import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { examAPI, questionAPI } from '../services/api';
import ExamExitModal from './exam/ExamExitModal';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './common/LanguageSwitcher';
import SEOHead, { SITE_URL } from './seo/SEOHead';
import AdBreak from './ads/AdBreak';
import ExamReview from './exam/ExamReview';

export default function ExamenView({ examConfig, nombreCertificacion, onVolver }) {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examCompleted, setExamCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  // Funcionalidades existentes
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [checkedQuestions, setCheckedQuestions] = useState(new Set());
  const [showExplanation, setShowExplanation] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  
  // Funcionalidades de control
  const [showExitModal, setShowExitModal] = useState(false);
  const [examMode, setExamMode] = useState('practice');
  const [isPaused, setIsPaused] = useState(false);
  const [isFailedQuestionsMode, setIsFailedQuestionsMode] = useState(false);

  // Estado para drag & drop
  const [dragItems, setDragItems] = useState({});
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Ad break phase: null | 'start' | 'finish'
  const [adPhase, setAdPhase] = useState(null);

  // Obtener o generar sessionId para usuarios anónimos
  useEffect(() => {
    let storedSessionId = localStorage.getItem('anonymousSessionId');
    
    if (!storedSessionId) {
      storedSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anonymousSessionId', storedSessionId);
    }
    
    setSessionId(storedSessionId);
  }, []);

  // Crear y cargar examen
  useEffect(() => {
    const createExam = async () => {
      if (!sessionId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Validando configuración del examen:', examConfig);
        
        if (!examConfig) {
          throw new Error(t('exam.errorTitle'));
        }

        if (!examConfig.provider || examConfig.provider === '') {
          throw new Error(t('exam.errorTitle'));
        }

        if (!examConfig.certification || examConfig.certification === '') {
          throw new Error(t('exam.errorTitle'));
        }

        if (examConfig.mode) {
          setExamMode(examConfig.mode);
          setIsFailedQuestionsMode(examConfig.mode === 'failed_questions');
        }

        console.log('✅ Configuración validada, creando examen:', {
          provider: examConfig.provider,
          certification: examConfig.certification,
          questionCount: examConfig.questionCount || 'default',
          timeLimit: examConfig.timeLimit || 'default',
          mode: examConfig.mode,
          isFailedQuestions: examConfig.mode === 'failed_questions',
          sessionId: sessionId
        });
        
        let examResponse;
        
        // Usar endpoint específico para preguntas fallidas
        if (examConfig.mode === 'failed_questions') {
          console.log('🔄 Creando examen de preguntas fallidas...');
          examResponse = await examAPI.createFailedQuestionsExam(examConfig);
        } else {
          console.log('📝 Creando examen normal...');
          examResponse = await examAPI.createExam(examConfig);
        }
        
        if (!examResponse.success) {
          throw new Error(examResponse.error || 'Error creando el examen');
        }
        
        const createdExam = examResponse.data;
        console.log('✅ Examen creado exitosamente:', createdExam);
        
        // Validar que tenemos preguntas para modo de preguntas fallidas
        if (examConfig.mode === 'failed_questions' && (!createdExam.questions || createdExam.questions.length === 0)) {
          throw new Error(t('landing.noFailedQuestions'));
        }
        
        if (examResponse.sessionId) {
          setSessionId(examResponse.sessionId);
          localStorage.setItem('anonymousSessionId', examResponse.sessionId);
        }
        
        console.log('🏁 Iniciando examen:', createdExam.id);
        const startedExamResponse = await examAPI.startExam(createdExam.id);
        
        if (!startedExamResponse.success) {
          throw new Error(startedExamResponse.error || 'Error iniciando el examen');
        }
        
        const startedExam = startedExamResponse.data;
        setExam(startedExam);
        
        console.log('✅ Examen iniciado exitosamente:', startedExam);
        
        // Ajustar tiempo para preguntas fallidas (más tiempo por pregunta)
        let timeInSeconds;
        if (examConfig.mode === 'failed_questions') {
          timeInSeconds = Math.max((startedExam.questions?.length || 10) * 90, 600); // 1.5 min por pregunta, mínimo 10 min
        } else {
          timeInSeconds = (startedExam.timeLimit || 60) * 60;
        }
        setTimeLeft(timeInSeconds);
        // Show start-of-exam ad — loading stays true until ad completes
        setAdPhase('start');
        return; // skip finally's setLoading(false)

      } catch (err) {
        console.error('❌ Error creando/iniciando examen:', err);
        
        let errorMessage = 'Error desconocido';
        
        if (err.message.includes('preguntas fallidas')) {
          errorMessage = err.message;
        } else if (err.message.includes('provider')) {
          errorMessage = t('exam.errorTitle');
        } else if (err.message.includes('certification')) {
          errorMessage = t('exam.errorTitle');
        } else if (err.response?.data?.error) {
          errorMessage = `Error del servidor: ${err.response.data.error}`;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setLoading(false); // only on error
      }
    };

    createExam();
  }, [examConfig, sessionId]);

  // Timer del examen
  useEffect(() => {
    if (!exam || examCompleted || timeLeft <= 0) return;
    if (examMode !== 'realistic' && isPaused) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, examCompleted, isPaused, examMode]);

  // Efecto separado para detectar tiempo agotado
  useEffect(() => {
    if (timeLeft === 0 && !examCompleted && exam) {
      handleCompleteExam();
    }
  }, [timeLeft, examCompleted, exam]);

  const currentQuestion = exam?.questions[currentQuestionIndex];

  const handleExitExam = () => {
    setShowExitModal(true);
  };

  // Función mejorada para preparar datos de revisión
  const prepareReviewData = async () => {
    if (!exam || !results) {
      console.error('⚠️ No hay datos de examen o resultados para revisar');
      return null;
    }

    try {
      console.log('📋 Preparando datos para revisión...');
      
      // Crear estructura exacta que espera ExamReview
      const reviewData = {
        // Información básica del examen
        id: exam.id,
        title: exam.title || `${exam.provider} - ${exam.certification}`,
        provider: exam.provider,
        certification: exam.certification,
        status: 'completed',
        examMode: examMode,
        passingScore: exam.passingScore || 70,
        
        // Asegurar que las preguntas incluyan opciones completas
        questions: exam.questions.map((question, index) => {
          const questionId = question.id;
          const userAnswer = answers[questionId];
          const explanation = showExplanation[questionId];
          const wasChecked = checkedQuestions.has(questionId);
          const wasMarked = markedForReview.has(questionId);
          
          return {
            ...question,
            // Verificar que las opciones existan
            options: question.options || [],
            userAnswer: userAnswer,
            isAnswered: userAnswer !== undefined,
            isCorrect: wasChecked && explanation ? isAnswerCorrect(questionId) : null,
            explanation: explanation?.explanation || null,
            correctAnswers: explanation?.correctAnswer || null,
            wasChecked: wasChecked,
            wasMarked: wasMarked
          };
        }),
        
        // Respuestas del usuario
        answers: answers,
        
        // Metadatos para compatibilidad
        markedForReview: Array.from(markedForReview),
        checkedQuestions: Array.from(checkedQuestions),
        showExplanation: showExplanation,
        
        // Resultados estructurados
        results: {
          ...results,
          passed: results.passed,
          examSummary: results.examSummary,
          questionResults: results.questionResults || exam.questions.map((question, index) => {
            const questionId = question.id;
            const userAnswer = answers[questionId];
            const explanation = showExplanation[questionId];
            const wasChecked = checkedQuestions.has(questionId);
            
            return {
              questionId: questionId,
              questionText: question.text,
              category: question.category || 'General',
              difficulty: question.difficulty || 'Medium',
              questionType: question.questionType || (question.isMultipleChoice ? 'multiple_answer' : 'single_answer'),
              expectedAnswers: question.expectedAnswers || 1,
              userAnswer: userAnswer,
              isAnswered: userAnswer !== undefined,
              isCorrect: wasChecked && explanation ? isAnswerCorrect(questionId) : null,
              correctAnswers: explanation?.correctAnswer || null,
              explanation: explanation?.explanation || null,
              options: question.options || []
            };
          })
        }
      };

      // Verificación de opciones faltantes
      let questionsWithoutOptions = 0;
      reviewData.questions.forEach((question, index) => {
        if (!question.options || question.options.length === 0) {
          questionsWithoutOptions++;
          console.warn(`⚠️ Pregunta ${index + 1} (ID: ${question.id}) no tiene opciones`);
          
          // Intentar cargar opciones desde la API
          questionAPI.getQuestion(question.id, true, false)
            .then(response => {
              if (response.success && response.data && response.data.options) {
                question.options = response.data.options;
                console.log(`✅ Opciones cargadas para pregunta ${question.id}`);
              }
            })
            .catch(err => {
              console.error(`❌ Error cargando opciones para pregunta ${question.id}:`, err);
            });
        }
      });

      if (questionsWithoutOptions > 0) {
        console.warn(`⚠️ ${questionsWithoutOptions} preguntas sin opciones detectadas`);
      }

      console.log('✅ Datos de revisión preparados:', {
        examId: reviewData.id,
        questionsCount: reviewData.questions.length,
        answersCount: Object.keys(reviewData.answers).length,
        resultsAvailable: !!reviewData.results,
        questionResultsCount: reviewData.results.questionResults?.length || 0,
        hasExplanations: Object.keys(showExplanation).length,
        questionsWithOptions: reviewData.questions.filter(q => q.options && q.options.length > 0).length
      });

      return reviewData;
      
    } catch (error) {
      console.error('⚠️ Error preparando datos de revisión:', error);
      return null;
    }
  };

  // Función para mostrar la revisión
  const handleShowReview = async () => {
    console.log('📋 Iniciando revisión del examen...');
    
    try {
      setLoading(true);
      
      // Verificar que tenemos todas las opciones de las preguntas
      console.log('🔍 Verificando opciones de preguntas...');
      let questionsNeedingOptions = [];
      
      exam.questions.forEach((question, index) => {
        if (!question.options || question.options.length === 0) {
          questionsNeedingOptions.push(question.id);
          console.log(`⚠️ Pregunta ${index + 1} (ID: ${question.id}) necesita cargar opciones`);
        }
      });
      
      // Cargar opciones faltantes si es necesario
      if (questionsNeedingOptions.length > 0) {
        console.log(`🔄 Cargando opciones para ${questionsNeedingOptions.length} preguntas...`);
        
        const optionsPromises = questionsNeedingOptions.map(async (questionId) => {
          try {
            const response = await questionAPI.getQuestion(questionId, true, false);
            if (response.success && response.data && response.data.options) {
              return { questionId, options: response.data.options };
            }
            return { questionId, options: [] };
          } catch (err) {
            console.error(`❌ Error cargando opciones para pregunta ${questionId}:`, err);
            return { questionId, options: [] };
          }
        });
        
        const optionsResults = await Promise.all(optionsPromises);
        
        // Actualizar las preguntas del examen con las opciones cargadas
        const updatedQuestions = exam.questions.map(question => {
          const optionResult = optionsResults.find(result => result.questionId === question.id);
          if (optionResult && optionResult.options.length > 0) {
            return { ...question, options: optionResult.options };
          }
          return question;
        });
        
        // Actualizar el estado del examen con las opciones cargadas
        setExam(prevExam => ({
          ...prevExam,
          questions: updatedQuestions
        }));
        
        console.log(`✅ Opciones cargadas para ${optionsResults.filter(r => r.options.length > 0).length} preguntas`);
      }
      
      // Preparar datos para revisión con opciones incluidas
      const preparedData = await prepareReviewData();
      
      if (!preparedData) {
        console.error('⚠️ No se pudieron preparar los datos de revisión');
        setError(t('common.error'));
        return;
      }
      
      // Verificación final de opciones
      const questionsWithoutOptionsAfter = preparedData.questions.filter(q => !q.options || q.options.length === 0);
      if (questionsWithoutOptionsAfter.length > 0) {
        console.warn(`⚠️ Aún hay ${questionsWithoutOptionsAfter.length} preguntas sin opciones después de la carga`);
        
        // Crear opciones placeholder basadas en las respuestas
        questionsWithoutOptionsAfter.forEach(question => {
          const maxOption = Math.max(
            ...[question.userAnswer, question.correctAnswers].flat().filter(x => typeof x === 'number'),
            3 // mínimo 4 opciones (0-3)
          );
          
          question.options = Array.from({ length: maxOption + 1 }, (_, i) => ({
            label: String.fromCharCode(65 + i), // A, B, C, D...
            text: `Opción ${String.fromCharCode(65 + i)}` // Placeholder text
          }));
          
          console.log(`🔧 Opciones placeholder creadas para pregunta ${question.id}:`, question.options);
        });
      }
      
      console.log('✅ Datos preparados correctamente, guardando en estado...');
      
      // Guardar los datos preparados en el estado
      setReviewData(preparedData);
      
      // Pequeña pausa para asegurar que el estado se actualice
      setTimeout(() => {
        setShowReview(true);
        console.log('✅ Modal de revisión abierto');
      }, 100);
      
    } catch (error) {
      console.error('⚠️ Error al abrir revisión:', error);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExit = async () => {
    try {
      if (exam && !examCompleted) {
        try {
          await examAPI.cancelExam(exam.id);
        } catch (err) {
          console.warn('Error cancelando examen:', err);
        }
      }
      
      onVolver();
    } catch (err) {
      console.error('Error al salir del examen:', err);
      onVolver();
    }
  };

  const handleSaveAndExit = async () => {
    if (!isAuthenticated || examMode === 'realistic') {
      throw new Error('No se puede guardar en este modo');
    }

    try {
      await examAPI.pauseExam(exam.id, {
        currentQuestionIndex,
        timeLeft,
        answers,
        markedForReview: Array.from(markedForReview),
        checkedQuestions: Array.from(checkedQuestions)
      });

      console.log('Examen guardado y pausado');
      onVolver();
    } catch (err) {
      console.error('Error guardando examen:', err);
      throw err;
    }
  };

  const handleTogglePause = () => {
    if (examMode === 'realistic') return;
    
    setIsPaused(!isPaused);
  };

  const handleAnswerSelect = async (answerIndex) => {
    if (!currentQuestion || examCompleted || isPaused) return;

    let newAnswer;
    const currentAnswer = answers[currentQuestion.id];

    if (currentQuestion.isMultipleChoice) {
      const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
      
      if (currentAnswers.includes(answerIndex)) {
        newAnswer = currentAnswers.filter(index => index !== answerIndex);
      } else {
        const maxAnswers = currentQuestion.expectedAnswers || 2;
        if (currentAnswers.length < maxAnswers) {
          newAnswer = [...currentAnswers, answerIndex].sort();
        } else {
          newAnswer = [answerIndex];
        }
      }
    } else {
      newAnswer = answerIndex;
    }

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: newAnswer
    };
    setAnswers(newAnswers);

    try {
      console.log('Submitting answer:', {
        examId: exam.id,
        questionId: currentQuestion.id,
        answer: newAnswer
      });
      
      await examAPI.submitAnswer(exam.id, currentQuestion.id, newAnswer);
    } catch (err) {
      console.error('Error enviando respuesta:', err);
      setError('Error guardando respuesta. Continuando con el examen...');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handler para fill in the blank
  const handleFillBlankChange = async (blankIndex, value) => {
    if (!currentQuestion || examCompleted || isPaused) return;
    const currentAnswer = Array.isArray(answers[currentQuestion.id])
      ? [...answers[currentQuestion.id]]
      : [];
    currentAnswer[blankIndex] = value;
    const newAnswers = { ...answers, [currentQuestion.id]: currentAnswer };
    setAnswers(newAnswers);
    try {
      await examAPI.submitAnswer(exam.id, currentQuestion.id, currentAnswer);
    } catch (err) {
      console.error('Error guardando respuesta fill-blank:', err);
    }
  };

  // Handler para drag & drop: inicializa orden si no existe
  const initDragItems = (question) => {
    if (!dragItems[question.id]) {
      const items = question.options || question.items || [];
      setDragItems(prev => ({
        ...prev,
        [question.id]: items.map((_, i) => i)
      }));
    }
  };

  const handleDragStart = (e, fromIndex) => {
    e.dataTransfer.setData('fromIndex', fromIndex);
  };

  const handleDragOver = (e, toIndex) => {
    e.preventDefault();
    setDragOverIndex(toIndex);
  };

  const handleDrop = async (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
    if (fromIndex === toIndex || !currentQuestion || isPaused) return;

    const currentOrder = dragItems[currentQuestion.id]
      ? [...dragItems[currentQuestion.id]]
      : (currentQuestion.options || []).map((_, i) => i);

    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    setDragItems(prev => ({ ...prev, [currentQuestion.id]: newOrder }));
    setDragOverIndex(null);

    const newAnswers = { ...answers, [currentQuestion.id]: newOrder };
    setAnswers(newAnswers);
    try {
      await examAPI.submitAnswer(exam.id, currentQuestion.id, newOrder);
    } catch (err) {
      console.error('Error guardando drag & drop:', err);
    }
  };

  // Handler para checkbox (select all that apply, sin límite fijo)
  const handleCheckboxToggle = async (optionIndex) => {
    if (!currentQuestion || examCompleted || isPaused) return;
    const currentAnswer = Array.isArray(answers[currentQuestion.id])
      ? [...answers[currentQuestion.id]]
      : [];
    let newAnswer;
    if (currentAnswer.includes(optionIndex)) {
      newAnswer = currentAnswer.filter(i => i !== optionIndex);
    } else {
      newAnswer = [...currentAnswer, optionIndex].sort((a, b) => a - b);
    }
    const newAnswers = { ...answers, [currentQuestion.id]: newAnswer };
    setAnswers(newAnswers);
    try {
      await examAPI.submitAnswer(exam.id, currentQuestion.id, newAnswer);
    } catch (err) {
      console.error('Error guardando checkbox:', err);
    }
  };

  const toggleMarkForReview = () => {
    if (isPaused) return;
    
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestion.id)) {
      newMarked.delete(currentQuestion.id);
    } else {
      newMarked.add(currentQuestion.id);
    }
    setMarkedForReview(newMarked);
  };

  const handleCheckAnswer = async () => {
    if (!currentQuestion || checkedQuestions.has(currentQuestion.id) || examMode === 'realistic' || isPaused) return;

    try {
      console.log('🔍 Solicitando detalles de pregunta:', currentQuestion.id);
      const questionDetails = await questionAPI.getQuestionDetails(currentQuestion.id);
      console.log('📝 Respuesta completa del backend:', questionDetails);

      let correctAnswer = null;
      let explanation = t('examReview.noExplanation');
      
      if (questionDetails.success && questionDetails.data) {
        const data = questionDetails.data;
        
        correctAnswer = data.correctAnswer || 
                      data.correctAnswers || 
                      data.correct_answer || 
                      data.correct_answers;
        
        explanation = data.explanation || explanation;
        
        console.log('✅ Datos extraídos:', {
          correctAnswer,
          explanation: explanation.substring(0, 100) + '...',
          questionType: currentQuestion.isMultipleChoice ? 'multiple' : 'single',
          userAnswer: answers[currentQuestion.id],
          isFailedQuestionsMode
        });
        
      } else {
        correctAnswer = questionDetails.correctAnswer || 
                      questionDetails.correctAnswers ||
                      questionDetails.correct_answer ||
                      questionDetails.correct_answers;
        
        explanation = questionDetails.explanation || explanation;
      }

      if (correctAnswer === undefined || correctAnswer === null) {
        console.error('❌ No se pudo obtener la respuesta correcta del backend');
        throw new Error('Respuesta correcta no disponible');
      }

      let normalizedCorrectAnswer = correctAnswer;

      const qType = currentQuestion.questionType;

      if (qType === 'fill_in_the_blank' || qType === 'fill_in_the_gap' || qType === 'drag_and_drop') {
        // Keep as-is (array of values or ordered indices)
        normalizedCorrectAnswer = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
      } else if (currentQuestion.isMultipleChoice || qType === 'multiple_answer' || qType === 'checkbox') {
        if (!Array.isArray(correctAnswer)) {
          normalizedCorrectAnswer = [correctAnswer];
        }
      } else {
        if (Array.isArray(correctAnswer)) {
          normalizedCorrectAnswer = correctAnswer[0];
        }
      }

      console.log('🎯 Respuesta correcta normalizada:', {
        original: correctAnswer,
        normalized: normalizedCorrectAnswer,
        isMultiple: currentQuestion.isMultipleChoice
      });
      
      setShowExplanation(prev => ({
        ...prev,
        [currentQuestion.id]: {
          correctAnswer: normalizedCorrectAnswer,
          explanation: explanation
        }
      }));

      setCheckedQuestions(prev => new Set([...prev, currentQuestion.id]));
      
      // Para modo de preguntas fallidas, mostrar información adicional
      if (isFailedQuestionsMode) {
        const isCorrect = isAnswerCorrect(currentQuestion.id);
        console.log(`🔄 Pregunta fallida verificada - ${isCorrect ? 'Correcta esta vez' : 'Aún incorrecta'}`);
      }
      
    } catch (err) {
      console.error('Error obteniendo detalles de pregunta:', err);
      
      // Fallback con datos simulados
      setShowExplanation(prev => ({
        ...prev,
        [currentQuestion.id]: {
          correctAnswer: currentQuestion.isMultipleChoice ? [0, 1] : 0,
          explanation: t('examReview.noExplanation')
        }
      }));
      setCheckedQuestions(prev => new Set([...prev, currentQuestion.id]));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1 && !isPaused) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0 && !isPaused) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    if (!isPaused) {
      setCurrentQuestionIndex(index);
      setShowSummary(false);
    }
  };

  const handleShowSummary = () => {
    if (!isPaused) {
      setShowSummary(true);
    }
  };

  const handleRequestFinish = () => {
    if (!isPaused) {
      setShowConfirmFinish(true);
    }
  };

  const handleCompleteExam = async () => {
    if (!exam || examCompleted) return;

    try {
      setLoading(true);
      
      console.log('Completing exam:', exam.id);
      
      const completedExam = await examAPI.completeExam(exam.id);
      const examResults = await examAPI.getResults(exam.id);
      setResults(examResults.data);
      setShowConfirmFinish(false);
      setLoading(false); // clear spinner before ad appears
      setAdPhase('finish'); // adPhase check in render takes over

    } catch (err) {
      console.error('Error completando examen:', err);
      setError(`Error completando examen: ${err.response?.data?.error || err.message}`);
      setExamCompleted(true); // fallback: skip ad on error
    } finally {
      setLoading(false);
    }
  };

  // Called when an ad break finishes (countdown ends or user skips)
  const handleAdComplete = () => {
    const phase = adPhase;
    setAdPhase(null);
    if (phase === 'start') {
      setLoading(false); // now reveal the exam questions
    } else if (phase === 'finish') {
      setExamCompleted(true); // now reveal the results
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = timeLeft / ((exam?.timeLimit || 60) * 60);
    if (percentage > 0.5) return 'text-green-600';
    if (percentage > 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isOptionSelected = (optionIndex) => {
    const currentAnswer = answers[currentQuestion.id];
    
    if (currentQuestion.isMultipleChoice) {
      return Array.isArray(currentAnswer) && currentAnswer.includes(optionIndex);
    } else {
      return currentAnswer === optionIndex;
    }
  };

  const getSelectedCount = () => {
    const currentAnswer = answers[currentQuestion.id];
    if (currentQuestion.isMultipleChoice && Array.isArray(currentAnswer)) {
      return currentAnswer.length;
    }
    return currentAnswer !== undefined ? 1 : 0;
  };

  const isCurrentQuestionAnswered = () => {
    const currentAnswer = answers[currentQuestion?.id];
    if (!currentQuestion) return false;

    const qType = currentQuestion.questionType;

    if (qType === 'fill_in_the_blank' || qType === 'fill_in_the_gap') {
      const blanksCount = currentQuestion.blanks?.length ||
        (currentQuestion.text.match(/___+/g) || []).length || 1;
      return Array.isArray(currentAnswer) &&
        currentAnswer.length === blanksCount &&
        currentAnswer.every(v => v && v.trim() !== '');
    }

    if (qType === 'drag_and_drop') {
      const items = currentQuestion.options || currentQuestion.items || [];
      return Array.isArray(currentAnswer) && currentAnswer.length === items.length;
    }

    if (qType === 'checkbox') {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }

    if (currentQuestion.isMultipleChoice || qType === 'multiple_answer') {
      const expectedAnswers = currentQuestion.expectedAnswers || 1;
      return Array.isArray(currentAnswer) && currentAnswer.length === expectedAnswers;
    }

    return currentAnswer !== undefined;
  };

  const getUnansweredQuestions = () => {
    if (!exam) return [];
    return exam.questions.filter((_, index) => {
      const questionId = exam.questions[index].id;
      return answers[questionId] === undefined;
    });
  };

  const isAnswerCorrect = (questionId) => {
    const explanation = showExplanation[questionId];
    const userAnswer = answers[questionId];
    const question = exam?.questions.find(q => q.id === questionId);
    if (!explanation || userAnswer === undefined) return null;

    const qType = question?.questionType;

    if (qType === 'fill_in_the_blank' || qType === 'fill_in_the_gap') {
      const correct = Array.isArray(explanation.correctAnswer)
        ? explanation.correctAnswer
        : [explanation.correctAnswer];
      const user = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      return correct.every((c, i) =>
        (user[i] || '').trim().toLowerCase() === (c || '').trim().toLowerCase()
      );
    }

    if (qType === 'drag_and_drop') {
      const correct = explanation.correctAnswer;
      return JSON.stringify(userAnswer) === JSON.stringify(correct);
    }

    if (Array.isArray(explanation.correctAnswer)) {
      return JSON.stringify(userAnswer) === JSON.stringify(explanation.correctAnswer);
    } else {
      return userAnswer === explanation.correctAnswer;
    }
  };

  // Renderizar progreso para preguntas fallidas
  const renderFailedQuestionsResults = () => {
    if (!examCompleted || !results || !isFailedQuestionsMode) return null;
    
    const improvedQuestions = exam.questions.filter(q => {
      const wasCorrect = isAnswerCorrect(q.id);
      return wasCorrect === true;
    }).length;
    
    const stillStrugglingWith = exam.questions.length - improvedQuestions;
    
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
          <span>🔄</span>
          {t('failedQuestionsResults.title')}
        </h3>
        
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {improvedQuestions}
            </div>
            <div className="text-sm text-gray-600">{t('failedQuestionsResults.improved')}</div>
            <div className="text-xs text-green-600">{t('failedQuestionsResults.wellDone')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stillStrugglingWith}
            </div>
            <div className="text-sm text-gray-600">{t('failedQuestionsResults.stillStruggling')}</div>
            <div className="text-xs text-orange-600">{t('failedQuestionsResults.keepPracticing')}</div>
          </div>
        </div>
        
        <div className="bg-white rounded p-3">
          <div className="flex justify-between items-center text-sm">
            <span>{t('failedQuestionsResults.improvementRate')}</span>
            <span className="font-semibold text-green-600">
              {Math.round((improvedQuestions / exam.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(improvedQuestions / exam.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {improvedQuestions > stillStrugglingWith && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
            <strong>{t('failedQuestionsResults.title')}</strong> {t('failedQuestionsResults.greatProgress')}
          </div>
        )}
      </div>
    );
  };

  // ── Renderizado de inputs según questionType ──────────────────────────────
  const renderQuestionInput = () => {
    const qType = currentQuestion.questionType;
    const explanation = showExplanation[currentQuestion.id];
    const isChecked = checkedQuestions.has(currentQuestion.id);
    const isDisabled = isChecked || isPaused;

    // ── FILL IN THE BLANK ────────────────────────────────────────────────────
    if (qType === 'fill_in_the_blank' || qType === 'fill_in_the_gap') {
      const blanks = currentQuestion.blanks ||
        (currentQuestion.text.match(/___+/g) || ['___']).map((_, i) => ({ label: t('exam.fillBlankLabel', { num: i + 1 }) }));
      const userAnswers = Array.isArray(answers[currentQuestion.id])
        ? answers[currentQuestion.id]
        : [];
      const correctAnswers = explanation?.correctAnswer;

      return (
        <div className="space-y-4 mb-8">
          <p className="text-sm text-gray-500 italic">{t('exam.fillBlankHint')}</p>
          {blanks.map((blank, i) => {
            const userVal = userAnswers[i] || '';
            const correctVal = Array.isArray(correctAnswers) ? correctAnswers[i] : correctAnswers;
            let inputStyle = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
            if (explanation && canShowVerification) {
              const ok = (userVal || '').trim().toLowerCase() === (correctVal || '').trim().toLowerCase();
              inputStyle = ok
                ? 'border-green-500 bg-green-50 text-green-800'
                : 'border-red-500 bg-red-50 text-red-800';
            }
            return (
              <div key={i} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {blank.label || t('exam.fillBlankLabel', { num: i + 1 })}
                </label>
                <input
                  type="text"
                  value={userVal}
                  onChange={e => handleFillBlankChange(i, e.target.value)}
                  disabled={isDisabled}
                  placeholder="{t('exam.fillBlankPlaceholder')}"
                  className={`w-full px-4 py-2 border-2 rounded-lg text-gray-800 transition-colors outline-none ${inputStyle} disabled:opacity-60`}
                />
                {explanation && canShowVerification && (
                  <span className="text-xs text-gray-500">{t('exam.fillBlankCorrect')} <strong>{correctVal}</strong></span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // ── DRAG & DROP ──────────────────────────────────────────────────────────
    if (qType === 'drag_and_drop') {
      const sourceItems = currentQuestion.options || currentQuestion.items || [];
      if (!dragItems[currentQuestion.id]) initDragItems(currentQuestion);
      const order = dragItems[currentQuestion.id] || sourceItems.map((_, i) => i);
      const correctOrder = explanation?.correctAnswer;

      return (
        <div className="space-y-3 mb-8">
          <p className="text-sm text-gray-500 italic flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            {t('exam.dragHint')}
          </p>
          {order.map((originalIndex, position) => {
            const item = sourceItems[originalIndex];
            const isCorrectPos = correctOrder && correctOrder[position] === originalIndex;
            let itemStyle = 'border-gray-300 bg-white hover:border-blue-400 cursor-grab';
            if (explanation && canShowVerification) {
              itemStyle = isCorrectPos
                ? 'border-green-500 bg-green-50 cursor-not-allowed'
                : 'border-red-400 bg-red-50 cursor-not-allowed';
            }
            if (dragOverIndex === position && !isDisabled) {
              itemStyle = 'border-blue-500 bg-blue-50 cursor-grab';
            }

            return (
              <div
                key={originalIndex}
                draggable={!isDisabled}
                onDragStart={e => handleDragStart(e, position)}
                onDragOver={e => handleDragOver(e, position)}
                onDrop={e => handleDrop(e, position)}
                onDragLeave={() => setDragOverIndex(null)}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all select-none ${itemStyle} ${isDisabled ? 'opacity-70' : ''}`}
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold">
                  {position + 1}
                </span>
                {!isDisabled && (
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
                  </svg>
                )}
                <span className="text-gray-800 flex-1">
                  {typeof item === 'object' ? (item.text || item.label) : item}
                </span>
                {explanation && canShowVerification && (
                  isCorrectPos
                    ? <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    : <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // ── CHECKBOX (select all that apply) ────────────────────────────────────
    if (qType === 'checkbox') {
      const selectedIndices = Array.isArray(answers[currentQuestion.id])
        ? answers[currentQuestion.id]
        : [];
      const explanation = showExplanation[currentQuestion.id];

      return (
        <div className="space-y-3 mb-8">
          <p className="text-sm text-gray-500 italic">{t('exam.checkboxHint')}</p>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedIndices.includes(index);
            const correctAnswer = explanation?.correctAnswer;
            const isCorrectOption = correctAnswer && (
              Array.isArray(correctAnswer) ? correctAnswer.includes(index) : correctAnswer === index
            );
            let rowStyle = 'border-gray-200 hover:border-blue-300 hover:bg-blue-25';
            let checkStyle = 'border-gray-300';
            if (isSelected) {
              if (explanation && canShowVerification) {
                rowStyle = isCorrectOption ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50';
                checkStyle = isCorrectOption ? 'border-green-600 bg-green-600 text-white' : 'border-red-600 bg-red-600 text-white';
              } else {
                rowStyle = 'border-blue-600 bg-blue-50';
                checkStyle = 'border-blue-600 bg-blue-600 text-white';
              }
            } else if (isCorrectOption && explanation && canShowVerification) {
              rowStyle = 'border-green-400 bg-green-25';
            }

            return (
              <button
                key={index}
                onClick={() => handleCheckboxToggle(index)}
                disabled={isDisabled}
                className={`w-full text-left p-4 rounded border-2 transition-all ${isPaused ? 'opacity-50 cursor-not-allowed border-gray-200' : rowStyle}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center text-sm font-medium transition-colors ${isDisabled && !isSelected ? 'border-gray-300' : checkStyle}`}>
                    {isSelected ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="text-gray-800 flex-1">
                    {typeof option === 'object' ? option.text : option}
                  </span>
                  {explanation && canShowVerification && (
                    <div className="flex-shrink-0">
                      {isCorrectOption
                        ? <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        : isSelected
                        ? <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        : null
                      }
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // ── SINGLE / MULTIPLE ANSWER (existing behavior) ─────────────────────────
    return (
      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, index) => {
          const isSelected = isOptionSelected(index);
          const isMultiple = currentQuestion.isMultipleChoice || qType === 'multiple_answer';
          const explanation = showExplanation[currentQuestion.id];
          const isCorrectOption = explanation && (
            Array.isArray(explanation.correctAnswer)
              ? explanation.correctAnswer.includes(index)
              : explanation.correctAnswer === index
          );

          return (
            <button
              key={index}
              className={`w-full text-left p-4 rounded border-2 transition-all ${
                isPaused
                  ? 'opacity-50 cursor-not-allowed border-gray-200'
                  : isSelected
                  ? isCorrectOption && canShowVerification
                    ? 'border-green-600 bg-green-50'
                    : explanation && canShowVerification
                    ? 'border-red-600 bg-red-50'
                    : 'border-blue-600 bg-blue-50'
                  : isCorrectOption && explanation && canShowVerification
                  ? 'border-green-400 bg-green-25'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
              }`}
              onClick={() => handleAnswerSelect(index)}
              disabled={checkedQuestions.has(currentQuestion.id) || isPaused}
            >
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded ${
                  isMultiple ? 'rounded' : 'rounded-full'
                } border-2 flex items-center justify-center text-sm font-medium ${
                  isSelected
                    ? isCorrectOption && canShowVerification
                      ? 'border-green-600 bg-green-600 text-white'
                      : explanation && canShowVerification
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-blue-600 bg-blue-600 text-white'
                    : isCorrectOption && explanation && canShowVerification
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300'
                }`}>
                  {isMultiple && (isSelected || (isCorrectOption && explanation && canShowVerification)) ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    option.label
                  )}
                </span>
                <span className="text-gray-800 flex-1">{option.text}</span>
                {explanation && canShowVerification && (
                  <div className="flex-shrink-0">
                    {isCorrectOption ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : isSelected ? (
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const canShowVerification = examMode === 'practice' || examMode === 'failed_questions';
  const canPause = examMode === 'practice' || examMode === 'failed_questions';
  const canShowQuestionMetadata = examMode === 'practice' || examMode === 'failed_questions';

  // ── SEO for exam page ────────────────────────────────────────────────────────
  const examProviderName = examConfig?.provider_name || examConfig?.provider || null;
  const examCertName = nombreCertificacion || examConfig?.certification || null;
  const examCertCode = examConfig?.certificationCode || null;
  const examSeoTitle = examCertName
    ? `${examCertName} Practice Exam`
    : 'Cloud Certification Practice Exam';
  const examSeoDesc = examCertName && examProviderName
    ? `Taking a ${examCertName} practice exam. ${exam?.questions?.length || ''} questions with instant explanations. Prepare for your ${examProviderName} certification.`
    : 'Cloud certification practice exam with real questions and instant explanations.';

  // ── Ad break takes full priority over all other screens ──────────────────
  if (adPhase) {
    return <AdBreak phase={adPhase} onComplete={handleAdComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium text-lg">
            {exam ? t('exam.processingDots') : t('exam.creatingExam')}
          </p>
          {sessionId && (
            <p className="text-blue-500 text-sm mt-2">
              {t('exam.session')}: {sessionId.substring(0, 20)}...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-4">{t('common.error')}</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button 
            onClick={onVolver}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {t('exam.backToStart')}
          </button>
        </div>
      </div>
    );
  }

  // Vista de resultados
  if (examCompleted && results) {
    return (
      <>
      <SEOHead
        pageType="exam"
        title={examSeoTitle}
        description={examSeoDesc}
        provider={examProviderName}
        certification={examCertName}
        certificationCode={examCertCode}
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
        <header className="bg-white shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">{t('exam.completed')}</h1>
              <p className="text-gray-600">{nombreCertificacion}</p>
              <p className="text-sm text-gray-500">
                {t('exam.mode')}: {examMode === 'realistic' ? t('examModes.label.realistic') : 
                       examMode === 'failed_questions' ? t('examModes.label.failed_questions') : t('examModes.label.practice')}
              </p>
            </div>
            <button 
              onClick={onVolver}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t('exam.newExam')}
            </button>
          </div>
        </header>

        <main className="flex-1 flex justify-center items-start px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                results.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {results.passed ? (
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h2 className={`text-3xl font-bold mb-2 ${
                results.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.passed ? t('exam.passed') : t('exam.failed')}
              </h2>
              
              <p className="text-xl text-gray-700 mb-4">
                {t('exam.score', { score: results.examSummary.score }).split(':')[0]}: <span className="font-bold">{results.examSummary.score}%</span>
              </p>
              
              <p className="text-gray-600">
                {t('exam.passingScore', { score: exam.passingScore })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.examSummary.statistics.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">{t('exam.correct')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {results.examSummary.statistics.incorrectAnswers}
                </div>
                <div className="text-sm text-gray-600">{t('exam.incorrect')}</div>
              </div>
            </div>

            {/* Progreso de preguntas fallidas */}
            {renderFailedQuestionsResults()}

            {/* Resumen de todas las preguntas */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">{t('exam.answerSummary')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exam.questions.map((question, index) => {
                  const questionId = question.id;
                  const isAnswered = answers[questionId] !== undefined;
                  const wasMarked = markedForReview.has(questionId);
                  const wasChecked = checkedQuestions.has(questionId);
                  const isCorrect = wasChecked ? isAnswerCorrect(questionId) : null;

                  return (
                    <div 
                      key={questionId}
                      className={`p-3 rounded border-2 text-sm ${
                        !isAnswered 
                          ? 'border-orange-300 bg-orange-50'
                          : isCorrect === true
                          ? 'border-green-300 bg-green-50'
                          : isCorrect === false
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Pregunta {index + 1}
                        </span>
                        <div className="flex gap-1">
                          {!isAnswered && (
                            <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">
                              Sin responder
                            </span>
                          )}
                          {wasMarked && (
                            <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                              Marcada
                            </span>
                          )}
                          {wasChecked && (
                            <span className={`px-2 py-1 rounded text-xs text-white ${
                              isCorrect ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {isCorrect ? 'Correcta' : 'Incorrecta'}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1 truncate">
                        {question.text.substring(0, 60)}...
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {getUnansweredQuestions().length > 0 && (
                <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded">
                  <div className="flex items-center gap-2 text-orange-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">
                      {getUnansweredQuestions().length} pregunta(s) sin responder
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">{t('exam.statistics')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('exam.totalQuestions')}:</span>
                  <span className="font-semibold ml-2">{results.examSummary.statistics.totalQuestions}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('exam.timeUsed')}:</span>
                  <span className="font-semibold ml-2">{formatTime(results.examSummary.timeSpent * 60)}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('exam.markedCount')}:</span>
                  <span className="font-semibold ml-2">{markedForReview.size}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('exam.examMode')}:</span>
                  <span className="font-semibold ml-2">
                    {examMode === 'realistic' ? t('examModes.label.realistic') : 
                     examMode === 'failed_questions' ? t('examModes.label.failed_questions') : t('examModes.label.practice')}
                  </span>
                </div>
                {canShowVerification && (
                  <div>
                    <span className="text-gray-600">{t('exam.verificationsUsed')}:</span>
                    <span className="font-semibold ml-2">{checkedQuestions.size}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={onVolver}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                {t('exam.newExam')}
              </button>
              <button 
                onClick={handleShowReview}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
              >
                {t('exam.reviewAnswers')}
              </button>
            </div>
          </div>
        </main>

        {/* Modal de revisión dentro de la vista de resultados */}
        {showReview && reviewData && (
          <ExamReview
            examId={exam.id}
            examData={reviewData}
            onClose={() => {
              console.log('Cerrando modal de revisión');
              setShowReview(false);
              setReviewData(null);
            }}
          />
        )}
      </div>
    </>
    );
  }

  // Modal de confirmación para finalizar
  if (showConfirmFinish) {
    const unansweredCount = getUnansweredQuestions().length;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {t('exam.confirmFinish')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('exam.confirmFinishText')}
            </p>
            
            {unansweredCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                <p className="text-orange-800 text-sm">
                  <strong>{t('common.confirm')}:</strong> {t('exam.unansweredWarning', { count: unansweredCount })}
                </p>
              </div>
            )}
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>{t('exam.answered')}: {Object.keys(answers).length}/{exam.questions.length}</p>
              <p>{t('exam.markedForReview')}: {markedForReview.size}</p>
              <p>{t('exam.timeLeft')}: {formatTime(timeLeft)}</p>
              <p>{t('exam.mode')}: {examMode === 'realistic' ? t('examModes.label.realistic') : 
                        examMode === 'failed_questions' ? t('examModes.label.failed_questions') : t('examModes.label.practice')}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmFinish(false)}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCompleteExam}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Finalizar Examen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista de resumen de preguntas
  if (showSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
        <header className="bg-white shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-blue-700">{t('exam.summaryTitle')}</h1>
              <p className="text-gray-600 text-sm">{nombreCertificacion}</p>
              <p className="text-xs text-gray-500">
                {t('exam.mode')}: {examMode === 'realistic' ? t('examModes.label.realistic') : 
                       examMode === 'failed_questions' ? t('examModes.label.failed_questions') : t('examModes.label.practice')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`text-lg font-bold ${getTimeColor()}`}>
                {formatTime(timeLeft)} {isPaused && `(${t('common.paused')})`}
              </div>
              
              {canPause && (
                <button
                  onClick={handleTogglePause}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    isPaused 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {isPaused ? t('common.resume') : t('common.pause')}
                </button>
              )}
              
              <button 
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                {t('exam.continueExam')}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="grid grid-cols-4 gap-4 text-center mb-6">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(answers).length}
                  </div>
                  <div className="text-sm text-gray-600">{t('exam.answered')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {getUnansweredQuestions().length}
                  </div>
                  <div className="text-sm text-gray-600">{t('common.unanswered')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {markedForReview.size}
                  </div>
                  <div className="text-sm text-gray-600">{t('common.marked')}</div>
                </div>
                {canShowVerification && (
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {checkedQuestions.size}
                    </div>
                    <div className="text-sm text-gray-600">{t('common.verified')}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {exam.questions.map((question, index) => {
                  const questionId = question.id;
                  const isAnswered = answers[questionId] !== undefined;
                  const isMarked = markedForReview.has(questionId);
                  const isChecked = checkedQuestions.has(questionId);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={questionId}
                      onClick={() => goToQuestion(index)}
                      disabled={isPaused}
                      className={`p-3 rounded border-2 text-sm transition-all ${
                        isPaused 
                          ? 'opacity-50 cursor-not-allowed'
                          : isCurrent
                          ? 'border-blue-600 bg-blue-100 text-blue-800'
                          : !isAnswered
                          ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                          : isMarked
                          ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                          : 'border-green-300 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <div className="font-semibold">
                        Pregunta {index + 1}
                      </div>
                      <div className="flex justify-center gap-1 mt-1">
                        {!isAnswered && (
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                        {isMarked && (
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        )}
                        {isChecked && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowSummary(false)}
                disabled={isPaused}
                className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Continuar Examen
              </button>
              <button
                onClick={handleRequestFinish}
                disabled={isPaused}
                className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Finalizar Examen
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Modal de pausa (solo en modo práctica)
  if (isPaused && canPause) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zM9 8a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('exam.pausedTitle')}</h2>
          <p className="text-gray-600 mb-6">
            {t('exam.pausedText')}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p>{t('exam.currentQuestion')}: {currentQuestionIndex + 1}/{exam.questions.length}</p>
              <p>{t('exam.timeLeft')}: {formatTime(timeLeft)}</p>
              <p>{t('exam.answered')}: {Object.keys(answers).length}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleExitExam}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {t('exam.exitExamButton')}
            </button>
            <button
              onClick={handleTogglePause}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista del examen en progreso
  if (!exam || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-blue-700 font-medium">{t('exam.loadingQuestion')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <SEOHead
      pageType="exam"
      title={examSeoTitle}
      description={examSeoDesc}
      provider={examProviderName}
      certification={examCertName}
      certificationCode={examCertCode}
      noIndex={true}
    />
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header con información del examen */}
      <header className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-blue-700">{nombreCertificacion}</h1>
            <div className="flex items-center gap-4 text-sm">
              <p className="text-gray-600">
                Pregunta {currentQuestionIndex + 1} de {exam.questions.length}
              </p>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                examMode === 'realistic' 
                  ? 'bg-red-100 text-red-700' 
                  : examMode === 'failed_questions'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {examMode === 'realistic' ? t('examModes.label.realistic') : 
                 examMode === 'failed_questions' ? t('examModes.label.failed_questions') : 
                 t('examModes.label.practice')}
              </span>
              
              {/* Información adicional para preguntas fallidas */}
              {isFailedQuestionsMode && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  {t('exam.focusImprove')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Progreso */}
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {Math.round(((currentQuestionIndex + 1) / exam.questions.length) * 100)}%
              </span>
            </div>

            {/* Tiempo */}
            <div className={`text-lg font-bold ${getTimeColor()}`}>
              {formatTime(timeLeft)} {isPaused && `(${t('common.paused')})`}
            </div>

            {/* Respuestas */}
            <div className="text-sm text-gray-600">
              {t('exam.answered')}: {Object.keys(answers).length}/{exam.questions.length}
            </div>

            {/* Botones de control */}
            <div className="flex gap-2">
              {/* Pausar/reanudar (solo en modo práctica) */}
              {canPause && (
                <button
                  onClick={handleTogglePause}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    isPaused 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {isPaused ? t('common.resume') : t('common.pause')}
                </button>
              )}

              <LanguageSwitcher />
              {/* Botón de resumen */}
              <button
                onClick={handleShowSummary}
                disabled={isPaused}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
              >
                {t('exam.viewSummary')}
              </button>

              {/* Botón de salir */}
              <button
                onClick={handleExitExam}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex justify-center items-start px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
          {/* Barra de estado de la pregunta actual */}
          <div className="flex justify-between items-center mb-6 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{t('exam.status')}:</span>
              {answers[currentQuestion.id] !== undefined ? (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">{t('exam.statusAnswered')}</span>
              ) : (
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm">{t('exam.statusUnanswered')}</span>
              )}
              
              {markedForReview.has(currentQuestion.id) && (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">{t('common.marked')}</span>
              )}
              
              {checkedQuestions.has(currentQuestion.id) && canShowVerification && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">{t('common.verified')}</span>
              )}
            </div>

            <div className="flex gap-2">
              {/* Botón marcar para revisar */}
              <button
                onClick={toggleMarkForReview}
                disabled={isPaused}
                className={`px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 ${
                  markedForReview.has(currentQuestion.id)
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {markedForReview.has(currentQuestion.id) ? 'Desmarca' : 'Marcar'}
              </button>

              {/* Botón verificar respuesta (solo en modo práctica) */}
              {canShowVerification && (
                <button
                  onClick={handleCheckAnswer}
                  disabled={checkedQuestions.has(currentQuestion.id) || isPaused}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    checkedQuestions.has(currentQuestion.id) || isPaused
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {checkedQuestions.has(currentQuestion.id) ? 'Verificada' : 'Verificar'}
                </button>
              )}
            </div>
          </div>

          {/* Pregunta */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 leading-relaxed">
              {currentQuestion.text}
            </h2>
            
            {/* Metadatos de la pregunta (solo en modo práctica) */}
            {canShowQuestionMetadata && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {currentQuestion.category}
                </span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {currentQuestion.difficulty}
                </span>
                {(currentQuestion.isMultipleChoice || currentQuestion.questionType === 'multiple_answer') && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    {t('exam.questionTypeMultiple', { count: currentQuestion.expectedAnswers })}
                  </span>
                )}
                {(currentQuestion.questionType === 'fill_in_the_blank' || currentQuestion.questionType === 'fill_in_the_gap') && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{t('exam.questionTypeFill')}</span>
                )}
                {currentQuestion.questionType === 'drag_and_drop' && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">{t('exam.questionTypeDrag')}</span>
                )}
                {currentQuestion.questionType === 'checkbox' && (
                  <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded">{t('exam.questionTypeCheckbox')}</span>
                )}
              </div>
            )}

          {/* Instrucciones según tipo de pregunta */}
          {(currentQuestion.isMultipleChoice || currentQuestion.questionType === 'multiple_answer') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {t('exam.selectMultiple', { count: currentQuestion.expectedAnswers, selected: getSelectedCount() })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input de respuesta (varía por questionType) */}
          {renderQuestionInput()}

          {/* {t('exam.explanation')} de la respuesta (solo en modo práctica) */}
          {showExplanation[currentQuestion.id] && canShowVerification && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800 mb-2">{t('exam.explanation')}</h4>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    {showExplanation[currentQuestion.id].explanation}
                  </p>
                  
                  {/* Estado de la respuesta del usuario */}
                  <div className="mt-3 p-2 rounded text-sm">
                    {isAnswerCorrect(currentQuestion.id) ? (
                      <div className="text-green-700 bg-green-100 p-2 rounded">
                        Correcto! Tu respuesta es correcta.
                      </div>
                    ) : (
                      <div className="text-red-700 bg-red-100 p-2 rounded">
                        {t('exam.answerIncorrect')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Indicador de progreso para pregunta múltiple */}
          {(currentQuestion.isMultipleChoice || currentQuestion.questionType === 'multiple_answer') && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>{t('exam.progressAnswers')}</span>
                <span>{getSelectedCount()}/{currentQuestion.expectedAnswers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    getSelectedCount() === currentQuestion.expectedAnswers 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${(getSelectedCount() / currentQuestion.expectedAnswers) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="flex justify-between items-center">
            <button
              className={`px-6 py-3 rounded font-medium transition-colors ${
                currentQuestionIndex > 0 && !isPaused
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isPaused}
            >
              Anterior
            </button>

            <div className="flex gap-3">
              {/* Botón finalizar examen (disponible desde cualquier pregunta) */}
              <button
                className="px-6 py-3 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                onClick={handleRequestFinish}
                disabled={isPaused}
              >
                Finalizar Examen
              </button>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <button
                  className="px-8 py-3 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  onClick={handleCompleteExam}
                  disabled={isPaused}
                >
                  Enviar Examen
                </button>
              ) : (
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  onClick={handleNextQuestion}
                  disabled={isPaused}
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>

          {/* Advertencia para preguntas incompletas */}
          {(currentQuestion.isMultipleChoice || currentQuestion.questionType === 'multiple_answer') && getSelectedCount() < currentQuestion.expectedAnswers && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
              {t('exam.selectMore', { count: currentQuestion.expectedAnswers - getSelectedCount() })}
            </div>
          )}

          {/* Advertencia de tiempo */}
          {timeLeft < 300 && timeLeft > 0 && !isPaused && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
              {t('exam.timeLow')}
            </div>
          )}

          {/* Advertencia de modo realista */}
          {examMode === 'realistic' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              <strong>{t('examModes.label.realistic')}:</strong> {t('exam.realisticWarning')}
            </div>
          )}

          {/* Información adicional para preguntas fallidas */}
          {isFailedQuestionsMode && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
              <strong>{t('examModes.label.failed_questions')}:</strong> {t('exam.failedModeInfo')}
            </div>
          )}
        </div>
      </main>

      {/* Modal de salida */}
      {showExitModal && (
        <ExamExitModal
          exam={exam}
          answers={answers}
          timeLeft={timeLeft}
          examMode={examMode}
          onConfirmExit={handleConfirmExit}
          onCancel={() => setShowExitModal(false)}
          onSaveAndExit={handleSaveAndExit}
        />
      )}

      {/* Modal de revisión con datos del estado */}
      {showReview && reviewData && (
        <ExamReview
          examId={exam.id}
          examData={reviewData}
          onClose={() => {
            console.log('Cerrando modal de revisión');
            setShowReview(false);
            setReviewData(null);
          }}
        />
      )}
    </div>
    </>
  );
}