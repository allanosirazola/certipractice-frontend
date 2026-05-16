// PWA.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InstallPrompt from '../../components/pwa/InstallPrompt';
import OfflineIndicator from '../../components/pwa/OfflineIndicator';

describe('InstallPrompt', () => {
  let _store;
  beforeEach(() => {
    _store = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k) => (_store.has(k) ? _store.get(k) : null),
        setItem: (k, v) => _store.set(k, String(v)),
        removeItem: (k) => _store.delete(k),
        clear: () => _store.clear(),
      },
    });
    // matchMedia stub — display-mode: standalone NOT matching
    window.matchMedia = vi.fn().mockImplementation((q) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('renders nothing when no beforeinstallprompt event fired', () => {
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the prompt after beforeinstallprompt fires', async () => {
    render(<InstallPrompt />);
    const evt = new Event('beforeinstallprompt');
    evt.prompt = vi.fn();
    evt.userChoice = Promise.resolve({ outcome: 'accepted' });
    act(() => { window.dispatchEvent(evt); });
    await waitFor(() => {
      expect(screen.getByText(/Instala la app|Install the app/i)).toBeInTheDocument();
    });
  });

  it('calls prompt() when install button clicked', async () => {
    render(<InstallPrompt />);
    const prompt = vi.fn();
    const evt = new Event('beforeinstallprompt');
    evt.prompt = prompt;
    evt.userChoice = Promise.resolve({ outcome: 'accepted' });
    act(() => { window.dispatchEvent(evt); });
    await waitFor(() => screen.getByText(/Instala la app|Install the app/i));
    await userEvent.click(screen.getByRole('button', { name: /Instalar|Install/i }));
    expect(prompt).toHaveBeenCalled();
  });

  it('hides and persists dismissal when "No gracias" clicked', async () => {
    render(<InstallPrompt />);
    const evt = new Event('beforeinstallprompt');
    evt.prompt = vi.fn();
    evt.userChoice = Promise.resolve();
    act(() => { window.dispatchEvent(evt); });
    await waitFor(() => screen.getByText(/Instala la app|Install the app/i));
    await userEvent.click(screen.getByRole('button', { name: /No, gracias|No thanks/i }));
    expect(screen.queryByText(/Instala la app|Install the app/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem('cp-pwa-install-dismissed-at')).toBeTruthy();
  });

  it('hides when already in standalone display mode', () => {
    window.matchMedia = vi.fn().mockImplementation((q) => ({
      matches: q === '(display-mode: standalone)',
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { container } = render(<InstallPrompt />);
    // Fire event — should still be hidden
    const evt = new Event('beforeinstallprompt');
    act(() => { window.dispatchEvent(evt); });
    expect(container).toBeEmptyDOMElement();
  });
});

describe('OfflineIndicator', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('renders nothing when online', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('appears when offline event fires', async () => {
    render(<OfflineIndicator />);
    act(() => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
      window.dispatchEvent(new Event('offline'));
    });
    await waitFor(() => {
      expect(screen.getByText(/Sin conexión|Offline/i)).toBeInTheDocument();
    });
  });

  it('disappears again when online event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    render(<OfflineIndicator />);
    await waitFor(() => screen.getByText(/Sin conexión|Offline/i));
    act(() => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => {
      expect(screen.queryByText(/Sin conexión|Offline/i)).not.toBeInTheDocument();
    });
  });
});
