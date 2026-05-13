// BookmarkButton.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock API
const mockIsBookmarked = vi.fn();
const mockToggleBookmark = vi.fn();
vi.mock('../../services/api', () => ({
  engagementAPI: {
    isBookmarked: (...args) => mockIsBookmarked(...args),
    toggleBookmark: (...args) => mockToggleBookmark(...args),
  },
}));

import BookmarkButton from '../../components/engagement/BookmarkButton';

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1 }, isAuthenticated: true });
    mockIsBookmarked.mockResolvedValue({ success: true, data: { bookmarked: false } });
    mockToggleBookmark.mockResolvedValue({ success: true, data: { bookmarked: true } });
  });

  it('renders a disabled button with sign-in tooltip for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    render(<BookmarkButton questionId="q1" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.getAttribute('title')).toMatch(/Inicia sesión|Sign in/i);
    expect(mockIsBookmarked).not.toHaveBeenCalled();
  });

  it('renders a star button when authenticated', () => {
    render(<BookmarkButton questionId="q1" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('fetches initial state on mount when not provided', async () => {
    render(<BookmarkButton questionId="q1" />);
    await waitFor(() => expect(mockIsBookmarked).toHaveBeenCalledWith('q1'));
  });

  it('skips initial fetch when initialBookmarked is provided', () => {
    render(<BookmarkButton questionId="q1" initialBookmarked />);
    expect(mockIsBookmarked).not.toHaveBeenCalled();
  });

  it('toggles bookmark on click and calls onChange', async () => {
    const onChange = vi.fn();
    render(<BookmarkButton questionId="q1" initialBookmarked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(mockToggleBookmark).toHaveBeenCalledWith('q1'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
  });

  it('reverts on toggle error', async () => {
    mockToggleBookmark.mockRejectedValue(new Error('boom'));
    const onChange = vi.fn();
    render(<BookmarkButton questionId="q1" initialBookmarked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(mockToggleBookmark).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows i18n tooltip in the title attribute', () => {
    render(<BookmarkButton questionId="q1" initialBookmarked={false} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('title')).toMatch(/Marcar|Bookmark/);
  });
});
