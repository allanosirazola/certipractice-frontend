// src/components/dailyQuiz/DailyQuiz.jsx
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { dailyQuizAPI } from '../../services/api';
import logger from '../../utils/logger';

/**
 * Daily Quiz — 5-question challenge that surfaces SM-2 review cards
 * for authed users and a fresh random set for anon users.
 *
 * Flow:
 *   1) loading: GET /daily-quiz
 *   2) intro:   if not yet completed → show "Start" CTA
 *   3) playing: one question at a time, multiple-choice; immediate
 *      feedback after each pick
 *   4) finished: score summary + close
 *
 * If the API reports completed=true, jump straight to a "you already
 * did today" summary. The same questions are re-hydrated so users can
 * review their session.
 */

const ANON_STORAGE_KEY = 'cp-daily-quiz-anon';

export default function DailyQuiz({ onClose, onComplete }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [stage, setStage] = useState('loading'); // loading | intro | playing | finished | error
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  // ── Load on mount ────────────────────────────────────────────────────
  // Note: deliberately omitting `t` from the dep array even though it's
  // referenced in setError. With the global i18n mock used in tests,
  // useTranslation() returns a fresh { t } object on every render, so
  // including t here would re-fire the effect on every state change and
  // reset stage back to 'intro' the moment we transition to 'playing'.
  // The error string is set once on mount; the active language doesn't
  // change mid-session, so this is fine for production too.
  useEffect(() => {
    let cancelled = false;
    dailyQuizAPI.getDaily()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
          setError(t('dailyQuiz.error.noQuestions', { defaultValue: 'No hay preguntas disponibles hoy.' }));
          setStage('error');
          return;
        }
        setQuiz(data);

        // Anon: check localStorage for today's completion
        let anonCompletedToday = false;
        let anonPrevScore = null;
        if (!user) {
          try {
            const raw = window.localStorage.getItem(ANON_STORAGE_KEY);
            const stored = raw ? JSON.parse(raw) : null;
            if (stored && stored.date === data.date) {
              anonCompletedToday = true;
              anonPrevScore = stored.score;
            }
          } catch { /* ignore */ }
        }

        if (data.completed || anonCompletedToday) {
          setFinalScore({ score: data.previousScore ?? anonPrevScore ?? 0, total: data.questions.length });
          setStage('finished');
        } else {
          setStage('intro');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('DailyQuiz load failed:', err?.message);
        setError(err?.message || 'error');
        setStage('error');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Close on Escape ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const currentQuestion = quiz?.questions?.[position];

  const handleSelectOption = useCallback((optionId) => {
    if (answered) return;
    setSelected(optionId);
  }, [answered]);

  const handleConfirm = useCallback(() => {
    if (!currentQuestion || selected === null) return;
    const opt = currentQuestion.options.find((o) => o.id === selected);
    const isCorrect = !!opt?.isCorrect;
    setAnswered(true);
    setAnswers((prev) => [...prev, { questionId: currentQuestion.id, isCorrect }]);
  }, [currentQuestion, selected]);

  const handleNext = useCallback(async () => {
    const nextPosition = position + 1;
    if (nextPosition < (quiz?.questions?.length || 0)) {
      setPosition(nextPosition);
      setSelected(null);
      setAnswered(false);
      return;
    }
    // We just finished the last one — submit (or persist locally)
    const total = quiz.questions.length;
    const score = answers.filter((a) => a.isCorrect).length;

    if (user) {
      setSubmitting(true);
      try {
        await dailyQuizAPI.submit(answers);
      } catch (err) {
        logger.warn('Daily quiz submit failed:', err?.message);
        // Don't block: we still show the score, the user just won't see it
        // counted server-side until they retry next session.
      } finally {
        setSubmitting(false);
      }
    } else {
      try {
        window.localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify({
          date: quiz.date, score, total,
        }));
      } catch { /* ignore */ }
    }

    setFinalScore({ score, total });
    setStage('finished');
    onComplete?.({ score, total });
  }, [position, quiz, answers, user, onComplete]);

  const handleStart = () => {
    setStage('playing');
    setPosition(0);
    setSelected(null);
    setAnswered(false);
    setAnswers([]);
  };

  // ── Render ───────────────────────────────────────────────────────────
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
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('dailyQuiz.title', { defaultValue: 'Quiz diario' })}
            </h2>
            {stage === 'playing' && quiz && (
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {position + 1} / {quiz.questions.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Cerrar' })}
            className="p-1 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6 min-h-[300px]">
          {stage === 'loading' && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="text-3xl">⚠️</div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {stage === 'intro' && quiz && (
            <IntroView
              t={t}
              total={quiz.questions.length}
              isAuth={!!user}
              onStart={handleStart}
            />
          )}

          {stage === 'playing' && currentQuestion && (
            <PlayingView
              t={t}
              question={currentQuestion}
              selected={selected}
              answered={answered}
              onSelectOption={handleSelectOption}
              onConfirm={handleConfirm}
              onNext={handleNext}
              isLast={position === quiz.questions.length - 1}
            />
          )}

          {stage === 'finished' && finalScore && (
            <FinishedView
              t={t}
              score={finalScore.score}
              total={finalScore.total}
              submitting={submitting}
              isAuth={!!user}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Subviews ───────────────────────────────────────────────────────── */

function IntroView({ t, total, isAuth, onStart }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
      <div className="text-5xl">📅</div>
      <div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-100">
          {t('dailyQuiz.intro.title', { defaultValue: '5 preguntas hoy' })}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
          {isAuth
            ? t('dailyQuiz.intro.descriptionAuth', { defaultValue: 'Incluye repasos pendientes y nuevas preguntas. Tarda menos de 3 minutos.' })
            : t('dailyQuiz.intro.descriptionAnon', { defaultValue: '5 preguntas elegidas al azar. Tarda menos de 3 minutos.' })}
        </p>
      </div>
      <button
        onClick={onStart}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
      >
        {t('dailyQuiz.intro.start', { defaultValue: 'Empezar' })}
      </button>
    </div>
  );
}

function PlayingView({ t, question, selected, answered, onSelectOption, onConfirm, onNext, isLast }) {
  return (
    <div>
      {question.topicName && (
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          {question.topicName}
        </div>
      )}
      <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-5 whitespace-pre-wrap">
        {question.text}
      </p>

      <div className="space-y-2 mb-5">
        {(question.options || []).map((opt) => {
          const isSelected = selected === opt.id;
          let cls = 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
          if (answered) {
            if (opt.isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-900/20';
            else if (isSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-900/20';
            else cls = 'border-gray-200 dark:border-gray-700 opacity-60';
          } else if (isSelected) {
            cls = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
          }
          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => onSelectOption(opt.id)}
              className={`w-full text-left p-3 rounded border-2 transition-colors text-sm ${cls}`}
            >
              {opt.text}
              {answered && opt.isCorrect && (
                <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {answered && question.explanation && (
        <div className="mb-5 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm text-gray-700 dark:text-gray-200">
          <strong className="block text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">
            {t('dailyQuiz.explanation', { defaultValue: 'Explicación' })}
          </strong>
          <div className="whitespace-pre-wrap">{question.explanation}</div>
        </div>
      )}

      {!answered ? (
        <button
          onClick={onConfirm}
          disabled={selected === null}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
        >
          {t('dailyQuiz.confirm', { defaultValue: 'Confirmar' })}
        </button>
      ) : (
        <button
          onClick={onNext}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
        >
          {isLast
            ? t('dailyQuiz.finish', { defaultValue: 'Terminar' })
            : t('dailyQuiz.next', { defaultValue: 'Siguiente' })}
        </button>
      )}
    </div>
  );
}

function FinishedView({ t, score, total, submitting, isAuth, onClose }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  let emoji = '😐';
  let messageKey = 'fair';
  if (pct >= 80) { emoji = '🎉'; messageKey = 'great'; }
  else if (pct >= 50) { emoji = '👍'; messageKey = 'good'; }
  else { emoji = '💪'; messageKey = 'keepGoing'; }
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <div className="text-5xl">{emoji}</div>
      <div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-100">
          {t(`dailyQuiz.finished.${messageKey}`, { defaultValue: '¡Buen trabajo!' })}
        </h3>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2 tabular-nums">
          {score} / {total}
        </p>
        {!isAuth && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 max-w-xs">
            {t('dailyQuiz.finished.signInHint', {
              defaultValue: 'Regístrate para guardar tu progreso y conservar tu racha.',
            })}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        disabled={submitting}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
      >
        {submitting
          ? t('dailyQuiz.finished.saving', { defaultValue: 'Guardando…' })
          : t('dailyQuiz.finished.close', { defaultValue: 'Cerrar' })}
      </button>
    </div>
  );
}
