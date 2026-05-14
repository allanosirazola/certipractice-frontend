// src/components/progress/ReadinessGauge.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { progressAPI } from '../../services/api';
import logger from '../../utils/logger.js';

/**
 * Readiness gauge for a specific certification.
 *
 * Shows a circular progress arc with the predicted probability of passing
 * the exam (0-100). Pulled from GET /progress/readiness/:certificationId.
 *
 * Color thresholds:
 *   ≥ 75  → green   ("ready")
 *   ≥ 50  → amber   ("getting close")
 *    < 50 → red     ("keep studying")
 *
 * Hidden for anonymous users (the API requires auth).
 *
 * @param {{ certificationId: number|string, refreshSignal?: any, className?: string }} props
 */
export default function ReadinessGauge({ certificationId, refreshSignal, className = '' }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || certificationId == null) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    progressAPI.getReadiness(certificationId)
      .then((res) => {
        if (cancelled) return;
        if (res?.success) setData(res.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('Readiness fetch failed:', err?.message);
        setError(err?.message || 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, certificationId, refreshSignal]);

  if (!user) return null;

  if (loading && !data) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 ${className}`}
        aria-busy="true"
      >
        <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  // Not enough data yet — backend returns score=null until N samples
  if (data.score === null || data.score === undefined) {
    return (
      <div className={`rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span>
            {t('progress.readiness.notEnoughData', { needed: data.minSamples || 20 })}
          </span>
        </div>
      </div>
    );
  }

  const score = Math.max(0, Math.min(100, Math.round(data.score)));
  const tone = scoreTone(score);
  const advice = Array.isArray(data.advice) ? data.advice : [];

  return (
    <div className={`rounded-lg border bg-white p-4 dark:bg-gray-800 ${tone.border} ${className}`}>
      <div className="flex items-start gap-4">
        <Gauge score={score} tone={tone} />
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold ${tone.title}`}>
            {t(`progress.readiness.title.${tone.label}`)}
          </h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {t('progress.readiness.basedOn', { samples: data.samples || 0 })}
          </p>
          {advice.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-300">
              {advice.slice(0, 3).map((a, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function scoreTone(score) {
  if (score >= 75) {
    return {
      label: 'ready',
      border: 'border-green-200 dark:border-green-500/30',
      ring: 'stroke-green-500',
      title: 'text-green-700 dark:text-green-400',
    };
  }
  if (score >= 50) {
    return {
      label: 'almost',
      border: 'border-amber-200 dark:border-amber-500/30',
      ring: 'stroke-amber-500',
      title: 'text-amber-700 dark:text-amber-400',
    };
  }
  return {
    label: 'keepStudying',
    border: 'border-red-200 dark:border-red-500/30',
    ring: 'stroke-red-500',
    title: 'text-red-700 dark:text-red-400',
  };
}

function Gauge({ score, tone }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-16 w-16 shrink-0" role="img" aria-label={`${score}%`}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle
          cx="32" cy="32" r={radius}
          className="fill-none stroke-gray-200 dark:stroke-gray-700"
          strokeWidth="6"
        />
        <circle
          cx="32" cy="32" r={radius}
          className={`fill-none ${tone.ring} transition-[stroke-dashoffset] duration-500`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-base font-semibold tabular-nums ${tone.title}`}>
          {score}%
        </span>
      </div>
    </div>
  );
}
