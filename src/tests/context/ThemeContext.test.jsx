// src/tests/context/ThemeContext.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function Probe({ onReady }) {
  const ctx = useTheme();
  onReady?.(ctx);
  return <div data-testid="theme">{ctx.theme}</div>;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides default light theme when nothing is stored', () => {
    localStorage.getItem = vi.fn(() => null);
    window.matchMedia = vi.fn(() => ({ matches: false }));

    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('theme').textContent).toBe('light');
  });

  it('reads saved theme from localStorage', () => {
    localStorage.getItem = vi.fn(() => 'dark');

    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('theme').textContent).toBe('dark');
  });

  it('respects prefers-color-scheme: dark when no stored value', () => {
    localStorage.getItem = vi.fn(() => null);
    window.matchMedia = vi.fn(() => ({ matches: true }));

    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('theme').textContent).toBe('dark');
  });

  it('toggleTheme switches light → dark → light', () => {
    localStorage.getItem = vi.fn(() => 'light');
    window.matchMedia = vi.fn(() => ({ matches: false }));

    let api;
    render(
      <ThemeProvider>
        <Probe onReady={(ctx) => { api = ctx; }} />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => api.toggleTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => api.toggleTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme accepts only valid values', () => {
    let api;
    render(
      <ThemeProvider>
        <Probe onReady={(ctx) => { api = ctx; }} />
      </ThemeProvider>
    );

    act(() => api.setTheme('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => api.setTheme('invalid'));
    expect(document.documentElement.classList.contains('dark')).toBe(true); // unchanged
  });

  it('persists theme to localStorage on change', () => {
    const setItem = vi.fn();
    localStorage.setItem = setItem;

    let api;
    render(
      <ThemeProvider>
        <Probe onReady={(ctx) => { api = ctx; }} />
      </ThemeProvider>
    );

    act(() => api.setTheme('dark'));
    expect(setItem).toHaveBeenCalledWith('certipractice_theme', 'dark');
  });

  it('sets color-scheme on html element', () => {
    let api;
    render(
      <ThemeProvider>
        <Probe onReady={(ctx) => { api = ctx; }} />
      </ThemeProvider>
    );

    act(() => api.setTheme('dark'));
    expect(document.documentElement.style.colorScheme).toBe('dark');

    act(() => api.setTheme('light'));
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
