// CookieConsentBanner.jsx - Banner de consentimiento de cookies GDPR
import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'certipractice_cookie_consent';

const COOKIE_CATEGORIES = {
  necessary: {
    name: 'Necesarias',
    description: 'Cookies esenciales para el funcionamiento del sitio. No se pueden desactivar.',
    required: true
  },
  functional: {
    name: 'Funcionales',
    description: 'Permiten recordar tus preferencias y personalizar tu experiencia.',
    required: false
  },
  analytics: {
    name: 'Analíticas',
    description: 'Nos ayudan a entender cómo usas el sitio para mejorarlo.',
    required: false
  },
  marketing: {
    name: 'Marketing',
    description: 'Utilizadas para mostrarte contenido relevante.',
    required: false
  }
};

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      const parsed = JSON.parse(savedConsent);
      setConsent(parsed.categories || consent);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(consent);
  };

  const saveConsent = (categories) => {
    const consentData = {
      categories,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setShowBanner(false);

    // Disparar evento para que otros componentes puedan reaccionar
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: categories }));

    // Inicializar o deshabilitar servicios según el consentimiento
    if (categories.analytics) {
      // Inicializar Google Analytics
      initAnalytics();
    } else {
      // Desactivar Google Analytics
      disableAnalytics();
    }
  };

  const initAnalytics = () => {
    // Implementar inicialización de GA
    console.log('Analytics enabled');
  };

  const disableAnalytics = () => {
    // Implementar desactivación de GA
    console.log('Analytics disabled');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <div className="max-w-6xl mx-auto">
        {!showDetails ? (
          /* Banner simple */
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">🍪 Uso de Cookies</h3>
              <p className="text-sm text-gray-600">
                Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y 
                personalizar el contenido. Puedes aceptar todas, rechazar las no esenciales 
                o <button onClick={() => setShowDetails(true)} className="text-blue-600 underline">
                personalizar tus preferencias</button>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Solo Necesarias
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Aceptar Todas
              </button>
            </div>
          </div>
        ) : (
          /* Panel de preferencias detalladas */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">⚙️ Configuración de Cookies</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
                <div key={key} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      id={`cookie-${key}`}
                      checked={consent[key]}
                      disabled={category.required}
                      onChange={(e) => setConsent({ ...consent, [key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`cookie-${key}`} className="font-medium text-gray-800 cursor-pointer">
                      {category.name}
                      {category.required && (
                        <span className="ml-2 text-xs text-gray-500">(Siempre activas)</span>
                      )}
                    </label>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <a 
                href="/privacy-policy" 
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                Política de Privacidad
              </a>
              <div className="flex gap-3">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Rechazar Opcionales
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Guardar Preferencias
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook para comprobar consentimiento
export const useCookieConsent = () => {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent);
      setConsent(parsed.categories);
    }

    const handleUpdate = (e) => {
      setConsent(e.detail);
    };

    window.addEventListener('cookieConsentUpdated', handleUpdate);
    return () => window.removeEventListener('cookieConsentUpdated', handleUpdate);
  }, []);

  return {
    consent,
    hasConsent: (category) => consent?.[category] === true,
    isLoaded: consent !== null
  };
};