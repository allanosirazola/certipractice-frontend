// CreateStudyPlanModal.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCreate = vi.fn();
vi.mock('../../services/api', () => ({
  studyPlansAPI: {
    create: (...args) => mockCreate(...args),
  },
}));

import CreateStudyPlanModal from '../../components/studyPlans/CreateStudyPlanModal';

describe('CreateStudyPlanModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ success: true, data: { id: 1 } });
  });

  it('renders the form with the cert name', () => {
    render(
      <CreateStudyPlanModal
        certificationId={5}
        certificationName="AWS SAA"
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Crear plan de estudio|Create study plan/i)).toBeInTheDocument();
    expect(screen.getByText(/AWS SAA/)).toBeInTheDocument();
  });

  it('suggests a daily goal from defaultPoolSize and the date span', () => {
    render(
      <CreateStudyPlanModal
        certificationId={5}
        onClose={() => {}}
        defaultPoolSize={300}
      />
    );
    // Default 30-day target, 300 questions → 10/day
    const slider = screen.getByRole('slider');
    expect(slider.value).toBe('10');
  });

  it('submits with the chosen values', async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(
      <CreateStudyPlanModal
        certificationId={5}
        onClose={onClose}
        onCreated={onCreated}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Crear plan/i }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.certificationId).toBe(5);
    expect(payload.targetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.dailyGoal).toBeGreaterThan(0);
    expect(onCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error if the API rejects', async () => {
    mockCreate.mockRejectedValue(new Error('server down'));
    render(
      <CreateStudyPlanModal
        certificationId={5}
        onClose={() => {}}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Crear plan/i }));
    expect(await screen.findByText(/server down/)).toBeInTheDocument();
  });

  it('rejects past dates client-side', async () => {
    render(
      <CreateStudyPlanModal
        certificationId={5}
        onClose={() => {}}
      />
    );
    // Set the date input to a past day. Input doesn't have a connected
    // label so we grab it by type rather than getByLabelText.
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).not.toBeNull();
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '2000-01-01');
    await userEvent.click(screen.getByRole('button', { name: /Crear plan/i }));
    expect(await screen.findByText(/al menos mañana|at least tomorrow/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<CreateStudyPlanModal certificationId={5} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /Cancelar|Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
