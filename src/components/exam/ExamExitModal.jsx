// ExamExitModal.jsx - Modal para confirmar salida del examen
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ExamExitModal({ 
  exam, 
  answers, 
  timeLeft, 
  examMode, 
  onConfirmExit, 
  onCancel, 
  onSaveAndExit 
}) {
  const { isAuthenticated } = useAuth();
  const [selectedAction, setSelectedAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] !== undefined).length;
  };

  const handleAction = async (action) => {
    setLoading(true);
    
    try {
      if (action === 'save') {
        await onSaveAndExit();
      } else {
        await onConfirmExit();
      }
    } catch (error) {
      console.error('Error al salir del examen:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRealisticMode = examMode === 'realistic';
  const canSave = isAuthenticated && !isRealisticMode;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              ¿Salir del examen?
            </h3>
            <p className="text-gray-600">
              {isRealisticMode 
                ? 'En modo examen real, salir significa perder todo el progreso.'
                : 'Puedes guardar tu progreso y continuar más tarde.'
              }
            </p>
          </div>

          {/* Estado actual del examen */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-700 mb-3">Estado actual del examen</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Preguntas respondidas:</span>
                <span className="font-semibold">
                  {getAnsweredCount()}/{exam?.questions?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo restante:</span>
                <span className="font-semibold text-orange-600">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Progreso:</span>
                <span className="font-semibold">
                  {Math.round((getAnsweredCount() / (exam?.questions?.length || 1)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modo:</span>
                <span className={`font-semibold ${
                  isRealisticMode ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {isRealisticMode ? '🎯 Examen Real' : '📚 Práctica'}
                </span>
              </div>
            </div>
          </div>

          {/* Opciones disponibles */}
          <div className="space-y-3">
            {/* Opción 1: Guardar y continuar después (solo si está autenticado y no es modo realista) */}
            {canSave && (
              <button
                onClick={() => setSelectedAction('save')}
                disabled={loading}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAction === 'save'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    💾
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">
                      Guardar y continuar después
                    </div>
                    <div className="text-sm text-gray-600">
                      Guarda tu progreso actual y retoma el examen cuando quieras. 
                      Tu tiempo y respuestas se conservarán.
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Opción 2: Salir sin guardar */}
            <button
              onClick={() => setSelectedAction('exit')}
              disabled={loading}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAction === 'exit'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-25'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">
                  🚪
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 mb-1">
                    Salir sin guardar
                  </div>
                  <div className="text-sm text-gray-600">
                    {isRealisticMode 
                      ? 'Abandona el examen. En modo real no se puede guardar el progreso.'
                      : 'Abandona el examen y pierde todo el progreso actual.'
                    }
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Advertencias especiales */}
          {isRealisticMode && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-red-800">
                    <strong>Modo Examen Real:</strong> En las condiciones reales del examen 
                    no puedes pausar ni guardar. Si sales, perderás todo el progreso.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated && !isRealisticMode && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-yellow-800">
                    <strong>Modo Invitado:</strong> Para poder guardar y continuar exámenes 
                    más tarde, necesitas crear una cuenta. Sin registro, tu progreso se perderá al salir.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            
            {selectedAction && (
              <button
                onClick={() => handleAction(selectedAction)}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded transition-colors disabled:opacity-50 ${
                  selectedAction === 'save'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <>
                    {selectedAction === 'save' ? '💾 Guardar y Salir' : '🚪 Salir sin Guardar'}
                  </>
                )}
              </button>
            )}
          </div>

          {!selectedAction && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Selecciona una opción para continuar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}