// FailedQuestionsStats.jsx - Componente para mostrar estadísticas de preguntas fallidas
import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';

export default function FailedQuestionsStats({ provider, certification, onClose, onStartFailedExam }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [failedQuestions, setFailedQuestions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, category, difficulty
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  useEffect(() => {
    loadFailedQuestionsData();
  }, [provider, certification]);

  const loadFailedQuestionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = { provider, certification };
      console.log(certification)
      // Cargar estadísticas
      const statsResponse = await userAPI.getFailedQuestionsStats(filters);
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Cargar preguntas fallidas
      const questionsResponse = await userAPI.getFailedQuestions(filters);
      console.log(questionsResponse)
      if (questionsResponse.success) {
        setFailedQuestions(questionsResponse.data);
      }

    } catch (err) {
      console.error('Error cargando datos de preguntas fallidas:', err);
      setError('Error cargando estadísticas de preguntas fallidas');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredQuestions = () => {
    let filtered = failedQuestions;

    if (filter === 'category' && selectedCategory) {
      filtered = filtered.filter(q => q.category === selectedCategory);
    } else if (filter === 'difficulty' && selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    return filtered;
  };

  const getUniqueCategories = () => {
    return [...new Set(failedQuestions.map(q => q.category))];
  };

  const getUniqueDifficulties = () => {
    return [...new Set(failedQuestions.map(q => q.difficulty))];
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'text-green-600 bg-green-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'hard': 'text-red-600 bg-red-100',
      'expert': 'text-purple-600 bg-purple-100'
    };
    return colors[difficulty?.toLowerCase()] || 'text-gray-600 bg-gray-100';
  };

  const getCategoryIcon = (category) => {
    // Mapeo básico de categorías a iconos
    const icons = {
      'Topic 1': '📚',
      'Security': '🔒',
      'Networking': '🌐',
      'Storage': '💾',
      'Compute': '⚙️',
      'Database': '🗄️',
      'Analytics': '📊'
    };
    return icons[category] || '📝';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas de preguntas fallidas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-4">Error</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-orange-50">
          <div>
            <h2 className="text-2xl font-bold text-orange-800">Preguntas Fallidas</h2>
            <p className="text-orange-600">{provider} - {certification}</p>
            <p className="text-sm text-gray-600 mt-1">
              Analiza tus debilidades y conviértelas en fortalezas
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Estadísticas generales */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
                <div className="text-sm text-red-700">Total Fallidas</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.recentlyFailed || 0}</div>
                <div className="text-sm text-orange-700">Esta Semana</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.improved || 0}</div>
                <div className="text-sm text-green-700">Mejoradas</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.improvementRate ? `${Math.round(stats.improvementRate)}%` : '0%'}
                </div>
                <div className="text-sm text-blue-700">Tasa de Mejora</div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({failedQuestions.length})
              </button>
              <button
                onClick={() => setFilter('category')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  filter === 'category'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Por Categoría
              </button>
              <button
                onClick={() => setFilter('difficulty')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  filter === 'difficulty'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Por Dificultad
              </button>
            </div>

            {/* Filtros específicos */}
            {filter === 'category' && (
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Todas las categorías</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category}
                  </option>
                ))}
              </select>
            )}

            {filter === 'difficulty' && (
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Todas las dificultades</option>
                {getUniqueDifficulties().map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lista de preguntas fallidas */}
          <div className="max-h-64 overflow-y-auto mb-6">
            {filteredQuestions.length > 0 ? (
              <div className="space-y-3">
                {filteredQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-600">#{index + 1}</span>
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                            {getCategoryIcon(question.category)} {question.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Fallada {question.failedCount || 1} vez{(question.failedCount || 1) !== 1 ? 'es' : ''}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {question.text.length > 150 
                        ? `${question.text.substring(0, 150)}...` 
                        : question.text
                      }
                    </p>
                    {question.lastFailedAt && (
                      <div className="text-xs text-gray-500 mt-2">
                        Última vez fallada: {new Date(question.lastFailedAt).toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  No hay preguntas fallidas con los filtros seleccionados.
                </p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {filteredQuestions.length > 0 && (
                <span>
                  Mostrando {filteredQuestions.length} pregunta{filteredQuestions.length !== 1 ? 's' : ''} fallida{filteredQuestions.length !== 1 ? 's' : ''}
                  {filter !== 'all' && ` (filtrado)`}
                </span>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
              
              {failedQuestions.length >= 5 && (
                <button
                  onClick={() => onStartFailedExam(failedQuestions.length)}
                  className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-medium"
                >
                  Practicar Preguntas Fallidas
                </button>
              )}
            </div>
          </div>

          {/* Consejo motivacional */}
          {failedQuestions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800 mb-2">Consejo de Estudio</h4>
                  <p className="text-blue-700 text-sm">
                    Las preguntas fallidas son oportunidades de aprendizaje. Cada error te acerca más al éxito. 
                    Revisa las explicaciones cuidadosamente y practica regularmente para mejorar tu comprensión.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}