import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock consent to return true by default so ad slot renders
vi.mock('../../components/privacy/CookieConsentBanner', () => ({
  hasAdvertisingConsent: vi.fn(() => true),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, o) => o?.defaultValue || k,
    i18n: { language: 'en' },
  }),
}));

import AdBreak from '../../components/ads/AdBreak';

describe('AdBreak', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders with countdown starting at 5', () => {
    render(<AdBreak phase="start" onComplete={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('skip button is disabled initially', () => {
    render(<AdBreak phase="start" onComplete={vi.fn()} />);
    const skip = screen.getByText(/skip in/i).closest('button') || screen.getByRole('button', { name: /skip/i });
    expect(skip).toBeDisabled();
  });

  it('skip button becomes enabled after 3 seconds', async () => {
    render(<AdBreak phase="start" onComplete={vi.fn()} />);
    act(() => { vi.advanceTimersByTime(3000); });
    await waitFor(() => {
      const skip = screen.getByRole('button', { name: /skip/i });
      expect(skip).not.toBeDisabled();
    });
  });

  it('calls onComplete when skip is clicked after 3s', async () => {
    const onComplete = vi.fn();
    render(<AdBreak phase="start" onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(3000); });
    await waitFor(() => expect(screen.getByRole('button', { name: /^skip/i })).not.toBeDisabled());
    await userEvent.click(screen.getByRole('button', { name: /^skip/i }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 1000 });
  });

  it('calls onComplete automatically after 5 seconds', async () => {
    const onComplete = vi.fn();
    render(<AdBreak phase="start" onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(5100); });
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('renders finish phase copy', () => {
    render(<AdBreak phase="finish" onComplete={vi.fn()} />);
    expect(screen.getByText(/calculating/i)).toBeInTheDocument();
  });

  it('shows placeholder when no advertising consent', async () => {
    const { hasAdvertisingConsent } = await import('../../components/privacy/CookieConsentBanner');
    hasAdvertisingConsent.mockReturnValueOnce(false);
    render(<AdBreak phase="start" onComplete={vi.fn()} />);
    expect(screen.getByText(/accept advertising cookies/i)).toBeInTheDocument();
  });

  it('renders progress bar SVG ring', () => {
    render(<AdBreak phase="start" onComplete={vi.fn()} />);
    expect(document.querySelector('svg circle')).toBeTruthy();
  });
});
