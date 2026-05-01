import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDoc = {
  setFont: vi.fn(), setFontSize: vi.fn(), setTextColor: vi.fn(),
  setFillColor: vi.fn(), setDrawColor: vi.fn(), setLineWidth: vi.fn(),
  text: vi.fn(), rect: vi.fn(), roundedRect: vi.fn(), line: vi.fn(),
  circle: vi.fn(), addPage: vi.fn(), splitTextToSize: vi.fn(() => ['line']),
  save: vi.fn(),
};

// jsPDF must be a class (constructor)
vi.mock('jspdf', () => ({
  default: class MockJsPDF {
    constructor() { Object.assign(this, mockDoc); }
  },
}));

import { generateExamReport } from '../../utils/generateExamReport';

const base = {
  exam: {
    provider: 'AWS', certification: 'SAA', certificationCode: 'SAA-C03',
    examMode: 'practice', passingScore: 72, questions: Array(10).fill({}),
  },
  results: {
    examSummary: { score: 85, passed: true, totalQuestions: 10, correctAnswers: 8, incorrectAnswers: 2 },
  },
  user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
  lang: 'en',
};

describe('generateExamReport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a .pdf filename', () => { expect(generateExamReport(base)).toMatch(/\.pdf$/); });
  it('filename contains cert code', () => { expect(generateExamReport(base)).toContain('SAA-C03'); });
  it('filename contains today date', () => { expect(generateExamReport(base)).toContain(new Date().toISOString().slice(0,10)); });
  it('calls save once', () => { generateExamReport(base); expect(mockDoc.save).toHaveBeenCalledTimes(1); });
  it('writes candidate name', () => {
    generateExamReport(base);
    const allText = mockDoc.text.mock.calls.map(c => String(c[0])).join(' ');
    expect(allText).toContain('Jane Doe');
  });
  it('works in Spanish', () => { expect(() => generateExamReport({ ...base, lang: 'es' })).not.toThrow(); });
  it('handles failed exam', () => {
    expect(() => generateExamReport({ ...base, results: { examSummary: { score: 50, passed: false, totalQuestions: 10, correctAnswers: 5, incorrectAnswers: 5 } } })).not.toThrow();
  });
  it('handles guest user (null)', () => { expect(() => generateExamReport({ ...base, user: null })).not.toThrow(); });
  it('handles missing results', () => { expect(() => generateExamReport({ ...base, results: null })).not.toThrow(); });
  it('handles missing exam', () => { expect(() => generateExamReport({ ...base, exam: null })).not.toThrow(); });
  it('includes score in document', () => {
    generateExamReport(base);
    const allText = mockDoc.text.mock.calls.map(c => String(c[0])).join(' ');
    expect(allText).toContain('85%');
  });
});
