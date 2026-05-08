import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analytics } from '../services/api.js';
import { useDateRange } from '../hooks/useDateRange.js';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { ErrorBanner } from './Overview.jsx';
import { formatDateTime } from '../utils/format.js';
import { buildAlerts } from '../utils/alerts.js';

/**
 * Alerts page — surfaces things that need attention based on rules
 * computed locally from the API responses.
 *
 * Rules implemented:
 *  - Pass rate < 50%
 *  - Completion rate < 60%
 *  - Question fail rate >= 75% (with at least 5 attempts)
 *  - Question reported >= 3 times
 *  - 5xx errors detected
 *  - Average exam time > 2× expected (45 min by default)
 */
export default function Alerts() {
  const { days, setDays, label } = useDateRange();

  const overviewQuery = useQuery({
    queryKey: ['overview', days],
    queryFn: ({ signal }) => analytics.overview({ days, signal }),
  });
  const questionsQuery = useQuery({
    queryKey: ['questions', days],
    queryFn: ({ signal }) => analytics.questions({ days, limit: 50, signal }),
  });
  const funnelQuery = useQuery({
    queryKey: ['site-funnel', days],
    queryFn: ({ signal }) => analytics.funnel({ days, signal }),
  });

  const alerts = useMemo(() => buildAlerts({
    overview: overviewQuery.data,
    questions: questionsQuery.data,
    funnel: funnelQuery.data,
  }), [overviewQuery.data, questionsQuery.data, funnelQuery.data]);

  const isLoading = overviewQuery.isLoading || questionsQuery.isLoading || funnelQuery.isLoading;
  const error = overviewQuery.error || questionsQuery.error || funnelQuery.error;

  const grouped = {
    critical: alerts.filter((a) => a.severity === 'critical'),
    warning: alerts.filter((a) => a.severity === 'warning'),
    info: alerts.filter((a) => a.severity === 'info'),
  };

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Alerts</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {label} · {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500">
            {overviewQuery.dataUpdatedAt ? `Updated ${formatDateTime(overviewQuery.dataUpdatedAt)}` : ''}
          </span>
          <button onClick={() => {
            overviewQuery.refetch(); questionsQuery.refetch(); funnelQuery.refetch();
          }} className="btn">↻ Refresh</button>
          <DateRangePicker days={days} onChange={setDays} />
        </div>
      </header>

      {error && <ErrorBanner error={error} />}

      {isLoading ? (
        <div className="space-y-3">
          <div className="skel h-20" />
          <div className="skel h-20" />
          <div className="skel h-20" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-5xl mb-3">✓</div>
            <h3 className="text-base font-medium text-neutral-200 mb-1">All clear</h3>
            <p className="text-xs text-neutral-500">No alerts for the selected period.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.critical.length > 0 && (
            <Section title="Critical" count={grouped.critical.length} alerts={grouped.critical} />
          )}
          {grouped.warning.length > 0 && (
            <Section title="Warning" count={grouped.warning.length} alerts={grouped.warning} />
          )}
          {grouped.info.length > 0 && (
            <Section title="Info" count={grouped.info.length} alerts={grouped.info} />
          )}
        </div>
      )}

      {/* Rules legend */}
      <details className="mt-8 text-xs text-neutral-500">
        <summary className="cursor-pointer hover:text-neutral-300">Alert rules</summary>
        <ul className="mt-3 space-y-1.5 pl-4 list-disc">
          <li><span className="tag tag-bad">critical</span> Pass rate below 50%</li>
          <li><span className="tag tag-bad">critical</span> Server errors (5xx) detected</li>
          <li><span className="tag tag-warn">warning</span> Completion rate below 60%</li>
          <li><span className="tag tag-warn">warning</span> Question fail rate ≥ 75% (≥ 5 attempts)</li>
          <li><span className="tag tag-warn">warning</span> Question reported ≥ 3 times</li>
          <li><span className="tag">info</span> Avg exam time {'>'} 90 min</li>
        </ul>
      </details>
    </div>
  );
}

function Section({ title, count, alerts }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
        {title} <span className="text-neutral-600">· {count}</span>
      </h2>
      <div className="space-y-2">
        {alerts.map((a) => <AlertCard key={a.id} alert={a} />)}
      </div>
    </section>
  );
}

function AlertCard({ alert }) {
  const sevClass = {
    critical: 'border-red-500/30 bg-red-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    info: 'border-neutral-700 bg-neutral-900/50',
  }[alert.severity];

  return (
    <div className={`rounded border ${sevClass} px-4 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-100">{alert.title}</div>
          <div className="text-xs text-neutral-400 mt-1">{alert.description}</div>
          {alert.metric && (
            <div className="text-[11px] text-neutral-500 mt-2 font-mono">
              {alert.metric}
            </div>
          )}
        </div>
        {alert.value && (
          <div className="text-right shrink-0">
            <div className={`text-lg font-semibold tabular-nums ${
              alert.severity === 'critical' ? 'text-red-400'
              : alert.severity === 'warning' ? 'text-amber-400'
              : 'text-neutral-300'
            }`}>{alert.value}</div>
          </div>
        )}
      </div>
    </div>
  );
}

