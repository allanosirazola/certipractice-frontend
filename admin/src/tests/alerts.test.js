import { describe, it, expect } from 'vitest';
import { buildAlerts } from '../utils/alerts.js';

describe('buildAlerts', () => {
  it('returns empty array when no inputs provided', () => {
    expect(buildAlerts()).toEqual([]);
    expect(buildAlerts({})).toEqual([]);
  });

  describe('pass rate', () => {
    it('triggers critical when pass rate < 50', () => {
      const alerts = buildAlerts({
        overview: { exams: { completed: 100, passed: 30, passRate: 30, started: 100, completionRate: 100 } },
      });
      expect(alerts).toContainEqual(expect.objectContaining({
        id: 'pass-rate', severity: 'critical',
      }));
    });

    it('does not trigger when pass rate >= 50', () => {
      const alerts = buildAlerts({
        overview: { exams: { completed: 100, passed: 60, passRate: 60, started: 100, completionRate: 100 } },
      });
      expect(alerts.find((a) => a.id === 'pass-rate')).toBeUndefined();
    });

    it('does not trigger when no exams completed', () => {
      const alerts = buildAlerts({
        overview: { exams: { completed: 0, passed: 0, passRate: 0, started: 0, completionRate: 0 } },
      });
      expect(alerts).toEqual([]);
    });
  });

  describe('completion rate', () => {
    it('triggers warning when completion rate < 60', () => {
      const alerts = buildAlerts({
        overview: { exams: { started: 100, completed: 40, completionRate: 40, passed: 30, passRate: 75 } },
      });
      expect(alerts).toContainEqual(expect.objectContaining({
        id: 'completion-rate', severity: 'warning',
      }));
    });

    it('does not trigger when completion rate >= 60', () => {
      const alerts = buildAlerts({
        overview: { exams: { started: 100, completed: 80, completionRate: 80, passed: 60, passRate: 75 } },
      });
      expect(alerts.find((a) => a.id === 'completion-rate')).toBeUndefined();
    });
  });

  describe('avg time', () => {
    it('triggers info when avg exam time > 90 min', () => {
      const alerts = buildAlerts({
        overview: { exams: { averageTimeMinutes: 120, completed: 0, started: 0 } },
      });
      expect(alerts).toContainEqual(expect.objectContaining({
        id: 'avg-time', severity: 'info', value: '120m',
      }));
    });

    it('does not trigger at 90 min exactly', () => {
      const alerts = buildAlerts({
        overview: { exams: { averageTimeMinutes: 90, completed: 0, started: 0 } },
      });
      expect(alerts.find((a) => a.id === 'avg-time')).toBeUndefined();
    });
  });

  describe('failed questions', () => {
    it('triggers warning for questions with >= 5 attempts AND >= 75% fail rate', () => {
      const alerts = buildAlerts({
        questions: {
          mostFailedQuestions: [
            { questionId: 'q1', attempts: 10, failRate: 80, preview: 'Bad question', topicName: 'S3' },
            { questionId: 'q2', attempts: 3, failRate: 100, preview: 'Few attempts' },
            { questionId: 'q3', attempts: 20, failRate: 50, preview: 'Acceptable rate' },
          ],
        },
      });
      const ids = alerts.map((a) => a.id);
      expect(ids).toContain('q-failed-q1');
      expect(ids).not.toContain('q-failed-q2'); // not enough attempts
      expect(ids).not.toContain('q-failed-q3'); // fail rate too low
    });
  });

  describe('reported questions', () => {
    it('triggers warning for >= 3 reports', () => {
      const alerts = buildAlerts({
        questions: {
          mostReportedQuestions: [
            { questionId: 'q1', reports: 5, preview: 'Reported' },
            { questionId: 'q2', reports: 2, preview: 'Just two' },
          ],
        },
      });
      const ids = alerts.map((a) => a.id);
      expect(ids).toContain('q-reported-q1');
      expect(ids).not.toContain('q-reported-q2');
    });
  });

  describe('5xx errors', () => {
    it('triggers critical for any 5xx', () => {
      const alerts = buildAlerts({
        funnel: {
          errors: [
            { path: '/api/foo', statusCode: 500, occurrences: 12 },
            { path: '/api/bar', statusCode: 503, occurrences: 3 },
            { path: '/api/baz', statusCode: 404, occurrences: 50 },
          ],
        },
      });
      const ids = alerts.map((a) => a.id);
      expect(ids).toContain('err-/api/foo-500');
      expect(ids).toContain('err-/api/bar-503');
      expect(ids).not.toContain('err-/api/baz-404');
    });
  });

  it('combines all categories into a single deduplicated array', () => {
    const alerts = buildAlerts({
      overview: { exams: { started: 100, completed: 30, passed: 5, passRate: 17, completionRate: 30, averageTimeMinutes: 100 } },
      questions: {
        mostFailedQuestions: [{ questionId: 'q1', attempts: 10, failRate: 90, preview: 'P' }],
        mostReportedQuestions: [{ questionId: 'q1', reports: 4, preview: 'P' }],
      },
      funnel: { errors: [{ path: '/x', statusCode: 500, occurrences: 1 }] },
    });
    // pass-rate, completion-rate, avg-time, q-failed-q1, q-reported-q1, err-/x-500
    expect(alerts).toHaveLength(6);
    const severities = alerts.map((a) => a.severity);
    expect(severities).toContain('critical');
    expect(severities).toContain('warning');
    expect(severities).toContain('info');
  });
});
