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
      setError('Por favor proporciona una descripción más detallada (mínimo 10 caracteres)');
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
      console.error('Error submitting report:', err);
      setError(err.message || 'Error al enviar el reporte. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Gracias por tu reporte!</h3>
          <p className="text-gray-600">
            Tu reporte ha sido enviado correctamente. Nuestro equipo lo revisará pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-red-50">
          <div>
            <h2 className="text-xl font-bold text-red-800">🚩 Reportar Pregunta</h2>
            <p className="text-red-600 text-sm mt-1">
              Ayúdanos a mejorar reportando problemas con las preguntas
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Pregunta reportada */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-700 mb-2 text-sm">Pregunta reportada:</h4>
            <p className="text-gray-800 text-sm leading-relaxed">
              {question.text.length > 200 
                ? `${question.text.substring(0, 200)}...` 
                : question.text
              }
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {question.category}
              </span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {question.difficulty}
              </span>
            </div>
          </div>

          {/* Tipo de reporte */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Qué tipo de problema has encontrado? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedType?.id === type.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-25'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{type.icon}</span>
                    <span className="font-medium text-sm text-gray-800">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe el problema en detalle *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por favor explica qué está mal con esta pregunta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 caracteres (mínimo 10)
            </p>
          </div>

          {/* Corrección sugerida */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Tienes una corrección sugerida? (opcional)
            </label>
            <textarea
              value={suggestedCorrection}
              onChange={(e) => setSuggestedCorrection(e.target.value)}
              placeholder="Si sabes cuál debería ser la respuesta correcta o cómo mejorar la pregunta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nota de privacidad */}
          {!isAuthenticated && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
              <strong>Nota:</strong> Estás reportando como usuario anónimo. 
              <a href="#" className="underline ml-1">Inicia sesión</a> para recibir actualizaciones sobre tu reporte.
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
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