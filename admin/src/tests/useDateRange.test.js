import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateRange } from '../hooks/useDateRange.js';

describe('useDateRange', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to 7 days', () => {
    const { result } = renderHook(() => useDateRange());
    expect(result.current.days).toBe(7);
    expect(result.current.label).toBe('Last 7 days');
  });

  it('honors initial argument', () => {
    const { result } = renderHook(() => useDateRange(30));
    expect(result.current.days).toBe(30);
    expect(result.current.label).toBe('Last 30 days');
  });

  it('reads stored value on init', () => {
    localStorage.setItem('admin_date_range_days', '90');
    const { result } = renderHook(() => useDateRange());
    expect(result.current.days).toBe(90);
  });

  it('rejects invalid stored values, falls back to default', () => {
    localStorage.setItem('admin_date_range_days', '999');
    const { result } = renderHook(() => useDateRange());
    expect(result.current.days).toBe(7);
  });

  it('setDays persists to localStorage', () => {
    const { result } = renderHook(() => useDateRange());
    act(() => result.current.setDays(30));
    expect(result.current.days).toBe(30);
    expect(localStorage.getItem('admin_date_range_days')).toBe('30');
  });

  it('setDays ignores invalid values', () => {
    const { result } = renderHook(() => useDateRange(7));
    act(() => result.current.setDays(999));
    expect(result.current.days).toBe(7);
  });

  it('produces correct labels for all presets', () => {
    const cases = {
      1: 'Last 24h',
      7: 'Last 7 days',
      14: 'Last 14 days',
      30: 'Last 30 days',
      90: 'Last 90 days',
      180: 'Last 6 months',
      365: 'Last year',
    };
    Object.entries(cases).forEach(([d, label]) => {
      const { result } = renderHook(() => useDateRange(parseInt(d, 10)));
      expect(result.current.label).toBe(label);
    });
  });
});
