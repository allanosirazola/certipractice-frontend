// EmailVerifyBanner.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockResend = vi.fn();
vi.mock('../../services/api', () => ({
  authAPI: {
    resendVerification: (...args) => mockResend(...args),
  },
}));

import EmailVerifyBanner from '../../components/auth/EmailVerifyBanner';

describe('EmailVerifyBanner', () => {
  // The global setupTests.js replaces window.localStorage with bare vi.fn()
  // stubs that don't actually store anything. For this component we need a
  // real (in-memory) storage so the dismissal-persistence tests work.
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
    mockResend.mockResolvedValue({ success: true });
  });

  it('hides for anonymous users', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<EmailVerifyBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('hides when user.emailVerified is true', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'a@x.com', emailVerified: true } });
    const { container } = render(<EmailVerifyBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('hides when emailVerified field is missing (legacy session)', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'a@x.com' } });
    const { container } = render(<EmailVerifyBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows when user.emailVerified is explicitly false', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'a@x.com', emailVerified: false } });
    render(<EmailVerifyBanner />);
    expect(screen.getByText(/Verifica tu correo|Verify your email/i)).toBeInTheDocument();
    expect(screen.getByText(/a@x\.com/)).toBeInTheDocument();
  });

  it('clicking Reenviar calls API and latches into sent state', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'a@x.com', emailVerified: false } });
    render(<EmailVerifyBanner />);
    await userEvent.click(screen.getByRole('button', { name: /Reenviar|Resend/i }));
    expect(mockResend).toHaveBeenCalled();
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Correo enviado|Email sent/i });
      expect(btn).toBeDisabled();
    });
  });

  it('clicking Más tarde hides the banner and persists dismissal', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'a@x.com', emailVerified: false } });
    const { container } = render(<EmailVerifyBanner />);
    await userEvent.click(screen.getByRole('button', { name: /Más tarde|Later/i }));
    expect(container).toBeEmptyDOMElement();
    // Stamp recorded
    expect(window.localStorage.getItem('cp-verify-banner-dismissed-at')).toBeTruthy();
  });

  it('stays hidden on re-render if dismissed within last 24h', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'a@x.com', emailVerified: false } });
    window.localStorage.setItem('cp-verify-banner-dismissed-at', String(Date.now() - 60_000));
    const { container } = render(<EmailVerifyBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows again after 24h dismissal window expires', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, email: 'a@x.com', emailVerified: false } });
    const oldStamp = Date.now() - 25 * 60 * 60 * 1000;
    window.localStorage.setItem('cp-verify-banner-dismissed-at', String(oldStamp));
    render(<EmailVerifyBanner />);
    expect(screen.getByText(/Verifica tu correo|Verify your email/i)).toBeInTheDocument();
  });
});
