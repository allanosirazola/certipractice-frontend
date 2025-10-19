// src/services/api.js - Updated for PostgreSQL backend (Fixed)
import config from '../config/config.js';

const API_BASE_URL = config.API_URL;

// Utility function for session management
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem(config.STORAGE_KEYS.anonymousSession);
  if (!sessionId) {
    sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(config.STORAGE_KEYS.anonymousSession, sessionId);
  }
  return sessionId;
};

// Utility function for auth token
const getAuthToken = () => {
  return localStorage.getItem(config.STORAGE_KEYS.authToken);
};

// Handle API responses consistently
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// Utility function for making API requests with timeout
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const sessionId = getOrCreateSessionId();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.API_TIMEOUT);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      'X-Session-ID': sessionId,
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  };

  try {
    if (config.DEBUG) {
      console.log(`API Request: ${defaultOptions.method || 'GET'} ${url}`);
    }
    
    const response = await fetch(url, defaultOptions);
    clearTimeout(timeoutId);
    
    const data = await handleResponse(response);
    
    if (config.DEBUG) {
      console.log(`API Response (${response.status}):`, data);
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (config.DEBUG) {
      console.error(`API Error for ${url}:`, error);
    }
    
    // Enhanced error handling
    if (error.name === 'AbortError') {
      const timeoutError = new Error('La solicitud tardó demasiado tiempo. Verifica tu conexión.');
      timeoutError.status = 408;
      timeoutError.isTimeoutError = true;
      throw timeoutError;
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    
    throw error;
  }
};

// Health check function - Updated for new backend structure
export const checkBackendHealth = async () => {
  try {
    const response = await apiRequest('/questions/health');
    return {
      available: true,
      status: response.data?.status || 'healthy',
      serverTime: response.data?.serverTime,
      database: response.data?.database,
      version: response.data?.postgresVersion
    };
  } catch (error) {
    if (config.DEBUG) {
      console.error('Backend health check failed:', error);
    }
    
    return {
      available: false,
      status: 'unhealthy',
      error: error.message,
      isNetworkError: error.isNetworkError,
      isTimeoutError: error.isTimeoutError
    };
  }
};

// Question API - Updated for PostgreSQL backend
export const questionAPI = {
  // Get all questions with filters and pagination
  getQuestions: async (filters = {}) => {
    const searchParams = new URLSearchParams();
    
    // Add pagination
    searchParams.append('page', filters.page || 1);
    searchParams.append('limit', filters.limit || 20);
    
    // Add filters - mapping from frontend to backend parameter names
    if (filters.provider) searchParams.append('provider', filters.provider);
    if (filters.certification) searchParams.append('certification', filters.certification);
    if (filters.category) searchParams.append('category', filters.category);
    if (filters.topic) searchParams.append('topic', filters.topic);
    if (filters.difficulty) searchParams.append('difficulty', filters.difficulty);
    if (filters.questionType) searchParams.append('questionType', filters.questionType);
    if (filters.search) searchParams.append('search', filters.search);
    if (filters.includeStats) searchParams.append('includeStats', filters.includeStats);

    return await apiRequest(`/questions?${searchParams.toString()}`);
  },

  // Get a specific question by ID
  getQuestion: async (id, includeAnswers = false, includeStats = false) => {
    const searchParams = new URLSearchParams();
    if (includeAnswers) searchParams.append('includeAnswers', 'true');
    if (includeStats) searchParams.append('includeStats', 'true');
    
    const query = searchParams.toString();
    return await apiRequest(`/questions/${id}${query ? `?${query}` : ''}`);
  },

  // Get question metadata only
  getQuestionMetadata: async (id) => {
    return await apiRequest(`/questions/${id}/metadata`);
  },

  // Get question details for checking answers
  getQuestionDetails: async (questionId) => {
    return await apiRequest(`/questions/${questionId}`, {
      headers: {
        'X-Include-Answers': 'true'
      }
    });
  },

  // Get random questions for exam
  getRandomQuestions: async (count = 20, filters = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.append('count', count);
    
    if (filters.provider) searchParams.append('provider', filters.provider);
    if (filters.certification) searchParams.append('certification', filters.certification);
    if (filters.category) searchParams.append('category', filters.category);
    if (filters.difficulty) searchParams.append('difficulty', filters.difficulty);
    if (filters.questionType) searchParams.append('questionType', filters.questionType);

    return await apiRequest(`/questions/random?${searchParams.toString()}`);
  },

  // Check answer for a question
  checkAnswer: async (questionId, answer, timeSpent = null) => {
    const payload = { answer };
    if (timeSpent) payload.timeSpent = timeSpent;
    
    return await apiRequest(`/questions/${questionId}/check`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Validate question format
  validateQuestion: async (questionData) => {
    return await apiRequest('/questions/validate', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  },

  // Get providers - Updated to handle new PostgreSQL structure
  getProviders: async () => {
    return await apiRequest('/questions/providers');
  },

  // Get certifications - Updated to handle new PostgreSQL structure
  getCertifications: async (provider = null) => {
    const searchParams = new URLSearchParams();
    if (provider) searchParams.append('provider', provider);
    
    return await apiRequest(`/questions/certifications${provider ? `?${searchParams.toString()}` : ''}`);
  },

  // Get categories/topics - Updated to handle new PostgreSQL structure
  getCategories: async (certification = null) => {
    const searchParams = new URLSearchParams();
    if (certification) searchParams.append('certification', certification);
    
    return await apiRequest(`/questions/categories${certification ? `?${searchParams.toString()}` : ''}`);
  },

  // Get question types
  getQuestionTypes: async () => {
    return await apiRequest('/questions/types');
  },

  // Get question statistics
  getQuestionTypeStats: async () => {
    return await apiRequest('/questions/stats/types');
  },

  // Get questions by difficulty
  getQuestionsByDifficulty: async (difficulty, limit = 10) => {
    return await apiRequest(`/questions/difficulty/${difficulty}?limit=${limit}`);
  },

  // Search questions
  searchQuestions: async (searchTerm, filters = {}) => {
    return await questionAPI.getQuestions({
      ...filters,
      search: searchTerm
    });
  },

  // Admin functions
  admin: {
    // Create question
    createQuestion: async (questionData) => {
      return await apiRequest('/questions', {
        method: 'POST',
        body: JSON.stringify(questionData),
      });
    },

    // Update question
    updateQuestion: async (id, questionData) => {
      return await apiRequest(`/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(questionData),
      });
    },

    // Delete question
    deleteQuestion: async (id) => {
      return await apiRequest(`/questions/${id}`, {
        method: 'DELETE',
      });
    },

    // Get questions for review
    getQuestionsForReview: async (status = 'pending', limit = 50) => {
      return await apiRequest(`/questions/admin/review?status=${status}&limit=${limit}`);
    },

    // Approve question
    approveQuestion: async (id) => {
      return await apiRequest(`/questions/${id}/approve`, {
        method: 'POST',
      });
    },

    // Reject question
    rejectQuestion: async (id, reason) => {
      return await apiRequest(`/questions/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    // Create sample data
    createSampleData: async () => {
      return await apiRequest('/questions/admin/sample-data', {
        method: 'POST',
      });
    }
  }
};

// Exam API - Enhanced for PostgreSQL backend
export const examAPI = {
  // Create exam with minimal data
  createExam: async (examConfig) => {
    if (config.DEBUG) {
      console.log('Creating exam with simplified config:', examConfig);
    }
    
    // Transform frontend config to simplified backend format
    const backendConfig = {
      // REQUIRED MINIMAL FIELDS
      provider: examConfig.provider,
      certification: examConfig.certification,
      
      // OPTIONAL FIELDS
      mode: examConfig.mode || 'practice',
      questionCount: examConfig.questionCount,
      timeLimit: examConfig.timeLimit,
      difficulty: examConfig.difficulty,
      category: examConfig.category,
      
      // EXAM SETTINGS
      settings: {
        randomizeQuestions: examConfig.settings?.randomizeQuestions !== false,
        randomizeAnswers: examConfig.settings?.randomizeAnswers === true,
        showExplanations: examConfig.settings?.showExplanations !== false,
        allowPause: examConfig.mode === 'practice',
        allowReview: examConfig.mode === 'practice'
      }
    };

    // Minimal validation on frontend
    if (!backendConfig.provider) {
      throw new Error('Provider is required');
    }
    
    if (!backendConfig.certification) {
      throw new Error('Certification is required');
    }

    console.log('Sending to backend:', backendConfig);

    return await apiRequest('/exams', {
      method: 'POST',
      body: JSON.stringify(backendConfig),
    });
  },

  // Helper method to create config from user selection
  createConfigFromSelection: (provider, certification, mode = 'practice', options = {}) => {
    return {
      provider: provider.name || provider,
      certification: certification.code || certification.name || certification,
      mode: mode,
      questionCount: options.questionCount,
      timeLimit: options.timeLimit,
      difficulty: options.difficulty,
      category: options.category,
      settings: options.settings || {}
    };
  },

  // Get user exams (works for authenticated and anonymous users)
  getUserExams: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.provider) params.append('provider', filters.provider);
    
    const queryString = params.toString();
    const endpoint = `/exams${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  },

  // Get specific exam
  getExam: async (examId) => {
    return await apiRequest(`/exams/${examId}`);
  },

  // Get exam for review (includes correct answers)
  getExamForReview: async (examId) => {
    return await apiRequest(`/exams/${examId}/review`);
  },

  // Start an exam
  startExam: async (id) => {
    return await apiRequest(`/exams/${id}/start`, {
      method: 'POST',
    });
  },

  // Submit answer for a question
  submitAnswer: async (examId, questionId, answer) => {
    return await apiRequest(`/exams/${examId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    });
  },

  // Complete an exam
  completeExam: async (examId) => {
    return await apiRequest(`/exams/${examId}/complete`, {
      method: 'POST',
    });
  },

  // Pause an exam (only for practice mode)
  pauseExam: async (examId, pauseData = {}) => {
    return await apiRequest(`/exams/${examId}/pause`, {
      method: 'POST',
      body: JSON.stringify(pauseData),
    });
  },

  // Resume an exam
  resumeExam: async (examId) => {
    return await apiRequest(`/exams/${examId}/resume`, {
      method: 'POST',
    });
  },

  // Cancel an exam
  cancelExam: async (examId) => {
    return await apiRequest(`/exams/${examId}/cancel`, {
      method: 'POST',
    });
  },

  // Get exam results
  getResults: async (examId) => {
    return await apiRequest(`/exams/${examId}/results`);
  },

  // Get exam progress
  getProgress: async (examId) => {
    return await apiRequest(`/exams/${examId}/progress`);
  },

  // Get exam statistics
  getStatistics: async (examId) => {
    return await apiRequest(`/exams/${examId}/statistics`);
  },

  // Validate answer before submission
  validateAnswer: async (examId, questionId, answer) => {
    return await apiRequest(`/exams/${examId}/validate-answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    });
  },
   // Crear examen de preguntas fallidas
  createFailedQuestionsExam: async (examConfig) => {
    console.log('Creando examen de preguntas fallidas:', examConfig);
    
    const backendConfig = {
      // REQUIRED MINIMAL FIELDS
      provider: examConfig.provider,
      certification: examConfig.certification,
      
      // FAILED QUESTIONS SPECIFIC
      mode: 'failed_questions',
      questionSource: 'failed_questions',
      
      // OPTIONAL FIELDS
      questionCount: examConfig.questionCount,
      timeLimit: examConfig.timeLimit,
      difficulty: examConfig.difficulty,
      category: examConfig.category,
      
      // EXAM SETTINGS
      settings: {
        randomizeQuestions: examConfig.settings?.randomizeQuestions !== false,
        randomizeAnswers: examConfig.settings?.randomizeAnswers === true,
        showExplanations: examConfig.settings?.showExplanations !== false,
        allowPause: true, // Always allow pause for failed questions mode
        allowReview: true,
        failedQuestionsOnly: true
      }
    };

    // Validation
    if (!backendConfig.provider) {
      throw new Error('Provider is required');
    }
    
    if (!backendConfig.certification) {
      throw new Error('Certification is required');
    }

    console.log('Sending failed questions exam config to backend:', backendConfig);

    return await apiRequest('/exams/failed-questions', {
      method: 'POST',
      body: JSON.stringify(backendConfig),
    });
  },
  // Delete exam
  deleteExam: async (id) => {
    return await apiRequest(`/exams/${id}`, {
      method: 'DELETE',
    });
  }
};

// Auth API - Enhanced
export const authAPI = {
  // Register
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store auth token and clear anonymous session
    if (response.data?.token) {
      localStorage.setItem(config.STORAGE_KEYS.authToken, response.data.token);
      localStorage.removeItem(config.STORAGE_KEYS.anonymousSession);
    }
    
    return response;
  },

  // Login
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store auth token and clear anonymous session
    if (response.data?.token) {
      localStorage.setItem(config.STORAGE_KEYS.authToken, response.data.token);
      localStorage.removeItem(config.STORAGE_KEYS.anonymousSession);
    }
    
    return response;
  },

  // Logout
  logout: async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      if (config.DEBUG) {
        console.warn('Logout request failed:', error);
      }
    } finally {
      // Always clear local storage
      localStorage.removeItem(config.STORAGE_KEYS.authToken);
      sessionStorage.removeItem(config.STORAGE_KEYS.authToken);
    }
  },

  // Get current user profile
  getProfile: async () => {
    return await apiRequest('/auth/profile');
  },

  // Update user profile
  updateProfile: async (userData) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await apiRequest('/auth/verify');
      return response;
    } catch (error) {
      // If token verification fails, remove it
      localStorage.removeItem(config.STORAGE_KEYS.authToken);
      sessionStorage.removeItem(config.STORAGE_KEYS.authToken);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    return await apiRequest('/auth/refresh', {
      method: 'POST',
    });
  },

  // Delete account
  deleteAccount: async (password) => {
    return await apiRequest('/auth/delete', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // Validate email
  validateEmail: async (token) => {
    return await apiRequest(`/auth/validate/${token}`, {
      method: 'POST',
    });
  }
};

// User API - Enhanced
export const userAPI = {
  // Get user statistics
  getStats: async () => {
    return await apiRequest('/users/stats');
  },

  // Get user progress
  getProgress: async (certificationId = null) => {
    const params = certificationId ? `?certificationId=${certificationId}` : '';
    return await apiRequest(`/users/progress${params}`);
  },

  // Get user bookmarks
  getBookmarks: async () => {
    return await apiRequest('/users/bookmarks');
  },

  // Get user error responses
  getErrorResponses: async (limit = 20) => {
    return await apiRequest(`/users/error-responses?limit=${limit}`);
  },

  // Get user activity
  getActivity: async (limit = 50) => {
    return await apiRequest(`/users/activity?limit=${limit}`);
  },
    
  getFailedQuestions: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.provider) params.append('provider', filters.provider);
        if (filters.certification) params.append('certification', filters.certification);
        if (filters.category) params.append('category', filters.category);
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.limit) params.append('limit', filters.limit);
        
        return await apiRequest(`/users/failed-questions?${params.toString()}`);
      },

    // Obtener estadísticas de preguntas fallidas
    getFailedQuestionsStats: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.certification) params.append('certification', filters.certification);
      
      return await apiRequest(`/users/failed-questions/stats?${params.toString()}`);
    },
  // Admin functions
  admin: {
    // Get all users
    getAllUsers: async (options = {}) => {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options.role) params.append('role', options.role);
      if (options.isActive !== undefined) params.append('isActive', options.isActive);
      if (options.search) params.append('search', options.search);
      
      return await apiRequest(`/users/admin?${params.toString()}`);
    },

    // Get user by ID
    getUserById: async (id) => {
      return await apiRequest(`/users/${id}`);
    },

    // Update user role
    updateUserRole: async (id, role) => {
      return await apiRequest(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
    },

    // Activate user
    activateUser: async (id) => {
      return await apiRequest(`/users/${id}/activate`, {
        method: 'POST',
      });
    },

    // Deactivate user
    deactivateUser: async (id) => {
      return await apiRequest(`/users/${id}/deactivate`, {
        method: 'POST',
      });
    },

    // Reset user password
    resetUserPassword: async (id, newPassword) => {
      return await apiRequest(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    },

  // Marcar pregunta como fallida (esto se haría automáticamente al responder mal)
  markQuestionAsFailed: async (questionId, examId = null) => {
    return await apiRequest('/users/failed-questions', {
      method: 'POST',
      body: JSON.stringify({ questionId, examId }),
    });
  },

  // Quitar pregunta de la lista de fallidas (cuando se responda correctamente varias veces seguidas)
  removeFromFailedQuestions: async (questionId) => {
    return await apiRequest(`/users/failed-questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  // Obtener progreso en preguntas fallidas (cuántas se han mejorado)
  getFailedQuestionsProgress: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.certification) params.append('certification', filters.certification);
    if (filters.timeframe) params.append('timeframe', filters.timeframe); // week, month, all
    
    return await apiRequest(`/users/failed-questions/progress?${params.toString()}`);
  },

  // Obtener recomendaciones de estudio basadas en preguntas fallidas
  getStudyRecommendations: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.certification) params.append('certification', filters.certification);
    
    return await apiRequest(`/users/study-recommendations?${params.toString()}`);
  },

    // Get users by role
    getUsersByRole: async (role) => {
      return await apiRequest(`/users/role/${role}`);
    }
  }
};

