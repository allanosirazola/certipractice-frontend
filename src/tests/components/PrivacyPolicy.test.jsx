// src/tests/components/PrivacyPolicy.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacyPolicy from '../../components/privacy/PrivacyPolicy';
import { ThemeProvider } from '../../context/ThemeContext';

// SEOHead writes to document.head — mock it
vi.mock('../../components/seo/SEOHead', () => ({ default: () => null }));

const renderPage = (props = {}) =>
  render(
    <ThemeProvider>
      <PrivacyPolicy onBack={vi.fn()} onOpenCookies={vi.fn()} {...props} />
    </ThemeProvider>
  );

describe('PrivacyPolicy', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    window.localStorage.getItem = vi.fn(() => null);
    window.localStorage.setItem = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()
    });
  });

  describe('content rendering', () => {
    it('renders the page title', () => {
      renderPage();
      expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument();
    });

    it('renders the last-updated date', () => {
      renderPage();
      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    });

    it('renders all 9 numbered sections', () => {
      renderPage();
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBe(9);
    });

    it('renders the introduction paragraph', () => {
      renderPage();
      expect(screen.getByText(/we take your privacy seriously/i)).toBeInTheDocument();
    });

    it('mentions Google AdSense in cookies section', () => {
      renderPage();
      const adsenseRefs = screen.getAllByText(/Google AdSense/i);
      expect(adsenseRefs.length).toBeGreaterThan(0);
    });

    it('lists GDPR rights (access, rectification, deletion, portability)', () => {
      renderPage();
      expect(screen.getByText(/Access:/i)).toBeInTheDocument();
      expect(screen.getByText(/Rectification:/i)).toBeInTheDocument();
      expect(screen.getByText(/Deletion:/i)).toBeInTheDocument();
      expect(screen.getByText(/Portability:/i)).toBeInTheDocument();
    });

    it('contains contact email at least once', () => {
      renderPage();
      const matches = screen.getAllByText(/privacy@certipractice\.app/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('navigation', () => {
    it('renders back button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      renderPage({ onBack });
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders Manage cookie preferences CTA', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /Manage cookie preferences/i })).toBeInTheDocument();
    });

    it('calls onOpenCookies when CTA clicked', async () => {
      const user = userEvent.setup();
      const onOpenCookies = vi.fn();
      renderPage({ onOpenCookies });
      await user.click(screen.getByRole('button', { name: /Manage cookie preferences/i }));
      expect(onOpenCookies).toHaveBeenCalledTimes(1);
    });
  });

  describe('settings panel', () => {
    it('includes the SettingsPanel button in the header', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
    });
  });

  describe('semantics', () => {
    it('uses landmark elements (header, main)', () => {
      const { container } = renderPage();
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('has exactly one h1', () => {
      renderPage();
      expect(screen.getAllByRole('heading', { level: 1 }).length).toBe(1);
    });
  });
});
