import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { engagementAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 20;

/**
 * Page-level component listing all of the current user's bookmarks.
 * Allows removing in-place and navigating to the question (via prop).
 *
 * @param {{ onSelectQuestion?: (questionId:string)=>void }} props
 */
export default function BookmarksList({ onSelectQuestion }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], pagination: { total: 0 } });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await engagementAPI.listBookmarks({
        limit: PAGE_SIZE,
        offset: p * PAGE_SIZE,
      });
      if (res?.success) {
        setData(res.data);
        setPage(p);
      }
    } catch (err) {
      setError(err?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user) load(0);
    else setLoading(false);
  }, [user, load]);

  const handleRemove = async (questionId) => {
    // Optimistic remove
    const prev = data;
    setData({
      items: data.items.filter((i) => i.questionId !== questionId),
      pagination: { ...data.pagination, total: Math.max(0, data.pagination.total - 1) },
    });
    try {
      await engagementAPI.removeBookmark(questionId);
    } catch {
      setData(prev);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('engagement.bookmarks.signInRequired')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('engagement.bookmarks.signInDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-6">
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t('engagement.bookmarks.title')}
        </h1>
        {data.pagination.total > 0 && (
          <span className="text-xs text-gray-500 tabular-nums">
            {t('engagement.bookmarks.count', { count: data.pagination.total })}
          </span>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {data.items.map((item) => (
              <BookmarkRow
                key={item.questionId}
                item={item}
                onSelect={() => onSelectQuestion?.(item.questionId)}
                onRemove={() => handleRemove(item.questionId)}
              />
            ))}
          </ul>

          {data.pagination.total > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                onClick={() => load(page - 1)}
                disabled={page === 0}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                ← {t('common.previous')}
              </button>
              <span className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.pagination.total)} / {data.pagination.total}
              </span>
              <button
                onClick={() => load(page + 1)}
                disabled={(page + 1) * PAGE_SIZE >= data.pagination.total}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                {t('common.next')} →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookmarkRow({ item, onSelect, onRemove }) {
  const { t } = useTranslation();
  return (
    <li className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onSelect}
          className="text-left flex-1 min-w-0"
          type="button"
        >
          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
            {item.questionText}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            {item.providerName && <Tag>{item.providerName}</Tag>}
            {item.certificationName && <Tag>{item.certificationName}</Tag>}
            {item.topicName && <Tag>{item.topicName}</Tag>}
            {item.difficulty && (
              <Tag color={difficultyColor(item.difficulty)}>{item.difficulty}</Tag>
            )}
            {item.hasNote && <Tag color="blue">📝 {t('engagement.note.has')}</Tag>}
          </div>
        </button>
        <button
          onClick={onRemove}
          className="shrink-0 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          type="button"
          title={t('engagement.bookmark.remove')}
        >
          ✕
        </button>
      </div>
    </li>
  );
}

function Tag({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

function difficultyColor(d) {
  return { easy: 'green', medium: 'yellow', hard: 'red', expert: 'red' }[d] || 'gray';
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <li key={i} className="px-4 py-3">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="mt-2 h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-700/50 animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-700 py-12 text-center">
      <div className="text-4xl mb-2">🔖</div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {t('engagement.bookmarks.empty')}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t('engagement.bookmarks.emptyHint')}
      </p>
    </div>
  );
}
