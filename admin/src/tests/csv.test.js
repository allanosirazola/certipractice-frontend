import { describe, it, expect } from 'vitest';
import { toCsv } from '../utils/csv.js';

describe('toCsv', () => {
  it('produces a header row + body rows', () => {
    const rows = [
      { name: 'alice', count: 10 },
      { name: 'bob', count: 20 },
    ];
    const csv = toCsv(rows, [
      { key: 'name', label: 'Name' },
      { key: 'count', label: 'Count' },
    ]);
    expect(csv).toBe('Name,Count\nalice,10\nbob,20');
  });

  it('uses key as label when label is missing', () => {
    const csv = toCsv([{ a: 1 }], [{ key: 'a' }]);
    expect(csv).toBe('a\n1');
  });

  it('quotes cells containing commas', () => {
    const csv = toCsv([{ x: 'one, two' }], [{ key: 'x' }]);
    expect(csv).toBe('x\n"one, two"');
  });

  it('escapes embedded quotes by doubling them', () => {
    const csv = toCsv([{ x: 'he said "hi"' }], [{ key: 'x' }]);
    expect(csv).toBe('x\n"he said ""hi"""');
  });

  it('quotes cells containing newlines', () => {
    const csv = toCsv([{ x: 'line1\nline2' }], [{ key: 'x' }]);
    expect(csv).toBe('x\n"line1\nline2"');
  });

  it('renders null/undefined as empty cells', () => {
    const csv = toCsv([{ a: null, b: undefined, c: 0 }], [
      { key: 'a' }, { key: 'b' }, { key: 'c' },
    ]);
    expect(csv).toBe('a,b,c\n,,0');
  });

  it('returns empty string for empty rows', () => {
    expect(toCsv([], [{ key: 'a' }])).toBe('');
    expect(toCsv(null, [{ key: 'a' }])).toBe('');
  });
});
