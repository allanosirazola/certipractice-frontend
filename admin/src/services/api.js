/**
 * @fileoverview API client for the admin panel.
 *
 * - All admin endpoints live under /api/admin/analytics/*
 * - Bearer token from localStorage('admin_token')
 * - Standardized error: throws ApiError with { status, code, message }
 */

const TOKEN_KEY = 'admin_token';

const baseURL = (() => {
  const env = import.meta.env.VITE_ADMIN_API_URL || import.meta.env.VITE_API_URL;
  if (env) return env.replace(/\/+$/, '');
  // dev fallback
  return 'http://localhost:8080';
})();

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const request = async (path, { method = 'GET', body, query, signal } = {}) => {
  const url = new URL(baseURL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    throw new ApiError('Network error', { status: 0, code: 'NETWORK' });
  }

  // Try to parse JSON regardless of status
  let payload = null;
  try { payload = await res.json(); } catch { /* not json */ }

  if (!res.ok) {
    const error = payload?.error;
    throw new ApiError(
      error?.message || payload?.error || res.statusText || 'Request failed',
      {
        status: res.status,
        code: error?.code,
        details: error?.details,
      }
    );
  }

  return payload;
};

/* ─── Auth ────────────────────────────────────────────────────────────── */

export const auth = {
  login: async (email, password) => {
    const res = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    if (res?.data?.user?.role !== 'admin') {
      throw new ApiError('Admin privileges required', { status: 403, code: 'FORBIDDEN' });
    }
    tokenStore.set(res.data.token);
    return res.data.user;
  },
  verify: async () => {
    const res = await request('/api/auth/verify');
    if (res?.data?.user?.role !== 'admin') {
      tokenStore.clear();
      throw new ApiError('Admin privileges required', { status: 403, code: 'FORBIDDEN' });
    }
    return res.data.user;
  },
  logout: () => tokenStore.clear(),
};

/* ─── Admin analytics ────────────────────────────────────────────────── */

const adminPath = '/api/admin/analytics';

export const analytics = {
  overview: ({ days = 7, signal } = {}) =>
    request(`${adminPath}/overview`, { query: { days }, signal }).then((r) => r.data),

  exams: ({ days = 7, signal } = {}) =>
    request(`${adminPath}/exams`, { query: { days }, signal }).then((r) => r.data),

  questions: ({ days = 7, limit = 20, signal } = {}) =>
    request(`${adminPath}/questions`, { query: { days, limit }, signal }).then((r) => r.data),

  users: ({ days = 7, signal } = {}) =>
    request(`${adminPath}/users`, { query: { days }, signal }).then((r) => r.data),

  funnel: ({ days = 7, signal } = {}) =>
    request(`${adminPath}/funnel`, { query: { days }, signal }).then((r) => r.data),

  timeseries: ({ days = 30, scope = 'global', signal } = {}) =>
    request(`${adminPath}/timeseries`, { query: { days, scope }, signal }).then((r) => r.data),

  computeDaily: ({ date, scope } = {}) =>
    request(`${adminPath}/compute-daily`, { method: 'POST', body: { date, scope } }).then((r) => r.data),
};

export default { auth, analytics, ApiError, tokenStore };
