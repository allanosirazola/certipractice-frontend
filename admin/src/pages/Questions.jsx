import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { analytics } from '../services/api.js';
import { useDateRange } from '../hooks/useDateRange.js';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { ErrorBanner, EmptyState } from './Overview.jsx';
import { formatNumber, formatPercent, formatDateTime } from '../utils/format.js';
import { downloadCsv } from '../utils/csv.js';

const TABS = [
  { key: 'failed', label: 'Most failed' },
  { key: 'viewed', label: 'Most viewed' },
  { key: 'reported', label: 'Most reported' },
];

export default function Questions() {
  const { days, setDays, label } = useDateRange();
  const [tab, setTab] = useState('failed');
  const [drillDown, setDrillDown] = useState(null); // selected questionId

  const q = useQuery({
    queryKey: ['questions', days],
    queryFn: ({ signal }) => analytics.questions({ days, limit: 50, signal }),
  });

  const data = q.data;

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Questions</h1>
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

      {/* Distribution + by-difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DistributionCard data={data} loading={q.isLoading} />
        <DifficultyCard data={data} loading={q.isLoading} />
      </div>

      {/* Tabs + table */}
      <section className="card">
        <div className="card-header flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  tab === t.key
                    ? 'bg-[var(--bg-3)] text-neutral-50'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportTab(data, tab, days)}
            disabled={!data}
            className="btn"
          >↓ Export CSV</button>
        </div>
        {q.isLoading ? <div className="skel h-72 m-4" /> : (
          <QuestionTable
            tab={tab}
            data={data}
            onSelect={setDrillDown}
            selectedId={drillDown}
          />
        )}
      </section>

      {/* Drill-down sidebar */}
      {drillDown && (
        <DrillDownPanel
          questionId={drillDown}
          data={data}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  );
}

/* ─── Distribution chart ─────────────────────────────────────────────── */
function DistributionCard({ data, loading }) {
  return (
    <div className="card">
      <div className="card-header"><h2 className="text-sm font-medium">Accuracy distribution</h2></div>
      <div className="card-body">
        {loading ? <div className="skel h-56" /> : data?.accuracyDistribution?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.accuracyDistribution} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip
                contentStyle={{ background: '#161616', border: '1px solid #404040', borderRadius: 4, fontSize: 12 }}
              />
              <Bar dataKey="questions" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState message="No data." />}
      </div>
    </div>
  );
}

