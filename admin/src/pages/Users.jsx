import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { analytics } from '../services/api.js';
import { useDateRange } from '../hooks/useDateRange.js';
import DateRangePicker from '../components/DateRangePicker.jsx';
import KpiCard, { KpiCardSkeleton } from '../components/KpiCard.jsx';
import { ErrorBanner, EmptyState } from './Overview.jsx';
import { formatNumber, formatCompact, formatDateTime, formatDuration } from '../utils/format.js';
import { downloadCsv } from '../utils/csv.js';

export default function Users() {
  const { days, setDays, label } = useDateRange();

  const q = useQuery({
    queryKey: ['users-detail', days],
    queryFn: ({ signal }) => analytics.users({ days, signal }),
  });

  const data = q.data;

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500">
            {q.dataUpdatedAt ? `Updated ${formatDateTime(q.dataUpdatedAt)}` : ''}
          </span>
          <button onClick={() => q.refetch()} className="btn">↻ Refresh</button>
          <DateRangePicker days={days} onChange={setDays} />
        </div>
      </header>

      {q.isError && <ErrorBanner error={q.error} onRetry={() => q.refetch()} />}

      {/* Page-view duration percentiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {q.isLoading ? (
          <>
            <KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton />
          </>
        ) : data ? (
          <>
            <KpiCard
              label="Authenticated"
              value={formatCompact(data.userSplit.authenticated)}
              hint="Activity events from logged-in users"
            />
            <KpiCard
              label="Anonymous"
              value={formatCompact(data.userSplit.anonymous)}
              hint="Activity events without an account"
            />
            <KpiCard
              label="Median page duration"
              value={formatDuration(data.pageViewDuration.medianMs)}
              hint={`p95 ${formatDuration(data.pageViewDuration.p95Ms)}`}
            />
            <KpiCard
              label="Avg page duration"
              value={formatDuration(data.pageViewDuration.averageMs)}
            />
          </>
        ) : null}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* DAU chart */}
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-medium">Daily users</h2></div>
          <div className="card-body">
            {q.isLoading ? <div className="skel h-64" /> : data?.dailyActiveUsers?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.dailyActiveUsers} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="authenticatedUsers" name="Authenticated" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="anonymousSessions" name="Anonymous" stroke="#737373" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No data." />}
          </div>
        </div>

        {/* Auth split donut */}
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-medium">Authenticated vs anonymous</h2></div>
          <div className="card-body">
            {q.isLoading ? <div className="skel h-64" /> : data ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Authenticated', value: data.userSplit.authenticated },
                      { name: 'Anonymous', value: data.userSplit.anonymous },
                    ]}
                    dataKey="value"
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    <Cell fill="#3b82f6" stroke="none" />
                    <Cell fill="#737373" stroke="none" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No data." />}
          </div>
        </div>
      </div>

      {/* Most active users */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-medium">Most active users</h2>
          <button
            onClick={() => data?.mostActiveUsers && downloadCsv(`active-users-${days}d`, data.mostActiveUsers, [
              { key: 'userId', label: 'ID' },
              { key: 'username', label: 'Username' },
              { key: 'email', label: 'Email' },
              { key: 'activities', label: 'Activities' },
              { key: 'pageViews', label: 'Page views' },
              { key: 'examsCompleted', label: 'Exams completed' },
            ])}
            className="btn"
            disabled={!data?.mostActiveUsers?.length}
          >↓ Export CSV</button>
        </div>
        <div className="card-body p-0">
          {q.isLoading ? (
            <div className="skel h-72 m-4" />
          ) : data?.mostActiveUsers?.length ? (
            <table className="dense">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th className="num">Activities</th>
                  <th className="num">Page views</th>
                  <th className="num">Exams done</th>
                </tr>
              </thead>
              <tbody>
                {data.mostActiveUsers.map((u) => (
                  <tr key={u.userId}>
                    <td className="text-neutral-200 font-medium">{u.username}</td>
                    <td className="text-neutral-400">{u.email}</td>
                    <td className="num">{formatNumber(u.activities)}</td>
                    <td className="num">{formatNumber(u.pageViews)}</td>
                    <td className="num">{formatNumber(u.examsCompleted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState message="No active users in this range." />}
        </div>
      </section>

      {/* Registrations sparkline */}
      {data?.registrationsByDay?.length > 0 && (
        <section className="card mt-4">
          <div className="card-header"><h2 className="text-sm font-medium">Registrations by day</h2></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.registrationsByDay} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip
                  contentStyle={{ background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="registrations" name="New users" stroke="#22c55e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
