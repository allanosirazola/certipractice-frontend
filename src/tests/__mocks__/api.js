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

// ── Engagement: bookmarks + notes ─────────────────────────────────────
export const engagementAPI = {
  listBookmarks: vi.fn().mockResolvedValue({ success: true, data: { bookmarks: [], total: 0 } }),
  isBookmarked: vi.fn().mockResolvedValue({ success: true, data: { bookmarked: false } }),
  toggleBookmark: vi.fn().mockResolvedValue({ success: true, data: { bookmarked: true } }),
  removeBookmark: vi.fn().mockResolvedValue({ success: true, data: { removed: true } }),
  listNotes: vi.fn().mockResolvedValue({ success: true, data: { notes: [], total: 0 } }),
  getNote: vi.fn().mockResolvedValue({ success: true, data: { note: null } }),
  upsertNote: vi.fn().mockResolvedValue({ success: true, data: { note: { content: '' } } }),
  deleteNote: vi.fn().mockResolvedValue({ success: true, data: { deleted: true } }),
};

// ── Search ─────────────────────────────────────────────────────────────
export const searchAPI = {
  searchQuestions: vi.fn().mockResolvedValue({ success: true, data: { results: [] } }),
  suggest: vi.fn().mockResolvedValue({ success: true, data: { suggestions: [] } }),
};

// ── Progress: streaks + readiness ─────────────────────────────────────
export const progressAPI = {
  getStreak: vi.fn().mockResolvedValue({
    success: true,
    data: { current: 0, best: 0, lastActiveDate: null },
  }),
  getReadiness: vi.fn().mockResolvedValue({
    success: true,
    data: { score: null, samples: 0, minSamples: 20, advice: [] },
  }),
};

// ── Reviews: SM-2 spaced repetition ───────────────────────────────────
export const reviewsAPI = {
  getDue: vi.fn().mockResolvedValue({
    success: true,
    data: { items: [], total: 0 },
  }),
  getStats: vi.fn().mockResolvedValue({
    success: true,
    data: { totalCards: 0, dueNow: 0, reviewed24h: 0, averageEase: null, totalLapses: 0 },
  }),
  gradeReview: vi.fn().mockResolvedValue({
    success: true,
    data: { questionId: 'q1', lastQuality: 2 },
  }),
};

// ── Daily Quiz ────────────────────────────────────────────────────────
export const dailyQuizAPI = {
  getDaily: vi.fn().mockResolvedValue({
    success: true,
    data: { date: '2026-05-20', questions: [], completed: false, previousScore: null },
  }),
  getStatus: vi.fn().mockResolvedValue({
    success: true,
    data: { completed: false, authenticated: false },
  }),
  submit: vi.fn().mockResolvedValue({
    success: true,
    data: { score: 0, total: 5, alreadyCompleted: false },
  }),
};

// Función helper para resetear todos los mocks
export const resetAllMocks = () => {
  Object.values(examAPI).forEach(fn => fn.mockClear());
  Object.values(questionAPI).forEach(fn => fn.mockClear());
  Object.values(userAPI).forEach(fn => fn.mockClear());
  Object.values(reportAPI).forEach(fn => fn.mockClear());
  Object.values(engagementAPI).forEach(fn => fn.mockClear());
  Object.values(searchAPI).forEach(fn => fn.mockClear());
  Object.values(progressAPI).forEach(fn => fn.mockClear());
  Object.values(reviewsAPI).forEach(fn => fn.mockClear());
  Object.values(dailyQuizAPI).forEach(fn => fn.mockClear());
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
