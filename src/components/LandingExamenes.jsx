// LandingExamenes.jsx - VERSIÓN COMPLETA CON PREGUNTAS FALLIDAS
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { questionAPI, checkBackendHealth } from '../services/api';
import { 
  parseProviderData, 
  formatCertification, 
  examDefaults,
  getProviderLogo,
  getCertificationLogo
} from '../data/certificaciones';
import Login from './auth/Login';
import Register from './auth/Register';
import UserProfile from './user/UserProfile';
import ExamHistory from './exam/ExamHistory';
import ExamModeSelector from './exam/ExamModeSelector';
import FailedQuestionsStats from './exam/FailedQuestionsStats';

export default function LandingExamenes({ onEmpezar }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  
  // Datos del backend
  const [providers, setProviders] = useState([]);
  const [certifications, setCertifications] = useState([]);
  
  // Estado del UI
  const [providerSeleccionado, setProviderSeleccionado] = useState(null);
  const [certificacionSeleccionada, setCertificacionSeleccionada] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  // Estados de los modales
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFailedQuestions, setShowFailedQuestions] = useState(false);
  const [failedQuestionsData, setFailedQuestionsData] = useState(null);

  // Verificar estado del backend y cargar datos iniciales
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar backend
        console.log('Verificando backend...');
        const health = await checkBackendHealth();
        setBackendStatus(health);
        
        if (!health.available) {
          setError('Backend no disponible. Asegúrate de que el servidor esté corriendo en puerto 3000.');
          return;
        }

        console.log('Backend disponible, cargando proveedores...');
        
        // Cargar proveedores disponibles desde PostgreSQL
        const providersResponse = await questionAPI.getProviders();
        console.log('Proveedores recibidos:', providersResponse);
        
        if (!providersResponse.success === false && providersResponse.data) {
          const providersList = providersResponse.data.map(provider => parseProviderData(provider));
          setProviders(providersList);
          console.log('Proveedores procesados:', providersList);

          if (providersList.length === 0) {
            setError('No se encontraron proveedores en la base de datos. Ejecuta el script de datos de ejemplo.');
            return;
          }
        } else {
          setError(providersResponse.error || 'Error cargando proveedores');
          return;
        }
        
      } catch (err) {
        console.error('Error inicializando app:', err);
        setError(`Error conectando con el backend: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      initializeApp();
    }
  }, [authLoading]);

  // Cargar certificaciones cuando se selecciona un proveedor
  useEffect(() => {
    const loadCertifications = async () => {
      if (!providerSeleccionado) {
        setCertifications([]);
        return;
      }

      try {
        console.log(`Cargando certificaciones para ${providerSeleccionado.name}...`);
        const response = await questionAPI.getCertifications(providerSeleccionado.name);
        
        if (!response.success === false && response.data) {
          const certificationsList = response.data.map(cert => formatCertification(cert));
          setCertifications(certificationsList);
          console.log('Certificaciones procesadas:', certificationsList);
        } else {
          console.error('Error en respuesta de certificaciones:', response);
          setCertifications([]);
        }
      } catch (err) {
        console.error('Error cargando certificaciones:', err);
        setCertifications([]);
      }
    };

    loadCertifications();
  }, [providerSeleccionado]);

  const handleProviderSelection = (provider) => {
    console.log(`Proveedor seleccionado:`, provider);
    setProviderSeleccionado(provider);
    setCertificacionSeleccionada(null);
  };

  const handleStartExam = () => {
    if (!providerSeleccionado || !certificacionSeleccionada) return;
    setShowModeSelector(true);
  };

  const handleModeSelected = async (examConfig, nombreCertificacion) => {
    try {
      console.log(`Iniciando examen con configuración simplificada:`, examConfig);
      
      // Solo validar campos esenciales
      if (!examConfig.provider || !examConfig.certification) {
        throw new Error('Proveedor y certificación son requeridos');
      }
      
      // Llamar a la función onEmpezar con la configuración validada
      onEmpezar(examConfig, nombreCertificacion);
    } catch (err) {
      console.error('Error iniciando examen:', err);
      setError(`Error iniciando examen: ${err.message}`);
    }
  };

  const handleBackFromModeSelector = () => {
    setShowModeSelector(false);
  };

  const handleResumeExam = (examId, showResults = false) => {
    console.log('Resumir examen:', examId, showResults);
    setShowHistory(false);
    // TODO: Implementar lógica para continuar examen
  };

  // Función para manejar preguntas fallidas
  const handleShowFailedQuestions = () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    
    if (!providerSeleccionado || !certificacionSeleccionada) {
      setError('Selecciona un proveedor y certificación primero');
      return;
    }
    
    setFailedQuestionsData({
      provider: providerSeleccionado.name,
      certification: certificacionSeleccionada.id || certificacionSeleccionada.name
    });
    setShowFailedQuestions(true);
  };

  // Función para iniciar examen de preguntas fallidas
  const handleStartFailedQuestionsExam = (questionCount) => {
    const failedExamConfig = {
      ...createBaseExamConfig(),
      mode: 'failed_questions',
      questionCount: questionCount,
      timeLimit: Math.max(Math.ceil(questionCount * 1.5), 10), // 1.5 min por pregunta, mínimo 10 min
      settings: {
        randomizeQuestions: true,
        randomizeAnswers: false,
        showExplanations: true,
        allowPause: true,
        allowReview: true,
        failedQuestionsOnly: true
      }
    };
    
    setShowFailedQuestions(false);
    setShowModeSelector(true);
    
    // Pasar directamente el config al iniciador
    onEmpezar(failedExamConfig, `${providerSeleccionado.name} - ${certificacionSeleccionada.name} (Preguntas Fallidas)`);
  };

  // Crear configuración base del examen usando datos de la certificación
  const createBaseExamConfig = () => {
    // Validar que tenemos proveedor y certificación seleccionados
    if (!providerSeleccionado || !certificacionSeleccionada) {
      console.error('Proveedor o certificación no seleccionados');
      return null;
    }

    // Crear título descriptivo del examen
    const examTitle = `${providerSeleccionado.name} - ${certificacionSeleccionada.name}`;
    
    // Crear descripción del examen
    const examDescription = `Examen de práctica para la certificación ${certificacionSeleccionada.code || certificacionSeleccionada.name} de ${providerSeleccionado.name}`;

    console.log('Creando configuración base del examen:', {
      provider: providerSeleccionado.id,
      provider_name: providerSeleccionado.name,
      certification: certificacionSeleccionada.id,
      title: examTitle
    });

    return {
      // CAMPOS REQUERIDOS
      title: examTitle,
      provider: providerSeleccionado.id,
      certification: certificacionSeleccionada.id,
      
      // CAMPOS OPCIONALES con valores por defecto
      description: examDescription,
      questionCount: certificacionSeleccionada.total_questions, 
      timeLimit: certificacionSeleccionada.duration_minutes || examDefaults.timeLimit,
      passingScore: certificacionSeleccionada.passing_score || examDefaults.passingScore,
      
      // CAMPOS ADICIONALES
      mode: 'practice',
      difficulty: certificacionSeleccionada.difficulty_level || 'medium',
      certificationCode: certificacionSeleccionada.code,
      
      // CONFIGURACIONES DEL EXAMEN
      settings: {
        randomizeQuestions: true,
        randomizeAnswers: false,
        showExplanations: true,
        allowPause: true,
        allowReview: true
      }
    };
  };

  // Componente para renderizar logo de proveedor con fallback mejorado
  const ProviderLogo = ({ provider, className = "" }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const handleImageError = (e) => {
      console.warn(`Error cargando imagen para proveedor ${provider.name}:`, e.target.src);
      setImageError(true);
    };

    const handleImageLoad = () => {
      console.log(`Imagen cargada exitosamente para proveedor ${provider.name}`);
      setImageLoaded(true);
    };

    // URLs de logos usando CDN o iconos como fallback
    const getProviderLogoUrl = (providerName) => {
      const logoMap = {
        'AWS': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
        'Google Cloud': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg',
        'Microsoft Azure': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg',
        'Databricks': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Databricks_Logo.png',
        'Snowflake': 'https://logos-world.net/wp-content/uploads/2022/11/Snowflake-Logo.png',
        'HashiCorp': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Terraform_Logo.svg',
        'Salesforce': 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
      };
      return logoMap[providerName] || null;
    };

    const logoUrl = getProviderLogoUrl(provider.name);

    // Si hay error de imagen o no hay logo definido, mostrar fallback
    if (imageError || !logoUrl) {
      return (
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg shadow-sm ${className}`}>
          {provider.name.substring(0, 2).toUpperCase()}
        </div>
      );
    }

    return (
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-sm border ${className}`}>
        <img 
          src={logoUrl}
          alt={`${provider.name} logo`}
          className="max-w-full max-h-full object-contain p-1"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        {!imageLoaded && !imageError && (
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        )}
      </div>
    );
  };

  // Componente para renderizar logo de certificación
  const CertificationLogo = ({ certification, className = "" }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const handleImageError = (e) => {
      console.error(`Error cargando imagen para certificación ${certification.code}:`, e.target.src);
      setImageError(true);
    };

    const handleImageLoad = () => {
      console.log(`Imagen de certificación cargada exitosamente para ${certification.code}`);
      setImageLoaded(true);
    };

    // Usar iconos como fallback en lugar de URLs inexistentes
    const getCertificationIcon = (certification) => {
      const code = certification.code || certification.name;
      const provider = certification.provider || providerSeleccionado?.name;
      
      // Mapeo básico de iconos por proveedor
      const iconMap = {
        'AWS': '🧡',
        'Google Cloud': '🔵',
        'Microsoft Azure': '🔷',
        'Databricks': '🔴',
        'Snowflake': '❄️',
        'HashiCorp': '🟣',
        'Salesforce': '🔷',
      };
      
      return iconMap[provider] || '📜';
    };

    // Siempre mostrar fallback con icono
    return (
      <div className={`w-10 h-10 rounded flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xl shadow-sm ${className}`}>
        {getCertificationIcon(certification)}
      </div>
    );
  };

  // Si se está mostrando el selector de modo
  if (showModeSelector) {
    const certificationDisplayName = `${providerSeleccionado.name} - ${certificacionSeleccionada.name}`;
    
    return (
      <ExamModeSelector
        examConfig={createBaseExamConfig()}
        nombreCertificacion={certificationDisplayName}
        onStartExam={handleModeSelected}
        onVolver={handleBackFromModeSelector}
      />
    );
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">
            {authLoading ? 'Verificando autenticación...' : 'Cargando datos del backend...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-4">Error de Conexión</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <div className="bg-red-50 rounded p-4 text-left text-sm text-red-700">
            <p className="font-semibold mb-2">Soluciones:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verifica que el backend esté corriendo</li>
              <li>Inicia el backend: <code className="bg-red-100 px-1 rounded">npm run dev</code></li>
              <li>Verifica el puerto 3000 esté libre</li>
              <li>Ejecuta datos de ejemplo: <code className="bg-red-100 px-1 rounded">POST /api/v1/questions/admin/sample-data</code></li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Calcular total de preguntas
  const totalQuestions = providers.reduce((sum, provider) => sum + (provider.questionCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
      <header className="bg-white shadow p-6 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-700 mb-2">CertiPractice</h1>
          <p className="text-gray-600 text-lg">
            {isAuthenticated ? (
              <>Hola {user?.firstName}! - {providers.length} proveedores disponibles</>
            ) : (
              <>Práctica gratuita - {providers.length} proveedores disponibles</>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {backendStatus?.available && (
            <div className="flex items-center text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              PostgreSQL conectado
            </div>
          )}
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Historial</span>
              </button>
              
              {/* Botón para preguntas fallidas */}
              <button
                onClick={handleShowFailedQuestions}
                className="flex items-center space-x-2 px-3 py-2 text-orange-600 border border-orange-600 rounded hover:bg-orange-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Fallos</span>
              </button>
              
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span>Mi Perfil</span>
              </button>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-100 to-green-100 border border-blue-200 rounded-lg p-6 mb-8 max-w-2xl text-center">
            <h3 className="font-semibold text-blue-800 mb-2">Practica gratis sin registro!</h3>
            <p className="text-blue-700 mb-3">
              Puedes hacer exámenes completos sin necesidad de crear una cuenta.
            </p>
            <p className="text-sm text-green-700 mb-4">
              <strong>¿Quieres más?</strong> Regístrate para guardar tu progreso, ver estadísticas detalladas e historial completo.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowRegister(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
              >
                Crear Cuenta Gratis
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Ya Tengo Cuenta
              </button>
            </div>
          </div>
        )}

        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-blue-800">
          Practica con preguntas reales de certificación
        </h2>
        <p className="text-center text-gray-700 mb-10 max-w-2xl">
          Elige el proveedor y certificación. Las preguntas vienen directamente de la base de datos PostgreSQL.
          {isAuthenticated && ' Tu progreso se guardará automáticamente.'}
        </p>
        
        {/* Selección de Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10 w-full max-w-6xl">
          {providers.map(provider => (
            <div
              key={provider.name}
              className={`bg-white rounded-lg shadow p-6 flex flex-col items-center border-2 transition-all cursor-pointer ${
                providerSeleccionado?.name === provider.name 
                  ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-105' 
                  : 'border-transparent hover:border-blue-300 hover:shadow-md hover:scale-102'
              }`}
              onClick={() => handleProviderSelection(provider)}
            >
              <ProviderLogo provider={provider} className="mb-4" />
              <h3 className="text-lg font-bold mb-2 text-blue-700 text-center">
                {provider.name}
              </h3>
              <p className="text-gray-600 text-center mb-2 text-sm">
                {provider.description}
              </p>
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-600">
                  {(provider.question_count || 0).toLocaleString()}
                </span>
                <p className="text-xs text-gray-500">preguntas</p>
              </div>
              {provider.certificationCount > 0 && (
                <div className="text-center mt-1">
                  <span className="text-sm font-medium text-green-600">
                    {provider.certificationCount} certificaciones
                  </span>
                </div>
              )}
              {providerSeleccionado?.name === provider.name && (
                <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold animate-pulse">
                  Seleccionado
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Selección de Certificación */}
        {providerSeleccionado && certifications.length > 0 && (
          <div className="w-full max-w-4xl mb-10 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 text-blue-700 text-center">
              Certificaciones disponibles para {providerSeleccionado.name}
            </h3>            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map(cert => (
                <button
                  key={cert.code || cert.name}
                  className={`w-full px-4 py-3 rounded border text-left font-medium transition-all ${
                    certificacionSeleccionada?.code === cert.code || certificacionSeleccionada?.name === cert.name
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105' 
                      : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => setCertificacionSeleccionada(cert)}
                >
                  <div className="flex items-center space-x-3">
                    <CertificationLogo certification={cert} />
                    <div className="flex-1">
                      <div className="font-semibold">{cert.code || cert.name}</div>
                      <div className="text-sm opacity-75">
                        {cert.name}
                      </div>
                      {cert.difficulty && (
                        <div className="text-xs opacity-60">
                          Dificultad: {cert.difficulty}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Configuración del Examen usando datos de la certificación */}
        {certificacionSeleccionada && (
          <div className="w-full max-w-md mb-10 animate-fade-in">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
              <h4 className="font-semibold text-blue-700 mb-4 text-center">
                Configuración del Examen
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Preguntas:</span>
                  <span className="font-semibold text-blue-600">{examDefaults.questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo límite:</span>
                  <span className="font-semibold text-blue-600">
                    {certificacionSeleccionada.duration || examDefaults.timeLimit} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Puntuación mínima:</span>
                  <span className="font-semibold text-blue-600">
                    {certificacionSeleccionada.passingScore || examDefaults.passingScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dificultad:</span>
                  <span className="font-semibold text-purple-600">
                    {certificacionSeleccionada.difficulty || 'Medium'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Guardar progreso:</span>
                  <span className="font-semibold text-green-600">
                    {isAuthenticated ? 'Si' : 'No (sin registro)'}
                  </span>
                </div>
              </div>
              
              {/* Sección de preguntas fallidas */}
              {isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-medium text-gray-700 mb-2">Opciones Avanzadas</h5>
                  <button
                    onClick={handleShowFailedQuestions}
                    className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-sm font-medium"
                  >
                    Ver Preguntas Fallidas
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Practica solo las preguntas que has respondido incorrectamente
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Botón Empezar */}
        <button
          className={`px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg transition-all ${
            certificacionSeleccionada 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 hover:shadow-xl' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={!certificacionSeleccionada}
          onClick={handleStartExam}
        >
          {certificacionSeleccionada 
            ? 'Seleccionar Modo de Examen'
            : 'Selecciona una certificación'
          }
        </button>

        {!isAuthenticated && certificacionSeleccionada && (
          <div className="mt-6 text-center max-w-md">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Modo Invitado:</strong> Tu examen se guardará temporalmente en esta sesión.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowRegister(true)}
                  className="block w-full text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                >
                  ¿Quieres guardar tu progreso permanentemente? Regístrate aquí
                </button>
                <p className="text-xs text-yellow-700">
                  <strong>Con cuenta:</strong> Accede al modo "Preguntas Fallidas" para practicar solo lo que necesitas mejorar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado de la conexión */}
        {providers.length === 0 && !loading && (
          <div className="mt-8 text-center text-gray-600">
            <p>No se encontraron proveedores en la base de datos.</p>
            <p className="text-sm mt-2">Ejecuta el script de datos de ejemplo para comenzar.</p>
          </div>
        )}
      </main>
      
      <footer className="bg-white text-center py-6 text-gray-500 text-sm border-t">
        <div className="max-w-4xl mx-auto px-4">
          <p className="mb-2">
            © {new Date().getFullYear()} CertiPractice • Conectado a {totalQuestions.toLocaleString()} preguntas totales
          </p>
          {backendStatus?.available && (
            <p className="text-green-600 text-xs">
              PostgreSQL {backendStatus.version ? `v${backendStatus.version.split(' ')[1]}` : 'conectado'}
            </p>
          )}
          {isAuthenticated && (
            <p className="text-blue-600">
              Sesión activa: {user?.username}
            </p>
          )}
          {!isAuthenticated && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-3">¿No tienes cuenta? Únete a la comunidad</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowRegister(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Crear Cuenta
                </button>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          )}
          
          {/* Consejos adicionales */}
          <div className="text-center mt-10">
            <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-800 mb-2">¿No estás seguro?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Si es tu primera vez, te recomendamos empezar con el <strong>Modo Práctica</strong> 
                para familiarizarte con el formato de preguntas. Cuando te sientas preparado, 
                usa el <strong>Modo Examen Real</strong> para evaluar tu conocimiento.
                {isAuthenticated && (
                  <> También puedes usar <strong>Preguntas Fallidas</strong> para mejorar tus debilidades específicas.</>
                )}
              </p>
              <div className="flex justify-center gap-4 text-xs text-gray-500 flex-wrap">
                <span>Modo Práctica: Ideal para aprender</span>
                <span>•</span>
                <span>Modo Real: Ideal para evaluarse</span>
                {isAuthenticated && (
                  <>
                    <span>•</span>
                    <span>Preguntas Fallidas: Mejora debilidades</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modales */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      {showHistory && (
        <ExamHistory 
          onClose={() => setShowHistory(false)}
          onResumeExam={handleResumeExam}
        />
      )}

      {showFailedQuestions && failedQuestionsData && (
        <FailedQuestionsStats
          provider={failedQuestionsData.provider}
          certification={failedQuestionsData.certification}
          onClose={() => {
            setShowFailedQuestions(false);
            setFailedQuestionsData(null);
          }}
          onStartFailedExam={handleStartFailedQuestionsExam}
        />
      )}
    </div>
  );
}