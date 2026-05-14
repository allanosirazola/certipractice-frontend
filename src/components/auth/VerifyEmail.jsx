// src/components/auth/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';
import logger from '../../utils/logger';

/**
 * Email-verification landing page.
 *
 * Reached via the link sent by the backend (URL contains `?token=...`).
 * The page POSTs the token to /auth/verify-email and renders one of
 * five states: loading, success, already-verified, expired, generic-error.
 *
 * The token is consumed on first mount; no user input needed.
 */
const STATE = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ALREADY: 'already',
  EXPIRED: 'expired',
  ERROR: 'error',
  MISSING: 'missing',
};

export default function VerifyEmail({ onBack }) {
  const { t } = useTranslation();
  const [state, setState] = useState(STATE.LOADING);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setState(STATE.MISSING);
      return;
    }

    let cancelled = false;
    authAPI.verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.alreadyVerified) {
          setState(STATE.ALREADY);
        } else if (res?.success) {
          setState(STATE.SUCCESS);
        } else {
          setState(STATE.ERROR);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Backend sets code:'TOKEN_EXPIRED' on expiry
        const code = err?.code || err?.data?.code;
        const msg = String(err?.message || '').toLowerCase();
        if (code === 'TOKEN_EXPIRED' || msg.includes('expired')) {
          setState(STATE.EXPIRED);
        } else {
          setState(STATE.ERROR);
          logger.warn('Email verification failed:', err?.message);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      // No email argument — backend uses the authenticated session if
      // present. Anonymous users would need to enter it; for the link
      // case we assume the session is still active.
      await authAPI.resendVerification();
      setResent(true);
    } catch (err) {
      logger.warn('Resend verification failed:', err?.message);
    } finally {
      setResending(false);
    }
  };

  const handleContinue = () => {
    // Clean up the URL so a reload doesn't re-trigger the call
    window.history.replaceState(null, '', window.location.pathname);
    onBack?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-950">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          {t('verifyEmail.heading', 'Verificación de correo')}
        </h1>

        {state === STATE.LOADING && (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('verifyEmail.loading', 'Verificando tu correo…')}
            </p>
          </div>
        )}

        {state === STATE.SUCCESS && (
          <StateCard
            iconClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            iconLabel="✓"
            title={t('verifyEmail.success.title', '¡Correo verificado!')}
            description={t('verifyEmail.success.description', 'Tu cuenta está completamente activada. Ya puedes empezar a practicar.')}
            primaryAction={{
              label: t('verifyEmail.continueToApp', 'Continuar a la app'),
              onClick: handleContinue,
            }}
          />
        )}

        {state === STATE.ALREADY && (
          <StateCard
            iconClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            iconLabel="✓"
            title={t('verifyEmail.already.title', 'Ya estaba verificado')}
            description={t('verifyEmail.already.description', 'Tu correo ya fue verificado anteriormente. Puedes continuar a la app.')}
            primaryAction={{
              label: t('verifyEmail.continueToApp', 'Continuar a la app'),
              onClick: handleContinue,
            }}
          />
        )}

        {state === STATE.EXPIRED && (
          <StateCard
            iconClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            iconLabel="⏱"
            title={t('verifyEmail.expired.title', 'Enlace caducado')}
            description={t('verifyEmail.expired.description', 'Este enlace tiene más de 24 horas. Solicita uno nuevo y revisa tu bandeja de entrada.')}
            primaryAction={{
              label: resending
                ? t('verifyEmail.resending', 'Enviando…')
                : resent
                  ? t('verifyEmail.resent', 'Correo enviado')
                  : t('verifyEmail.resend', 'Enviar nuevo enlace'),
              onClick: handleResend,
              disabled: resending || resent,
            }}
            secondaryAction={{
              label: t('verifyEmail.back', 'Volver al inicio'),
              onClick: handleContinue,
            }}
          />
        )}

        {state === STATE.ERROR && (
          <StateCard
            iconClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            iconLabel="!"
            title={t('verifyEmail.error.title', 'No pudimos verificar tu correo')}
            description={t('verifyEmail.error.description', 'El enlace puede ser incorrecto o ya haber sido usado. Solicita uno nuevo si lo necesitas.')}
            primaryAction={{
              label: resending
                ? t('verifyEmail.resending', 'Enviando…')
                : resent
                  ? t('verifyEmail.resent', 'Correo enviado')
                  : t('verifyEmail.resend', 'Enviar nuevo enlace'),
              onClick: handleResend,
              disabled: resending || resent,
            }}
            secondaryAction={{
              label: t('verifyEmail.back', 'Volver al inicio'),
              onClick: handleContinue,
            }}
          />
        )}

        {state === STATE.MISSING && (
          <StateCard
            iconClass="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            iconLabel="?"
            title={t('verifyEmail.missing.title', 'Enlace incompleto')}
            description={t('verifyEmail.missing.description', 'No encontramos un token de verificación en este enlace. Vuelve al correo que te enviamos y pulsa el botón.')}
            primaryAction={{
              label: t('verifyEmail.back', 'Volver al inicio'),
              onClick: handleContinue,
            }}
          />
        )}
      </div>
    </div>
  );
}

function StateCard({ iconClass, iconLabel, title, description, primaryAction, secondaryAction }) {
  return (
    <div className="text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${iconClass}`}>
        {iconLabel}
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        {description}
      </p>
      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mb-2"
        >
          {primaryAction.label}
        </button>
      )}
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
