// __mocks__/mockData.js - Datos mock para tests

export const mockUser = {
  id: 'user-123',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
};

export const mockQuestion = {
  id: 'q-001',
  text: '¿Cuál es la capital de España?',
  options: [
    { id: 1, text: 'Barcelona' },
    { id: 2, text: 'Madrid' },
    { id: 3, text: 'Valencia' },
    { id: 4, text: 'Sevilla' },
  ],
  category: 'Geografía',
  difficulty: 'easy',
  correctAnswer: 2,
  explanation: 'Madrid es la capital de España desde 1561.',
};

export const mockMultipleChoiceQuestion = {
  id: 'q-002',
  text: '¿Cuáles de los siguientes son lenguajes de programación?',
  options: [
    { id: 1, text: 'Python' },
    { id: 2, text: 'HTML' },
    { id: 3, text: 'JavaScript' },
    { id: 4, text: 'CSS' },
  ],
  category: 'Programación',
  difficulty: 'medium',
  isMultipleChoice: true,
  correctAnswers: [1, 3],
  explanation: 'Python y JavaScript son lenguajes de programación.',
};

export const mockExam = {
  id: 'exam-123',
  title: 'AWS Solutions Architect Associate',
  provider: 'AWS',
  certification: 'SAA-C03',
  status: 'in_progress',
  mode: 'practice',
  currentQuestion: 0,
  totalQuestions: 65,
  timeLimit: 130,
  timeRemaining: 7800,
  questions: [mockQuestion],
  answers: {},
  createdAt: '2025-02-10T10:00:00Z',
  startedAt: '2025-02-10T10:05:00Z',
};

export const mockCompletedExam = {
  ...mockExam,
  id: 'exam-456',
  status: 'completed',
  score: 78,
  passed: true,
  correctAnswers: 51,
  incorrectAnswers: 14,
  timeSpent: 6500,
  completedAt: '2025-02-10T12:00:00Z',
};

export const mockExamConfig = {
  title: 'AWS Solutions Architect Associate',
  provider: 'AWS',
  certification: 'SAA-C03',
  questionCount: 65,
  timeLimit: 130,
  passingScore: 72,
  mode: 'practice',
  settings: {
    randomizeQuestions: true,
    randomizeAnswers: false,
    showExplanations: true,
    allowPause: true,
    allowReview: true,
  },
};

export const mockResults = {
  examId: 'exam-456',
  score: 78,
  passed: true,
  totalQuestions: 65,
  correctAnswers: 51,
  incorrectAnswers: 14,
  timeSpent: 6500,
  passingScore: 72,
  questionResults: [
    {
      questionId: 'q-001',
      question: mockQuestion,
      userAnswer: 2,
      correctAnswer: 2,
      isCorrect: true,
      explanation: 'Madrid es la capital de España.',
    },
    {
      questionId: 'q-002',
      question: { ...mockQuestion, id: 'q-002', text: 'Pregunta 2' },
      userAnswer: 1,
      correctAnswer: 3,
      isCorrect: false,
      explanation: 'La respuesta correcta era la opción 3.',
    },
  ],
};

export const mockFailedQuestions = [
  {
    id: 'fq-001',
    questionId: 'q-002',
    text: 'Pregunta fallida 1 - ¿Cuál es la mejor práctica para configurar VPCs en AWS?',
    category: 'Networking',
    difficulty: 'hard',
    failedCount: 3,
    lastFailedAt: '2025-02-09T15:00:00Z',
  },
  {
    id: 'fq-002',
    questionId: 'q-003',
    text: 'Pregunta fallida 2 - ¿Qué servicio de AWS se usa para gestionar identidades?',
    category: 'Security',
    difficulty: 'medium',
    failedCount: 2,
    lastFailedAt: '2025-02-08T10:00:00Z',
  },
  {
    id: 'fq-003',
    questionId: 'q-004',
    text: 'Pregunta fallida 3 - ¿Cuál es la diferencia entre EC2 y Lambda?',
    category: 'Compute',
    difficulty: 'easy',
    failedCount: 1,
    lastFailedAt: '2025-02-07T12:00:00Z',
  },
  {
    id: 'fq-004',
    questionId: 'q-005',
    text: 'Pregunta fallida 4 - ¿Qué tipo de almacenamiento ofrece S3?',
    category: 'Storage',
    difficulty: 'medium',
    failedCount: 2,
    lastFailedAt: '2025-02-06T14:00:00Z',
  },
  {
    id: 'fq-005',
    questionId: 'q-006',
    text: 'Pregunta fallida 5 - ¿Cuándo usar RDS vs DynamoDB?',
    category: 'Database',
    difficulty: 'hard',
    failedCount: 4,
    lastFailedAt: '2025-02-05T09:00:00Z',
  },
];

export const mockFailedQuestionsStats = {
  totalFailed: 5,
  recentlyFailed: 3,
  improved: 2,
  improvementRate: 15,
  byCategory: {
    Networking: 1,
    Security: 1,
    Compute: 1,
    Storage: 1,
    Database: 1,
  },
  byDifficulty: {
    easy: 1,
    medium: 2,
    hard: 2,
  },
};

export const mockProvider = {
  name: 'AWS',
  description: 'Amazon Web Services',
  question_count: 500,
  certificationCount: 5,
};

export const mockCertification = {
  id: 'SAA-C03',
  name: 'Solutions Architect Associate',
  code: 'SAA-C03',
  total_questions: 65,
  duration_minutes: 130,
  passing_score: 72,
  difficulty_level: 'medium',
};

export const mockBackendHealth = {
  available: true,
  version: 'PostgreSQL 15.2',
};

export const mockReportTypes = [
  { id: 'incorrect_answer', label: 'Respuesta incorrecta marcada como correcta' },
  { id: 'typo', label: 'Error tipográfico' },
  { id: 'outdated', label: 'Información desactualizada' },
  { id: 'unclear', label: 'Pregunta poco clara' },
  { id: 'duplicate', label: 'Pregunta duplicada' },
  { id: 'wrong_category', label: 'Categoría incorrecta' },
  { id: 'wrong_difficulty', label: 'Dificultad incorrecta' },
  { id: 'other', label: 'Otro problema' },
];
