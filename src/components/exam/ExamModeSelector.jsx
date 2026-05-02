// ExamModeSelector.jsx - Con modalidad de preguntas fallidas
import { useState, useEffect } from 'react';
import logger from '../../utils/logger.js';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

export default function ExamModeSelector({ examConfig, nombreCertificacion, onStartExam, onVolver }) {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [failedQuestionsCount, setFailedQuestionsCount] = useState(0);
  const [loadingFailedQuestions, setLoadingFailedQuestions] = useState(false);

  // Cargar cantidad de preguntas fallidas para el usuario autenticado
  useEffect(() => {
    const loadFailedQuestionsCount = async () => {
      if (!isAuthenticated || !examConfig.provider || !examConfig.certification) return;

      try {
        setLoadingFailedQuestions(true);
        const response = await userAPI.getFailedQuestions({
          provider: examConfig.provider_name,
          certification: examConfig.certification
        });
        
        if (response.success && response.data) {
          setFailedQuestionsCount(response.data.length);
        }
      } catch (error) {
        logger.warn('ExamModeSelector catch:', error?.message || error);
        setFailedQuestionsCount(0);
      } finally {
        setLoadingFailedQuestions(false);
      }
    };

    loadFailedQuestionsCount();
  }, [isAuthenticated, examConfig.provider, examConfig.certification]);

  const examModes = [
    {
      id: 'realistic',
      name: t('examModes.realistic.name'),
      icon: '🎯',
      description: t('examModes.realistic.description'),
      features: t('examModes.realistic.features', { returnObjects: true }),
      restrictions: t('examModes.realistic.restrictions', { returnObjects: true }),
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900',
      borderColor: 'border-red-200 dark:border-red-700',
      available: true
    },
    {
      id: 'practice',
      name: t('examModes.practice.name'),
      icon: '📚',
      description: t('examModes.practice.description'),
      features: t('examModes.practice.features', { returnObjects: true }),
      restrictions: t('examModes.practice.restrictions', { returnObjects: true }),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900',
      borderColor: 'border-blue-200 dark:border-blue-700',
      available: true
    },
    {
      id: 'failed_questions',
      name: t('examModes.failed_questions.name'),
      icon: '🔄',
      description: t('examModes.failed_questions.description'),
      features: t('examModes.failed_questions.features', { returnObjects: true }),
      restrictions: t('examModes.failed_questions.restrictions', { returnObjects: true }),
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900',
      borderColor: 'border-orange-200',
      available: isAuthenticated && failedQuestionsCount >= 5,
      requiresAuth: true,
      questionsCount: failedQuestionsCount
    }
  ];

  const handleModeSelect = (mode) => {
    if (!mode.available) return;
    setSelectedMode(mode);
    setShowConfirm(true);
  };

  const handleConfirmStart = () => {
    const enhancedConfig = {
      ...examConfig,
      mode: selectedMode.id,
      settings: {
        ...examConfig.settings,
        // Configuraciones específicas del modo
        allowVerification: selectedMode.id === 'practice' || selectedMode.id === 'failed_questions',
        allowPause: selectedMode.id === 'practice' || selectedMode.id === 'failed_questions',
        showQuestionMetadata: selectedMode.id === 'practice' || selectedMode.id === 'failed_questions',
        strictMode: selectedMode.id === 'realistic',
        failedQuestionsOnly: selectedMode.id === 'failed_questions'
      }
    };

    onStartExam(enhancedConfig, nombreCertificacion);
  };

  if (showConfirm && selectedMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${selectedMode.color} text-white text-3xl`}>
              {selectedMode.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {t('modeSelector.confirmTitle', { name: selectedMode.name })}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {selectedMode.description}
            </p>
          </div>

          <div className="space-y-6">
            {/* Configuración del examen */}
            <div className={`p-4 rounded-lg border-2 ${selectedMode.borderColor} ${selectedMode.bgColor}`}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('modeSelector.examConfig')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-300">{t('modeSelector.certification')}</span>
                  <div className="font-semibold">{nombreCertificacion}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">{t('modeSelector.questions')}</span>
                  <div className="font-semibold">
                    {selectedMode.id === 'failed_questions' 
                      ? t('modeSelector.failedOnly', { count: failedQuestionsCount }) 
                      : examConfig.questionCount
                    }
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">{t('modeSelector.timeLimit')}</span>
                  <div className="font-semibold">
                    {selectedMode.id === 'failed_questions' 
                      ? t('modeSelector.failedMinutes', { minutes: Math.ceil(failedQuestionsCount * 1.5) }) 
                      : t('modeSelector.regularMinutes', { minutes: examConfig.timeLimit })
                    }
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">{t('modeSelector.passingScore')}</span>
                  <div className="font-semibold">{examConfig.passingScore}%</div>
                </div>
              </div>
            </div>

            {/* Información especial para preguntas fallidas */}
            {selectedMode.id === 'failed_questions' && (
              <div className="bg-orange-50 dark:bg-orange-900 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800 mb-2">{t('modeSelector.failedModeNote')}</h4>
                    <p className="text-orange-700 dark:text-orange-400 text-sm mb-2">
                      {t('modeSelector.failedModeDesc', { count: failedQuestionsCount })}
                    </p>
                    <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                      <li>• {t('modeSelector.failedModeTips.0', { returnObjects: true })}</li>
                      <li>• {t('modeSelector.failedModeTips.1', { returnObjects: true })}</li>
                      <li>• {t('modeSelector.failedModeTips.2', { returnObjects: true })}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Características y restricciones (resto igual) */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('modeSelector.featuresTitle')}
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  {selectedMode.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {t('modeSelector.restrictionsTitle')}
                </h4>
                <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                  {selectedMode.restrictions.map((restriction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Información sobre guardado para usuarios no autenticados */}
            {!isAuthenticated && (
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">{t('modeSelector.guestNote')}</h4>
                    <p className="text-yellow-700 text-sm">
                      {t('modeSelector.guestDesc')} 
                      <button className="underline font-semibold hover:text-yellow-900" onClick={() => {}}>
                        {t('modeSelector.registerHere')}
                      </button>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                setShowConfirm(false);
                setSelectedMode(null);
              }}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('modeSelector.changeMode')}
            </button>
            <button
              onClick={handleConfirmStart}
              className={`flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-all bg-gradient-to-r ${selectedMode.color}`}
            >
              {selectedMode.icon} Iniciar {selectedMode.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{t('modeSelector.pageTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-300">{nombreCertificacion}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button 
              onClick={onVolver}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex justify-center items-center px-4 py-8">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {t('modeSelector.heading')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('modeSelector.subheading')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {examModes.map((mode) => (
              <div
                key={mode.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all hover:shadow-xl cursor-pointer relative ${
                  mode.available
                    ? `${selectedMode?.id === mode.id ? mode.borderColor : 'border-gray-200 dark:border-gray-700'} hover:scale-105`
                    : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleModeSelect(mode)}
              >
                {/* Badge de disponibilidad */}
                {!mode.available && mode.requiresAuth && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {!isAuthenticated ? t('modeSelector.requiresAccount') : t('modeSelector.noQuestions')}
                  </div>
                )}
                
                {mode.available && mode.id === 'failed_questions' && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {failedQuestionsCount} preguntas
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${mode.color} text-white text-3xl shadow-lg ${!mode.available ? 'opacity-50' : ''}`}>
                      {mode.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                      {mode.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {mode.description}
                    </p>
                  </div>

                  {/* Estado de carga para preguntas fallidas */}
                  {mode.id === 'failed_questions' && loadingFailedQuestions && (
                    <div className="text-center mb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('modeSelector.loadingFailed')}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t('modeSelector.features')}
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {mode.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {feature}
                          </li>
                        ))}
                        {mode.features.length > 3 && (
                          <li className="text-gray-500 dark:text-gray-400 text-xs">
                            {t('modeSelector.moreFeatures', { count: mode.features.length - 3 })}
                          </li>
                        )}
                      </ul>
                    </div>

                    {mode.restrictions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {t('modeSelector.restrictionsTitle')}:
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          {mode.restrictions.slice(0, 2).map((restriction, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              {restriction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={!mode.available}
                    className={`w-full mt-6 px-6 py-3 rounded-lg font-semibold text-white transition-all transform ${
                      mode.available 
                        ? `hover:scale-105 bg-gradient-to-r ${mode.color} shadow-lg`
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {mode.available 
                      ? t('modeSelector.selectMode', { name: mode.name })
                      : (mode.requiresAuth && !isAuthenticated 
                          ? t('modeSelector.requiresRegister')
                          : t('modeSelector.notAvailable')
                        )
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Información adicional sobre preguntas fallidas */}
          {isAuthenticated && failedQuestionsCount < 5 && (
            <div className="text-center mt-10">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('modeSelector.needMoreFailed')}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  
                  {t('modeSelector.needMoreFailedDesc', { count: failedQuestionsCount })}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {t('modeSelector.needMoreFailedHint')}
                </p>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="text-center mt-10">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('modeSelector.tipTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {t('modeSelector.tipDesc2')}
                </p>
                <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{t('modeSelector.tipPractice')}</span>
                  <span>•</span>
                  <span>{t('modeSelector.tipRealistic')}</span>
                  <span>•</span>
                  <span>{t('modeSelector.tipFailed')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}