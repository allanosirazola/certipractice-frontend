import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { communityAPI } from '../../services/api';

const QUESTION_STATUS = {
  pending: { label: 'Pendiente', color: 'yellow', icon: '⏳' },
  approved: { label: 'Aprobada', color: 'green', icon: '✅' },
  rejected: { label: 'Rechazada', color: 'red', icon: '❌' },
  discussion: { label: 'En Discusión', color: 'blue', icon: '💬' }
};

export default function CommunityForum({ onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // browse, submit, my-submissions
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'all',
    provider: 'all',
    sortBy: 'recent',
    search: ''
  });
  
  // Para nueva pregunta
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    explanation: '',
    provider: '',
    certification: '',
    category: '',
    difficulty: 'medium',
    references: ''
  });

  // Estados de UI
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [filters]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await communityAPI.getQuestions(filters);
      if (response.success) {
        setQuestions(response.data);
      }
    } catch (err) {
      setError('Error cargando preguntas de la comunidad');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (questionId, voteType) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para votar');
      return;
    }
    
    try {
      await communityAPI.voteQuestion(questionId, voteType);
      // Actualizar UI optimistamente
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            votes: voteType === 'up' ? q.votes + 1 : q.votes - 1,
            userVote: voteType
          };
        }
        return q;
      }));
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para proponer preguntas');
      return;
    }

    // Validaciones
    const correctAnswers = newQuestion.options.filter(o => o.isCorrect);
    if (correctAnswers.length === 0) {
      setError('Debes marcar al menos una respuesta correcta');
      return;
    }

    if (newQuestion.options.some(o => o.text.trim() === '')) {
      setError('Todas las opciones deben tener texto');
      return;
    }

    try {
      setLoading(true);
      const response = await communityAPI.submitQuestion({
        ...newQuestion,
        submittedBy: user.id,
        submittedAt: new Date().toISOString()
      });

      if (response.success) {
        alert('¡Pregunta enviada! Será revisada por la comunidad.');
        setNewQuestion({
          text: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          explanation: '',
          provider: '',
          certification: '',
          category: '',
          difficulty: 'medium',
          references: ''
        });
        setActiveTab('my-submissions');
        loadQuestions();
      }
    } catch (err) {
      setError('Error enviando pregunta');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (questionId) => {
    if (!newComment.trim()) return;

    try {
      await communityAPI.addComment(questionId, {
        text: newComment,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      setNewComment('');
      // Recargar pregunta seleccionada
      const response = await communityAPI.getQuestion(questionId);
      if (response.success) {
        setSelectedQuestion(response.data);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const renderBrowseTab = () => (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <input
          type="text"
          placeholder="Buscar preguntas..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="discussion">En Discusión</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="recent">Más recientes</option>
          <option value="popular">Más votadas</option>
          <option value="discussed">Más comentadas</option>
        </select>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        {questions.map(question => (
          <div 
            key={question.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Votos */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleVote(question.id, 'up')}
                  className={`p-1 rounded hover:bg-green-100 ${
                    question.userVote === 'up' ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  ▲
                </button>
                <span className="font-bold text-lg">{question.votes || 0}</span>
                <button
                  onClick={() => handleVote(question.id, 'down')}
                  className={`p-1 rounded hover:bg-red-100 ${
                    question.userVote === 'down' ? 'text-red-600' : 'text-gray-400'
                  }`}
                >
                  ▼
                </button>
              </div>

              {/* Contenido */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-${QUESTION_STATUS[question.status]?.color}-100 text-${QUESTION_STATUS[question.status]?.color}-700`}>
                    {QUESTION_STATUS[question.status]?.icon} {QUESTION_STATUS[question.status]?.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {question.provider} / {question.certification}
                  </span>
                </div>
                
                <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">
                  {question.text}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>👤 {question.submittedByName}</span>
                  <span>📅 {new Date(question.submittedAt).toLocaleDateString()}</span>
                  <button 
                    onClick={() => {
                      setSelectedQuestion(question);
                      setShowComments(true);
                    }}
                    className="hover:text-blue-600"
                  >
                    💬 {question.commentsCount || 0} comentarios
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubmitTab = () => (
    <form onSubmit={handleSubmitQuestion} className="space-y-6">
      {/* Texto de la pregunta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto de la pregunta *
        </label>
        <textarea
          value={newQuestion.text}
          onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={4}
          required
          placeholder="Escribe aquí el enunciado de la pregunta..."
        />
      </div>

      {/* Opciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opciones de respuesta *
        </label>
        <div className="space-y-3">
          {newQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => {
                  const newOptions = [...newQuestion.options];
                  newOptions[index].text = e.target.value;
                  setNewQuestion({ ...newQuestion, options: newOptions });
                }}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={option.isCorrect}
                  onChange={(e) => {
                    const newOptions = [...newQuestion.options];
                    newOptions[index].isCorrect = e.target.checked;
                    setNewQuestion({ ...newQuestion, options: newOptions });
                  }}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm text-green-600">Correcta</span>
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (newQuestion.options.length < 6) {
              setNewQuestion({
                ...newQuestion,
                options: [...newQuestion.options, { text: '', isCorrect: false }]
              });
            }
          }}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          + Añadir opción
        </button>
      </div>

      {/* Explicación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explicación de la respuesta *
        </label>
        <textarea
          value={newQuestion.explanation}
          onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          required
          placeholder="Explica por qué esta es la respuesta correcta..."
        />
      </div>

      {/* Metadatos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor *
          </label>
          <select
            value={newQuestion.provider}
            onChange={(e) => setNewQuestion({ ...newQuestion, provider: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Selecciona...</option>
            <option value="AWS">AWS</option>
            <option value="Google Cloud">Google Cloud</option>
            <option value="Microsoft Azure">Microsoft Azure</option>
            <option value="Databricks">Databricks</option>
            <option value="Snowflake">Snowflake</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dificultad *
          </label>
          <select
            value={newQuestion.difficulty}
            onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="easy">Fácil</option>
            <option value="medium">Media</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      {/* Referencias */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Referencias (opcional)
        </label>
        <input
          type="text"
          value={newQuestion.references}
          onChange={(e) => setNewQuestion({ ...newQuestion, references: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="URL de documentación oficial, etc."
        />
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : '📝 Proponer Pregunta'}
      </button>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🌐 Foro de la Comunidad</h2>
            <p className="text-gray-600">Propone preguntas y ayuda a mejorar el banco de preguntas</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'browse', label: '📋 Explorar', count: questions.length },
            { id: 'submit', label: '✏️ Proponer' },
            { id: 'my-submissions', label: '📁 Mis Propuestas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'browse' && renderBrowseTab()}
          {activeTab === 'submit' && renderSubmitTab()}
          {activeTab === 'my-submissions' && (
            <div className="text-center py-8 text-gray-500">
              {isAuthenticated 
                ? 'Cargando tus propuestas...' 
                : 'Inicia sesión para ver tus propuestas'
              }
            </div>
          )}
        </div>
      </div>

      {/* Modal de comentarios */}
      {showComments && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">Discusión</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {selectedQuestion.comments?.map(comment => (
                <div key={comment.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{comment.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => handleAddComment(selectedQuestion.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enviar
                </button>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowComments(false);
                  setSelectedQuestion(null);
                }}
                className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}