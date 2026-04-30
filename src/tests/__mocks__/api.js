// __mocks__/api.js - Mock de servicios de API

import {
  mockExam,
  mockCompletedExam,
  mockResults,
  mockQuestion,
  mockFailedQuestions,
  mockFailedQuestionsStats,
  mockProvider,
  mockCertification,
  mockBackendHealth,
} from './mockData';

export const examAPI = {
  createExam: vi.fn().mockResolvedValue({
    success: true,
    data: mockExam,
  }),
  
  createFailedQuestionsExam: vi.fn().mockResolvedValue({
    success: true,
    data: { ...mockExam, mode: 'failed_questions' },
  }),
  
  startExam: vi.fn().mockResolvedValue({
    success: true,
    data: mockExam,
  }),
  
  getExam: vi.fn().mockResolvedValue({
    success: true,
    data: mockExam,
  }),
  
  getExamForReview: vi.fn().mockResolvedValue({
    success: true,
    data: mockCompletedExam,
  }),
  
  getUserExams: vi.fn().mockResolvedValue({
    success: true,
    data: [mockExam, mockCompletedExam],
  }),
  
  submitAnswer: vi.fn().mockResolvedValue({
    success: true,
    data: { questionId: 'q-001', answer: 1 },
  }),
  
  completeExam: vi.fn().mockResolvedValue({
    success: true,
    data: mockCompletedExam,
  }),
  
  getResults: vi.fn().mockResolvedValue({
    success: true,
    data: mockResults,
  }),
  
  pauseExam: vi.fn().mockResolvedValue({
    success: true,
    data: { ...mockExam, status: 'paused' },
  }),
  
  cancelExam: vi.fn().mockResolvedValue({
    success: true,
    data: { message: 'Exam cancelled' },
  }),
  
  deleteExam: vi.fn().mockResolvedValue({
    success: true,
    data: { message: 'Exam deleted' },
  }),
};

export const questionAPI = {
  getProviders: vi.fn().mockResolvedValue({
    success: true,
    data: [mockProvider],
  }),
  
  getCertifications: vi.fn().mockResolvedValue({
    success: true,
    data: [mockCertification],
  }),
  
  getQuestion: vi.fn().mockResolvedValue({
    success: true,
    data: mockQuestion,
  }),
  
  getQuestionDetails: vi.fn().mockResolvedValue({
    success: true,
    data: {
      correctAnswer: 1,
      explanation: 'Madrid es la capital de España desde 1561.',
    },
  }),
};

export const userAPI = {
  getFailedQuestions: vi.fn().mockResolvedValue({
    success: true,
    data: mockFailedQuestions,
  }),
  
  getFailedQuestionsStats: vi.fn().mockResolvedValue({
    success: true,
    data: mockFailedQuestionsStats,
  }),
  
  getProfile: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'user-123', username: 'testuser' },
  }),
};

export const reportAPI = {
  submitReport: vi.fn().mockResolvedValue({
    success: true,
    data: { reportId: 'report-123', status: 'submitted' },
  }),
};

export const checkBackendHealth = vi.fn().mockResolvedValue(mockBackendHealth);

export const utils = {
  formatApiError: vi.fn()((error) => error?.message || 'Error desconocido'),
};

// Función helper para resetear todos los mocks
export const resetAllMocks = () => {
  Object.values(examAPI).forEach(fn => fn.mockClear());
  Object.values(questionAPI).forEach(fn => fn.mockClear());
  Object.values(userAPI).forEach(fn => fn.mockClear());
  Object.values(reportAPI).forEach(fn => fn.mockClear());
  checkBackendHealth.mockClear();
};

// Función helper para simular errores de API
export const mockApiError = (apiFunction, errorMessage = 'API Error') => {
  apiFunction.mockRejectedValueOnce(new Error(errorMessage));
};

// Función helper para simular respuestas fallidas
export const mockApiFailure = (apiFunction, errorMessage = 'Operation failed') => {
  apiFunction.mockResolvedValueOnce({
    success: false,
    error: errorMessage,
  });
};
