// src/components/pwa/OfflineIndicator.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Small pill in the corner of the screen indicating offline state.
 * Renders nothing when navigator.onLine is true.
 *
 * Note: navigator.onLine has well-known false positives (the device
 * being on a network that has no internet still reports online=true).
 * We only use it as a quick hint — the actual offline UX comes from
 * the service worker serving cached responses and the components
 * showing their own error/empty states when API calls fail.
 */
export default function OfflineIndicator() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const setOn  = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online',  setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online',  setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2"
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
      {t('pwa.offline', { defaultValue: 'Sin conexión — usando datos guardados' })}
    </div>
  );
}
