// src/components/pwa/InstallPrompt.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DISMISS_KEY = 'cp-pwa-install-dismissed-at';

/**
 * In-app install prompt for browsers that fire `beforeinstallprompt`
 * (Chrome / Edge / Samsung Internet on Android, Edge on Windows,
 * Chromium on Linux).
 *
 * Safari does NOT fire this event — iOS Safari users have to "Add to
 * Home Screen" manually from the share menu. We don't try to detect
 * iOS here (the hint would be intrusive on the desktop); a separate
 * help page can document that flow.
 *
 * Visibility rules:
 *   - Browser fires `beforeinstallprompt` → we capture the event
 *   - User dismissed within last 14 days → hidden
 *   - App already installed (display-mode: standalone) → hidden
 */
export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed?
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;
    if (window.navigator?.standalone) return; // iOS PWA

    try {
      const stamp = Number(window.localStorage.getItem(DISMISS_KEY));
      if (stamp && Date.now() - stamp < 14 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    } catch { /* ignore */ }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch { /* user dismissed native prompt */ }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setDeferredPrompt(null);
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-40 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg shadow-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">📱</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {t('pwa.install.title', { defaultValue: 'Instala la app' })}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            {t('pwa.install.description', { defaultValue: 'Accede sin conexión y desde tu pantalla de inicio.' })}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstall}
              className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {t('pwa.install.cta', { defaultValue: 'Instalar' })}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {t('pwa.install.dismiss', { defaultValue: 'No, gracias' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
