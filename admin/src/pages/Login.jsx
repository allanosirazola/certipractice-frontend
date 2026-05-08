import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/', { replace: true });
  }, [loading, isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center text-white font-bold">C</div>
            <div className="text-lg font-semibold">CertiPractice Admin</div>
          </div>
          <p className="text-xs text-neutral-500">Sign in with an admin account.</p>
        </div>

        <form onSubmit={onSubmit} className="card card-body space-y-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1" htmlFor="email">Email</label>
            <input
              id="email" type="email" autoComplete="username" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1" htmlFor="password">Password</label>
            <input
              id="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn btn-primary w-full justify-center">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[11px] text-neutral-600 mt-4">
          Restricted area. Access is monitored.
        </p>
      </div>
    </div>
  );
}
