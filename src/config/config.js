// src/config/config.js - Configuración centralizada
const config = {
  // API Configuration
  API_URL: import.meta.env?.VITE_API_URL || 
           window.ENV?.API_URL || 
           'https://certipractice-backend-production.up.railway.app',
  
  // Environment
  NODE_ENV: import.meta.env?.MODE || 
            window.ENV?.NODE_ENV || 
            'development',
  
  // App Configuration
  APP_NAME: 'CertiPractice',
  APP_VERSION: '1.0.0',
  
  // Default Settings
  DEFAULT_EXAM_SETTINGS: {
    questionCount: 20,
    timeLimit: 60,
    passingScore: 70,
    mode: 'practice'
  },
  
  // Session Configuration
  SESSION_STORAGE_KEY: 'certipractice_session',
  AUTH_TOKEN_KEY: 'authToken',
  ANONYMOUS_SESSION_KEY: 'anonymousSessionId',
  
  // API Timeouts (in milliseconds)
  API_TIMEOUT: 30000,
  API_RETRY_ATTEMPTS: 3,
  API_RETRY_DELAY: 1000,
  
  // Local Storage Keys
  STORAGE_KEYS: {
    authToken: 'authToken',
    anonymousSession: 'anonymousSessionId',
    userPreferences: 'userPreferences',
    examDrafts: 'examDrafts'
  },
  
  // Development flags
  DEBUG: import.meta.env?.MODE === 'development' || 
         window.ENV?.NODE_ENV === 'development',
  
  // Feature flags
  FEATURES: {
    enableOfflineMode: false,
    enableAdvancedAnalytics: true,
    enableExamHistory: true,
    enableBookmarks: true
  }
};

// Validación de configuración en desarrollo
if (config.DEBUG) {
  // Verificar que la URL de la API sea válida
  try {
    new URL(config.API_URL);
  } catch (error) {
  }
}

export default config;