// src/components/studyPlans/CreateStudyPlanModal.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { studyPlansAPI } from '../../services/api';
import logger from '../../utils/logger';

/**
 * Modal that lets the user commit to an exam date + daily question goal.
 *
 * Computes a suggested daily goal client-side as the user fills the
 * form (just to give immediate feedback — the backend does the
 * authoritative validation). Submits via POST /study-plans; on success
 * calls onCreated() so the parent can refresh its card state.
 *
 * @param {{
 *   certificationId: number,
 *   certificationName?: string,
 *   onClose: () => void,
 *   onCreated?: (plan: object) => void,
 *   defaultPoolSize?: number,    // approx total questions to cover
 * }} props
 */
const TODAY = () => new Date().toISOString().slice(0, 10);
const PLUS_DAYS = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function CreateStudyPlanModal({
  certificationId, certificationName, onClose, onCreated,
  defaultPoolSize = 300,
}) {
  const { t } = useTranslation();
  const [targetDate, setTargetDate] = useState(PLUS_DAYS(30));
  const [dailyGoal, setDailyGoal] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Suggest a daily goal: total / days, clamped to 1..50 for sanity
  useEffect(() => {
    if (!targetDate) return;
    const days = Math.max(1, daysBetween(TODAY(), targetDate));
    const suggested = Math.max(1, Math.min(50, Math.ceil(defaultPoolSize / days)));
    setDailyGoal(suggested);
  }, [targetDate, defaultPoolSize]);

  // Esc closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    setError(null);
    if (!certificationId) {
      setError(t('studyPlan.create.errorNoCert', { defaultValue: 'Selecciona una certificación primero.' }));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      setError(t('studyPlan.create.errorBadDate', { defaultValue: 'Fecha no válida.' }));
      return;
    }
    if (daysBetween(TODAY(), targetDate) < 1) {
      setError(t('studyPlan.create.errorPast', { defaultValue: 'La fecha debe ser al menos mañana.' }));
      return;
    }
    if (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 200) {
      setError(t('studyPlan.create.errorGoal', { defaultValue: 'El objetivo diario debe estar entre 1 y 200.' }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await studyPlansAPI.create({
        certificationId,
        targetDate,
        dailyGoal,
      });
      onCreated?.(res?.data || null);
      onClose?.();
    } catch (err) {
      logger.warn('Create study plan failed:', err?.message);
      setError(err?.message || t('studyPlan.create.errorGeneric', { defaultValue: 'No se pudo crear el plan.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const days = Math.max(0, daysBetween(TODAY(), targetDate));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {t('studyPlan.create.title', { defaultValue: 'Crear plan de estudio' })}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Cerrar' })}
            className="p-1 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {certificationName && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('studyPlan.create.forCert', {
                cert: certificationName,
                defaultValue: 'Para: {{cert}}',
              })}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t('studyPlan.create.targetDateLabel', { defaultValue: 'Fecha del examen' })}
            </label>
            <input
              type="date"
              value={targetDate}
              min={PLUS_DAYS(1)}
              max={PLUS_DAYS(365 * 2)}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {days > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('studyPlan.create.daysInfo', {
                  count: days,
                  defaultValue: '{{count}} días desde hoy',
                })}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('studyPlan.create.dailyGoalLabel', { defaultValue: 'Preguntas por día' })}
              </label>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                {dailyGoal}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? t('studyPlan.create.submitting', { defaultValue: 'Creando…' })
                : t('studyPlan.create.submit', { defaultValue: 'Crear plan' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function daysBetween(fromIso, toIso) {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / 86_400_000);
}
