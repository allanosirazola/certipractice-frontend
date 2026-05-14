// VerifyEmail.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();
vi.mock('../../services/api', () => ({
  authAPI: {
    verifyEmail: (...args) => mockVerifyEmail(...args),
    resendVerification: (...args) => mockResendVerification(...args),
  },
}));

import VerifyEmail from '../../components/auth/VerifyEmail';

/** Stub window.location.search before each test */
function setQuery(qs) {
  // jsdom forbids writing to location.search directly; replace location.
  delete window.location;
  window.location = new URL(`http://localhost/verify-email?${qs}`);
}

describe('VerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setQuery('');
  });

  it('shows missing state when no token in URL', () => {
    render(<VerifyEmail />);
    expect(screen.getByText(/Enlace incompleto|Incomplete link/i)).toBeInTheDocument();
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it('calls verifyEmail with the token and shows success state', async () => {
    setQuery('token=abc123');
    mockVerifyEmail.mockResolvedValue({ success: true, data: { verified: true } });
    render(<VerifyEmail />);
    await waitFor(() => expect(mockVerifyEmail).toHaveBeenCalledWith('abc123'));
    expect(await screen.findByText(/Correo verificado|Email verified/i)).toBeInTheDocument();
  });

  it('shows already-verified state when API returns alreadyVerified', async () => {
    setQuery('token=abc');
    mockVerifyEmail.mockResolvedValue({ success: true, data: { alreadyVerified: true } });
    render(<VerifyEmail />);
    expect(await screen.findByText(/Ya estaba verificado|Already verified/i)).toBeInTheDocument();
  });

  it('shows expired state when API responds with TOKEN_EXPIRED code', async () => {
    setQuery('token=abc');
    mockVerifyEmail.mockRejectedValue({ code: 'TOKEN_EXPIRED', message: 'expired' });
    render(<VerifyEmail />);
    expect(await screen.findByText(/Enlace caducado|Link expired/i)).toBeInTheDocument();
  });

  it('shows generic error for other failures', async () => {
    setQuery('token=abc');
    mockVerifyEmail.mockRejectedValue(new Error('something else'));
    render(<VerifyEmail />);
    expect(await screen.findByText(/No pudimos verificar|couldn't verify/i)).toBeInTheDocument();
  });

  it('clicking continue calls onBack', async () => {
    setQuery('token=abc');
    mockVerifyEmail.mockResolvedValue({ success: true, data: { verified: true } });
    const onBack = vi.fn();
    render(<VerifyEmail onBack={onBack} />);
    await screen.findByText(/Correo verificado|Email verified/i);
    await userEvent.click(screen.getByRole('button', { name: /Continuar|Continue/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('resend button calls API on expired state', async () => {
    setQuery('token=abc');
    mockVerifyEmail.mockRejectedValue({ code: 'TOKEN_EXPIRED' });
    mockResendVerification.mockResolvedValue({ success: true });
    render(<VerifyEmail />);
    await screen.findByText(/Enlace caducado|Link expired/i);
    await userEvent.click(screen.getByRole('button', { name: /Enviar nuevo|Send new/i }));
    expect(mockResendVerification).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Correo enviado|Email sent/i })).toBeDisabled()
    );
  });
});
