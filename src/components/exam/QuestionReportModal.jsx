import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';

const REPORT_TYPE_IDS = [
  { id: 'incorrect_answer', icon: '❌', severity: 'high' },
  { id: 'outdated', icon: '📅', severity: 'medium' },
  { id: 'unclear', icon: '❓', severity: 'medium' },
  { id: 'typo', icon: '✏️', severity: 'low' },
  { id: 'wrong_category', icon: '📁', severity: 'low' },
  { id: 'duplicate', icon: '📋', severity: 'low' },
  { id: 'explanation_wrong', icon: '📖', severity: 'medium' },
  { id: 'other', icon: '🔧', severity: 'medium' }
];

export default function QuestionReportModal({ 
  question, 
  examId, 
  onClose, 
  onReportSubmitted 
}) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Build localized report types using translation keys
  const REPORT_TYPES = REPORT_TYPE_IDS.map(item => ({
    ...item,
    label: t(`questionReport.types.${item.id}.label`, { defaultValue: item.id }),
    description: t(`questionReport.types.${item.id}.description`, { defaultValue: '' })
  }));
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedType) {
      setError('Por favor selecciona un tipo de reporte');
      return;
    }

    if (description.trim().length < 10) {
      setError(t('questionReport.descTooShort'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reportData = {
        questionId: question.id,
        examId: examId,
        reportType: selectedType.id,
        severity: selectedType.severity,
        description: description.trim(),
        suggestedCorrection: suggestedCorrection.trim() || null,
        questionText: question.text,
        questionCategory: question.category,
        questionDifficulty: question.difficulty,
        reportedBy: isAuthenticated ? user.id : null,
        reportedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        // Incluir contexto adicional
        context: {
          certification: question.certification,
          provider: question.provider,
          questionType: question.isMultipleChoice ? 'multiple' : 'single'
        }
      };

      const response = await reportAPI.submitReport(reportData);
      
      if (response.success) {
        setSuccess(true);
        if (onReportSubmitted) {
          onReportSubmitted(response.data);
        }
        // Cerrar modal después de 2 segundos
        setTimeout(() => onClose(), 2000);
      } else {
        throw new Error(response.error || 'Error al enviar el reporte');
      }
    } catch (err) {
      setError(err.message || 'Error al enviar el reporte. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('questionReport.thanksTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-300">
            {t('questionReport.thanksText')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-red-50 dark:bg-red-900">
          <div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200">🚩 Reportar Pregunta</h2>
            <p className="text-red-600 text-sm mt-1">
              {t('questionReport.helpUs')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 text-2xl transition-colors"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Pregunta reportada */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2 text-sm">{t('questionReport.questionReported')}</h4>
            <p className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed">
              {question.text.length > 200 
                ? `${question.text.substring(0, 200)}...` 
                : question.text
              }
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                {question.category}
              </span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                {question.difficulty}
              </span>
            </div>
          </div>

          {/* Tipo de reporte */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              {t('questionReport.whatProblem')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedType?.id === type.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:border-red-600 hover:bg-red-25'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{type.icon}</span>
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-100">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Describe el problema en detalle *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('questionReport.descriptionPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('questionReport.charCount', { count: description.length })}
            </p>
          </div>

          {/* Corrección sugerida */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('questionReport.suggestedFix')}
            </label>
            <textarea
              value={suggestedCorrection}
              onChange={(e) => setSuggestedCorrection(e.target.value)}
              placeholder={t('questionReport.suggestedFixPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nota de privacidad */}
          {!isAuthenticated && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
              <strong>{t('common.confirm')}:</strong> {t('questionReport.anonymousNote')} 
              <a href="#" className="underline ml-1">{t('questionReport.loginForUpdates')}</a> {t('questionReport.loginForUpdatesText')}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedType || description.length < 10}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              loading || !selectedType || description.length < 10
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </span>
            ) : (
              '🚩 Enviar Reporte'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}