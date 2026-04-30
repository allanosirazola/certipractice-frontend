// __mocks__/AuthContext.js - Mock del contexto de autenticación
import React, { createContext, useContext } from 'react';
import { mockUser } from './mockData';

// Estado por defecto - usuario autenticado
let mockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  loading: false,
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn(),
  register: vi.fn().mockResolvedValue({ success: true }),
};

// Crear el contexto
export const AuthContext = createContext(mockAuthState);

// Hook personalizado
export const useAuth = () => useContext(AuthContext);

// Provider para tests
export const AuthProvider = ({ children, value }) => {
  const authValue = value || mockAuthState;
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Funciones helper para modificar el estado del mock en tests
export const setMockAuthState = (newState) => {
  mockAuthState = { ...mockAuthState, ...newState };
};

export const setAuthenticated = (isAuthenticated) => {
  mockAuthState = {
    ...mockAuthState,
    isAuthenticated,
    user: isAuthenticated ? mockUser : null,
  };
};

export const setMockUser = (user) => {
  mockAuthState = {
    ...mockAuthState,
    user,
    isAuthenticated: !!user,
  };
};

export const setLoading = (loading) => {
  mockAuthState = {
    ...mockAuthState,
    loading,
  };
};

export const resetMockAuth = () => {
  mockAuthState = {
    user: mockUser,
    isAuthenticated: true,
    loading: false,
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    register: vi.fn().mockResolvedValue({ success: true }),
  };
};

// Estados predefinidos para tests
export const unauthenticatedState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn(),
  register: vi.fn().mockResolvedValue({ success: true }),
};

export const authenticatedState = {
  user: mockUser,
  isAuthenticated: true,
  loading: false,
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn(),
  register: vi.fn().mockResolvedValue({ success: true }),
};

export const loadingState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
};

export default {
  AuthContext,
  AuthProvider,
  useAuth,
  setMockAuthState,
  setAuthenticated,
  setMockUser,
  setLoading,
  resetMockAuth,
  unauthenticatedState,
  authenticatedState,
  loadingState,
};
