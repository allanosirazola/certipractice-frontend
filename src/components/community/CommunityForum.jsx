import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { communityAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';

const QUESTION_STATUS_META = {
  pending: { color: 'yellow', icon: '⏳' },
  approved: { color: 'green', icon: '✅' },
  rejected: { color: 'red', icon: '❌' },
  discussion: { color: 'blue', icon: '💬' }
};

export default function CommunityForum({ onClose }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const QUESTION_STATUS = Object.fromEntries(
    Object.entries(QUESTION_STATUS_META).map(([k, v]) => [k, { ...v, label: t(`community.status.${k}`) }])
  );
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
      setError(t('community.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (questionId, voteType) => {
    if (!isAuthenticated) {
      alert(t('community.loginToVote'));
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
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert(t('community.loginToSubmit'));
      return;
    }

    // Validaciones
    const correctAnswers = newQuestion.options.filter(o => o.isCorrect);
    if (correctAnswers.length === 0) {
      setError(t('community.validationCorrectRequired'));
      return;
    }

    if (newQuestion.options.some(o => o.text.trim() === '')) {
      setError(t('community.validationOptionsRequired'));
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
        alert(t('community.submitSuccess'));
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
      setError(t('community.submitError'));
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
    }
  };

  const renderBrowseTab = () => (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <input
          type="text"
          placeholder="{t('community.searchPlaceholder')}"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">{t('community.filterAll')}</option>
          <option value="pending">{t('community.filterPending')}</option>
          <option value="approved">{t('community.filterApproved')}</option>
          <option value="discussion">{t('community.filterDiscussion')}</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="recent">{t('community.sortRecent')}</option>
          <option value="popular">{t('community.sortPopular')}</option>
          <option value="discussed">{t('community.sortDiscussed')}</option>
        </select>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        {questions.map(question => (
          <div 
            key={question.id}
            className="bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Votos */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleVote(question.id, 'up')}
                  className={`p-1 rounded hover:bg-green-100 dark:bg-green-900/30 ${
                    question.userVote === 'up' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  ▲
                </button>
                <span className="font-bold text-lg">{question.votes || 0}</span>
                <button
                  onClick={() => handleVote(question.id, 'down')}
                  className={`p-1 rounded hover:bg-red-100 dark:bg-red-900/30 ${
                    question.userVote === 'down' ? 'text-red-600' : 'text-gray-400 dark:text-gray-500'
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {question.provider} / {question.certification}
                  </span>
                </div>
                
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                  {question.text}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
      {/* {t('community.questionText')}/}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t('community.questionText')}
        </label>
        <textarea
          value={newQuestion.text}
          onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={4}
          required
          placeholder="{t('community.questionTextPlaceholder')}"
        />
      </div>

      {/* Opciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t('community.answerOptions')}
        </label>
        <div className="space-y-3">
          {newQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-medium">
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
                placeholder={t('community.optionPlaceholder', { letter: String.fromCharCode(65 + index) })}
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
                <span className="text-sm text-green-600">{t('community.correct')}</span>
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
          {t('community.addOption')}
        </button>
      </div>

      {/* Explicación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t('community.explanation')}
        </label>
        <textarea
          value={newQuestion.explanation}
          onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          required
          placeholder="{t('community.explanationPlaceholder')}"
        />
      </div>

      {/* Metadatos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {t('community.provider')}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {t('community.difficulty')}
          </label>
          <select
            value={newQuestion.difficulty}
            onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="easy">{t('community.easy')}</option>
            <option value="medium">{t('community.medium')}</option>
            <option value="hard">{t('community.hard')}</option>
          </select>
        </div>
      </div>

      {/* Referencias */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t('community.references')}
        </label>
        <input
          type="text"
          value={newQuestion.references}
          onChange={(e) => setNewQuestion({ ...newQuestion, references: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="{t('community.referencesPlaceholder')}"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? t('community.submitting') : t('community.submitQuestion')}
      </button>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('community.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300">{t('community.subtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 text-2xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'browse', label: t('community.tabBrowse'), count: questions.length },
            { id: 'submit', label: t('community.tabSubmit') },
            { id: 'my-submissions', label: t('community.tabMySubmissions') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isAuthenticated 
                ? t('community.loadingSubmissions') 
                : t('community.loginToSeeSubmissions')
              }
            </div>
          )}
        </div>
      </div>

      {/* Modal de comentarios */}
      {showComments && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">{t('community.discussion')}</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {selectedQuestion.comments?.map(comment => (
                <div key={comment.id} className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{comment.userName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200">{comment.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="{t('community.commentPlaceholder')}"
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
            <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
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