import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { analytics } from '../services/api.js';
import { useDateRange } from '../hooks/useDateRange.js';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { ErrorBanner, EmptyState } from './Overview.jsx';
import { formatNumber, formatPercent, formatDateTime, formatDuration } from '../utils/format.js';
import { downloadCsv } from '../utils/csv.js';

export default function Funnel() {
  const { days, setDays, label } = useDateRange();

  const examsQuery = useQuery({
    queryKey: ['exams-funnel', days],
    queryFn: ({ signal }) => analytics.exams({ days, signal }),
  });
  const funnelQuery = useQuery({
    queryKey: ['site-funnel', days],
    queryFn: ({ signal }) => analytics.funnel({ days, signal }),
  });

  const e = examsQuery.data;
  const f = funnelQuery.data;

  /* Compute exam-flow conversion stages from overview shape */
  const stages = e ? buildStages(e) : null;

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Funnel</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500">
            {examsQuery.dataUpdatedAt ? `Updated ${formatDateTime(examsQuery.dataUpdatedAt)}` : ''}
          </span>
          <button onClick={() => { examsQuery.refetch(); funnelQuery.refetch(); }} className="btn">↻ Refresh</button>
          <DateRangePicker days={days} onChange={setDays} />
        </div>
      </header>

      {(examsQuery.isError || funnelQuery.isError) && (
        <ErrorBanner error={examsQuery.error || funnelQuery.error} />
      )}

      {/* Exam funnel stages */}
      <section className="card mb-6">
        <div className="card-header">
          <h2 className="text-sm font-medium">Exam flow conversion</h2>
        </div>
        <div className="card-body">
          {examsQuery.isLoading ? (
            <div className="skel h-40" />
          ) : stages ? (
            <ExamFunnelStages stages={stages} />
          ) : <EmptyState message="No exam events in this range." />}
        </div>
      </section>

      {/* Drop-off by question index */}
      <section className="card mb-6">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-medium">Where users abandon (by question index)</h2>
          <span className="text-[11px] text-neutral-500">
            Higher bars = more abandonment at that question position
          </span>
        </div>
        <div className="card-body">
          {examsQuery.isLoading ? (
            <div className="skel h-64" />
          ) : e?.abandonmentByQuestionIndex?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={e.abandonmentByQuestionIndex} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="questionIndex" label={{ value: 'Question #', position: 'insideBottom', offset: -2, fill: '#737373', fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{ background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 }}
                  labelFormatter={(v) => `Question #${v}`}
                />
                <Bar dataKey="abandonments" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No abandonment events recorded." />}
        </div>
      </section>

      {/* Top paths + errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-medium">Top paths</h2>
            <button
              onClick={() => f?.topPaths && downloadCsv(`paths-${days}d`, f.topPaths, [
                { key: 'path', label: 'Path' },
                { key: 'visits', label: 'Visits' },
                { key: 'uniqueVisitors', label: 'Unique visitors' },
                { key: 'averageDurationMs', label: 'Avg duration (ms)' },
                { key: 'errorResponses', label: 'Errors' },
              ])}
              className="btn"
              disabled={!f?.topPaths?.length}
            >↓ CSV</button>
          </div>
          <div className="card-body p-0">
            {funnelQuery.isLoading ? <div className="skel h-64 m-4" /> : f?.topPaths?.length ? (
              <table className="dense">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th className="num">Visits</th>
                    <th className="num">Unique</th>
                    <th className="num">Avg</th>
                    <th className="num">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {f.topPaths.slice(0, 15).map((p) => (
                    <tr key={p.path}>
                      <td className="font-mono text-xs text-neutral-300 max-w-[200px] truncate">{p.path}</td>
                      <td className="num">{formatNumber(p.visits)}</td>
                      <td className="num">{formatNumber(p.uniqueVisitors)}</td>
                      <td className="num">{formatDuration(p.averageDurationMs)}</td>
                      <td className="num">
                        {p.errorResponses > 0
                          ? <span className="tag tag-bad">{p.errorResponses}</span>
                          : <span className="text-neutral-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState message="No path data." />}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="text-sm font-medium">Errors (4xx/5xx)</h2></div>
          <div className="card-body p-0">
            {funnelQuery.isLoading ? <div className="skel h-64 m-4" /> : f?.errors?.length ? (
              <table className="dense">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th className="num">Status</th>
                    <th className="num">Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {f.errors.map((err, i) => (
                    <tr key={`${err.path}-${err.statusCode}-${i}`}>
                      <td className="font-mono text-xs text-neutral-300 max-w-[200px] truncate">{err.path}</td>
                      <td className="num">
                        <span className={`tag ${err.statusCode >= 500 ? 'tag-bad' : 'tag-warn'}`}>
                          {err.statusCode}
                        </span>
                      </td>
                      <td className="num">{formatNumber(err.occurrences)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState message="No errors recorded. Nice." />}
          </div>
        </div>
      </div>

      {/* Search queries */}
      {f?.topSearchQueries?.length > 0 && (
        <section className="card mt-4">
          <div className="card-header"><h2 className="text-sm font-medium">Top search queries</h2></div>
          <div className="card-body p-0">
            <table className="dense">
              <thead>
                <tr><th>Query</th><th className="num">Searches</th></tr>
              </thead>
              <tbody>
                {f.topSearchQueries.map((s, i) => (
                  <tr key={`${s.query}-${i}`}>
                    <td className="font-mono text-xs text-neutral-300">{s.query}</td>
                    <td className="num">{formatNumber(s.searches)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function buildStages(e) {
  const created = sumDaily(e.dailyFunnel, 'created');
  const started = sumDaily(e.dailyFunnel, 'started');
  const completed = sumDaily(e.dailyFunnel, 'completed');
  const abandoned = sumDaily(e.dailyFunnel, 'abandoned');
  return [
    { label: 'Created', count: created, percent: 100 },
    { label: 'Started', count: started, percent: pct(started, created) },
    { label: 'Completed', count: completed, percent: pct(completed, started) },
    { label: 'Abandoned', count: abandoned, percent: pct(abandoned, started), bad: true },
  ];
}

function sumDaily(rows, key) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

function pct(n, base) {
  if (!base) return 0;
  return Math.round((n / base) * 100);
}

function ExamFunnelStages({ stages }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-300 font-medium">{s.label}</span>
            <span className="tabular-nums">
              <span className="text-neutral-200">{formatNumber(s.count)}</span>
              {i > 0 && (
                <span className={`ml-2 text-[11px] ${s.bad ? 'text-red-400' : 'text-neutral-500'}`}>
                  {formatPercent(s.percent)}
                  {!s.bad && stages[i - 1] && stages[i - 1].count > 0 && ' of previous'}
                </span>
              )}
            </span>
          </div>
          <div className="h-6 bg-[var(--bg-2)] rounded overflow-hidden">
            <div
              className={s.bad ? 'h-full bg-red-500/40' : 'h-full bg-blue-500/60'}
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
