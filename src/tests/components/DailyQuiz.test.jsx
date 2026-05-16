// DailyQuiz.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetDaily = vi.fn();
const mockSubmit = vi.fn();
vi.mock('../../services/api', () => ({
  dailyQuizAPI: {
    getDaily: (...args) => mockGetDaily(...args),
    submit: (...args) => mockSubmit(...args),
  },
}));

import DailyQuiz from '../../components/dailyQuiz/DailyQuiz';

const QUESTIONS = [
  {
    id: 'q1', text: 'What is S3?', topicName: 'Storage',
    options: [
      { id: 'a', text: 'Object storage', isCorrect: true },
      { id: 'b', text: 'Database', isCorrect: false },
    ],
    explanation: 'S3 is object storage.',
  },
  {
    id: 'q2', text: 'What is EC2?', topicName: 'Compute',
    options: [
      { id: 'a', text: 'Compute service', isCorrect: true },
      { id: 'b', text: 'CDN', isCorrect: false },
    ],
    explanation: 'EC2 is compute.',
  },
];

describe('DailyQuiz', () => {
  let _store;
  beforeEach(() => {
    vi.clearAllMocks();
    _store = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k) => (_store.has(k) ? _store.get(k) : null),
        setItem: (k, v) => _store.set(k, String(v)),
        removeItem: (k) => _store.delete(k),
        clear: () => _store.clear(),
      },
    });
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
    mockSubmit.mockResolvedValue({ success: true, data: { score: 0, total: 0 } });
  });

  it('shows loading state then intro for a fresh user', async () => {
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: QUESTIONS, completed: false, previousScore: null },
    });
    render(<DailyQuiz onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/5 preguntas hoy|5 questions today/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Empezar/i })).toBeInTheDocument();
  });

  it('jumps to finished state when API reports completed=true', async () => {
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: QUESTIONS, completed: true, previousScore: 4 },
    });
    render(<DailyQuiz onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/4 \/ 2|4 \/ \d/)).toBeInTheDocument());
  });

  it('shows error state when no questions available', async () => {
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: [], completed: false, previousScore: null },
    });
    render(<DailyQuiz onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/No hay preguntas|No questions/i)).toBeInTheDocument());
  });

  it('starts the quiz when "Empezar" is clicked', async () => {
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: QUESTIONS, completed: false, previousScore: null },
    });
    render(<DailyQuiz onClose={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Empezar/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Empezar/i }));
    expect(await screen.findByText(/What is S3/)).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('shows correct answer feedback after confirming', async () => {
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: QUESTIONS, completed: false, previousScore: null },
    });
    render(<DailyQuiz onClose={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Empezar/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Empezar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Object storage/i }));
    await userEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    // Explanation is revealed after confirming
    expect(await screen.findByText(/S3 is object storage/)).toBeInTheDocument();
    // Next button now visible (not last question)
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument();
  });

  it('reaches finished state and submits for authed user', async () => {
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: QUESTIONS, completed: false, previousScore: null },
    });
    render(<DailyQuiz onClose={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Empezar/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Empezar/i }));

    // Q1: pick correct
    await userEvent.click(screen.getByRole('button', { name: /Object storage/i }));
    await userEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    // Q2: pick wrong
    await userEvent.click(screen.getByRole('button', { name: /CDN/i }));
    await userEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Terminar/i }));

    // Finished — 1/2
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument());
    expect(mockSubmit).toHaveBeenCalledWith([
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
    ]);
  });

  it('persists completion to localStorage for anonymous users', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: [QUESTIONS[0]], completed: false, previousScore: null },
    });
    render(<DailyQuiz onClose={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Empezar/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Empezar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Object storage/i }));
    await userEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Terminar/i }));
    await waitFor(() => expect(screen.getByText('1 / 1')).toBeInTheDocument());
    expect(mockSubmit).not.toHaveBeenCalled();
    const stored = JSON.parse(window.localStorage.getItem('cp-daily-quiz-anon'));
    expect(stored).toMatchObject({ date: '2026-05-20', score: 1, total: 1 });
  });

  it('calls onClose when close button clicked', async () => {
    mockGetDaily.mockResolvedValue({
      success: true,
      data: { date: '2026-05-20', questions: QUESTIONS, completed: false },
    });
    const onClose = vi.fn();
    render(<DailyQuiz onClose={onClose} />);
    await waitFor(() => expect(mockGetDaily).toHaveBeenCalled());
    await userEvent.click(screen.getByLabelText(/Cerrar/i));
    expect(onClose).toHaveBeenCalled();
  });
});
