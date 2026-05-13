import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { engagementAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * Toggle button to bookmark a question.
 *
 * Displays as a small icon button. Anonymous users see it disabled with
 * a tooltip explaining sign-in is required — bookmarks are a sticky
 * sign-up incentive.
 *
 * @param {{ questionId: string, initialBookmarked?: boolean, size?: 'sm'|'md', onChange?: (bookmarked:boolean)=>void }} props
 */
export default function BookmarkButton({
  questionId,
  initialBookmarked,
  size = 'md',
  onChange,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAuthed = !!user;

  const [bookmarked, setBookmarked] = useState(!!initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial state when authenticated and not provided
  useEffect(() => {
    if (!isAuthed || !questionId || initialBookmarked != null) return;
    let cancelled = false;
    engagementAPI.isBookmarked(questionId)
      .then((res) => {
        if (!cancelled && res?.success) setBookmarked(!!res.data?.bookmarked);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthed, questionId, initialBookmarked]);

  const onClick = useCallback(async () => {
    if (!isAuthed || loading) return;
    setLoading(true);
    setError(null);
    // Optimistic update
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const res = await engagementAPI.toggleBookmark(questionId);
      const newState = !!res?.data?.bookmarked;
      setBookmarked(newState);
      onChange?.(newState);
    } catch (err) {
      // Revert on failure
      setBookmarked(prev);
      setError(err?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [isAuthed, loading, bookmarked, questionId, onChange, t]);

  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 16 : 20;
  const titleKey = !isAuthed
    ? 'engagement.bookmark.signInRequired'
    : bookmarked
    ? 'engagement.bookmark.remove'
    : 'engagement.bookmark.add';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAuthed || loading}
      title={t(titleKey)}
      aria-pressed={bookmarked}
      aria-label={t(titleKey)}
      className={`${sizeClass} inline-flex items-center justify-center rounded-md border transition-colors
        ${bookmarked
          ? 'border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/40 dark:text-amber-400'
          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        }
        ${(!isAuthed || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <BookmarkIcon size={iconSize} filled={bookmarked} />
      <span className="sr-only">
        {bookmarked ? t('engagement.bookmark.bookmarked') : t('engagement.bookmark.add')}
      </span>
      {error && <span className="sr-only">{error}</span>}
    </button>
  );
}

function BookmarkIcon({ size = 20, filled = false }) {
  return filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 3v18l7-5 7 5V3a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-5 7 5z"/>
    </svg>
  );
}
