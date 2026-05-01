// src/App.jsx
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingExamenes from './components/LandingExamenes';
import ExamenView from './components/ExamenView';
import CommunityPage from './components/community/CommunityPage';
import PrivacyPolicy from './components/privacy/PrivacyPolicy';
import SEOHead from './components/seo/SEOHead';
import CookieConsentBanner from './components/privacy/CookieConsentBanner';
import './App.css';

// View routes managed via state (no router needed)
const VIEWS = { HOME: 'home', EXAM: 'exam', COMMUNITY: 'community', PRIVACY: 'privacy' };

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
    <ThemeProvider>
      <AuthProvider>
        <SEOHead pageType={view === VIEWS.HOME ? 'home' : 'page'} />
        <CookieConsentBanner
          forceOpen={cookiePanelOpen}
          onClose={() => setCookiePanelOpen(false)}
        />
        <div className="app">
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
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
