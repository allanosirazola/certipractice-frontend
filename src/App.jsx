// src/App.jsx
import { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SEOHead from './components/seo/SEOHead';
import CookieConsentBanner from './components/privacy/CookieConsentBanner';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

// Lazy-load route-level components to keep the initial bundle small.
// Only the view the user opens is downloaded.
const LandingExamenes = lazy(() => import('./components/LandingExamenes'));
const ExamenView      = lazy(() => import('./components/ExamenView'));
const CommunityPage   = lazy(() => import('./components/community/CommunityPage'));
const PrivacyPolicy   = lazy(() => import('./components/privacy/PrivacyPolicy'));

// View routes managed via state (no router needed)
const VIEWS = { HOME: 'home', EXAM: 'exam', COMMUNITY: 'community', PRIVACY: 'privacy' };

function ViewLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Cargando…</span>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState(() => {
    // Read URL hash for deep-linking
    const hash = window.location.hash.replace('#', '');
    if (hash === 'community') return VIEWS.COMMUNITY;
    if (hash === 'privacy') return VIEWS.PRIVACY;
    return VIEWS.HOME;
  });
  const [examConfig, setExamConfig] = useState(null);
  const [nombreCertificacion, setNombreCertificacion] = useState('');
  const [cookiePanelOpen, setCookiePanelOpen] = useState(false);

  // Sync URL hash with view
  useEffect(() => {
    const newHash = view === VIEWS.HOME || view === VIEWS.EXAM ? '' : view;
    if (window.location.hash.replace('#', '') !== newHash) {
      window.history.replaceState(null, '', newHash ? `#${newHash}` : window.location.pathname);
    }
  }, [view]);

  // Listen for back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'community') setView(VIEWS.COMMUNITY);
      else if (hash === 'privacy') setView(VIEWS.PRIVACY);
      else if (view !== VIEWS.EXAM) setView(VIEWS.HOME);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [view]);

  const handleEmpezarExamen = (config, nombre) => {
    setExamConfig(config);
    setNombreCertificacion(nombre);
    setView(VIEWS.EXAM);
  };

  const handleVolverInicio = () => {
    setExamConfig(null);
    setNombreCertificacion('');
    setView(VIEWS.HOME);
  };

  const navProps = {
    onOpenCookies: () => setCookiePanelOpen(true),
    onOpenPrivacy: () => setView(VIEWS.PRIVACY),
    onOpenCommunity: () => setView(VIEWS.COMMUNITY),
    onBack: () => setView(VIEWS.HOME),
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SEOHead pageType={view === VIEWS.HOME ? 'home' : 'page'} />
          <CookieConsentBanner
            forceOpen={cookiePanelOpen}
            onClose={() => setCookiePanelOpen(false)}
            onOpenPrivacy={() => { setCookiePanelOpen(false); setView(VIEWS.PRIVACY); }}
          />
          <div className="app">
            <Suspense fallback={<ViewLoader />}>
              {view === VIEWS.EXAM && examConfig && (
                <ExamenView
                  examConfig={examConfig}
                  nombreCertificacion={nombreCertificacion}
                  onVolver={handleVolverInicio}
                  {...navProps}
                />
              )}
              {view === VIEWS.HOME && (
                <LandingExamenes
                  onEmpezar={handleEmpezarExamen}
                  {...navProps}
                />
              )}
              {view === VIEWS.COMMUNITY && (
                <CommunityPage {...navProps} />
              )}
              {view === VIEWS.PRIVACY && (
                <PrivacyPolicy {...navProps} />
              )}
            </Suspense>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
