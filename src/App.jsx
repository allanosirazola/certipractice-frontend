// src/App.jsx
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import LandingExamenes from './components/LandingExamenes';
import ExamenView from './components/ExamenView';
import './App.css';

function App() {
  const [enExamen, setEnExamen] = useState(false);
  const [examConfig, setExamConfig] = useState(null);
  const [nombreCertificacion, setNombreCertificacion] = useState('');

  const handleEmpezarExamen = (config, nombre) => {
    setExamConfig(config);
    console.log("Exam config:"+ examConfig)
    setNombreCertificacion(nombre);
    console.log("Certi config:"+ nombre)

    setEnExamen(true);
  };

  const handleVolverInicio = () => {
    setEnExamen(false);
    setExamConfig(null);
    setNombreCertificacion('');
  };

  return (
    <AuthProvider>
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