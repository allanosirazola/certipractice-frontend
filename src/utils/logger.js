// src/utils/logger.js
// Lightweight logger that respects config.DEBUG flag and avoids
// leaking errors silently in production.
import config from '../config/config.js';

const TAG = '[CertiPractice]';

function fmt(level, args) {
  return [`${TAG}[${level}]`, ...args];
}

export const logger = {
  /** Always log errors — these are real problems we want to surface. */
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error(...fmt('error', args));
  },
  /** Warnings always shown. */
  warn: (...args) => {
    // eslint-disable-next-line no-console
    console.warn(...fmt('warn', args));
  },
  /** Info only in DEBUG / dev. */
  info: (...args) => {
    if (!config.DEBUG) return;
    // eslint-disable-next-line no-console
    console.info(...fmt('info', args));
  },
  /** Debug only in DEBUG / dev. */
  debug: (...args) => {
    if (!config.DEBUG) return;
    // eslint-disable-next-line no-console
    console.log(...fmt('debug', args));
  },
};

export default logger;
