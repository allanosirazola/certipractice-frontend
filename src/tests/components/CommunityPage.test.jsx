// src/tests/components/CommunityPage.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommunityPage from '../../components/community/CommunityPage';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock CommunityForum to avoid API calls
vi.mock('../../components/community/CommunityForum', () => ({
  default: ({ onClose }) => (
    <div data-testid="forum-mock">
      <button onClick={onClose}>Mock close</button>
    </div>
  ),
}));

// Mock SEOHead (does DOM mutations during tests)
vi.mock('../../components/seo/SEOHead', () => ({
  default: () => null,
}));

const renderPage = (props = {}) => render(
  <ThemeProvider>
    <CommunityPage onBack={vi.fn()} onOpenCookies={vi.fn()} {...props} />
  </ThemeProvider>
);

describe('CommunityPage', () => {
  beforeEach(() => {
    globalThis.__setTestLang?.('en');
    localStorage.getItem.mockReturnValue(null);
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  describe('Renderizado', () => {
    it('renderiza el componente CommunityForum', () => {
      renderPage();
      expect(screen.getByTestId('forum-mock')).toBeInTheDocument();
    });

    it('renderiza el botón de volver', () => {
      renderPage();
      expect(screen.getByText(/Back to home/i)).toBeInTheDocument();
    });

    it('renderiza el SettingsPanel', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
    });
  });

  describe('Navegación', () => {
    it('llama onBack al hacer clic en volver', () => {
      const onBack = vi.fn();
      renderPage({ onBack });
      fireEvent.click(screen.getByText(/Back to home/i));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('llama onBack al cerrar el foro mock', () => {
      const onBack = vi.fn();
      renderPage({ onBack });
      fireEvent.click(screen.getByText('Mock close'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });
});
