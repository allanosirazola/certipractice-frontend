/**
 * @fileoverview Pure function: derive alerts from API responses.
 *
 * Kept separate from the Alerts page so it can be unit-tested without
 * mounting React components.
 */

import { formatPercent, formatNumber } from './format.js';

/**
 * Build alert objects based on rules.
 *
 * @param {{
 *   overview?: object,
 *   questions?: object,
 *   funnel?: object,
 * }} data
 * @returns {Array<{id, severity, title, description, metric?, value?}>}
 */
export function buildAlerts({ overview, questions, funnel } = {}) {
  const out = [];

  // Pass rate critical
  if (overview?.exams?.completed > 0) {
    const passRate = overview.exams.passRate;
    if (passRate < 50) {
      out.push({
        id: 'pass-rate',
        severity: 'critical',
        title: 'Low pass rate',
        description: `Only ${passRate}% of completed exams passed in the selected period.`,
        metric: `${overview.exams.passed} passed of ${overview.exams.completed} completed`,
        value: formatPercent(passRate),
      });
    }
  }

  // Completion rate warning
  if (overview?.exams?.started > 0) {
    const cr = overview.exams.completionRate;
    if (cr < 60) {
      out.push({
        id: 'completion-rate',
        severity: 'warning',
        title: 'Low completion rate',
        description: 'Users are starting exams but not finishing them.',
        metric: `${overview.exams.started} started → ${overview.exams.completed} completed`,
        value: formatPercent(cr),
      });
    }
  }

  // Avg exam time excessive
  if (overview?.exams?.averageTimeMinutes > 90) {
    out.push({
      id: 'avg-time',
      severity: 'info',
      title: 'Exams take a long time on average',
      description: 'Average completion time is over 90 minutes — consider reviewing exam length.',
      value: `${overview.exams.averageTimeMinutes}m`,
    });
  }

  // Failed questions
  questions?.mostFailedQuestions?.forEach((q) => {
    if (q.attempts >= 5 && q.failRate >= 75) {
      out.push({
        id: `q-failed-${q.questionId}`,
        severity: 'warning',
        title: 'Question with high failure rate',
        description: q.preview,
        metric: `${q.attempts} attempts · ${q.topicName || 'no topic'} · ${q.difficulty || 'no difficulty'}`,
        value: formatPercent(q.failRate, 1),
      });
    }
  });

  // Reported questions
  questions?.mostReportedQuestions?.forEach((q) => {
    if (q.reports >= 3) {
      out.push({
        id: `q-reported-${q.questionId}`,
        severity: 'warning',
        title: 'Question reported multiple times',
        description: q.preview,
        value: `${q.reports} reports`,
      });
    }
  });

  // 5xx errors
  funnel?.errors?.forEach((err) => {
    if (err.statusCode >= 500) {
      out.push({
        id: `err-${err.path}-${err.statusCode}`,
        severity: 'critical',
        title: `${err.statusCode} errors detected`,
        description: `Path: ${err.path}`,
        value: formatNumber(err.occurrences),
      });
    }
  });

  return out;
}
