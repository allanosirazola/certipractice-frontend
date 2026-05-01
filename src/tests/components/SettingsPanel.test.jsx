// src/tests/components/SettingsPanel.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import SettingsPanel from '../../components/common/SettingsPanel';

const renderWithProviders = (ui) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('SettingsPanel', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('renders trigger button', () => {
    renderWithProviders(<SettingsPanel />);
    expect(screen.getByRole('button', { name: /settings|ajustes/i })).toBeInTheDocument();
  });

  it('opens dropdown on trigger click', () => {
    renderWithProviders(<SettingsPanel />);
    expect(screen.queryByText(/theme|tema/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    expect(screen.getByText(/theme|tema/i)).toBeInTheDocument();
  });

  it('renders both language options when open', () => {
    renderWithProviders(<SettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    const buttons = screen.getAllByRole('button');
    const labels = buttons.map(b => b.textContent || '');
    expect(labels.some(l => l.includes('EN'))).toBe(true);
    expect(labels.some(l => l.includes('ES'))).toBe(true);
  });

  it('shows light mode label by default', () => {
    renderWithProviders(<SettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    expect(screen.getByText(/light mode|modo claro/i)).toBeInTheDocument();
  });

  it('toggles dark mode', () => {
    renderWithProviders(<SettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    const themeToggle = screen.getByRole('switch');
    expect(themeToggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(themeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('shows community button when callback provided', () => {
    renderWithProviders(<SettingsPanel onOpenCommunity={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    expect(screen.getByText(/community|comunidad/i)).toBeInTheDocument();
  });

  it('hides community button when no callback', () => {
    renderWithProviders(<SettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    expect(screen.queryByText(/community forum|foro de la comunidad/i)).not.toBeInTheDocument();
  });

  it('calls onOpenCommunity when community button is clicked', () => {
    const onOpenCommunity = vi.fn();
    renderWithProviders(<SettingsPanel onOpenCommunity={onOpenCommunity} />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    fireEvent.click(screen.getByText(/community|comunidad/i));
    expect(onOpenCommunity).toHaveBeenCalled();
  });

  it('calls onOpenCookies when cookies button is clicked', () => {
    const onOpenCookies = vi.fn();
    renderWithProviders(<SettingsPanel onOpenCookies={onOpenCookies} />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    fireEvent.click(screen.getByText(/cookie/i));
    expect(onOpenCookies).toHaveBeenCalled();
  });

  it('calls onOpenPrivacy when privacy button is clicked', () => {
    const onOpenPrivacy = vi.fn();
    renderWithProviders(<SettingsPanel onOpenPrivacy={onOpenPrivacy} />);
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    fireEvent.click(screen.getByText(/privacy/i));
    expect(onOpenPrivacy).toHaveBeenCalled();
  });

  it('closes dropdown on outside click', () => {
    renderWithProviders(
      <div>
        <SettingsPanel />
        <div data-testid="outside">outside</div>
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }));
    expect(screen.getByText(/theme|tema/i)).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText(/theme|tema/i)).not.toBeInTheDocument();
  });
});
