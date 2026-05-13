import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { searchAPI } from '../../services/api';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

/**
 * Full-text search bar with debounced API call and result dropdown.
 * Use as a header search affordance from the landing page.
 *
 * @param {{ onSelectResult?: (questionId:string)=>void, autoFocus?: boolean }} props
 */
export default function SearchBar({ onSelectResult, autoFocus = false }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Auto focus
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      setError(null);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchAPI.searchQuestions(query, { limit: 8 });
        if (res?.success) {
          setResults(res.data.items || []);
          setOpen(true);
        }
      } catch (err) {
        setError(err?.message || t('common.error'));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => debounceTimer.current && clearTimeout(debounceTimer.current);
  }, [query, t]);

  const handleSelect = useCallback((item) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    onSelectResult?.(item.questionId);
  }, [onSelectResult]);

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('engagement.search.placeholder')}
          className="w-full pl-10 pr-10 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          aria-label={t('engagement.search.placeholder')}
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            type="button"
            aria-label={t('common.clear')}
          >
            ✕
          </button>
        )}
      </div>

      {open && (results.length > 0 || error || (query.length >= MIN_CHARS && !loading)) && (
        <div className="absolute z-30 mt-1 w-full max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {error ? (
            <div className="px-3 py-3 text-sm text-red-500" role="alert">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500">
              {t('engagement.search.noResults')}
            </div>
          ) : (
            <ul role="listbox">
              {results.map((item, idx) => (
                <li
                  key={item.questionId}
                  role="option"
                  aria-selected={idx === activeIdx}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3 py-2 transition-colors ${
                      idx === activeIdx
                        ? 'bg-blue-50 dark:bg-blue-500/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    <p
                      className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2"
                      // Snippet has <mark> tags from server
                      dangerouslySetInnerHTML={{ __html: item.snippet || escape(item.preview) }}
                    />
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                      {item.providerName && <span>{item.providerName}</span>}
                      {item.certificationName && <span>· {item.certificationName}</span>}
                      {item.topicName && <span>· {item.topicName}</span>}
                      <span className="ml-auto capitalize">{item.difficulty}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// Tiny HTML escaper for fallback when no snippet
function escape(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
