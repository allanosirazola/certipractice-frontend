// ExamHistory.jsx - VERSIÓN COMPLETA ACTUALIZADA
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { examAPI, utils } from '../../services/api';
import ExamReview from './ExamReview';
import { useTranslation } from 'react-i18next';

export default function ExamHistory({ onClose, onResumeExam }) {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  // NUEVOS ESTADOS PARA REVISIÓN
  const [showReview, setShowReview] = useState(false);
  const [reviewExamId, setReviewExamId] = useState(null);
  const [reviewExamData, setReviewExamData] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadExams();
    }
  }, [filter, isAuthenticated]);

  const loadExams = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError('');
    
    try {
      const filters = filter !== 'all' ? { status: filter } : {};
      const result = await examAPI.getUserExams(filters);
      
      if (result.success !== false && result.data) {
        setExams(result.data);
      } else {
        setError(result.error || t('common.loading'));
      }
    } catch (err) {
      setError(utils.formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm(t('examHistory.confirmDelete'))) {
      return;
    }

    try {
      const result = await examAPI.deleteExam(examId);
      
      if (result.success !== false) {
        setExams(exams.filter(exam => exam.id !== examId));
      } else {
        setError(result.error || 'Error eliminando examen');
      }
    } catch (err) {
      setError(utils.formatApiError(err));
    }
  };

  // NUEVA FUNCIÓN PARA MANEJAR LA REVISIÓN
  const handleShowReview = (exam) => {
    setReviewExamId(exam.id);
    setReviewExamData(exam);
    setShowReview(true);
  };

  // NUEVA FUNCIÓN PARA CERRAR REVISIÓN
  const handleCloseReview = () => {
    setShowReview(false);
    setReviewExamId(null);
    setReviewExamData(null);
  };

  // Resto de tus funciones existentes...
  const getStatusBadge = (status) => {
    const statusConfig = {
      'not_started': { text: 'No iniciado', color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100' },
      'pending': { text: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' },
      'active': { text: 'En progreso', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200' },
      'in_progress': { text: 'En progreso', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' },
      'paused': { text: 'Pausado', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800' },
      'completed': { text: 'Completado', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' },
      'cancelled': { text: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' }
    };

    const config = statusConfig[status] || statusConfig['not_started'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getScoreBadge = (score, passed, passingScore) => {
    if (score === 0 || score === null || score === undefined) return null;
    
    const scoreValue = typeof score === 'number' ? score : parseFloat(score);
    const threshold = passingScore || 70;
    const isPassed = passed !== undefined ? passed : scoreValue >= threshold;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isPassed ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      }`}>
        {scoreValue.toFixed(1)}% {isPassed ? '✓' : '✗'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return t('examHistory.invalidDate');
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  };

  const getExamModeIcon = (mode) => {
    const modes = {
      'practice': '📚',
      'realistic': '🎯',
      'timed': '⏱️',
      'review': '🔍'
    };
    return modes[mode] || '📝';
  };

  const getExamModeLabel = (mode) => {
    const modes = {
      'practice': 'Práctica',
      'realistic': 'Examen Real',
      'timed': 'Cronometrado',
      'review': 'Revisión'
    };
    return modes[mode] || mode;
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('examHistory.restricted')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('examHistory.loginRequired')}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('examHistory.title')}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('examHistory.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all', label: 'Todos', icon: '📄' },
                { key: 'active', label: 'En progreso', icon: '⏳' },
                { key: 'in_progress', label: 'En progreso', icon: '⏳' },
                { key: 'completed', label: 'Completados', icon: '✅' },
                { key: 'paused', label: 'Pausados', icon: '⏸️' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <button 
                    onClick={() => setError('')}
                    className="text-red-500 hover:text-red-700 dark:text-red-300 font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Lista de exámenes */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">{t('examHistory.loadingExams')}</p>
                </div>
              ) : exams?.length > 0 ? (
                <div className="space-y-4">
                  {exams.map(exam => {
                    const examProgress = exam.questions?.length > 0 ? 
                      Math.round((exam.answeredQuestions || 0) / exam.questions.length * 100) : 0;
                    
                    return (
                      <div key={exam.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border hover:border-blue-300 dark:border-blue-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                                {exam.title || `${exam.provider} - ${exam.certification}`}
                              </h3>
                              {getStatusBadge(exam.status)}
                              {exam.score !== null && exam.score !== undefined && getScoreBadge(exam.score, exam.passed, exam.passingScore)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <span className="flex items-center gap-1">
                                <span>{getExamModeIcon(exam.examMode)}</span>
                                {getExamModeLabel(exam.examMode)}
                              </span>
                              <span>📊 {exam.provider}</span>
                              <span>🎓 {exam.certification}</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <div>
                                <span className="block font-medium text-gray-800 dark:text-gray-100">{t('examHistory.questionsLabel')}</span>
                                {exam.answeredQuestions || 0}/{exam.questions?.length || exam.totalQuestions || 0}
                              </div>
                              <div>
                                <span className="block font-medium text-gray-800 dark:text-gray-100">{t('examHistory.timeLimitLabel')}</span>
                                {formatDuration(exam.timeLimit)}
                              </div>
                              <div>
                                <span className="block font-medium text-gray-800 dark:text-gray-100">{t('examHistory.createdAt')}</span>
                                {formatDate(exam.createdAt)}
                              </div>
                              {exam.completedAt && (
                                <div>
                                  <span className="block font-medium text-gray-800 dark:text-gray-100">{t('examHistory.completedAt')}</span>
                                  {formatDate(exam.completedAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        {exam.status !== 'completed' && exam.questions?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('examHistory.progress')}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-300">{examProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${examProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Estadísticas adicionales para exámenes completados */}
                        {exam.status === 'completed' && exam.timeSpent && (
                          <div className="bg-white dark:bg-gray-800 rounded p-3 mb-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold text-green-600">{exam.correctAnswers || 0}</div>
                                <div className="text-gray-600 dark:text-gray-300">{t('examHistory.correct')}</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-red-600">{exam.incorrectAnswers || 0}</div>
                                <div className="text-gray-600 dark:text-gray-300">{t('examHistory.incorrect')}</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-blue-600">{formatDuration(exam.timeSpent)}</div>
                                <div className="text-gray-600 dark:text-gray-300">{t('examHistory.timeUsed')}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            {(exam.status === 'in_progress' || exam.status === 'active' || exam.status === 'paused') && (
                              <button
                                onClick={() => onResumeExam(exam.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                              >
                                <span>▶️</span>
                                Continuar
                              </button>
                            )}
                            
                            {exam.status === 'completed' && (
                              <button
                                onClick={() => handleShowReview(exam)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                              >
                                <span>📊</span>
                                Ver Resultados
                              </button>
                            )}
                            
                            {exam.status === 'not_started' && (
                              <button
                                onClick={() => onResumeExam(exam.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                              >
                                <span>🚀</span>
                                Iniciar
                              </button>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                            title="Eliminar examen"
                          >
                            <span>🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
                    {t('examHistory.noExamsFilter', { filter: filter !== 'all' ? filter.replace('_',' ') : '' })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('examHistory.startFirst')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center p-6 border-t bg-gray-50 dark:bg-gray-900">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {exams.length > 0 && (
                <span>
                  📊 {exams.length} examen{exams.length !== 1 ? 'es' : ''} encontrado{exams.length !== 1 ? 's' : ''}
                  {filter !== 'all' && ` (filtro: ${filter.replace('_', ' ')})`}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* AGREGAR EL COMPONENTE DE REVISIÓN */}
      {showReview && (
        <ExamReview
          examId={reviewExamId}
          examData={reviewExamData}
          onClose={handleCloseReview}
        />
      )}
    </>
  );
}