// src/context/AuthContext.jsx - Updated for new backend structure (Fixed)
import React, { createContext, useContext, useState, useEffect } from 'react';
import config from '../config/config.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(config.STORAGE_KEYS.authToken));
  const [loading, setLoading] = useState(true);

  const API_URL = config.API_URL;

  // Verificar si hay un token al cargar la app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const savedToken = localStorage.getItem(config.STORAGE_KEYS.authToken);
    if (savedToken) {
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Backend returns user data in data property
          setUser(data.data || data);
          setToken(savedToken);
        } else {
          localStorage.removeItem(config.STORAGE_KEYS.authToken);
          setToken(null);
        }
      } catch (error) {
        if (config.DEBUG) {
          console.error('Error verificando autenticación:', error);
        }
        localStorage.removeItem(config.STORAGE_KEYS.authToken);
        setToken(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Backend structure: { success: true, data: { user, token } }
        const userData = data.data.user;
        const authToken = data.data.token;
        
        setUser(userData);
        setToken(authToken);
        localStorage.setItem(config.STORAGE_KEYS.authToken, authToken);
        
        // Clear anonymous session when logging in
        localStorage.removeItem(config.STORAGE_KEYS.anonymousSession);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: data.error || 'Error en el login' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error en login:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Backend structure: { success: true, data: { user, token } }
        const newUser = data.data.user;
        const authToken = data.data.token;
        
        setUser(newUser);
        setToken(authToken);
        localStorage.setItem(config.STORAGE_KEYS.authToken, authToken);
        
        // Clear anonymous session when registering
        localStorage.removeItem(config.STORAGE_KEYS.anonymousSession);
        
        return { success: true, user: newUser };
      } else {
        return { success: false, error: data.error || 'Error en el registro' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error en registro:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = async () => {
    try {
      // Notify server about logout
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      if (config.DEBUG) {
        console.warn('Error notifying server about logout:', error);
      }
    } finally {
      // Always clear local state
      setUser(null);
      setToken(null);
      localStorage.removeItem(config.STORAGE_KEYS.authToken);
      sessionStorage.removeItem(config.STORAGE_KEYS.authToken);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local user state with new data
        setUser(data.data);
        return { success: true, user: data.data };
      } else {
        return { success: false, error: data.error || 'Error actualizando perfil' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error actualizando perfil:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Contraseña actualizada correctamente' };
      } else {
        return { success: false, error: data.error || 'Error cambiando contraseña' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error cambiando contraseña:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const deleteAccount = async (password) => {
    try {
      const response = await fetch(`${API_URL}/auth/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Account deleted successfully, logout user
        await logout();
        return { success: true, message: data.message || 'Cuenta eliminada correctamente' };
      } else {
        return { success: false, error: data.error || 'Error eliminando cuenta' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error eliminando cuenta:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getUserStats = async () => {
    try {
      const response = await fetch(`${API_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, stats: data.data };
      } else {
        return { success: false, error: data.error || 'Error obteniendo estadísticas' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error obteniendo estadísticas:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getUserProgress = async (certificationId = null) => {
    try {
      const params = certificationId ? `?certificationId=${certificationId}` : '';
      const response = await fetch(`${API_URL}/users/progress${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, progress: data.data };
      } else {
        return { success: false, error: data.error || 'Error obteniendo progreso' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error obteniendo progreso:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newToken = data.data.token;
        const updatedUser = data.data.user;
        
        setToken(newToken);
        setUser(updatedUser);
        localStorage.setItem(config.STORAGE_KEYS.authToken, newToken);
        
        return { success: true, token: newToken, user: updatedUser };
      } else {
        // Token refresh failed, logout user
        await logout();
        return { success: false, error: data.error || 'Error refrescando token' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error refrescando token:', error);
      }
      await logout();
      return { success: false, error: 'Error de conexión' };
    }
  };

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, user: data.data };
      } else {
        // Token verification failed, logout user
        await logout();
        return { success: false, error: data.error || 'Token inválido' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error verificando token:', error);
      }
      await logout();
      return { success: false, error: 'Error de conexión' };
    }
  };

  const validateEmail = async (validationToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/validate/${validationToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update user state if currently logged in
        if (user) {
          setUser(data.data);
        }
        return { success: true, user: data.data, message: data.message };
      } else {
        return { success: false, error: data.error || 'Error validando email' };
      }
    } catch (error) {
      if (config.DEBUG) {
        console.error('Error validando email:', error);
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Interceptor for handling 401 responses globally
  const handleUnauthorized = async () => {
    if (config.DEBUG) {
      console.warn('Token expirado o inválido, cerrando sesión...');
    }
    await logout();
  };

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Handle 401 responses globally
      if (response.status === 401) {
        await handleUnauthorized();
        throw new Error('Token expirado');
      }

      return response;
    } catch (error) {
      if (error.message === 'Token expirado') {
        throw error;
      }
      if (config.DEBUG) {
        console.error('Error en petición autenticada:', error);
      }
      throw new Error('Error de conexión');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    getUserStats,
    getUserProgress,
    refreshToken,
    verifyToken,
    validateEmail,
    makeAuthenticatedRequest,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isInstructor: user?.role === 'instructor' || user?.role === 'admin',
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => roles.includes(user?.role)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};