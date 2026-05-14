// src/components/reviews/DueBadge.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reviewsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * Tiny indicator for "N flashcards due". Renders nothing when:
 *   - user is anonymous (reviews are auth-only)
 *   - dueNow === 0 (nothing to remind about)
 *   - the API call fails (silent — no error UI to clutter the header)
 *
 * @param {{ certificationId?: number, refreshSignal?: any, className?: string }} props
 */
export default function DueBadge({ certificationId, refreshSignal, className = '' }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!user) { setCount(null); return; }
    let cancelled = false;
    reviewsAPI.getStats()
      .then((res) => { if (!cancelled) setCount(res?.data?.dueNow ?? 0); })
      .catch(() => { if (!cancelled) setCount(0); });
    return () => { cancelled = true; };
  }, [user, certificationId, refreshSignal]);

  if (!user || !count) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 tabular-nums ${className}`}
      title={t('reviews.dueBadge.tooltip', 'Tienes {{count}} carta(s) para repasar', { count })}
    >
      🃏 {count}
    </span>
  );
}
