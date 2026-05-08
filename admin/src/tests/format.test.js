import { describe, it, expect } from 'vitest';
import {
  formatNumber, formatCompact, formatPercent,
  formatDuration, formatMinutes, formatDelta,
  formatDate, formatDateTime,
} from '../utils/format.js';

describe('format utilities', () => {
  describe('formatNumber', () => {
    it('formats integers with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
    it('returns "—" for null/undefined/NaN', () => {
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber(undefined)).toBe('—');
      expect(formatNumber(NaN)).toBe('—');
      expect(formatNumber('not a number')).toBe('—');
    });
    it('handles 0 correctly', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatCompact', () => {
    it('uses full notation under 10k', () => {
      expect(formatCompact(9999)).toBe('9,999');
    });
    it('uses compact notation at 10k+', () => {
      expect(formatCompact(15000)).toBe('15K');
      expect(formatCompact(2_500_000)).toBe('2.5M');
    });
    it('returns "—" for invalid input', () => {
      expect(formatCompact(null)).toBe('—');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages with default 0 digits', () => {
      expect(formatPercent(75.4)).toBe('75%');
    });
    it('respects digits argument', () => {
      expect(formatPercent(75.4, 1)).toBe('75.4%');
    });
    it('returns "—" for null', () => {
      expect(formatPercent(null)).toBe('—');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds', () => {
      expect(formatDuration(45_000)).toBe('45s');
    });
    it('formats minutes', () => {
      expect(formatDuration(120_000)).toBe('2m');
    });
    it('formats hours and minutes', () => {
      expect(formatDuration(3_900_000)).toBe('1h 5m');
    });
    it('formats whole hours without minutes', () => {
      expect(formatDuration(3_600_000)).toBe('1h');
    });
    it('returns "—" for null/undefined', () => {
      expect(formatDuration(null)).toBe('—');
      expect(formatDuration(undefined)).toBe('—');
    });
  });

  describe('formatMinutes', () => {
    it('formats sub-hour ranges', () => {
      expect(formatMinutes(45)).toBe('45 min');
    });
    it('formats hours', () => {
      expect(formatMinutes(120)).toBe('2h');
      expect(formatMinutes(125)).toBe('2h 5m');
    });
  });

  describe('formatDelta', () => {
    it('prefixes positive numbers with +', () => {
      expect(formatDelta(25)).toBe('+25%');
    });
    it('preserves negative sign', () => {
      expect(formatDelta(-10)).toBe('-10%');
    });
    it('returns null for null/undefined', () => {
      expect(formatDelta(null)).toBeNull();
      expect(formatDelta(undefined)).toBeNull();
    });
    it('returns null for NaN inputs', () => {
      expect(formatDelta('abc')).toBeNull();
    });
  });

  describe('formatDate / formatDateTime', () => {
    it('formats date strings into "Mon D" form', () => {
      const out = formatDate('2026-04-15T00:00:00Z');
      expect(out).toMatch(/Apr/);
      expect(out).toMatch(/1[45]/); // depends on TZ
    });
    it('returns "—" for empty input', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDateTime(null)).toBe('—');
    });
  });
});
