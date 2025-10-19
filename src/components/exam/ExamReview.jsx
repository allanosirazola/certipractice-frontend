// ExamReview.jsx - Componente para revisar preguntas del examen completado
import { useState, useEffect } from 'react';
import { examAPI, questionAPI } from '../../services/api';

export default function ExamReview({ examId, examData, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState(null);
  const [questionDetails, setQuestionDetails] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [filter, setFilter] = useState('all'); // all, correct, incorrect, unanswered
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadExamData();
  }, [examId]);

  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('ExamReview - Datos recibidos:', {
        examId,
        examData,
        hasQuestions: examData?.questions?.length,
        hasResults: examData?.results?.questionResults?.length
      });

      // Verificar si tenemos datos de resultados con questionResults
      if (examData && examData.results && examData.results.questionResults && examData.results.questionResults.length > 0) {
        console.log('Usando datos de resultados con', examData.results.questionResults.length, 'preguntas');
        
        // Transformar questionResults a formato de examen
        const transformedExam = {
          id: examData.examSummary?.id || examId,
          title: examData.examSummary?.title || examData.reviewData?.title,
          provider: examData.examSummary?.provider || examData.reviewData?.provider,
          certification: examData.examSummary?.certification || examData.reviewData?.certification,
          status: examData.examSummary?.status || 'completed',
          questions: examData.results.questionResults.map((qResult, index) => ({
            id: qResult.questionId,
            text: qResult.questionText,
            category: qResult.category,
            difficulty: qResult.difficulty,
            questionType: qResult.questionType,
            isMultipleChoice: qResult.questionType === 'multiple_answer',
            expectedAnswers: qResult.expectedAnswers || 1,
            options: [], // Se cargarán más tarde
            correctAnswers: qResult.correctAnswers || [],
            explanation: qResult.explanation,
            userAnswer: qResult.userAnswer,
            isAnswered: qResult.isAnswered,
            isCorrect: qResult.isCorrect
          })),
          answers: {}
        };

        // Construir objeto de respuestas del usuario
        examData.results.questionResults.forEach(qResult => {
          if (qResult.userAnswer !== undefined) {
            transformedExam.answers[qResult.questionId] = qResult.userAnswer;
          }
        });

        setExam(transformedExam);
        setResults(examData.results);
        
        console.log('Examen transformado con', transformedExam.questions.length, 'preguntas');
        
      } else if (examData && examData.questions && examData.questions.length > 0) {
        console.log('Usando examData proporcionado con', examData.questions.length, 'preguntas');
        setExam(examData);
        
        // Cargar resultados si no los tenemos
        if (examData.status === 'completed') {
          try {
            const resultsResponse = await examAPI.getResults(examId);
            if (resultsResponse.success) {
              setResults(resultsResponse.data);
            }
          } catch (err) {
            console.warn('Error cargando resultados:', err);
          }
        }
      } else {
        // Cargar datos completos del examen usando el nuevo endpoint
        console.log('Cargando datos del examen desde API...');
        
        try {
          // Intentar primero con el endpoint de revisión
          const examResponse = await examAPI.getExamForReview(examId);
          console.log('Respuesta del API:', examResponse);
          
          if (examResponse.success && examResponse.data) {
            setExam(examResponse.data);
            console.log('Examen cargado con', examResponse.data.questions?.length || 0, 'preguntas');
            
            // Cargar resultados
            try {
              const resultsResponse = await examAPI.getResults(examId);
              if (resultsResponse.success) {
                setResults(resultsResponse.data);
              }
            } catch (err) {
              console.warn('Error cargando resultados:', err);
            }
          } else {
            throw new Error(examResponse.error || 'Error cargando examen para revisión');
          }
        } catch (err) {
          console.error('Error con endpoint de revisión, intentando endpoint normal:', err);
          
          // Fallback al endpoint normal
          try {
            const examResponse = await examAPI.getExam(examId);
            if (examResponse.success && examResponse.data) {
              setExam(examResponse.data);
              console.log('Examen cargado (fallback) con', examResponse.data.questions?.length || 0, 'preguntas');
            } else {
              throw new Error(examResponse.error || 'Error cargando examen');
            }
          } catch (fallbackErr) {
            throw new Error('No se pudo cargar el examen: ' + fallbackErr.message);
          }
        }
      }

    } catch (err) {
      console.error('Error cargando datos del examen:', err);
      setError(err.message || 'Error cargando examen');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionDetails = async (questionId) => {
  if (questionDetails[questionId] || loadingDetails) return;

  try {
    setLoadingDetails(true);
    
    // Si la pregunta ya tiene opciones cargadas desde questionResults, no necesitamos cargar más
    const currentQuestion = exam?.questions?.find(q => q.id === questionId);
    if (currentQuestion && currentQuestion.options && currentQuestion.options.length > 0) {
      console.log('Pregunta ya tiene opciones cargadas:', questionId);
      setQuestionDetails(prev => ({
        ...prev,
        [questionId]: {
          correctAnswers: currentQuestion.correctAnswers,
          explanation: currentQuestion.explanation || 'No hay explicación disponible'
        }
      }));
      return;
    }
    
    // MEJORADO: Cargar pregunta completa con opciones
    console.log(`🔄 Cargando pregunta completa con opciones: ${questionId}`);
    const response = await questionAPI.getQuestion(questionId, true, false);
    
    if (response.success && response.data) {
      const questionData = response.data;
      
      // Actualizar la pregunta en el estado del examen con las opciones cargadas
      setExam(prevExam => {
        if (!prevExam) return prevExam;
        
        const updatedQuestions = prevExam.questions.map(q => {
          if (q.id === questionId && (!q.options || q.options.length === 0)) {
            return {
              ...q,
              options: questionData.options || [],
              correctAnswers: questionData.correctAnswer || questionData.correctAnswers || q.correctAnswers,
              explanation: questionData.explanation || q.explanation
            };
          }
          return q;
        });
        
        return {
          ...prevExam,
          questions: updatedQuestions
        };
      });
      
      // Guardar detalles en el estado
      setQuestionDetails(prev => ({
        ...prev,
        [questionId]: {
          ...questionData,
          correctAnswers: questionData.correctAnswer || questionData.correctAnswers,
          explanation: questionData.explanation || 'No hay explicación disponible'
        }
      }));
      
      console.log(`✅ Pregunta ${questionId} cargada con ${questionData.options?.length || 0} opciones`);
    } else {
      throw new Error(response.error || 'Error cargando pregunta');
    }
  } catch (err) {
    console.error('Error cargando detalles de pregunta:', err);
    // Usar datos básicos si están disponibles
    const currentQuestion = exam?.questions?.find(q => q.id === questionId);
    if (currentQuestion) {
      // Crear opciones placeholder si no existen
      const placeholderOptions = Array.from({ length: 4 }, (_, i) => ({
        label: String.fromCharCode(65 + i),
        text: `Opción ${String.fromCharCode(65 + i)}`
      }));
      
      setQuestionDetails(prev => ({
        ...prev,
        [questionId]: {
          correctAnswers: currentQuestion.correctAnswers || [],
          explanation: currentQuestion.explanation || 'No se pudo cargar la explicación',
          options: placeholderOptions
        }
      }));
      
      // También actualizar la pregunta en el examen
      setExam(prevExam => {
        if (!prevExam) return prevExam;
        
        const updatedQuestions = prevExam.questions.map(q => {
          if (q.id === questionId && (!q.options || q.options.length === 0)) {
            return { ...q, options: placeholderOptions };
          }
          return q;
        });
        
        return { ...prevExam, questions: updatedQuestions };
      });
    }
  } finally {
    setLoadingDetails(false);
  }
};

  const getFilteredQuestions = () => {
    if (!exam || !exam.questions) return [];

    return exam.questions.filter((question, index) => {
      const status = getAnswerStatus(question.id);

      switch (filter) {
        case 'correct':
          return status === 'correct';
        case 'incorrect':
          return status === 'incorrect';
        case 'unanswered':
          return status === 'unanswered';
        default:
          return true; // 'all' - incluye todas las preguntas, incluso las 'unknown'
      }
    });
  };

  const isAnswerCorrect = (questionId) => {
    const details = questionDetails[questionId];
    const userAnswer = exam.answers?.[questionId];
    
    if (!details || userAnswer === undefined) return null;

    const correctAnswer = details.correctAnswer || details.correctAnswers || 
                         details.correct_answer || details.correct_answers;

    if (Array.isArray(correctAnswer)) {
      return JSON.stringify(userAnswer?.sort()) === JSON.stringify(correctAnswer.sort());
    } else {
      return userAnswer === correctAnswer;
    }
  };

  const getAnswerStatus = (questionId) => {
    const userAnswer = exam.answers?.[questionId];
    const isAnswered = userAnswer !== undefined;
    
    if (!isAnswered) return 'unanswered';
    
    // Primero intentar usar los datos de la pregunta directamente si están disponibles
    const question = exam.questions?.find(q => q.id === questionId);
    if (question && question.hasOwnProperty('isCorrect')) {
      return question.isCorrect ? 'correct' : 'incorrect';
    }
    
    // Si no, intentar determinar con los detalles cargados
    const details = questionDetails[questionId];
    if (!details) {
      // Si no tenemos detalles, intentar cargarlos pero devolver 'unknown' por ahora
      loadQuestionDetails(questionId);
      return 'unknown';
    }
    
    const isCorrect = isAnswerCorrect(questionId);
    if (isCorrect === null) return 'unknown';
    
    return isCorrect ? 'correct' : 'incorrect';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = getFilteredQuestions()[currentQuestionIndex];
  const filteredQuestions = getFilteredQuestions();

  // Cargar detalles de la pregunta actual
  useEffect(() => {
    if (currentQuestion) {
      loadQuestionDetails(currentQuestion.id);
    }
  }, [currentQuestion]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando revisión del examen...</p>
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

  if (!exam || !currentQuestion) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <p className="text-gray-600">No hay preguntas para revisar con el filtro seleccionado.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Revisión del Examen</h2>
            <p className="text-gray-600">{exam.certification} - {exam.provider}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>Modo: {exam.examMode === 'realistic' ? '🎯 Examen Real' : '📚 Práctica'}</span>
              {results && (
                <>
                  <span>Puntuación: {results.examSummary.score}%</span>
                  <span className={results.passed ? 'text-green-600' : 'text-red-600'}>
                    {results.passed ? '✅ Aprobado' : '❌ No Aprobado'}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filtros y navegación */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Todas', icon: '📄', count: exam.questions?.length || 0 },
              { key: 'correct', label: 'Correctas', icon: '✅', 
                count: exam.questions?.filter(q => getAnswerStatus(q.id) === 'correct').length || 0 },
              { key: 'incorrect', label: 'Incorrectas', icon: '❌', 
                count: exam.questions?.filter(q => getAnswerStatus(q.id) === 'incorrect').length || 0 },
              { key: 'unanswered', label: 'Sin responder', icon: '⭕', 
                count: exam.questions?.filter(q => getAnswerStatus(q.id) === 'unanswered').length || 0 }
            ].map(({ key, label, icon, count }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setCurrentQuestionIndex(0);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{icon}</span>
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Pregunta {currentQuestionIndex + 1} de {filteredQuestions.length}
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === filteredQuestions.length - 1}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            
            {/* Estado de la pregunta */}
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Estado:</span>
                {getAnswerStatus(currentQuestion.id) === 'correct' && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    ✅ Correcta
                  </span>
                )}
                {getAnswerStatus(currentQuestion.id) === 'incorrect' && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    ❌ Incorrecta
                  </span>
                )}
                {getAnswerStatus(currentQuestion.id) === 'unanswered' && (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                    ⭕ Sin responder
                  </span>
                )}
                
                {/* Metadatos de la pregunta */}
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  {currentQuestion.category}
                </span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.isMultipleChoice && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                    Selección múltiple
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Pregunta original: {exam.questions.findIndex(q => q.id === currentQuestion.id) + 1}
              </div>
            </div>

            {/* Pregunta */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 leading-relaxed">
                {currentQuestion.text}
              </h3>
            </div>

            {/* Opciones de respuesta */}
<div className="space-y-3 mb-8">
  {currentQuestion.options && currentQuestion.options.length > 0 ? (
    currentQuestion.options.map((option, optionIndex) => {
      const userAnswer = exam.answers?.[currentQuestion.id];
      const isUserSelected = currentQuestion.isMultipleChoice 
        ? Array.isArray(userAnswer) && userAnswer.includes(optionIndex)
        : userAnswer === optionIndex;

      const details = questionDetails[currentQuestion.id];
      const correctAnswer = details?.correctAnswer || details?.correctAnswers || 
                          details?.correct_answer || details?.correct_answers ||
                          currentQuestion.correctAnswers;
      
      const isCorrectOption = Array.isArray(correctAnswer) 
        ? correctAnswer.includes(optionIndex)
        : correctAnswer === optionIndex;

      return (
        <div
          key={optionIndex}
          className={`p-4 rounded-lg border-2 ${
            isCorrectOption
              ? 'border-green-500 bg-green-50'
              : isUserSelected && !isCorrectOption
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              isCorrectOption
                ? 'border-green-500 bg-green-500 text-white'
                : isUserSelected && !isCorrectOption
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-gray-300 bg-white text-gray-600'
            }`}>
              {option.label || String.fromCharCode(65 + optionIndex)}
            </span>
            
            <div className="flex-1">
              <p className="text-gray-800">{option.text}</p>
              
              {/* Indicadores de estado */}
              <div className="flex gap-2 mt-2">
                {isCorrectOption && (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                    ✓ Respuesta correcta
                  </span>
                )}
                {isUserSelected && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    isCorrectOption 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isCorrectOption ? 'Tu elección (correcta)' : 'Tu elección (incorrecta)'}
                  </span>
                )}
              </div>
            </div>

            {/* Iconos de estado */}
            <div className="flex-shrink-0">
              {isCorrectOption && (
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {isUserSelected && !isCorrectOption && (
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>
      );
    })
  ) : (
    // Mejorado: Mostrar información más útil cuando no hay opciones
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <div className="font-medium text-yellow-800 mb-2">
            Opciones de respuesta no disponibles
          </div>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>
              <strong>Tu respuesta:</strong> {
                exam.answers?.[currentQuestion.id] !== undefined 
                  ? (Array.isArray(exam.answers[currentQuestion.id]) 
                      ? `Opciones ${exam.answers[currentQuestion.id].map(i => String.fromCharCode(65 + i)).join(', ')}`
                      : `Opción ${String.fromCharCode(65 + exam.answers[currentQuestion.id])}`)
                  : 'Sin responder'
              }
            </p>
            <p>
              <strong>Estado:</strong> {
                getAnswerStatus(currentQuestion.id) === 'correct' ? '✅ Correcta' : 
                getAnswerStatus(currentQuestion.id) === 'incorrect' ? '❌ Incorrecta' : 
                '⭕ Sin responder'
              }
            </p>
            {questionDetails[currentQuestion.id]?.correctAnswers && (
              <p>
                <strong>Respuesta(s) correcta(s):</strong> {
                  Array.isArray(questionDetails[currentQuestion.id].correctAnswers)
                    ? questionDetails[currentQuestion.id].correctAnswers.map(i => String.fromCharCode(65 + i)).join(', ')
                    : String.fromCharCode(65 + questionDetails[currentQuestion.id].correctAnswers)
                }
              </p>
            )}
          </div>
          
          {/* Botón para intentar cargar opciones */}
          <button
            onClick={() => loadQuestionDetails(currentQuestion.id)}
            disabled={loadingDetails}
            className="mt-3 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {loadingDetails ? 'Cargando...' : 'Intentar cargar opciones'}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
            {/* Explicación */}
            {questionDetails[currentQuestion.id] && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800 mb-3">Explicación</h4>
                    <p className="text-blue-700 leading-relaxed">
                      {questionDetails[currentQuestion.id].explanation || 'No hay explicación disponible para esta pregunta.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loadingDetails && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Cargando explicación...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer con navegación rápida */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {filteredQuestions.length} pregunta(s) con filtro: {filter}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cerrar Revisión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}