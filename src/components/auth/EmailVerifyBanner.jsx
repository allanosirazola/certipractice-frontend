// src/components/auth/EmailVerifyBanner.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import logger from '../../utils/logger';

const DISMISS_KEY = 'cp-verify-banner-dismissed-at';

/**
 * Persistent banner reminding authenticated users to verify their email.
 *
 * Visibility rules — hidden when ANY of:
 *   - user is anonymous
 *   - user.emailVerified === true (already done)
 *   - the user dismissed it within the past 24h (stored in localStorage)
 *   - the backend doesn't expose emailVerified yet (older sessions)
 *
 * Actions:
 *   - "Reenviar" → calls authAPI.resendVerification(); latches into a
 *     disabled "Correo enviado" state on success
 *   - "Más tarde" → records dismissal timestamp; banner stays gone for 24h
 *
 * The banner appears at the top of the landing only; the verify-email
 * landing page (component VerifyEmail) handles the click-from-email flow.
 */
export default function EmailVerifyBanner({ className = '' }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stamp = Number(window.localStorage.getItem(DISMISS_KEY));
      if (stamp && Date.now() - stamp < 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    } catch { /* localStorage may be unavailable */ }
  }, []);

  // Hide if anonymous, already verified, or no flag in payload (legacy
  // sessions whose JWT predates the v1.7.0 field — we'd rather hide than
  // false-positive nag them every page load)
  if (!user) return null;
  if (user.emailVerified !== false) return null;
  if (dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      await authAPI.resendVerification();
      setResent(true);
    } catch (err) {
      logger.warn('Banner resend failed:', err?.message);
    } finally {
      setResending(false);
    }
  };

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* ignore */ }
    setDismissed(true);
  };

  const buttonLabel = resending
    ? t('verifyEmail.resending', { defaultValue: 'Enviando…' })
    : resent
      ? t('verifyEmail.resent', { defaultValue: 'Correo enviado' })
      : t('verifyEmail.banner.resend', { defaultValue: 'Reenviar enlace' });

  return (
    <div
      role="status"
      className={`w-full bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/60 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-xl shrink-0" aria-hidden="true">📧</span>
          <div className="text-sm">
            <div className="font-medium text-amber-900 dark:text-amber-200">
              {t('verifyEmail.banner.title', { defaultValue: 'Verifica tu correo' })}
            </div>
            <div className="text-amber-800 dark:text-amber-300 mt-0.5">
              {t('verifyEmail.banner.message', { email: user.email, defaultValue: 'Te hemos enviado un enlace de verificación a {{email}}. Búscalo en tu bandeja (o spam) y púlsalo.' })}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resent}
            className="px-3 py-1.5 text-xs font-medium rounded bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {buttonLabel}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded transition-colors"
          >
            {t('verifyEmail.banner.dismiss', { defaultValue: 'Más tarde' })}
          </button>
        </div>
      </div>
    </div>
  );
}
