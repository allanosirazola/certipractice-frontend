// src/components/progress/StreakBadge.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { progressAPI } from '../../services/api';
import logger from '../../utils/logger.js';

/**
 * Daily-streak indicator (🔥 N day(s)).
 *
 * Displays the current consecutive-day streak for authenticated users.
 * Hidden entirely for anonymous users — streaks are a sign-in incentive.
 *
 * Behavior:
 * - Fetches once on mount
 * - Re-fetches when `refreshSignal` changes (e.g. after exam completion)
 * - When current === 0 still renders quietly with a CTA tooltip
 *
 * Style: compact pill, fits in header / landing top bar.
 *
 * @param {{ refreshSignal?: any, compact?: boolean, className?: string }} props
 */
export default function StreakBadge({ refreshSignal, compact = false, className = '' }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    progressAPI.getStreak()
      .then((res) => {
        if (cancelled) return;
        if (res?.success) setStreak(res.data || null);
      })
      .catch((err) => {
        if (!cancelled) logger.warn('Streak fetch failed:', err?.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, refreshSignal]);

  // Anonymous: render nothing (header stays clean)
  if (!user) return null;

  // Loading shimmer
  if (loading && !streak) {
    return (
      <div
        className={`inline-flex h-7 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const current = streak?.current ?? 0;
  const best = streak?.best ?? 0;
  const isHot = current >= 3;
  const tooltipKey = current === 0
    ? 'progress.streak.tooltipStart'
    : 'progress.streak.tooltipActive';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        isHot
          ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300'
          : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
      } ${className}`}
      title={t(tooltipKey, { count: current, best })}
      aria-label={t('progress.streak.ariaLabel', { count: current })}
    >
      <FlameIcon className={`h-3.5 w-3.5 ${isHot ? '' : 'opacity-60'}`} hot={isHot} />
      <span className="tabular-nums">
        {compact
          ? current
          : t(current === 1 ? 'progress.streak.dayOne' : 'progress.streak.dayOther', { count: current })}
      </span>
    </div>
  );
}

function FlameIcon({ className, hot }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill={hot ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
