// src/components/engagement/SearchResultPreview.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { questionAPI } from '../../services/api';
import logger from '../../utils/logger';

/**
 * Lightweight modal that shows a single question selected from the
 * SearchBar dropdown. Read-only — used as a quick "what's this?"
 * preview, not a practice surface (we don't want users to "answer"
 * outside of a real exam session and pollute stats).
 *
 * The full question is loaded fresh via GET /questions/:id so we get
 * options and the explanation; the SearchBar result only carries a
 * snippet of question_text.
 *
 * @param {{ questionId: string, onClose: () => void }} props
 */
export default function SearchResultPreview({ questionId, onClose }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (!questionId) return;
    let cancelled = false;
    setLoading(true);
    questionAPI.getQuestion(questionId)
      .then((res) => {
        if (cancelled) return;
        setData(res?.data || null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('SearchResultPreview load failed:', err?.message);
        setError(err?.message || 'error');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [questionId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {t('engagement.search.previewTitle', { defaultValue: 'Vista previa' })}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Cerrar' })}
            className="p-1 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-5 min-h-[200px]">
          {loading && (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t('engagement.search.previewError', { defaultValue: 'No se pudo cargar la pregunta.' })}
            </p>
          )}

          {!loading && !error && data && (
            <>
              {data.topicName && (
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {data.topicName}
                </div>
              )}
              <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-4 whitespace-pre-wrap">
                {data.text || data.questionText}
              </p>

              {Array.isArray(data.options) && data.options.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {data.options.map((opt) => (
                    <li
                      key={opt.id}
                      className={`p-3 rounded border-2 text-sm ${
                        opt.isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-gray-100'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {opt.text}
                      {opt.isCorrect && (
                        <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {data.explanation && (
                <div>
                  {!showExplanation ? (
                    <button
                      type="button"
                      onClick={() => setShowExplanation(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t('engagement.search.showExplanation', { defaultValue: 'Mostrar explicación' })}
                    </button>
                  ) : (
                    <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm text-gray-700 dark:text-gray-200">
                      <strong className="block text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">
                        {t('engagement.search.explanation', { defaultValue: 'Explicación' })}
                      </strong>
                      <div className="whitespace-pre-wrap">{data.explanation}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
