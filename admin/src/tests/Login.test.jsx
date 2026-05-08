import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../pages/Login.jsx';
import { AuthProvider } from '../hooks/useAuth.jsx';
import { tokenStore } from '../services/api.js';

const renderLogin = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    if (global.fetch?.mockClear) global.fetch.mockClear();
  });

  it('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('logs in successfully and stores the token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: { id: 1, role: 'admin', email: 'a@x.com', username: 'admin' }, token: 'jwt' },
      }),
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@x.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(tokenStore.get()).toBe('jwt');
    });
  });

  it('shows server error message on bad credentials', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid credentials' } }),
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@x.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows admin-required error for non-admin users', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: { id: 1, role: 'student' }, token: 'jwt' },
      }),
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@x.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText(/Admin privileges required/)).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
  });
});
