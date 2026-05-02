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
import SettingsPanel from './common/SettingsPanel';
import CertificationLogo from './common/CertificationLogo';
import SEOHead, { SEO_CONFIGS, SITE_URL } from './seo/SEOHead';
import { useTranslation } from 'react-i18next';

export default function LandingExamenes({ onEmpezar, onOpenCookies, onOpenPrivacy, onOpenCommunity }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useTranslation();
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
        const health = await checkBackendHealth();
        setBackendStatus(health);
        
        if (!health.available) {
          setError(t('landing.backendError'));
          return;
        }
        // Cargar proveedores disponibles desde PostgreSQL
        const providersResponse = await questionAPI.getProviders();
        if (providersResponse.success && providersResponse.data) {
          const providersList = providersResponse.data.map(provider => parseProviderData(provider));
          setProviders(providersList);
          if (providersList.length === 0) {
            setError('No se encontraron proveedores en la base de datos. Ejecuta el script de datos de ejemplo.');
            return;
          }
        } else {
          setError(providersResponse.error || 'Error cargando proveedores');
          return;
        }
        
      } catch (err) {
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
        const response = await questionAPI.getCertifications(providerSeleccionado.name);
        
        if (response.success && response.data) {
          const certificationsList = response.data.map(cert => formatCertification(cert));
          setCertifications(certificationsList);
        } else {
          setCertifications([]);
        }
      } catch (err) {
        setCertifications([]);
      }
    };

    loadCertifications();
  }, [providerSeleccionado]);

  const handleProviderSelection = (provider) => {
    setProviderSeleccionado(provider);
    setCertificacionSeleccionada(null);
  };

  const handleStartExam = () => {
    if (!providerSeleccionado || !certificacionSeleccionada) return;
    setShowModeSelector(true);
  };

  const handleModeSelected = async (examConfig, nombreCertificacion) => {
    try {
      // Solo validar campos esenciales
      if (!examConfig.provider || !examConfig.certification) {
        throw new Error('Proveedor y certificación son requeridos');
      }
      
      // Llamar a la función onEmpezar con la configuración validada
      onEmpezar(examConfig, nombreCertificacion);
    } catch (err) {
      setError(`Error iniciando examen: ${err.message}`);
    }
  };

  const handleBackFromModeSelector = () => {
    setShowModeSelector(false);
  };

  const handleResumeExam = async (examId, showResults = false) => {
    setShowHistory(false);
    if (!examId) return;
    // showResults=true: open the review modal directly via ExamHistory's flow.
    // showResults=false: resuming a paused exam isn't supported by the
    // backend yet; surface that clearly instead of silently doing nothing.
    if (!showResults) {
      setError(t('landing.resumeNotAvailable', {
        defaultValue: 'La reanudación de exámenes pausados aún no está disponible. Tu progreso queda guardado en el historial.',
      }));
    }
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
    onEmpezar(failedExamConfig, `${providerSeleccionado.name} - ${certificacionSeleccionada.name} ({t('landing.failedQuestions')})`);
  };

  // Crear configuración base del examen usando datos de la certificación
  const createBaseExamConfig = () => {
    // Validar que tenemos proveedor y certificación seleccionados
    if (!providerSeleccionado || !certificacionSeleccionada) {
      return null;
    }

    // Crear título descriptivo del examen
    const examTitle = `${providerSeleccionado.name} - ${certificacionSeleccionada.name}`;
    
    // Crear descripción del examen
    const examDescription = `Examen de práctica para la certificación ${certificacionSeleccionada.code || certificacionSeleccionada.name} de ${providerSeleccionado.name}`;
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
      setImageError(true);
    };

    const handleImageLoad = () => {
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
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 shadow-sm border ${className}`}>
        <img 
          src={logoUrl}
          alt={`${provider.name} logo`}
          className="max-w-full max-h-full object-contain p-1"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        {!imageLoaded && !imageError && (
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        )}
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 dark:text-blue-400 font-medium">
            {authLoading ? t('landing.verifyingAuth') : t('landing.loadingBackend')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-200 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-4">{t('landing.connectionError')}</h3>
          <p className="text-red-700 dark:text-red-400 mb-6">{error}</p>
          <div className="bg-red-50 dark:bg-red-900/20 rounded p-4 text-left text-sm text-red-700 dark:text-red-400">
            <p className="font-semibold mb-2">{t('landing.solutions')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('landing.solutionCheck')}</li>
              <li>{t('landing.solutionStart')}</li>
              <li>{t('landing.solutionPort')}</li>
              <li>Ejecuta datos de ejemplo: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">POST /api/v1/questions/admin/sample-data</code></li>
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

  // ── SEO dinámico según selección ─────────────────────────────────────────
  const seoProviderName = providerSeleccionado?.name || null;
  const seoCertName = certificacionSeleccionada
    ? (certificacionSeleccionada.name || certificacionSeleccionada.code)
    : null;
  const seoCertCode = certificacionSeleccionada?.code || null;

  const providerKeyMap = { 'AWS': 'aws', 'Google Cloud': 'gcp', 'Microsoft Azure': 'azure', 'Databricks': 'databricks', 'Snowflake': 'snowflake' };

  const seoProps = seoCertName && seoProviderName
    ? {
        pageType: 'certification',
        provider: seoProviderName,
        certification: seoCertName,
        certificationCode: seoCertCode,
        title: `${seoCertName} Practice Exam – Free Questions`,
        description: `Free ${seoCertName}${seoCertCode ? ` (${seoCertCode})` : ''} practice exam questions with instant explanations. Prepare for your ${seoProviderName} certification with CertiPractice.`,
      }
    : seoProviderName && providerKeyMap[seoProviderName]
    ? { ...SEO_CONFIGS[providerKeyMap[seoProviderName]] }
    : SEO_CONFIGS.home;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <SEOHead {...seoProps} />
      <header className="bg-white dark:bg-gray-800 shadow p-6 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">CertiPractice</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {isAuthenticated ? (
              <>{t('landing.welcomeUser', { name: user?.firstName, count: providers.length })}</>
            ) : (
              <>{t('landing.freeGuest', { count: providers.length })}</>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {/* Community forum button - always visible */}
          {onOpenCommunity && (
            <button
              onClick={onOpenCommunity}
              className="hidden sm:flex items-center space-x-2 px-3 py-2 text-purple-700 dark:text-purple-300 border border-purple-400 dark:border-purple-600 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
              aria-label={t('landing.communityButton', { defaultValue: 'Community Forum' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <span>{t('landing.communityButton', { defaultValue: 'Comunidad' })}</span>
            </button>
          )}

          <SettingsPanel onOpenCookies={onOpenCookies} onOpenPrivacy={onOpenPrivacy} onOpenCommunity={onOpenCommunity} />

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-300 border border-blue-600 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>{t('landing.history')}</span>
              </button>
              
              {/* Botón para preguntas fallidas */}
              <button
                onClick={handleShowFailedQuestions}
                className="flex items-center space-x-2 px-3 py-2 text-orange-600 border border-orange-600 rounded hover:bg-orange-50 dark:bg-orange-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('landing.failedButton')}</span>
              </button>
              
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span>{t('landing.myProfile')}</span>
              </button>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 dark:bg-blue-950/30 transition-colors"
              >
                {t('landing.login')}
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {t('landing.register')}
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-100 to-green-100 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 max-w-2xl text-center">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">{t('landing.freeTitle')}</h3>
            <p className="text-blue-700 dark:text-blue-400 mb-3">
              {t('landing.freeDesc')}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              {t('landing.registerCTA')}
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

        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-blue-800 dark:text-blue-300">
          {t('landing.practiceForCerts')}
        </h2>
        <p className="text-center text-gray-700 dark:text-gray-200 mb-10 max-w-2xl">
          {t('landing.chooseProvider')}
          {isAuthenticated && t('landing.progressAutoSaved')}
        </p>
        
        {/* Selección de Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10 w-full max-w-6xl">
          {providers.map(provider => (
            <div
              key={provider.name}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center border-2 transition-all cursor-pointer ${
                providerSeleccionado?.name === provider.name 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 shadow-lg transform scale-105' 
                  : 'border-transparent hover:border-blue-300 hover:shadow-md hover:scale-102'
              }`}
              onClick={() => handleProviderSelection(provider)}
            >
              <ProviderLogo provider={provider} className="mb-4" />
              <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-400 text-center">
                {provider.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-2 text-sm">
                {provider.description}
              </p>
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-600">
                  {(provider.question_count || 0).toLocaleString()}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">preguntas</p>
              </div>
              {provider.certificationCount > 0 && (
                <div className="text-center mt-1">
                  <span className="text-sm font-medium text-green-600">
                    {provider.certificationCount} certificaciones
                  </span>
                </div>
              )}
              {providerSeleccionado?.name === provider.name && (
                <span className="mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold animate-pulse">
                  {t('landing.selectedBadge')}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Selección de Certificación */}
        {providerSeleccionado && certifications.length > 0 && (
          <div className="w-full max-w-4xl mb-10 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400 text-center">
              {t('landing.certsAvailable', { provider: providerSeleccionado.name })}
            </h3>            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map(cert => (
                <button
                  key={cert.code || cert.name}
                  className={`w-full px-4 py-3 rounded border text-left font-medium transition-all ${
                    certificacionSeleccionada?.code === cert.code || certificacionSeleccionada?.name === cert.name
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105' 
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:bg-blue-950/30 hover:border-blue-300'
                  }`}
                  onClick={() => setCertificacionSeleccionada(cert)}
                >
                  <div className="flex items-center space-x-3">
                    <CertificationLogo
                      code={cert.code}
                      name={cert.name}
                      provider={cert.provider || providerSeleccionado?.name}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{cert.code || cert.name}</div>
                      <div className="text-sm opacity-75">
                        {cert.name}
                      </div>
                      {cert.difficulty && (
                        <div className="text-xs opacity-60">
                          {t('landing.difficulty')} {cert.difficulty}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* {t('landing.examConfig')} usando datos de la certificación */}
        {certificacionSeleccionada && (
          <div className="w-full max-w-md mb-10 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-600">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-4 text-center">
                {t('landing.examConfig')}
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>{t('landing.questions')}</span>
                  <span className="font-semibold text-blue-600">{examDefaults.questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('landing.timeLimit')}</span>
                  <span className="font-semibold text-blue-600">
                    {certificacionSeleccionada.duration || examDefaults.timeLimit} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('landing.passingScoreLabel')}</span>
                  <span className="font-semibold text-blue-600">
                    {certificacionSeleccionada.passingScore || examDefaults.passingScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('landing.difficulty')}</span>
                  <span className="font-semibold text-purple-600">
                    {certificacionSeleccionada.difficulty || 'Medium'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('landing.saveProgress')}</span>
                  <span className="font-semibold text-green-600">
                    {isAuthenticated ? t('landing.saveYes') : t('landing.saveNo')}
                  </span>
                </div>
              </div>
              
              {/* Sección de preguntas fallidas */}
              {isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="font-medium text-gray-700 dark:text-gray-200 mb-2">{t('landing.advancedOptions')}</h5>
                  <button
                    onClick={handleShowFailedQuestions}
                    className="w-full px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded hover:bg-orange-200 transition-colors text-sm font-medium"
                  >
                    {t('landing.viewFailed')}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('landing.failedHint')}
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
            ? t('landing.selectMode')
            : t('landing.selectCertFirst')
          }
        </button>

        {!isAuthenticated && certificacionSeleccionada && (
          <div className="mt-6 text-center max-w-md">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>{t('landing.guestModeLabel')}</strong> {t('landing.guestModeInfo')}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowRegister(true)}
                  className="block w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm underline"
                >
                  {t('landing.registerForProgress')}
                </button>
                <p className="text-xs text-yellow-700">
                  {t('landing.withAccount')} {t('landing.failedModePromo')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado de la conexión */}
        {providers.length === 0 && !loading && (
          <div className="mt-8 text-center text-gray-600 dark:text-gray-300">
            <p>{t('landing.noProviders')}</p>
            <p className="text-sm mt-2">{t('landing.runSampleData')}</p>
          </div>
        )}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 text-center py-6 text-gray-500 dark:text-gray-400 text-sm border-t">
        <div className="max-w-4xl mx-auto px-4">
          <p className="mb-2">
            {t('landing.copyright', { year: new Date().getFullYear() })} • {t('landing.totalQuestions', { count: totalQuestions.toLocaleString() })}
          </p>

          {isAuthenticated && (
            <p className="text-blue-600">
              {t('landing.activeSession')} {user?.username}
            </p>
          )}
          {!isAuthenticated && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300 mb-3">{t('landing.joinCommunity')}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowRegister(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Crear Cuenta
                </button>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:bg-blue-950/30 transition-colors text-sm"
                >
                  {t('landing.login')}
                </button>
              </div>
            </div>
          )}
          
          {/* Consejos adicionales */}
          <div className="text-center mt-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('landing.unsureTitle')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {t('landing.unsureDesc')}{' '}
                {isAuthenticated && (
                  <>{t('landing.alsoFailedMode')}</>
                )}
              </p>
              <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                <span>{t('landing.tipPractice')}</span>
                <span>•</span>
                <span>{t('landing.tipRealistic')}</span>
                {isAuthenticated && (
                  <>
                    <span>•</span>
                    <span>{t('landing.failedQuestions')}: Mejora debilidades</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer secondary links: community + privacy */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-center items-center gap-4 text-sm">
            {onOpenCommunity && (
              <button
                onClick={onOpenCommunity}
                className="text-purple-700 dark:text-purple-300 hover:underline font-medium inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('landing.communityButton', { defaultValue: 'Foro de la comunidad' })}
              </button>
            )}
            <span className="text-gray-300 dark:text-gray-600">•</span>
            {onOpenPrivacy && (
              <button
                onClick={onOpenPrivacy}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('landing.privacyLink', { defaultValue: 'Política de Privacidad' })}
              </button>
            )}
            <span className="text-gray-300 dark:text-gray-600">•</span>
            {onOpenCookies && (
              <button
                onClick={onOpenCookies}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('landing.cookiesLink', { defaultValue: 'Cookies' })}
              </button>
            )}
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