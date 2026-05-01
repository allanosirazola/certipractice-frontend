// src/tests/components/PrivacyPolicy.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import PrivacyPolicy from '../../components/privacy/PrivacyPolicy';

const renderWithProviders = (ui) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('PrivacyPolicy', () => {
  it('renders the page title', () => {
    renderWithProviders(<PrivacyPolicy onBack={vi.fn()} onOpenCookies={vi.fn()} />);
    // Title is rendered in the language detected (English by default in tests)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders 9 numbered sections', () => {
    renderWithProviders(<PrivacyPolicy onBack={vi.fn()} onOpenCookies={vi.fn()} />);
    const sections = screen.getAllByRole('heading', { level: 2 });
    expect(sections.length).toBe(9);
  });

  it('shows last updated date', () => {
    renderWithProviders(<PrivacyPolicy onBack={vi.fn()} onOpenCookies={vi.fn()} />);
    // Matches "Last updated:" or "Última actualización:"
    expect(
      screen.getByText(/last updated|última actualización/i)
    ).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    renderWithProviders(<PrivacyPolicy onBack={onBack} onOpenCookies={vi.fn()} />);
    const backBtn = screen.getByRole('button', { name: /back|volver/i });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it('calls onOpenCookies when cookie management CTA is clicked', () => {
    const onOpenCookies = vi.fn();
    renderWithProviders(<PrivacyPolicy onBack={vi.fn()} onOpenCookies={onOpenCookies} />);
    // The CTA button at the bottom
    const ctaButtons = screen.getAllByRole('button', { name: /cookie/i });
    // Last one should be the CTA, click it
    fireEvent.click(ctaButtons[ctaButtons.length - 1]);
    expect(onOpenCookies).toHaveBeenCalled();
  });

  it('mentions GDPR rights', () => {
    renderWithProviders(<PrivacyPolicy onBack={vi.fn()} onOpenCookies={vi.fn()} />);
    expect(screen.getByText(/GDPR/i)).toBeInTheDocument();
  });

  it('mentions Google AdSense', () => {
    renderWithProviders(<PrivacyPolicy onBack={vi.fn()} onOpenCookies={vi.fn()} />);
    expect(screen.getAllByText(/AdSense/i).length).toBeGreaterThan(0);
  });

  it('contains contact email', () => {
    renderWithProviders(<PrivacyPolicy onBack={vi.fn()} onOpenCookies={vi.fn()} />);
    expect(screen.getAllByText(/privacy@certipractice/i).length).toBeGreaterThan(0);
  });
});
