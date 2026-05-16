// DailyQuizCard.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetStatus = vi.fn();
vi.mock('../../services/api', () => ({
  dailyQuizAPI: {
    getStatus: (...args) => mockGetStatus(...args),
  },
}));

import DailyQuizCard from '../../components/dailyQuiz/DailyQuizCard';

describe('DailyQuizCard', () => {
  // Replace bare-stub localStorage with an in-memory shim so the anon
  // branch (which reads from it) can actually round-trip values.
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
    mockUseAuth.mockReturnValue({ user: null });
  });

  it('shows the "start" state for an anonymous user who has not played today', async () => {
    render(<DailyQuizCard onOpen={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Quiz diario.*5 preguntas/i)).toBeInTheDocument());
    expect(screen.getByText(/Empezar/i)).toBeInTheDocument();
    expect(mockGetStatus).not.toHaveBeenCalled(); // anon doesn't hit server
  });

  it('shows the "completed" state when anon has played today (localStorage)', async () => {
    const today = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem(
      'cp-daily-quiz-anon',
      JSON.stringify({ date: today, score: 4, total: 5 })
    );
    render(<DailyQuizCard onOpen={() => {}} />);
    await waitFor(() => expect(screen.getByText(/completado/i)).toBeInTheDocument());
  });

  it('ignores stale localStorage entry (different date)', async () => {
    window.localStorage.setItem(
      'cp-daily-quiz-anon',
      JSON.stringify({ date: '2020-01-01', score: 4, total: 5 })
    );
    render(<DailyQuizCard onOpen={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Empezar/i)).toBeInTheDocument());
  });

  it('fetches status from server for authenticated users', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
    mockGetStatus.mockResolvedValue({ success: true, data: { completed: false, authenticated: true } });
    render(<DailyQuizCard onOpen={() => {}} />);
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalled());
    expect(screen.getByText(/Empezar/i)).toBeInTheDocument();
  });

  it('shows completed state when server reports completed=true', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
    mockGetStatus.mockResolvedValue({ success: true, data: { completed: true, authenticated: true } });
    render(<DailyQuizCard onOpen={() => {}} />);
    await waitFor(() => expect(screen.getByText(/completado/i)).toBeInTheDocument());
  });

  it('falls back to "not done" if status call fails (user can still try)', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
    mockGetStatus.mockRejectedValue(new Error('boom'));
    render(<DailyQuizCard onOpen={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Empezar/i)).toBeInTheDocument());
  });

  it('calls onOpen when clicked', async () => {
    const onOpen = vi.fn();
    render(<DailyQuizCard onOpen={onOpen} />);
    await waitFor(() => expect(screen.getByText(/Empezar/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalled();
  });
});
