// DueBadge.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetStats = vi.fn();
vi.mock('../../services/api', () => ({
  reviewsAPI: {
    getStats: (...args) => mockGetStats(...args),
  },
}));

import DueBadge from '../../components/reviews/DueBadge';

describe('DueBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
  });

  it('renders nothing for anonymous users', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<DueBadge />);
    expect(container).toBeEmptyDOMElement();
    expect(mockGetStats).not.toHaveBeenCalled();
  });

  it('renders nothing when no cards are due', async () => {
    mockGetStats.mockResolvedValue({ success: true, data: { dueNow: 0 } });
    const { container } = render(<DueBadge />);
    await waitFor(() => expect(mockGetStats).toHaveBeenCalled());
    // After resolve, dueNow=0 → component returns null
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count when cards are due', async () => {
    mockGetStats.mockResolvedValue({ success: true, data: { dueNow: 7 } });
    render(<DueBadge />);
    await waitFor(() => expect(screen.getByText(/7/)).toBeInTheDocument());
  });

  it('renders nothing when API fails', async () => {
    mockGetStats.mockRejectedValue(new Error('boom'));
    const { container } = render(<DueBadge />);
    await waitFor(() => expect(mockGetStats).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
