// setupTests.js - Configuración global para Vitest
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extender expect con matchers de jest-dom
expect.extend(matchers);

// Limpiar después de cada test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (typeof globalThis.__setTestLang === 'function') globalThis.__setTestLang('es');
});

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de window.confirm
window.confirm = vi.fn(() => true);

// Mock de window.alert
window.alert = vi.fn();

// Mock de navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-agent',
    language: 'es-ES',
  },
  writable: true,
});

// Mock de scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
// Global i18n mock — uses real ES translations so tests assert real strings
import esTranslations from '../i18n/locales/es.json';
import enTranslations from '../i18n/locales/en.json';

function resolvePath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

// Tests can switch language via __TEST_I18N_LANG__ if needed
let __testLang = 'es';
globalThis.__setTestLang = (lang) => { __testLang = lang; };
globalThis.__getTestLang = () => __testLang;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const dict = __testLang === 'en' ? enTranslations : esTranslations;
      let val = resolvePath(dict, key);
      if (val === undefined) {
        // Fallback to the other language to avoid bare keys in tests
        val = resolvePath(__testLang === 'en' ? esTranslations : enTranslations, key);
      }
      if (val === undefined) return opts?.defaultValue || key;
      if (opts?.returnObjects && typeof val === 'object') return val;
      if (typeof val === 'string') {
        let result = val;
        if (opts) {
          Object.entries(opts).forEach(([k, v]) => {
            result = result.replace(new RegExp(`\\{\\{${k}\\}}`, 'g'), String(v));
          });
        }
        return result;
      }
      return opts?.defaultValue || key;
    },
    i18n: {
      get language() { return __testLang; },
      changeLanguage: vi.fn((l) => { __testLang = l; }),
    },
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

