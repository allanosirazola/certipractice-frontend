// BookmarksList.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockListBookmarks = vi.fn();
const mockRemoveBookmark = vi.fn();
vi.mock('../../services/api', () => ({
  engagementAPI: {
    listBookmarks: (...args) => mockListBookmarks(...args),
    removeBookmark: (...args) => mockRemoveBookmark(...args),
  },
}));

import BookmarksList from '../../components/engagement/BookmarksList';

describe('BookmarksList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1 }, isAuthenticated: true });
  });

  it('shows a sign-in prompt for anonymous users', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    render(<BookmarksList />);
    expect(screen.getByText(/Inicia sesión|Sign in/i)).toBeInTheDocument();
    expect(mockListBookmarks).not.toHaveBeenCalled();
  });

  it('shows empty state when no bookmarks', async () => {
    mockListBookmarks.mockResolvedValue({
      success: true,
      data: { items: [], pagination: { total: 0, limit: 20, offset: 0 } },
    });
    render(<BookmarksList />);
    await waitFor(() => {
      expect(screen.getByText(/Aún no has marcado|No bookmarks/i)).toBeInTheDocument();
    });
  });

  it('renders bookmarked questions in a list', async () => {
    mockListBookmarks.mockResolvedValue({
      success: true,
      data: {
        items: [
          { questionId: 'q1', questionText: 'How does S3 work?', certificationName: 'AWS SAA' },
        ],
        pagination: { total: 1, limit: 20, offset: 0 },
      },
    });
    render(<BookmarksList />);
    await waitFor(() => expect(screen.getByText(/S3 work/)).toBeInTheDocument());
    expect(mockListBookmarks).toHaveBeenCalled();
  });
});
