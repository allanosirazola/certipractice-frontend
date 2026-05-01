import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(q => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
});

import useTheme from '../../hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light mode when no preference stored', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.dark).toBe(false);
  });

  it('reads saved dark preference from localStorage', () => {
    localStorage.getItem.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.dark).toBe(true);
  });

  it('reads saved light preference from localStorage', () => {
    localStorage.getItem.mockReturnValue('light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.dark).toBe(false);
  });

  it('toggle switches from light to dark', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.dark).toBe(true);
  });

  it('toggle switches from dark to light', () => {
    localStorage.getItem.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.dark).toBe(false);
  });

  it('adds dark class to html element when dark=true', () => {
    localStorage.getItem.mockReturnValue('dark');
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when toggled off', () => {
    localStorage.getItem.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme to localStorage on toggle', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(localStorage.setItem).toHaveBeenCalledWith('certipractice_theme', 'dark');
  });

  it('respects prefers-color-scheme dark when no localStorage', () => {
    window.matchMedia.mockImplementation(q => ({ matches: q === '(prefers-color-scheme: dark)', media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    localStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useTheme());
    expect(result.current.dark).toBe(true);
  });
});