// Analytics API
export const analyticsAPI = {
  // Get user progress
  getUserProgress: async () => {
    return await apiRequest('/analytics/progress');
  },

  // Get user statistics
  getUserStats: async () => {
    return await apiRequest('/analytics/stats');
  },

  // Get learning recommendations
  getRecommendations: async () => {
    return await apiRequest('/analytics/recommendations');
  },

  // Track user activity
  trackActivity: async (activityData) => {
    return await apiRequest('/analytics/activity', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }
};

// Stats API - Enhanced
export const statsAPI = {
  // Get global statistics
  getGlobalStats: async () => {
    return await apiRequest('/stats/global');
  },

  // Get question statistics (admin only)
  getQuestionStats: async () => {
    return await apiRequest('/stats/questions');
  }
};

// Utility functions
export const utils = {
  // Generate anonymous session ID
  generateSessionId: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  },

  // Get or create session ID for anonymous users
  getSessionId: () => {
    return getOrCreateSessionId();
  },

  // Clear session data
  clearSession: () => {
    localStorage.removeItem(config.STORAGE_KEYS.anonymousSession);
    localStorage.removeItem(config.STORAGE_KEYS.authToken);
    sessionStorage.removeItem(config.STORAGE_KEYS.authToken);
  },

  // Clear anonymous session (useful when logging in)
  clearAnonymousSession: () => {
    localStorage.removeItem(config.STORAGE_KEYS.anonymousSession);
  },

  // Check if user has anonymous session
  hasAnonymousSession: () => {
    return !!localStorage.getItem(config.STORAGE_KEYS.anonymousSession);
  },

  // Format API errors for display
  formatApiError: (error) => {
    if (error.isNetworkError) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
    
    if (error.isTimeoutError) {
      return 'La solicitud tardó demasiado tiempo. Intenta nuevamente.';
    }
    
    if (error.status === 401) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    
    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    
    if (error.status === 404) {
      return 'El recurso solicitado no fue encontrado.';
    }
    
    if (error.status === 429) {
      return 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar nuevamente.';
    }
    
    if (error.status >= 500) {
      return 'Error interno del servidor. Por favor, intenta más tarde.';
    }
    
    return error.message || 'Ha ocurrido un error inesperado.';
  },

  // Retry API request with exponential backoff
  retryRequest: async (requestFn, maxRetries = config.API_RETRY_ATTEMPTS, baseDelay = config.API_RETRY_DELAY) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries || error.status < 500) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        if (config.DEBUG) {
          console.log(`Retrying request in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

// Export default object with all APIs
export default {
  questionAPI,
  examAPI,
  authAPI,
  userAPI,
  analyticsAPI,
  statsAPI,
  checkBackendHealth,
  utils,
  config
};