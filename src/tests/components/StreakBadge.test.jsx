// StreakBadge.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetStreak = vi.fn();
vi.mock('../../services/api', () => ({
  progressAPI: {
    getStreak: (...args) => mockGetStreak(...args),
  },
}));

import StreakBadge from '../../components/progress/StreakBadge';

describe('StreakBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1 } });
    mockGetStreak.mockResolvedValue({
      success: true,
      data: { current: 0, best: 0, lastActiveDate: null },
    });
  });

  it('renders nothing for anonymous users', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<StreakBadge />);
    expect(container).toBeEmptyDOMElement();
    expect(mockGetStreak).not.toHaveBeenCalled();
  });

  it('fetches the streak on mount when authed', async () => {
    render(<StreakBadge />);
    await waitFor(() => expect(mockGetStreak).toHaveBeenCalled());
  });

  it('displays the current streak count', async () => {
    mockGetStreak.mockResolvedValue({
      success: true,
      data: { current: 7, best: 14, lastActiveDate: '2026-05-13' },
    });
    render(<StreakBadge />);
    await waitFor(() => expect(screen.getByText(/7 días/)).toBeInTheDocument());
  });

  it('renders zero-state without errors', async () => {
    render(<StreakBadge />);
    await waitFor(() => expect(mockGetStreak).toHaveBeenCalled());
    expect(screen.getByText(/0 días/)).toBeInTheDocument();
  });

  it('renders compact mode showing just the number', async () => {
    mockGetStreak.mockResolvedValue({
      success: true,
      data: { current: 3, best: 5 },
    });
    render(<StreakBadge compact />);
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });

  it('handles fetch error silently (no crash)', async () => {
    mockGetStreak.mockRejectedValue(new Error('boom'));
    render(<StreakBadge />);
    await waitFor(() => expect(mockGetStreak).toHaveBeenCalled());
    // Component should not throw — still renders some structure
    // We just verify no crash occurred (test would have failed)
    expect(true).toBe(true);
  });

  it('exposes proper aria-label for screen readers', async () => {
    mockGetStreak.mockResolvedValue({
      success: true,
      data: { current: 5, best: 10 },
    });
    render(<StreakBadge />);
    await waitFor(() => {
      const el = screen.getByLabelText(/5 días/);
      expect(el).toBeInTheDocument();
    });
  });
});
