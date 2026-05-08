import React from 'react';

const PRESETS = [
  { value: 1, label: '24h' },
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 365, label: '1y' },
];

export default function DateRangePicker({ days, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded bg-[var(--bg-2)] border border-[var(--border)]">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            days === p.value
              ? 'bg-[var(--bg-3)] text-neutral-50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
