// src/tests/components/SettingsPanel.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPanel from '../../components/common/SettingsPanel';
import { ThemeProvider } from '../../context/ThemeContext';

const renderPanel = (props = {}) =>
  render(
    <ThemeProvider>
      <SettingsPanel {...props} />
    </ThemeProvider>
  );

describe('SettingsPanel', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    window.localStorage.getItem = vi.fn(() => null);
    window.localStorage.setItem = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()
    });
  });

  describe('trigger button', () => {
    it('renders the gear button', () => {
      renderPanel();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('shows current language code (EN by default)', () => {
      renderPanel();
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('does not show dropdown initially', () => {
      renderPanel();
      expect(screen.queryByText(/^Language$/i)).not.toBeInTheDocument();
    });
  });

  describe('opening the dropdown', () => {
    it('opens the dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByText(/^Language$/i)).toBeInTheDocument();
    });

    it('shows both language options', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('button', { name: /settings/i }));
      const langButtons = screen.getAllByRole('button').filter(b =>
        b.textContent === 'EN' || b.textContent === 'ES'
      );
      // At least 2 language pills (could include trigger)
      expect(langButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('shows the theme toggle as a switch', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('closes the dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <div>
            <SettingsPanel />
            <div data-testid="outside">outside</div>
          </div>
        </ThemeProvider>
      );
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByText(/^Language$/i)).toBeInTheDocument();
      await user.click(screen.getByTestId('outside'));
      expect(screen.queryByText(/^Language$/i)).not.toBeInTheDocument();
    });
  });

  describe('theme toggle', () => {
    it('switches to dark mode when toggled', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('switch'));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('switch reflects aria-checked state', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('button', { name: /settings/i }));
      const sw = screen.getByRole('switch');
      expect(sw).toHaveAttribute('aria-checked', 'false');
      await user.click(sw);
      expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('navigation actions', () => {
    it('does NOT render community item when onOpenCommunity is missing', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.queryByText(/Community forum/i)).not.toBeInTheDocument();
    });

    it('renders community item when onOpenCommunity is provided', async () => {
      const user = userEvent.setup();
      renderPanel({ onOpenCommunity: vi.fn() });
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByText(/Community forum/i)).toBeInTheDocument();
    });

    it('calls onOpenCommunity when community item clicked', async () => {
      const user = userEvent.setup();
      const onOpenCommunity = vi.fn();
      renderPanel({ onOpenCommunity });
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByText(/Community forum/i));
      expect(onOpenCommunity).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenCookies when cookie preferences clicked', async () => {
      const user = userEvent.setup();
      const onOpenCookies = vi.fn();
      renderPanel({ onOpenCookies });
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByText(/Cookie preferences/i));
      expect(onOpenCookies).toHaveBeenCalledTimes(1);
    });

    it('renders privacy item when onOpenPrivacy is provided', async () => {
      const user = userEvent.setup();
      renderPanel({ onOpenPrivacy: vi.fn() });
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByText(/Privacy policy/i)).toBeInTheDocument();
    });

    it('calls onOpenPrivacy when privacy item clicked', async () => {
      const user = userEvent.setup();
      const onOpenPrivacy = vi.fn();
      renderPanel({ onOpenPrivacy });
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByText(/Privacy policy/i));
      expect(onOpenPrivacy).toHaveBeenCalledTimes(1);
    });

    it('closes dropdown after navigation action', async () => {
      const user = userEvent.setup();
      renderPanel({ onOpenCookies: vi.fn() });
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByText(/^Language$/i)).toBeInTheDocument();
      await user.click(screen.getByText(/Cookie preferences/i));
      expect(screen.queryByText(/^Language$/i)).not.toBeInTheDocument();
    });
  });
});
