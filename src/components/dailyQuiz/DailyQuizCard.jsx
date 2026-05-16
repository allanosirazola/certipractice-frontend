// src/components/dailyQuiz/DailyQuizCard.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { dailyQuizAPI } from '../../services/api';
import logger from '../../utils/logger';

const ANON_STORAGE_KEY = 'cp-daily-quiz-anon';

/**
 * Prominent CTA card on the landing page. Two states:
 *   - "Empezar" (with sparkles) if not done today
 *   - "✓ Completado hoy" (muted green) once finished
 *
 * For authed users the state comes from GET /daily-quiz/status. For
 * anonymous users we read localStorage (server doesn't track them).
 *
 * Clicking opens the DailyQuiz modal (passed via onOpen).
 */
export default function DailyQuizCard({ onOpen, refreshSignal }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [completed, setCompleted] = useState(null); // null = unknown
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Anon: check localStorage with today's UTC date
      if (!user) {
        try {
          const raw = window.localStorage.getItem(ANON_STORAGE_KEY);
          const stored = raw ? JSON.parse(raw) : null;
          const today = new Date().toISOString().slice(0, 10);
          if (!cancelled) {
            setCompleted(!!(stored && stored.date === today));
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setCompleted(false);
            setLoading(false);
          }
        }
        return;
      }

      // Auth: hit the server
      try {
        const res = await dailyQuizAPI.getStatus();
        if (!cancelled) {
          setCompleted(!!res?.data?.completed);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          logger.warn('DailyQuizCard status failed:', err?.message);
          setCompleted(false); // assume not done so user can try
          setLoading(false);
        }
      }
    }

    check();
    return () => { cancelled = true; };
  }, [user, refreshSignal]);

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 px-4 py-3 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const isDone = completed === true;

  return (
    <button
      onClick={onOpen}
      className={`w-full rounded-lg shadow border px-4 py-3 flex items-center gap-4 text-left transition-colors ${
        isDone
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 hover:bg-green-100/60 dark:hover:bg-green-900/30'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40'
      }`}
    >
      <div className="text-3xl shrink-0">{isDone ? '✅' : '📅'}</div>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold ${isDone ? 'text-green-800 dark:text-green-300' : 'text-blue-900 dark:text-blue-200'}`}>
          {isDone
            ? t('dailyQuiz.card.completedTitle', { defaultValue: 'Quiz diario completado' })
            : t('dailyQuiz.card.title', { defaultValue: 'Quiz diario · 5 preguntas' })}
        </div>
        <div className={`text-xs mt-0.5 ${isDone ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-300'}`}>
          {isDone
            ? t('dailyQuiz.card.completedSub', { defaultValue: 'Vuelve mañana para el siguiente.' })
            : t('dailyQuiz.card.sub', { defaultValue: 'Mantén tu racha — menos de 3 minutos.' })}
        </div>
      </div>
      <div className={`text-xs font-medium shrink-0 ${isDone ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
        {isDone
          ? t('dailyQuiz.card.review', { defaultValue: 'Revisar →' })
          : t('dailyQuiz.card.start', { defaultValue: 'Empezar →' })}
      </div>
    </button>
  );
}
