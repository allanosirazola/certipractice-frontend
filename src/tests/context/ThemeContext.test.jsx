// src/tests/context/ThemeContext.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockClear();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  describe('Initial theme', () => {
    it('defaults to light when no preference', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      expect(result.current.theme).toBe('light');
    });

    it('uses stored "dark" preference', () => {
      localStorage.getItem.mockImplementation((k) => k === 'certipractice_theme' ? 'dark' : null);
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      expect(result.current.theme).toBe('dark');
    });

    it('falls back to system preference when no stored value', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      expect(result.current.theme).toBe('dark');
    });

    it('handles localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => { throw new Error('blocked'); });
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      expect(result.current.theme).toBe('light');
    });
  });

  describe('DOM side effects', () => {
    it('adds dark class to html when theme is dark', () => {
      localStorage.getItem.mockImplementation((k) => k === 'certipractice_theme' ? 'dark' : null);
      renderHook(() => useTheme(), { wrapper: ThemeProvider });
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when theme is light', () => {
      document.documentElement.classList.add('dark');
      localStorage.getItem.mockImplementation((k) => k === 'certipractice_theme' ? 'light' : null);
      renderHook(() => useTheme(), { wrapper: ThemeProvider });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('persists theme to localStorage on change', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      act(() => result.current.setTheme('dark'));
      expect(localStorage.setItem).toHaveBeenCalledWith('certipractice_theme', 'dark');
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      act(() => result.current.toggleTheme());
      expect(result.current.theme).toBe('dark');
    });

    it('toggling twice returns to original', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      const initial = result.current.theme;
      act(() => result.current.toggleTheme());
      act(() => result.current.toggleTheme());
      expect(result.current.theme).toBe(initial);
    });
  });

  describe('setTheme validation', () => {
    it('accepts "light" and "dark"', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      act(() => result.current.setTheme('dark'));
      expect(result.current.theme).toBe('dark');
      act(() => result.current.setTheme('light'));
      expect(result.current.theme).toBe('light');
    });

    it('ignores invalid values', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
      const initial = result.current.theme;
      act(() => result.current.setTheme('purple'));
      act(() => result.current.setTheme(null));
      expect(result.current.theme).toBe(initial);
    });
  });

  describe('Default context outside provider', () => {
    it('returns safe defaults', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');
      expect(typeof result.current.setTheme).toBe('function');
      expect(typeof result.current.toggleTheme).toBe('function');
    });
  });
});
