import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, verify any stored token
  useEffect(() => {
    let cancelled = false;
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    authApi.verify()
      .then((u) => { if (!cancelled) setUser(u); })
      .catch(() => { if (!cancelled) { tokenStore.clear(); setUser(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const u = await authApi.login(email, password);
      setUser(u);
      return u;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
