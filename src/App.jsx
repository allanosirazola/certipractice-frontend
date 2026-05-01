// src/App.jsx
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import LandingExamenes from './components/LandingExamenes';
import ExamenView from './components/ExamenView';
import SEOHead from './components/seo/SEOHead';
import CookieConsentBanner from './components/privacy/CookieConsentBanner';
import './App.css';

function App() {
  const [enExamen, setEnExamen] = useState(false);
  const [examConfig, setExamConfig] = useState(null);
  const [nombreCertificacion, setNombreCertificacion] = useState('');
  const [cookiePanelOpen, setCookiePanelOpen] = useState(false);

  const handleEmpezarExamen = (config, nombre) => {
    setExamConfig(config);
    setNombreCertificacion(nombre);
    setEnExamen(true);
  };

  const handleVolverInicio = () => {
    setEnExamen(false);
    setExamConfig(null);
    setNombreCertificacion('');
  };

  return (
    <AuthProvider>
      <SEOHead pageType="home" />
      <CookieConsentBanner
        forceOpen={cookiePanelOpen}
        onClose={() => setCookiePanelOpen(false)}
      />
      <div className="app">
        {enExamen && examConfig ? (
          <ExamenView
            examConfig={examConfig}
            nombreCertificacion={nombreCertificacion}
            onVolver={handleVolverInicio}
            onOpenCookies={() => setCookiePanelOpen(true)}
          />
        ) : (
          <LandingExamenes
            onEmpezar={handleEmpezarExamen}
            onOpenCookies={() => setCookiePanelOpen(true)}
          />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
