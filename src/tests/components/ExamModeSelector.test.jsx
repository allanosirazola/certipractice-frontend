// ExamModeSelector.test.jsx - Tests para Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock del API - El componente usa getFailedQuestions, no getFailedQuestionsStats
const mockGetFailedQuestions = vi.fn();
vi.mock('../../services/api', () => ({
  userAPI: {
    getFailedQuestions: (...args) => mockGetFailedQuestions(...args),
  },
}));

import ExamModeSelector from '../../components/exam/ExamModeSelector';

describe('ExamModeSelector', () => {
  const mockExamConfig = {
    provider: 'aws',
    provider_name: 'AWS',
    certification: 'SAA-C03',
    questionCount: 65,
    timeLimit: 130,
    passingScore: 72,
    settings: {},
  };

  const defaultProps = {
    examConfig: mockExamConfig,
    nombreCertificacion: 'AWS - Solutions Architect Associate',
    onStartExam: vi.fn(),
    onVolver: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', username: 'testuser' },
    });
    // Devuelve array de 10 preguntas fallidas
    mockGetFailedQuestions.mockResolvedValue({
      success: true,
      data: Array(10).fill({ id: 'q', text: 'Question' }),
    });
  });

  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================
  describe('Renderizado', () => {
    it('muestra título', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText('Seleccionar Modo de Examen')).toBeInTheDocument();
    });

    it('muestra descripción de certificación', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText(/AWS - Solutions Architect Associate/)).toBeInTheDocument();
    });

    it('muestra botón de volver', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /← Volver/i })).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE MODOS DISPONIBLES
  // ============================================
  describe('Modos disponibles', () => {
    it('muestra modo realista', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText('Prueba de Examen Real')).toBeInTheDocument();
    });

    it('muestra modo práctica', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText('Modo Práctica')).toBeInTheDocument();
    });

    it('muestra modo preguntas fallidas', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText('Preguntas Fallidas')).toBeInTheDocument();
    });

    it('muestra iconos para cada modo', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText('🎯')).toBeInTheDocument(); // Realista
      expect(screen.getByText('📚')).toBeInTheDocument(); // Práctica
      expect(screen.getByText('🔄')).toBeInTheDocument(); // Fallidas
    });
  });

  // ============================================
  // TESTS DE CARACTERÍSTICAS DE MODOS
  // ============================================
  describe('Características de modos', () => {
    it('muestra características del modo realista', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText(/Tiempo límite estricto/i)).toBeInTheDocument();
    });

    it('muestra características del modo práctica', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      // El modo práctica tiene el icono 📚
      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('muestra restricciones del modo realista', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText(/No puedes verificar respuestas/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE PREGUNTAS FALLIDAS - AUTENTICADO
  // ============================================
  describe('Preguntas fallidas - usuario autenticado', () => {
    it('muestra badge con cantidad cuando hay 5+', async () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('10 preguntas')).toBeInTheDocument();
      });
    });

    it('muestra spinner mientras carga', () => {
      mockGetFailedQuestions.mockImplementation(() => new Promise(() => {}));
      
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText(/Cargando preguntas fallidas/i)).toBeInTheDocument();
    });

    it('botón habilitado cuando hay 5+ preguntas', async () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('10 preguntas')).toBeInTheDocument();
      });

      // El botón de seleccionar debe estar habilitado
      const selectButton = screen.getByRole('button', { name: /Seleccionar Preguntas Fallidas/i });
      expect(selectButton).not.toBeDisabled();
    });
  });

  // ============================================
  // TESTS DE PREGUNTAS FALLIDAS - INSUFICIENTES
  // ============================================
  describe('Preguntas fallidas - sin suficientes', () => {
    beforeEach(() => {
      mockGetFailedQuestions.mockResolvedValue({
        success: true,
        data: Array(3).fill({ id: 'q' }), // Solo 3 preguntas
      });
    });

    it('botón deshabilitado cuando hay menos de 5', async () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      await waitFor(() => {
        const selectButton = screen.getByRole('button', { name: /Seleccionar Preguntas Fallidas|No Disponible/i });
        expect(selectButton).toBeDisabled();
      });
    });

    it('muestra mensaje informativo sobre mínimo requerido', async () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Necesitas al menos 5 preguntas/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE PREGUNTAS FALLIDAS - NO AUTENTICADO
  // ============================================
  describe('Preguntas fallidas - usuario no autenticado', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });
    });

    it('muestra badge "Requiere cuenta"', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText('Requiere cuenta')).toBeInTheDocument();
    });

    it('botón deshabilitado', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      const selectButton = screen.getByRole('button', { name: /Requiere Registro/i });
      expect(selectButton).toBeDisabled();
    });

    it('muestra mensaje de registro', () => {
      render(<ExamModeSelector {...defaultProps} />);
      
      expect(screen.getByText(/Regístrate/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE SELECCIÓN DE MODO
  // ============================================
  describe('Selección de modo', () => {
    it('selecciona modo realista al hacer clic', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const realisticCard = screen.getByText('Prueba de Examen Real').closest('div[class*="cursor"]');
      await user.click(realisticCard);
      
      // Debe mostrar la pantalla de confirmación
      await waitFor(() => {
        expect(screen.getByText(/Confirmar Modo/i)).toBeInTheDocument();
      });
    });

    it('selecciona modo práctica al hacer clic', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByText(/Confirmar Modo/i)).toBeInTheDocument();
      });
    });

    it('selecciona modo fallidas cuando disponible', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('10 preguntas')).toBeInTheDocument();
      });

      const failedCard = screen.getByText('Preguntas Fallidas').closest('div[class*="cursor"]');
      await user.click(failedCard);
      
      await waitFor(() => {
        expect(screen.getByText(/Confirmar Modo/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE CONFIRMACIÓN
  // ============================================
  describe('Pantalla de confirmación', () => {
    it('muestra configuración del examen', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByText(/Configuración del Examen/i)).toBeInTheDocument();
        expect(screen.getByText('65')).toBeInTheDocument(); // questionCount
      });
    });

    it('muestra características incluidas', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByText('Características Incluidas')).toBeInTheDocument();
      });
    });

    it('muestra restricciones', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByText('Restricciones')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE INICIAR EXAMEN
  // ============================================
  describe('Iniciar examen', () => {
    it('llama a onStartExam con config de práctica', async () => {
      const onStartExam = vi.fn();
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} onStartExam={onStartExam} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByText(/Confirmar Modo/i)).toBeInTheDocument();
      });
      
      const startButton = screen.getByRole('button', { name: /Iniciar Modo Práctica/i });
      await user.click(startButton);
      
      expect(onStartExam).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'practice' }),
        expect.any(String)
      );
    });

    it('llama a onStartExam con config de realista', async () => {
      const onStartExam = vi.fn();
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} onStartExam={onStartExam} />);
      
      const realisticCard = screen.getByText('Prueba de Examen Real').closest('div[class*="cursor"]');
      await user.click(realisticCard);
      
      await waitFor(() => {
        expect(screen.getByText(/Confirmar Modo/i)).toBeInTheDocument();
      });
      
      const startButton = screen.getByRole('button', { name: /Iniciar Prueba de Examen Real/i });
      await user.click(startButton);
      
      expect(onStartExam).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'realistic' }),
        expect.any(String)
      );
    });

    it('llama a onStartExam con config de fallidas', async () => {
      const onStartExam = vi.fn();
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} onStartExam={onStartExam} />);
      
      await waitFor(() => {
        expect(screen.getByText('10 preguntas')).toBeInTheDocument();
      });

      const failedCard = screen.getByText('Preguntas Fallidas').closest('div[class*="cursor"]');
      await user.click(failedCard);
      
      await waitFor(() => {
        expect(screen.getByText(/Confirmar Modo/i)).toBeInTheDocument();
      });
      
      const startButton = screen.getByRole('button', { name: /Iniciar Preguntas Fallidas/i });
      await user.click(startButton);
      
      expect(onStartExam).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'failed_questions' }),
        expect.any(String)
      );
    });
  });

  // ============================================
  // TESTS DE NAVEGACIÓN
  // ============================================
  describe('Navegación', () => {
    it('llama a onVolver al hacer clic en volver', async () => {
      const onVolver = vi.fn();
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} onVolver={onVolver} />);
      
      const backButton = screen.getByRole('button', { name: /← Volver/i });
      await user.click(backButton);
      
      expect(onVolver).toHaveBeenCalled();
    });

    it('permite volver desde confirmación', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByText(/Confirmar Modo/i)).toBeInTheDocument();
      });
      
      const changeButton = screen.getByRole('button', { name: /Cambiar Modo/i });
      await user.click(changeButton);
      
      // Debe volver a la selección de modo
      await waitFor(() => {
        expect(screen.getByText('Seleccionar Modo de Examen')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE BOTONES DE CONFIRMACIÓN
  // ============================================
  describe('Botones de confirmación', () => {
    it('muestra botón "Cambiar Modo"', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cambiar Modo/i })).toBeInTheDocument();
      });
    });

    it('muestra botón "Iniciar" con nombre del modo', async () => {
      const user = userEvent.setup();
      render(<ExamModeSelector {...defaultProps} />);
      
      const practiceCard = screen.getByText('Modo Práctica').closest('div[class*="cursor"]');
      await user.click(practiceCard);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Iniciar Modo Práctica/i })).toBeInTheDocument();
      });
    });
  });
});
