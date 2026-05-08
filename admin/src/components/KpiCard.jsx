import React from 'react';
import { formatDelta } from '../utils/format.js';

/**
 * KPI card — large number with optional delta vs previous period.
 *
 * @param {string} label
 * @param {string|number} value
 * @param {string} [hint] - secondary line
 * @param {number} [delta] - percent change (e.g. 25 means +25%)
 * @param {boolean} [deltaInverted] - true if "negative" delta is good (e.g. abandon rate)
 */
export default function KpiCard({ label, value, hint, delta, deltaInverted = false }) {
  const deltaStr = formatDelta(delta);
  let deltaClass = 'text-neutral-500';
  if (deltaStr !== null && delta !== null && delta !== undefined) {
    const positive = delta > 0;
    const isGood = deltaInverted ? !positive : positive;
    deltaClass = isGood ? 'text-emerald-500' : 'text-red-500';
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="text-xs uppercase tracking-wide text-neutral-500 font-medium">{label}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="kpi-value text-3xl font-semibold text-neutral-50">{value ?? '—'}</div>
          {deltaStr && (
            <span className={`text-xs font-medium ${deltaClass}`}>{deltaStr}</span>
          )}
        </div>
        {hint && <div className="mt-1 text-xs text-neutral-500">{hint}</div>}
      </div>
    </div>
  );
}

/** Skeleton placeholder while data loads */
export function KpiCardSkeleton() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="skel h-3 w-24 mb-3" />
        <div className="skel h-8 w-32" />
      </div>
    </div>
  );
}