/* ─── By-difficulty table ────────────────────────────────────────────── */
function DifficultyCard({ data, loading }) {
  return (
    <div className="card">
      <div className="card-header"><h2 className="text-sm font-medium">By difficulty</h2></div>
      <div className="card-body p-0">
        {loading ? <div className="skel h-56 m-4" /> : data?.byDifficulty?.length ? (
          <table className="dense">
            <thead>
              <tr>
                <th>Difficulty</th>
                <th className="num">Attempts</th>
                <th className="num">Accuracy</th>
                <th className="num">Avg time</th>
              </tr>
            </thead>
            <tbody>
              {data.byDifficulty.map((d) => (
                <tr key={d.difficulty}>
                  <td className="capitalize">{d.difficulty}</td>
                  <td className="num">{formatNumber(d.attempts)}</td>
                  <td className="num">
                    {d.accuracyRate != null ? (
                      <span className={`tag ${d.accuracyRate >= 75 ? 'tag-good' : d.accuracyRate >= 50 ? 'tag-warn' : 'tag-bad'}`}>
                        {formatPercent(d.accuracyRate)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="num">{d.averageTimeSeconds != null ? `${d.averageTimeSeconds}s` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState message="No data." />}
      </div>
    </div>
  );
}

/* ─── Top-N table ────────────────────────────────────────────────────── */
function QuestionTable({ tab, data, onSelect, selectedId }) {
  if (!data) return null;
  const list = tab === 'failed' ? data.mostFailedQuestions
    : tab === 'viewed' ? data.mostViewedQuestions
    : data.mostReportedQuestions;

  if (!list?.length) {
    return <div className="card-body"><EmptyState message="No data for this tab." /></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="dense">
        <thead>
          <tr>
            <th>Question</th>
            {tab === 'failed' && <>
              <th>Topic</th>
              <th className="num">Attempts</th>
              <th className="num">Failures</th>
              <th className="num">Fail rate</th>
            </>}
            {tab === 'viewed' && <>
              <th>Topic</th>
              <th className="num">Views</th>
            </>}
            {tab === 'reported' && <>
              <th className="num">Reports</th>
            </>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr
              key={row.questionId}
              onClick={() => onSelect(row.questionId)}
              className={`cursor-pointer ${selectedId === row.questionId ? 'bg-[var(--bg-2)]' : ''}`}
            >
              <td className="max-w-md truncate text-neutral-300">{row.preview}</td>
              {tab === 'failed' && <>
                <td className="text-neutral-400">{row.topicName || '—'}</td>
                <td className="num">{formatNumber(row.attempts)}</td>
                <td className="num">{formatNumber(row.failures)}</td>
                <td className="num">
                  <span className={`tag ${row.failRate >= 50 ? 'tag-bad' : row.failRate >= 30 ? 'tag-warn' : 'tag-good'}`}>
                    {formatPercent(row.failRate, 1)}
                  </span>
                </td>
              </>}
              {tab === 'viewed' && <>
                <td className="text-neutral-400">{row.topicName || '—'}</td>
                <td className="num">{formatNumber(row.views)}</td>
              </>}
              {tab === 'reported' && <>
                <td className="num">
                  <span className="tag tag-warn">{formatNumber(row.reports)}</span>
                </td>
              </>}
              <td className="text-xs text-neutral-500">→</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Drill-down panel ───────────────────────────────────────────────── */
function DrillDownPanel({ questionId, data, onClose }) {
  // Find question across all lists
  const found =
    data?.mostFailedQuestions?.find((q) => q.questionId === questionId) ||
    data?.mostViewedQuestions?.find((q) => q.questionId === questionId) ||
    data?.mostReportedQuestions?.find((q) => q.questionId === questionId);

  if (!found) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside
        className="relative w-full max-w-md h-full bg-[var(--bg-1)] border-l border-[var(--border)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-medium">Question detail</h2>
          <button onClick={onClose} className="btn btn-ghost">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">ID</div>
            <code className="text-xs text-neutral-300">{questionId}</code>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Question</div>
            <div className="text-sm text-neutral-200 leading-relaxed">{found.preview}</div>
          </div>
          {found.topicName && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Topic" value={found.topicName} />
              {found.certificationName && <Field label="Certification" value={found.certificationName} />}
              {found.difficulty && <Field label="Difficulty" value={found.difficulty} />}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
            {found.attempts != null && <Field label="Attempts" value={formatNumber(found.attempts)} />}
            {found.failures != null && <Field label="Failures" value={formatNumber(found.failures)} />}
            {found.failRate != null && <Field label="Fail rate" value={formatPercent(found.failRate, 1)} />}
            {found.views != null && <Field label="Views" value={formatNumber(found.views)} />}
            {found.reports != null && <Field label="Reports" value={formatNumber(found.reports)} />}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">{label}</div>
      <div className="text-sm text-neutral-200 capitalize">{value}</div>
    </div>
  );
}

/* ─── CSV export per tab ──────────────────────────────────────────────── */
function exportTab(data, tab, days) {
  if (!data) return;
  if (tab === 'failed') {
    downloadCsv(`questions-failed-${days}d`, data.mostFailedQuestions, [
      { key: 'questionId', label: 'Question ID' },
      { key: 'preview', label: 'Preview' },
      { key: 'topicName', label: 'Topic' },
      { key: 'certificationName', label: 'Certification' },
      { key: 'difficulty', label: 'Difficulty' },
      { key: 'attempts', label: 'Attempts' },
      { key: 'failures', label: 'Failures' },
      { key: 'failRate', label: 'Fail rate %' },
    ]);
  } else if (tab === 'viewed') {
    downloadCsv(`questions-viewed-${days}d`, data.mostViewedQuestions, [
      { key: 'questionId', label: 'Question ID' },
      { key: 'preview', label: 'Preview' },
      { key: 'topicName', label: 'Topic' },
      { key: 'views', label: 'Views' },
    ]);
  } else {
    downloadCsv(`questions-reported-${days}d`, data.mostReportedQuestions, [
      { key: 'questionId', label: 'Question ID' },
      { key: 'preview', label: 'Preview' },
      { key: 'reports', label: 'Reports' },
    ]);
  }
}
