// FlashcardMode.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetDue = vi.fn();
const mockGradeReview = vi.fn();
const mockGetQuestion = vi.fn();
vi.mock('../../services/api', () => ({
  reviewsAPI: {
    getDue: (...args) => mockGetDue(...args),
    gradeReview: (...args) => mockGradeReview(...args),
  },
  questionAPI: {
    getQuestion: (...args) => mockGetQuestion(...args),
  },
}));

import FlashcardMode from '../../components/reviews/FlashcardMode';

describe('FlashcardMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
    mockGetDue.mockResolvedValue({ success: true, data: { items: [], total: 0 } });
    mockGetQuestion.mockResolvedValue({
      success: true,
      data: {
        id: 'q1', text: 'What is S3?',
        options: [
          { id: 'a', text: 'Storage service', isCorrect: true },
          { id: 'b', text: 'Database', isCorrect: false },
        ],
        explanation: 'S3 is object storage.',
      },
    });
    mockGradeReview.mockResolvedValue({ success: true, data: {} });
  });

  it('renders nothing when user is anonymous', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<FlashcardMode onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows loading state on mount', () => {
    render(<FlashcardMode onClose={() => {}} />);
    expect(screen.getByText(/Cargando cartas/i)).toBeInTheDocument();
  });

  it('shows empty state when no cards are due', async () => {
    render(<FlashcardMode onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/No hay nada que repasar/i)).toBeInTheDocument();
    });
  });

  it('loads the first card and shows the question text', async () => {
    mockGetDue.mockResolvedValue({
      success: true,
      data: {
        items: [{ questionId: 'q1', questionText: 'fallback text', topicName: 'Storage' }],
        total: 1,
      },
    });
    render(<FlashcardMode onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/What is S3/)).toBeInTheDocument());
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('reveals options + explanation when "Show answer" is clicked', async () => {
    mockGetDue.mockResolvedValue({
      success: true,
      data: { items: [{ questionId: 'q1', questionText: 'Q' }], total: 1 },
    });
    render(<FlashcardMode onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/What is S3/)).toBeInTheDocument());
    expect(screen.queryByText(/S3 is object storage/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Mostrar respuesta/i }));
    expect(await screen.findByText(/S3 is object storage/)).toBeInTheDocument();
    // Grade buttons appear
    expect(screen.getByRole('button', { name: /Otra vez/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Difícil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bien/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fácil/i })).toBeInTheDocument();
  });

  it('grades a card and advances to the next', async () => {
    mockGetDue.mockResolvedValue({
      success: true,
      data: {
        items: [
          { questionId: 'q1', questionText: 'Q1' },
          { questionId: 'q2', questionText: 'Q2' },
        ],
        total: 2,
      },
    });
    render(<FlashcardMode onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Mostrar respuesta/i }));
    await userEvent.click(screen.getByRole('button', { name: /Bien/i }));

    await waitFor(() => expect(mockGradeReview).toHaveBeenCalledWith('q1', 'good'));
    await waitFor(() => expect(screen.getByText('2 / 2')).toBeInTheDocument());
  });

  it('shows the finished state after grading the last card', async () => {
    mockGetDue.mockResolvedValue({
      success: true,
      data: { items: [{ questionId: 'q1', questionText: 'Q1' }], total: 1 },
    });
    render(<FlashcardMode onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText('1 / 1')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Mostrar respuesta/i }));
    await userEvent.click(screen.getByRole('button', { name: /Fácil/i }));
    await waitFor(() => expect(screen.getByText(/Sesión completada/i)).toBeInTheDocument());
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<FlashcardMode onClose={onClose} />);
    await waitFor(() => expect(mockGetDue).toHaveBeenCalled());
    await userEvent.click(screen.getByLabelText(/Cerrar/i));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error state when getDue fails', async () => {
    mockGetDue.mockRejectedValue(new Error('Server unavailable'));
    render(<FlashcardMode onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Server unavailable/)).toBeInTheDocument();
    });
  });
});
