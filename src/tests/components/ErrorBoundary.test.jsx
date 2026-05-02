// src/tests/components/ErrorBoundary.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Component that throws on render to trigger the boundary
function Boom({ message = 'kaboom' }) {
  throw new Error(message);
}

// Pre-set Spanish navigator for consistent assertions
beforeEach(() => {
  Object.defineProperty(window, 'navigator', {
    value: { language: 'es-ES' },
    writable: true,
    configurable: true,
  });
});

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // React logs caught errors to console.error in development; silence it
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>safe content</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    // Spanish title (navigator.language = 'es-ES')
    expect(screen.getByText(/Algo ha salido mal/i)).toBeInTheDocument();
  });

  it('shows English fallback when navigator is non-Spanish', () => {
    Object.defineProperty(window, 'navigator', {
      value: { language: 'en-US' },
      writable: true,
      configurable: true,
    });
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('exposes the error message in details', () => {
    render(
      <ErrorBoundary>
        <Boom message="my-specific-error" />
      </ErrorBoundary>
    );
    expect(screen.getByText(/my-specific-error/)).toBeInTheDocument();
  });

  it('renders reload and home buttons', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /Recargar página/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver al inicio/i })).toBeInTheDocument();
  });

  it('reload button calls window.location.reload', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock, hash: '' },
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: /Recargar página/i }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('logs the error via logger.error', () => {
    // Re-render with a fresh spy to capture the logger call
    const errorSpy = vi.spyOn(console, 'error');
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    // logger.error wraps console.error
    const calls = errorSpy.mock.calls.flat().map(String).join(' ');
    expect(calls).toMatch(/ErrorBoundary caught/);
  });

  it('has role="alert" on the fallback container', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
