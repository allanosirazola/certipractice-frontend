import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { engagementAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MAX_LENGTH = 5000;
const AUTOSAVE_DELAY_MS = 1500;

/**
 * Inline note editor attached to a question.
 *
 * Behavior:
 *  - Anonymous users see an empty placeholder + sign-in hint
 *  - Authed users see existing note (if any) or empty textarea
 *  - Autosaves 1.5 s after typing stops
 *  - Soft character limit at 5000 (matches backend MAX_NOTE_LENGTH)
 *
 * @param {{ questionId: string }} props
 */
export default function QuestionNote({ questionId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAuthed = !!user;

  const [content, setContent] = useState('');
  const [saved, setSaved] = useState('');         // last server-saved version
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const autosaveTimer = useRef(null);

  // Load existing note
  useEffect(() => {
    if (!isAuthed || !questionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    engagementAPI.getNote(questionId)
      .then((res) => {
        if (cancelled) return;
        const noteContent = res?.data?.content || '';
        setContent(noteContent);
        setSaved(noteContent);
        if (noteContent) setExpanded(true);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthed, questionId]);

  // Autosave on content change
  useEffect(() => {
    if (!isAuthed || loading) return;
    if (content === saved) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      flush(content);
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, isAuthed, loading]);

  const flush = async (text) => {
    if (!isAuthed) return;
    const trimmed = text.trim();
    setError(null);
    setSaving(true);
    try {
      if (trimmed === '') {
        // Empty content → delete note
        if (saved !== '') {
          await engagementAPI.deleteNote(questionId);
        }
        setSaved('');
      } else {
        const res = await engagementAPI.upsertNote(questionId, trimmed);
        setSaved(res?.data?.content || trimmed);
      }
    } catch (err) {
      setError(err?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  // Anonymous users: placeholder hint
  if (!isAuthed) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
        {t('engagement.note.signInToTakeNotes')}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <NoteIcon />
          {saved ? t('engagement.note.titleWithContent') : t('engagement.note.titleEmpty')}
        </span>
        <span className="text-[11px] text-gray-400">{expanded ? '▴' : '▾'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          {loading ? (
            <div className="h-20 animate-pulse rounded bg-gray-100 dark:bg-gray-700/50" />
          ) : (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
                onBlur={() => flush(content)}
                placeholder={t('engagement.note.placeholder')}
                rows={3}
                maxLength={MAX_LENGTH}
                className="w-full resize-y rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span>
                  {saving
                    ? t('engagement.note.saving')
                    : content !== saved
                    ? t('engagement.note.unsaved')
                    : saved
                    ? t('engagement.note.saved')
                    : ''}
                </span>
                <span className="tabular-nums">{content.length}/{MAX_LENGTH}</span>
              </div>
              {error && (
                <p className="mt-1 text-xs text-red-500" role="alert">{error}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  );
}
