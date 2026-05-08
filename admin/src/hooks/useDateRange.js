import { useState, useCallback, useMemo } from 'react';

/**
 * Manages a "days lookback" filter shared across pages.
 * Persists the choice in localStorage so it survives navigation.
 */
const KEY = 'admin_date_range_days';
const VALID = [1, 7, 14, 30, 90, 180, 365];

const readStored = () => {
  const raw = parseInt(localStorage.getItem(KEY), 10);
  return VALID.includes(raw) ? raw : 7;
};

export function useDateRange(initial) {
  const [days, setDaysState] = useState(initial ?? readStored());

  const setDays = useCallback((d) => {
    const n = parseInt(d, 10);
    if (VALID.includes(n)) {
      localStorage.setItem(KEY, String(n));
      setDaysState(n);
    }
  }, []);

  const label = useMemo(() => {
    if (days === 1) return 'Last 24h';
    if (days === 7) return 'Last 7 days';
    if (days === 14) return 'Last 14 days';
    if (days === 30) return 'Last 30 days';
    if (days === 90) return 'Last 90 days';
    if (days === 180) return 'Last 6 months';
    if (days === 365) return 'Last year';
    return `Last ${days} days`;
  }, [days]);

  return { days, setDays, label, options: VALID };
}
