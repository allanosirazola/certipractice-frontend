import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auth, analytics, ApiError, tokenStore } from '../services/api.js';

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    if (global.fetch?.mockClear) global.fetch.mockClear();
  });

  describe('tokenStore', () => {
    it('round-trips a token', () => {
      tokenStore.set('abc');
      expect(tokenStore.get()).toBe('abc');
      tokenStore.clear();
      expect(tokenStore.get()).toBeNull();
    });
  });

  describe('auth.login', () => {
    it('stores token on success and returns admin user', async () => {
      const mockUser = { id: 1, email: 'a@x', role: 'admin' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: mockUser, token: 'jwt' } }),
      });
      const u = await auth.login('a@x', 'pw');
      expect(u).toEqual(mockUser);
      expect(tokenStore.get()).toBe('jwt');
    });

    it('rejects non-admin role with FORBIDDEN', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: { id: 1, role: 'student' }, token: 'jwt' } }),
      });
      await expect(auth.login('a@x', 'pw')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        status: 403,
      });
      expect(tokenStore.get()).toBeNull();
    });

    it('throws ApiError on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ success: false, error: { code: 'INVALID_TOKEN', message: 'bad creds' } }),
      });
      await expect(auth.login('a@x', 'bad')).rejects.toMatchObject({
        message: 'bad creds',
        code: 'INVALID_TOKEN',
        status: 401,
      });
    });

    it('wraps network failures as ApiError NETWORK', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('network down'));
      await expect(auth.login('a@x', 'pw')).rejects.toMatchObject({
        code: 'NETWORK',
        status: 0,
      });
    });
  });

  describe('auth.verify', () => {
    it('returns user when token is valid and user is admin', async () => {
      tokenStore.set('jwt');
      const user = { id: 1, role: 'admin' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user, valid: true } }),
      });
      const u = await auth.verify();
      expect(u).toEqual(user);
    });

    it('clears the stored token when role is not admin', async () => {
      tokenStore.set('jwt');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: { id: 1, role: 'student' } } }),
      });
      await expect(auth.verify()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(tokenStore.get()).toBeNull();
    });
  });

  describe('analytics endpoints', () => {
    it('hits the right URL with days param', async () => {
      tokenStore.set('jwt');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { ok: true } }),
      });

      await analytics.overview({ days: 30 });
      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain('/api/admin/analytics/overview');
      expect(url).toContain('days=30');
    });

    it('passes Bearer token in Authorization header', async () => {
      tokenStore.set('jwt-token-xyz');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });
      await analytics.exams({ days: 7 });
      const opts = global.fetch.mock.calls[0][1];
      expect(opts.headers.Authorization).toBe('Bearer jwt-token-xyz');
    });

    it('omits empty query parameters', async () => {
      tokenStore.set('jwt');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });
      await analytics.timeseries({ days: 30, scope: '' });
      const url = global.fetch.mock.calls[0][0];
      expect(url).not.toContain('scope=');
    });

    it('extracts data from { success, data } envelope', async () => {
      tokenStore.set('jwt');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { kpi: 42 } }),
      });
      const out = await analytics.overview({ days: 7 });
      expect(out).toEqual({ kpi: 42 });
    });
  });

  describe('ApiError', () => {
    it('stores status, code and details', () => {
      const e = new ApiError('boom', { status: 500, code: 'X', details: { a: 1 } });
      expect(e.message).toBe('boom');
      expect(e.status).toBe(500);
      expect(e.code).toBe('X');
      expect(e.details).toEqual({ a: 1 });
      expect(e.name).toBe('ApiError');
    });
  });
});
