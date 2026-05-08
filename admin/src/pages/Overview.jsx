import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { analytics } from '../services/api.js';
import { useDateRange } from '../hooks/useDateRange.js';
import KpiCard, { KpiCardSkeleton } from '../components/KpiCard.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { formatCompact, formatNumber, formatPercent, formatMinutes, formatDateTime } from '../utils/format.js';

export default function Overview() {
  const { days, setDays, label } = useDateRange();

  const overviewQuery = useQuery({
    queryKey: ['overview', days],
    queryFn: ({ signal }) => analytics.overview({ days, signal }),
  });

  const examsQuery = useQuery({
    queryKey: ['exams-funnel', days],
    queryFn: ({ signal }) => analytics.exams({ days, signal }),
  });

  const usersQuery = useQuery({
    queryKey: ['users-summary', days],
    queryFn: ({ signal }) => analytics.users({ days, signal }),
  });

  const o = overviewQuery.data;
  const e = examsQuery.data;
  const u = usersQuery.data;

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{label} · compared to previous {label.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500">
            {overviewQuery.dataUpdatedAt ? `Updated ${formatDateTime(overviewQuery.dataUpdatedAt)}` : ''}
          </span>
          <button onClick={() => overviewQuery.refetch()} className="btn">↻ Refresh</button>
          <DateRangePicker days={days} onChange={setDays} />
        </div>
      </header>

      {overviewQuery.isError && (
        <ErrorBanner error={overviewQuery.error} onRetry={() => overviewQuery.refetch()} />
      )}

      {/* Top-level KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {overviewQuery.isLoading ? (
          <>
            <KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton />
          </>
        ) : o ? (
          <>
            <KpiCard
              label="Exams completed"
              value={formatCompact(o.exams.completed)}
              hint={`${formatNumber(o.exams.passed)} passed (${o.exams.passRate}%)`}
              delta={o.exams.completedDeltaPercent}
            />
            <KpiCard
              label="Active users"
              value={formatCompact(o.users.activeUsers)}
              hint={`${formatNumber(o.users.activeSessions)} anonymous sessions`}
            />
            <KpiCard
              label="Question accuracy"
              value={formatPercent(o.questions.accuracyRate)}
              hint={`${formatCompact(o.questions.answered)} answered of ${formatCompact(o.questions.views)} viewed`}
            />
            <KpiCard
              label="Avg exam time"
              value={formatMinutes(o.exams.averageTimeMinutes)}
              hint={`Average score ${formatPercent(o.exams.averageScore, 1)}`}
            />
          </>
        ) : null}
      </section>

      {/* Secondary KPI row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {overviewQuery.isLoading ? (
          <>
            <KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton />
          </>
        ) : o ? (
          <>
            <KpiCard
              label="Completion rate"
              value={formatPercent(o.exams.completionRate)}
              hint={`${formatNumber(o.exams.started)} started → ${formatNumber(o.exams.completed)} completed`}
            />
            <KpiCard
              label="Abandoned"
              value={formatCompact(o.exams.abandoned)}
              hint={`Of ${formatCompact(o.exams.started)} started`}
              deltaInverted
            />
            <KpiCard
              label="New registrations"
              value={formatCompact(o.users.registrations)}
              hint={`${formatNumber(o.users.logins)} sign-ins`}
            />
            <KpiCard
              label="Page views"
              value={formatCompact(o.users.pageViews)}
              hint={`${formatNumber(o.questions.uniqueQuestionsTouched)} unique questions touched`}
            />
          </>
        ) : null}
      </section>

      {/* Funnel + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-medium">Daily exam funnel</h2>
            <span className="text-[11px] text-neutral-500">created → started → completed</span>
          </div>
          <div className="card-body">
            {examsQuery.isLoading ? (
              <div className="skel h-64" />
            ) : e?.dailyFunnel?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={e.dailyFunnel} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="created" stroke="#a3a3a3" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="started" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="abandoned" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No exam events in this range." />}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-medium">Daily active users</h2>
            <span className="text-[11px] text-neutral-500">authenticated vs anonymous</span>
          </div>
          <div className="card-body">
            {usersQuery.isLoading ? (
              <div className="skel h-64" />
            ) : u?.dailyActiveUsers?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={u.dailyActiveUsers} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="authenticatedUsers" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="anonymousSessions" stackId="1" stroke="#737373" fill="#737373" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No user activity in this range." />}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  return (
    <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center justify-between">
      <div>
        <div className="text-sm text-red-300">Something went wrong</div>
        <div className="text-xs text-red-400/80 mt-0.5">{error?.message}</div>
      </div>
      {onRetry && <button onClick={onRetry} className="btn">Retry</button>}
    </div>
  );
}

export function EmptyState({ message }) {
  return <div className="h-64 grid place-items-center text-xs text-neutral-500">{message}</div>;
}
