// src/components/reviews/FlashcardMode.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { reviewsAPI, questionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';

/**
 * Anki-style flashcard review modal.
 *
 * Presents one due card at a time:
 *   1. Front: question text + answer options (read-only)
 *   2. User clicks "Show answer" → reveal the correct option + explanation
 *   3. User self-grades with again / hard / good / easy
 *   4. Card disappears, next one loads
 *
 * The four grades map to SM-2 quality 0..3. When all due cards are
 * processed the modal shows a summary and closes on dismiss.
 *
 * Hidden for anonymous users (route guard does this upstream, but we
 * defensively check here too).
 *
 * @param {{
 *   onClose: () => void,
 *   certificationId?: number,
 * }} props
 */
export default function FlashcardMode({ onClose, certificationId }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [queue, setQueue] = useState([]);
  const [position, setPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [grading, setGrading] = useState(false);
  const [details, setDetails] = useState(null);    // full question (text + options + explanation)
  const [stats, setStats] = useState({ graded: 0, again: 0, hard: 0, good: 0, easy: 0 });

  // Track whether we already loaded the initial queue
  const loadedRef = useRef(false);

  // ── Load due items on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    setLoading(true);
    reviewsAPI.getDue({ limit: 20, certificationId })
      .then((res) => {
        if (cancelled) return;
        const items = res?.data?.items || [];
        setQueue(items);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load reviews');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, certificationId]);

  // ── Load full question details when card changes ─────────────────────
  const currentCard = queue[position];

  useEffect(() => {
    if (!currentCard) {
      setDetails(null);
      return;
    }
    setRevealed(false);
    setSelectedOption(null);
    setDetails(null);

    let cancelled = false;
    questionAPI.getQuestion(currentCard.questionId)
      .then((res) => {
        if (cancelled) return;
        setDetails(res?.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('Failed to load card details:', err?.message);
        // Fall back to whatever the queue item carried
        setDetails({
          id: currentCard.questionId,
          text: currentCard.questionText,
          options: [],
        });
      });
    return () => { cancelled = true; };
  }, [currentCard]);

  // ── Keyboard shortcuts (1-4 = grade, space = reveal) ─────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && !grading && currentCard) {
        const map = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
        const q = map[e.key];
        if (q) {
          e.preventDefault();
          handleGrade(q);
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [revealed, grading, currentCard]); // handleGrade closed-over below

  // ── Grading ──────────────────────────────────────────────────────────
  const handleGrade = useCallback(async (quality) => {
    if (!currentCard || grading) return;
    setGrading(true);
    try {
      await reviewsAPI.gradeReview(currentCard.questionId, quality);
      setStats((s) => ({ ...s, graded: s.graded + 1, [quality]: (s[quality] || 0) + 1 }));
      setPosition((p) => p + 1);
    } catch (err) {
      logger.warn('Grade review failed:', err?.message);
      // Still advance so we don't lock the user on a broken card
      setStats((s) => ({ ...s, graded: s.graded + 1 }));
      setPosition((p) => p + 1);
    } finally {
      setGrading(false);
    }
  }, [currentCard, grading]);

  // ── Render ───────────────────────────────────────────────────────────
  if (!user) return null;

  const total = queue.length;
  const finished = !loading && position >= total;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-xl">🃏</span>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('reviews.flashcard.title', 'Flashcards')}
            </h2>
            {total > 0 && !finished && (
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {position + 1} / {total}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Cerrar')}
            className="p-1 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 min-h-[400px]">
          {loading && <LoadingState t={t} />}
          {!loading && error && <ErrorState message={error} t={t} />}
          {!loading && !error && total === 0 && <EmptyState t={t} />}
          {!loading && !error && total > 0 && finished && (
            <FinishedState stats={stats} t={t} onClose={onClose} />
          )}
          {!loading && !error && currentCard && !finished && (
            <CardView
              card={currentCard}
              details={details}
              revealed={revealed}
              selectedOption={selectedOption}
              onSelectOption={setSelectedOption}
              onReveal={() => setRevealed(true)}
              onGrade={handleGrade}
              grading={grading}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Subviews ───────────────────────────────────────────────────────── */

function LoadingState({ t }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('reviews.flashcard.loading', 'Cargando cartas…')}
      </p>
    </div>
  );
}

function ErrorState({ message, t }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div className="text-3xl">⚠️</div>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('reviews.flashcard.errorHint', 'Inténtalo de nuevo en unos minutos.')}
      </p>
    </div>
  );
}

function EmptyState({ t }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div className="text-5xl">🎉</div>
      <h3 className="text-base font-medium text-gray-800 dark:text-gray-100">
        {t('reviews.flashcard.empty.title', 'No hay nada que repasar')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        {t('reviews.flashcard.empty.description', 'Vuelve mañana o responde preguntas nuevas para crear tu cola de repaso.')}
      </p>
    </div>
  );
}

function FinishedState({ stats, t, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div className="text-5xl">✅</div>
      <h3 className="text-base font-medium text-gray-800 dark:text-gray-100">
        {t('reviews.flashcard.done.title', 'Sesión completada')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('reviews.flashcard.done.summary', '{{count}} carta repasada', { count: stats.graded })}
      </p>
      <div className="flex gap-2 mt-2 text-xs">
        {stats.again > 0 && <span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Again × {stats.again}</span>}
        {stats.hard > 0  && <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Hard × {stats.hard}</span>}
        {stats.good > 0  && <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Good × {stats.good}</span>}
        {stats.easy > 0  && <span className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Easy × {stats.easy}</span>}
      </div>
      <button
        onClick={onClose}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
      >
        {t('reviews.flashcard.done.close', 'Cerrar')}
      </button>
    </div>
  );
}

function CardView({ card, details, revealed, selectedOption, onSelectOption, onReveal, onGrade, grading, t }) {
  const text = details?.text || card.questionText || '';
  const options = details?.options || [];
  const explanation = details?.explanation || '';
  const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id);

  return (
    <div>
      {/* Topic / difficulty meta */}
      {(card.topicName || card.difficulty) && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {card.topicName && <span>{card.topicName}</span>}
          {card.difficulty && (
            <span className="px-1.5 py-0.5 rounded uppercase tracking-wide bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {card.difficulty}
            </span>
          )}
        </div>
      )}

      {/* Question text */}
      <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-5 whitespace-pre-wrap">
        {text}
      </p>

      {/* Options (interactive before reveal, marked after) */}
      {options.length > 0 && (
        <div className="space-y-2 mb-5">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = correctIds.includes(opt.id);
            let cls = 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
            if (revealed && isCorrect) {
              cls = 'border-green-500 bg-green-50 dark:bg-green-900/20';
            } else if (revealed && isSelected && !isCorrect) {
              cls = 'border-red-500 bg-red-50 dark:bg-red-900/20';
            } else if (isSelected) {
              cls = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
            }
            return (
              <button
                key={opt.id}
                disabled={revealed}
                onClick={() => onSelectOption(opt.id)}
                className={`w-full text-left p-3 rounded border-2 transition-colors text-sm ${cls}`}
              >
                {opt.text}
                {revealed && isCorrect && <span className="ml-2 text-green-600 dark:text-green-400">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Explanation (only after reveal) */}
      {revealed && explanation && (
        <div className="mb-5 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm text-gray-700 dark:text-gray-200">
          <strong className="block text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">
            {t('reviews.flashcard.explanation', 'Explicación')}
          </strong>
          <div className="whitespace-pre-wrap">{explanation}</div>
        </div>
      )}

      {/* Action: reveal OR grade buttons */}
      {!revealed ? (
        <button
          onClick={onReveal}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
        >
          {t('reviews.flashcard.showAnswer', 'Mostrar respuesta')}
          <span className="ml-2 text-xs opacity-70">{t('reviews.flashcard.spaceHint', '(espacio)')}</span>
        </button>
      ) : (
        <div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t('reviews.flashcard.howWell', '¿Qué tal lo recordaste?')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <GradeButton tone="red"    label={t('reviews.flashcard.again', 'Otra vez')}  shortcut="1" disabled={grading} onClick={() => onGrade('again')} />
            <GradeButton tone="amber"  label={t('reviews.flashcard.hard',  'Difícil')}  shortcut="2" disabled={grading} onClick={() => onGrade('hard')} />
            <GradeButton tone="blue"   label={t('reviews.flashcard.good',  'Bien')}     shortcut="3" disabled={grading} onClick={() => onGrade('good')} />
            <GradeButton tone="green"  label={t('reviews.flashcard.easy',  'Fácil')}    shortcut="4" disabled={grading} onClick={() => onGrade('easy')} />
          </div>
        </div>
      )}
    </div>
  );
}

function GradeButton({ tone, label, shortcut, onClick, disabled }) {
  const tones = {
    red:   'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-200',
    amber: 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-200',
    blue:  'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-200',
    green: 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-200',
  }[tone] || '';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tones}`}
    >
      <span className="block">{label}</span>
      <span className="text-[10px] opacity-60 mt-0.5 block">({shortcut})</span>
    </button>
  );
}
