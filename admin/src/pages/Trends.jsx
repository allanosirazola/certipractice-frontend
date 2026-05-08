import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { analytics } from '../services/api.js';
import { useDateRange } from '../hooks/useDateRange.js';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { ErrorBanner, EmptyState } from './Overview.jsx';
import { formatDateTime } from '../utils/format.js';
import { downloadCsv } from '../utils/csv.js';

const tooltipStyle = {
  contentStyle: { background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 },
  labelStyle: { color: '#a3a3a3' },
};

const tickFmt = (v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function Trends() {
  const { days, setDays, label } = useDateRange();

  const tsQuery = useQuery({
    queryKey: ['timeseries', days, 'global'],
    queryFn: ({ signal }) => analytics.timeseries({ days, scope: 'global', signal }),
  });

  const examsQuery = useQuery({
    queryKey: ['exams-funnel', days],
    queryFn: ({ signal }) => analytics.exams({ days, signal }),
  });

  const rows = tsQuery.data?.rows || [];

  const exportRows = () => {
    if (!rows.length) return;
    downloadCsv(`trends-${days}d`, rows, [
      { key: 'date', label: 'Date' },
      { key: 'examsCreated', label: 'Exams created' },
      { key: 'examsStarted', label: 'Exams started' },
      { key: 'examsCompleted', label: 'Exams completed' },
      { key: 'examsAbandoned', label: 'Exams abandoned' },
      { key: 'examsPassed', label: 'Exams passed' },
      { key: 'averageScore', label: 'Avg score' },
      { key: 'questionsAnswered', label: 'Questions answered' },
      { key: 'questionsCorrect', label: 'Questions correct' },
      { key: 'uniqueUsers', label: 'Unique users' },
      { key: 'pageViews', label: 'Page views' },
      { key: 'logins', label: 'Logins' },
      { key: 'newUsers', label: 'New users' },
    ]);
  };

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Trends</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportRows} className="btn" disabled={!rows.length}>↓ Export CSV</button>
          <span className="text-[11px] text-neutral-500">
            {tsQuery.dataUpdatedAt ? `Updated ${formatDateTime(tsQuery.dataUpdatedAt)}` : ''}
          </span>
          <button onClick={() => { tsQuery.refetch(); examsQuery.refetch(); }} className="btn">↻ Refresh</button>
          <DateRangePicker days={days} onChange={setDays} />
        </div>
      </header>

      {tsQuery.isError && <ErrorBanner error={tsQuery.error} onRetry={() => tsQuery.refetch()} />}

      {/* Empty state when no daily_metrics computed yet */}
      {!tsQuery.isLoading && rows.length === 0 && !tsQuery.isError && (
        <div className="card mb-6">
          <div className="card-body text-center text-sm text-neutral-400">
            No pre-aggregated metrics for this range yet.<br />
            <span className="text-xs text-neutral-500">
              Run <code className="text-neutral-300">npm run metrics:daily</code> on the backend, or trigger via API.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exams: stacked daily activity */}
        <ChartCard title="Exam activity (daily)" hint="created · started · completed · abandoned">
          {tsQuery.isLoading ? <div className="skel h-72" /> : rows.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickFmt} />
                <YAxis />
                <Tooltip {...tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="examsCreated" name="Created" fill="#737373" />
                <Bar dataKey="examsStarted" name="Started" fill="#3b82f6" />
                <Bar dataKey="examsCompleted" name="Completed" fill="#22c55e" />
                <Bar dataKey="examsAbandoned" name="Abandoned" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No data." />}
        </ChartCard>

        {/* Avg score over time */}
        <ChartCard title="Average exam score" hint="among completed exams">
          {tsQuery.isLoading ? <div className="skel h-72" /> : rows.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickFmt} />
                <YAxis domain={[0, 100]} />
                <Tooltip {...tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString()} formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Area type="monotone" dataKey="averageScore" name="Avg score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No data." />}
        </ChartCard>

        {/* Question answers */}
        <ChartCard title="Question answers" hint="correct vs total answered">
          {tsQuery.isLoading ? <div className="skel h-72" /> : rows.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickFmt} />
                <YAxis />
                <Tooltip {...tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="questionsAnswered" name="Answered" stroke="#a3a3a3" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="questionsCorrect" name="Correct" stroke="#22c55e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No data." />}
        </ChartCard>

        {/* Users */}
        <ChartCard title="Users & activity" hint="unique users · new sign-ups · logins">
          {tsQuery.isLoading ? <div className="skel h-72" /> : rows.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickFmt} />
                <YAxis />
                <Tooltip {...tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="uniqueUsers" name="Unique users" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="newUsers" name="New" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="logins" name="Logins" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No data." />}
        </ChartCard>
      </div>

      {/* Mode breakdown from exams query */}
      {examsQuery.data?.byMode?.length > 0 && (
        <section className="card mt-6">
          <div className="card-header"><h2 className="text-sm font-medium">By exam mode</h2></div>
          <div className="card-body p-0">
            <table className="dense">
              <thead>
                <tr><th>Mode</th><th className="num">Count</th><th className="num">Avg score</th></tr>
              </thead>
              <tbody>
                {examsQuery.data.byMode.map((row) => (
                  <tr key={row.mode}>
                    <td>{row.mode}</td>
                    <td className="num tabular-nums">{row.count}</td>
                    <td className="num tabular-nums">{row.averageScore != null ? `${row.averageScore}%` : '—'}</td>
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

function ChartCard({ title, hint, children }) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <span className="text-[11px] text-neutral-500">{hint}</span>}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
