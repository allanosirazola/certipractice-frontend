import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsentBanner, { getConsent, hasAdvertisingConsent, CONSENT_KEY, CONSENT_VERSION } from '../../components/privacy/CookieConsentBanner';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.getItem.mockReturnValue(null);
});

describe('CookieConsentBanner – initial state', () => {
  it('shows banner when no consent stored', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByText(/cookies and ads/i)).toBeInTheDocument();
  });

  it('does NOT show when valid consent already stored', () => {
    const stored = JSON.stringify({ categories: { necessary: true }, version: CONSENT_VERSION });
    localStorage.getItem.mockReturnValue(stored);
    render(<CookieConsentBanner />);
    expect(screen.queryByText(/cookies and ads/i)).not.toBeInTheDocument();
  });

  it('shows banner when stored version is old', () => {
    const stored = JSON.stringify({ categories: { necessary: true }, version: '1.0' });
    localStorage.getItem.mockReturnValue(stored);
    render(<CookieConsentBanner />);
    expect(screen.getByText(/cookies and ads/i)).toBeInTheDocument();
  });

  it('shows when forceOpen=true even if consent exists', () => {
    const stored = JSON.stringify({ categories: { necessary: true }, version: CONSENT_VERSION });
    localStorage.getItem.mockReturnValue(stored);
    render(<CookieConsentBanner forceOpen={true} />);
    expect(screen.getByText(/cookies and ads/i)).toBeInTheDocument();
  });
});

describe('CookieConsentBanner – actions', () => {
  it('calls localStorage.setItem with all=true on Accept All', async () => {
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByText(/accept all/i));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      CONSENT_KEY,
      expect.stringContaining('"advertising":true')
    );
  });

  it('saves only necessary on Necessary Only', async () => {
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByText(/necessary only/i));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      CONSENT_KEY,
      expect.stringContaining('"advertising":false')
    );
  });

  it('hides after accepting', async () => {
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByText(/accept all/i));
    expect(screen.queryByText(/cookies and ads/i)).not.toBeInTheDocument();
  });

  it('opens detailed view on Customise', async () => {
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByText(/customise/i));
    expect(screen.getByRole('switch', { hidden: false })).toBeInTheDocument();
  });

  it('can toggle advertising switch in detailed view', async () => {
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByText(/customise/i));
    const switches = screen.getAllByRole('switch');
    // advertising toggle (last switch, necessary is fixed)
    const advSwitch = switches[switches.length - 1];
    expect(advSwitch).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(advSwitch);
    expect(advSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onClose after accepting', async () => {
    const onClose = vi.fn();
    render(<CookieConsentBanner onClose={onClose} />);
    await userEvent.click(screen.getByText(/accept all/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves preferences from detailed view', async () => {
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByText(/customise/i));
    await userEvent.click(screen.getByText(/save preferences/i));
    expect(localStorage.setItem).toHaveBeenCalledWith(CONSENT_KEY, expect.any(String));
  });

  it('dispatches consentUpdated event', async () => {
    const handler = vi.fn();
    window.addEventListener('consentUpdated', handler);
    render(<CookieConsentBanner />);
    await userEvent.click(screen.getByText(/accept all/i));
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('consentUpdated', handler);
  });
});

describe('getConsent / hasAdvertisingConsent helpers', () => {
  it('returns null when nothing stored', () => {
    localStorage.getItem.mockReturnValue(null);
    expect(getConsent()).toBeNull();
  });

  it('returns null for wrong version', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ categories: {}, version: '0.1' }));
    expect(getConsent()).toBeNull();
  });

  it('returns categories for valid stored consent', () => {
    const cats = { necessary: true, advertising: true };
    localStorage.getItem.mockReturnValue(JSON.stringify({ categories: cats, version: CONSENT_VERSION }));
    expect(getConsent()).toEqual(cats);
  });

  it('hasAdvertisingConsent returns true when advertising=true', () => {
    const cats = { necessary: true, advertising: true };
    localStorage.getItem.mockReturnValue(JSON.stringify({ categories: cats, version: CONSENT_VERSION }));
    expect(hasAdvertisingConsent()).toBe(true);
  });

  it('hasAdvertisingConsent returns false when advertising=false', () => {
    const cats = { necessary: true, advertising: false };
    localStorage.getItem.mockReturnValue(JSON.stringify({ categories: cats, version: CONSENT_VERSION }));
    expect(hasAdvertisingConsent()).toBe(false);
  });
});
