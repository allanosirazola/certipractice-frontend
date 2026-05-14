// ReadinessGauge.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetReadiness = vi.fn();
vi.mock('../../services/api', () => ({
  progressAPI: {
    getReadiness: (...args) => mockGetReadiness(...args),
  },
}));

import ReadinessGauge from '../../components/progress/ReadinessGauge';

describe('ReadinessGauge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
  });

  it('renders nothing for anonymous users', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<ReadinessGauge certificationId={5} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockGetReadiness).not.toHaveBeenCalled();
  });

  it('renders nothing when certificationId is missing', () => {
    const { container } = render(<ReadinessGauge />);
    expect(container).toBeEmptyDOMElement();
    expect(mockGetReadiness).not.toHaveBeenCalled();
  });

  it('shows "not enough data" message when score is null', async () => {
    mockGetReadiness.mockResolvedValue({
      success: true,
      data: { score: null, samples: 5, minSamples: 20, advice: [] },
    });
    render(<ReadinessGauge certificationId={5} />);
    await waitFor(() => {
      expect(screen.getByText(/al menos|at least/i)).toBeInTheDocument();
    });
  });

  it('renders a "ready" gauge for high scores', async () => {
    mockGetReadiness.mockResolvedValue({
      success: true,
      data: { score: 85, samples: 50, advice: [] },
    });
    render(<ReadinessGauge certificationId={5} />);
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText(/Listo para el examen/i)).toBeInTheDocument();
    });
  });

  it('renders an "almost there" gauge for medium scores', async () => {
    mockGetReadiness.mockResolvedValue({
      success: true,
      data: { score: 62, samples: 40, advice: [] },
    });
    render(<ReadinessGauge certificationId={5} />);
    await waitFor(() => {
      expect(screen.getByText('62%')).toBeInTheDocument();
      expect(screen.getByText(/Casi listo|Almost there/i)).toBeInTheDocument();
    });
  });

  it('renders a "keep studying" gauge for low scores', async () => {
    mockGetReadiness.mockResolvedValue({
      success: true,
      data: { score: 35, samples: 30, advice: [] },
    });
    render(<ReadinessGauge certificationId={5} />);
    await waitFor(() => {
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.getByText(/Sigue practicando|Keep studying/i)).toBeInTheDocument();
    });
  });

  it('renders up to 3 advice items', async () => {
    mockGetReadiness.mockResolvedValue({
      success: true,
      data: {
        score: 80,
        samples: 60,
        advice: [
          'Repasa los temas de seguridad',
          'Haz más exámenes de práctica',
          'Revisa las preguntas falladas',
          'Esta cuarta no debe aparecer',
        ],
      },
    });
    render(<ReadinessGauge certificationId={5} />);
    await waitFor(() => {
      expect(screen.getByText(/Repasa los temas/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Esta cuarta/)).not.toBeInTheDocument();
  });

  it('hides itself silently when API errors', async () => {
    mockGetReadiness.mockRejectedValue(new Error('boom'));
    const { container } = render(<ReadinessGauge certificationId={5} />);
    await waitFor(() => expect(mockGetReadiness).toHaveBeenCalled());
    // After error, component returns null (no gauge rendered)
    expect(container.querySelector('svg')).toBeNull();
  });

  it('re-fetches when refreshSignal changes', async () => {
    mockGetReadiness.mockResolvedValue({
      success: true,
      data: { score: 50, samples: 30, advice: [] },
    });
    const { rerender } = render(<ReadinessGauge certificationId={5} refreshSignal={1} />);
    await waitFor(() => expect(mockGetReadiness).toHaveBeenCalledTimes(1));
    rerender(<ReadinessGauge certificationId={5} refreshSignal={2} />);
    await waitFor(() => expect(mockGetReadiness).toHaveBeenCalledTimes(2));
  });
});
