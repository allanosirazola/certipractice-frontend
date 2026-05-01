// src/components/privacy/CookieConsentBanner.jsx
// GDPR / ePrivacy compliant
import { useState, useEffect, useCallback } from 'react';

export const CONSENT_KEY = 'certipractice_consent_v2';
export const CONSENT_VERSION = '2.0';

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.categories;
  } catch { return null; }
}

export function hasAdvertisingConsent() {
  return getConsent()?.advertising === true;
}

function saveConsent(categories) {
  const data = { categories, timestamp: new Date().toISOString(), version: CONSENT_VERSION };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('consentUpdated', { detail: categories }));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState(() => getConsent());
  useEffect(() => {
    const h = (e) => setConsent(e.detail);
    window.addEventListener('consentUpdated', h);
    return () => window.removeEventListener('consentUpdated', h);
  }, []);
  return { consent, isLoaded: consent !== null, has: (cat) => consent?.[cat] === true };
}

export default function CookieConsentBanner({ forceOpen = false, onClose }) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, functional: false, analytics: false, advertising: false });

  const lang = (() => {
    try { return localStorage.getItem('certipractice_lang')?.startsWith('es') ? 'es' : 'en'; } catch { return 'en'; }
  })();

  useEffect(() => {
    if (forceOpen) { setVisible(true); return; }
    if (!getConsent()) setVisible(true);
  }, [forceOpen]);

  const dismiss = useCallback((categories) => {
    saveConsent(categories);
    setVisible(false);
    setShowDetails(false);
    onClose?.();
  }, [onClose]);

  const acceptAll = () => dismiss({ necessary: true, functional: true, analytics: true, advertising: true });
  const rejectAll = () => dismiss({ necessary: true, functional: false, analytics: false, advertising: false });
  const savePrefs = () => dismiss({ ...prefs, necessary: true });

  if (!visible) return null;

  const CATEGORIES = [
    { key: 'necessary', icon: '🔒', required: true,
      name: lang === 'es' ? 'Necesarias' : 'Necessary',
      desc: lang === 'es' ? 'Esenciales para el funcionamiento del sitio: sesión, preferencia de idioma. Siempre activas.' : 'Essential for the site to work: session, language preference. Always active.' },
    { key: 'functional', icon: '⚙️', required: false,
      name: lang === 'es' ? 'Funcionales' : 'Functional',
      desc: lang === 'es' ? 'Recuerdan tus preferencias de modo de examen e historial.' : 'Remember your exam mode preferences and history.' },
    { key: 'analytics', icon: '📊', required: false,
      name: lang === 'es' ? 'Analíticas' : 'Analytics',
      desc: lang === 'es' ? 'Nos ayudan a entender cómo usas CertiPractice para mejorar la plataforma.' : 'Help us understand how you use CertiPractice to improve the platform.' },
    { key: 'advertising', icon: '📢', required: false, highlight: true,
      name: lang === 'es' ? 'Publicidad — Google AdSense' : 'Advertising — Google AdSense',
      desc: lang === 'es' ? 'Usamos Google AdSense para financiar CertiPractice de forma gratuita. Google puede usar cookies para personalizar los anuncios según tu actividad de navegación y tus intereses.' : 'We use Google AdSense to fund CertiPractice for free. Google may use cookies to personalise ads based on your browsing activity and interests.' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {!showDetails ? (
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl mt-0.5">🍪</span>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {lang === 'es' ? 'Cookies y anuncios' : 'Cookies and ads'}
                </h2>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {lang === 'es'
                    ? 'CertiPractice es gratuito gracias a los anuncios de Google AdSense. Usamos cookies necesarias para el funcionamiento y, si consientes, para mostrarte anuncios relevantes. '
                    : 'CertiPractice is free thanks to Google AdSense. We use necessary cookies for the site to work and, if you consent, to show you relevant ads. '}
                  <button onClick={() => setShowDetails(true)} className="text-blue-600 underline underline-offset-2">
                    {lang === 'es' ? 'Personalizar' : 'Customise'}
                  </button>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex gap-2">
              <span className="text-amber-500 flex-shrink-0 mt-0.5">ℹ️</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                {lang === 'es'
                  ? 'Los anuncios nos permiten ofrecerte miles de preguntas de examen sin coste. Al aceptar la publicidad, Google podrá personalizar los anuncios según tu historial de navegación.'
                  : 'Ads allow us to offer thousands of exam questions at no cost. By accepting advertising, Google may personalise ads based on your browsing history.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={rejectAll} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {lang === 'es' ? 'Solo necesarias' : 'Necessary only'}
              </button>
              <button onClick={() => setShowDetails(true)} className="flex-1 px-4 py-2.5 border border-blue-300 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors">
                {lang === 'es' ? 'Personalizar' : 'Customise'}
              </button>
              <button onClick={acceptAll} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow transition-colors">
                {lang === 'es' ? 'Aceptar todo' : 'Accept all'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              {lang === 'es'
                ? 'Sin elegir, solo se usarán cookies estrictamente necesarias. Cambia tus preferencias desde ⚙️ Ajustes en cualquier momento.'
                : 'Without choosing, only strictly necessary cookies will be used. Change preferences anytime from ⚙️ Settings.'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">
                {lang === 'es' ? '⚙️ Preferencias de cookies' : '⚙️ Cookie preferences'}
              </h2>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-5 max-h-80 overflow-y-auto pr-1">
              {CATEGORIES.map(({ key, icon, name, desc, required, highlight }) => (
                <div key={key} className={`flex items-start gap-3 p-3 rounded-xl border ${highlight ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                  <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{name}</span>
                      {required ? (
                        <span className="text-xs text-gray-400 flex-shrink-0">{lang === 'es' ? 'Siempre activas' : 'Always on'}</span>
                      ) : (
                        <button
                          role="switch" aria-checked={prefs[key]}
                          onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                          className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${prefs[key] ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-5' : ''}`} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={rejectAll} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {lang === 'es' ? 'Rechazar todo' : 'Reject all'}
              </button>
              <button onClick={savePrefs} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow transition-colors">
                {lang === 'es' ? 'Guardar' : 'Save preferences'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                {lang === 'es' ? 'Privacidad de Google' : 'Google Privacy Policy'}
              </a>
              {' · '}
              <a href="https://certipractice.vercel.app/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                {lang === 'es' ? 'Nuestra política' : 'Our policy'}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
