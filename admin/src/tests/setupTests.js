import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Polyfill for Recharts in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock;

// Vitest 4 + jsdom 28 has a known bug where window.localStorage is auto-mocked
// with vi.fn() spies that don't actually persist values. We replace it before
// every test with a real Map-based shim.
function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => { map.clear(); },
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
}

beforeEach(() => {
  const ls = makeStorage();
  const ss = makeStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: ls, writable: true, configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: ss, writable: true, configurable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: ls, writable: true, configurable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: ss, writable: true, configurable: true,
    });
  }
});

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Not implemented: navigation')) return;
  originalError(...args);
};
