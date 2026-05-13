// QuestionNote.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetNote = vi.fn();
const mockUpsertNote = vi.fn();
const mockDeleteNote = vi.fn();
vi.mock('../../services/api', () => ({
  engagementAPI: {
    getNote: (...args) => mockGetNote(...args),
    upsertNote: (...args) => mockUpsertNote(...args),
    deleteNote: (...args) => mockDeleteNote(...args),
  },
}));

import QuestionNote from '../../components/engagement/QuestionNote';

describe('QuestionNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockUseAuth.mockReturnValue({ user: { id: 1 }, isAuthenticated: true });
    mockGetNote.mockResolvedValue({ success: true, data: { note: null } });
    mockUpsertNote.mockResolvedValue({ success: true, data: { note: { content: 'hello' } } });
    mockDeleteNote.mockResolvedValue({ success: true, data: { deleted: true } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a sign-in prompt for anonymous users', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    render(<QuestionNote questionId="q1" />);
    expect(screen.getByText(/Inicia sesión|Sign in/i)).toBeInTheDocument();
    expect(mockGetNote).not.toHaveBeenCalled();
  });

  it('fetches the existing note on mount when authed', async () => {
    mockGetNote.mockResolvedValue({
      success: true,
      data: { note: { content: 'My memo' } },
    });
    render(<QuestionNote questionId="q1" />);
    await waitFor(() => expect(mockGetNote).toHaveBeenCalledWith('q1'));
  });

  it('renders without crashing when no note exists', async () => {
    render(<QuestionNote questionId="q1" />);
    await waitFor(() => expect(mockGetNote).toHaveBeenCalled());
  });
});
