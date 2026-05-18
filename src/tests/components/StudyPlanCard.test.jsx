// StudyPlanCard.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGet = vi.fn();
vi.mock('../../services/api', () => ({
  studyPlansAPI: {
    getForCertification: (...args) => mockGet(...args),
  },
}));

import StudyPlanCard from '../../components/studyPlans/StudyPlanCard';

describe('StudyPlanCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
  });

  it('renders nothing for anonymous users', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<StudyPlanCard certificationId={5} onCreate={() => {}} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('renders nothing without a certificationId', () => {
    const { container } = render(<StudyPlanCard onCreate={() => {}} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('renders nothing on API error (silent)', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    const { container } = render(<StudyPlanCard certificationId={5} onCreate={() => {}} />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    // After error, component returns null
    expect(container.querySelector('button, .rounded-lg')).toBeNull();
  });

  it('shows the no-plan CTA when no active plan exists', async () => {
    mockGet.mockResolvedValue({ success: true, data: null });
    render(<StudyPlanCard certificationId={5} onCreate={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Crear plan de estudio|Create study plan/i)).toBeInTheDocument();
    });
  });

  it('calls onCreate when the no-plan CTA is clicked', async () => {
    mockGet.mockResolvedValue({ success: true, data: null });
    const onCreate = vi.fn();
    render(<StudyPlanCard certificationId={5} onCreate={onCreate} />);
    await waitFor(() => expect(screen.getByText(/Crear plan/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button'));
    expect(onCreate).toHaveBeenCalled();
  });

  it('shows the on-track status and progress bar', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        id: 1, dailyGoal: 10, answeredToday: 5, daysRemaining: 20,
        status: 'on_track', adjustedDailyGoal: 10,
      },
    });
    render(<StudyPlanCard certificationId={5} onCreate={() => {}} />);
    await waitFor(() => expect(screen.getByText(/En camino|On track/i)).toBeInTheDocument());
    expect(screen.getByText(/20 días|20 days/i)).toBeInTheDocument();
    expect(screen.getByText(/5\/10/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('shows behind status with adjust hint when adjustedDailyGoal exceeds dailyGoal', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        id: 1, dailyGoal: 10, answeredToday: 2, daysRemaining: 10,
        status: 'behind', adjustedDailyGoal: 15,
      },
    });
    render(<StudyPlanCard certificationId={5} onCreate={() => {}} />);
    await waitFor(() => expect(screen.getByText(/retrasado|Falling behind/i)).toBeInTheDocument());
    expect(screen.getByText(/Sube a 15|Bump to 15/i)).toBeInTheDocument();
  });

  it('shows overdue when daysRemaining <= 0', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        id: 1, dailyGoal: 10, answeredToday: 0, daysRemaining: -2,
        status: 'overdue', adjustedDailyGoal: 10,
      },
    });
    render(<StudyPlanCard certificationId={5} onCreate={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Fecha pasada|Past due/i)).toBeInTheDocument());
    expect(screen.getByText(/Examen pasado|Exam date passed/i)).toBeInTheDocument();
  });

  it('re-fetches when refreshSignal changes', async () => {
    mockGet.mockResolvedValue({ success: true, data: null });
    const { rerender } = render(<StudyPlanCard certificationId={5} onCreate={() => {}} refreshSignal={1} />);
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    rerender(<StudyPlanCard certificationId={5} onCreate={() => {}} refreshSignal={2} />);
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  });
});
