/**
 * Convert rows to CSV and trigger browser download.
 * Pure function for `toCsv` so it can be unit-tested.
 */

const escapeCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

/**
 * @param {Array<object>} rows
 * @param {Array<{key: string, label?: string}>} columns
 * @returns {string} CSV text
 */
export const toCsv = (rows, columns) => {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const header = columns.map((c) => escapeCell(c.label ?? c.key)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(row[c.key])).join(',')
  ).join('\n');
  return `${header}\n${body}`;
};

export const downloadCsv = (filename, rows, columns) => {
  const csv = toCsv(rows, columns);
  if (!csv) return false;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
