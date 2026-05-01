// src/App.jsx
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import LandingExamenes from './components/LandingExamenes';
import ExamenView from './components/ExamenView';
import SEOHead from './components/seo/SEOHead';
import './App.css';

function App() {
  const [enExamen, setEnExamen] = useState(false);
  const [examConfig, setExamConfig] = useState(null);
  const [nombreCertificacion, setNombreCertificacion] = useState('');

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
      {/* Global base SEO — overridden by page-level SEOHead */}
      <SEOHead pageType="home" />
      <div className="app">
        {enExamen && examConfig ? (
          <ExamenView
            examConfig={examConfig}
            nombreCertificacion={nombreCertificacion}
            onVolver={handleVolverInicio}
          />
        ) : (
          <LandingExamenes onEmpezar={handleEmpezarExamen} />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
