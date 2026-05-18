// src/components/studyPlans/StudyPlanCard.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { studyPlansAPI } from '../../services/api';
import logger from '../../utils/logger';

/**
 * Compact card surfacing the user's active study plan for the
 * currently-selected certification.
 *
 * Three states:
 *   - no plan       → CTA "Crear plan de estudio"
 *   - active plan   → progress card (days left, daily goal, status)
 *   - api error     → silent (no card; never breaks landing)
 *
 * Hidden entirely for anonymous users (study plans require auth).
 *
 * @param {{
 *   certificationId: number,
 *   onCreate: () => void,    // open the creation modal
 *   refreshSignal?: any,     // bump to force a re-fetch
 *   className?: string,
 * }} props
 */
export default function StudyPlanCard({ certificationId, onCreate, refreshSignal, className = '' }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user || certificationId == null) {
      setPlan(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    studyPlansAPI.getForCertification(certificationId)
      .then((res) => {
        if (cancelled) return;
        setPlan(res?.data || null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('StudyPlanCard fetch failed:', err?.message);
        setError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, certificationId, refreshSignal]);

  if (!user || certificationId == null) return null;

  if (loading) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 animate-pulse ${className}`}>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (error) return null; // Silent failure — don't pollute the landing

  // No plan → CTA
  if (!plan) {
    return (
      <button
        onClick={onCreate}
        className={`w-full rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-4 py-3 flex items-center gap-3 text-left transition-colors ${className}`}
      >
        <span className="text-2xl shrink-0" aria-hidden="true">🎯</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
            {t('studyPlan.card.noPlanTitle', { defaultValue: 'Crear plan de estudio' })}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
            {t('studyPlan.card.noPlanSub', { defaultValue: 'Pon una fecha de examen y nosotros te marcamos el ritmo.' })}
          </div>
        </div>
        <div className="text-xs font-medium text-blue-700 dark:text-blue-300 shrink-0">
          {t('studyPlan.card.create', { defaultValue: 'Crear →' })}
        </div>
      </button>
    );
  }

  // Active plan
  const statusTone = STATUS_TONES[plan.status] || STATUS_TONES.on_track;
  const dailyTarget = plan.adjustedDailyGoal || plan.dailyGoal;
  const todayPct = dailyTarget > 0
    ? Math.min(100, Math.round((plan.answeredToday / dailyTarget) * 100))
    : 0;

  return (
    <div className={`rounded-lg border bg-white dark:bg-gray-800 p-3 ${statusTone.border} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">🎯</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${statusTone.title}`}>
              {t(`studyPlan.status.${plan.status}`, {
                defaultValue: STATUS_DEFAULTS[plan.status] || 'En camino',
              })}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
              {plan.daysRemaining > 0
                ? t('studyPlan.card.daysLeft', {
                    count: plan.daysRemaining,
                    defaultValue: '{{count}} días',
                  })
                : t('studyPlan.card.examPast', { defaultValue: 'Examen pasado' })}
            </span>
          </div>

          {/* Today's progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>
                {t('studyPlan.card.todayProgress', {
                  done: plan.answeredToday,
                  goal: dailyTarget,
                  defaultValue: 'Hoy: {{done}}/{{goal}} preguntas',
                })}
              </span>
              <span className="tabular-nums">{todayPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${statusTone.bar}`}
                style={{ width: `${todayPct}%` }}
              />
            </div>
          </div>

          {plan.status === 'behind' && plan.adjustedDailyGoal > plan.dailyGoal && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              {t('studyPlan.card.adjustHint', {
                goal: plan.adjustedDailyGoal,
                defaultValue: 'Sube a {{goal}}/día para llegar a tiempo.',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_DEFAULTS = {
  on_track:   'En camino',
  ahead:      'Por delante',
  behind:     'Te has retrasado',
  overdue:    'Fecha pasada',
};

const STATUS_TONES = {
  on_track: {
    border: 'border-blue-200 dark:border-blue-700',
    title:  'text-blue-800 dark:text-blue-300',
    bar:    'bg-blue-500',
  },
  ahead: {
    border: 'border-green-200 dark:border-green-700',
    title:  'text-green-800 dark:text-green-300',
    bar:    'bg-green-500',
  },
  behind: {
    border: 'border-amber-200 dark:border-amber-700',
    title:  'text-amber-800 dark:text-amber-300',
    bar:    'bg-amber-500',
  },
  overdue: {
    border: 'border-red-200 dark:border-red-700',
    title:  'text-red-800 dark:text-red-300',
    bar:    'bg-red-500',
  },
};
