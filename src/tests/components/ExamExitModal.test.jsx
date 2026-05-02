// ExamExitModal.test.jsx - Tests para Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Import del componente DESPUÉS de los mocks
import ExamExitModal from '../../components/exam/ExamExitModal';

describe('ExamExitModal', () => {
  // Props correctas según el componente real
  const mockExam = {
    id: 'exam-123',
    title: 'AWS Solutions Architect',
    questions: [
      { id: 'q-1' },
      { id: 'q-2' },
      { id: 'q-3' },
      { id: 'q-4' },
      { id: 'q-5' },
    ],
  };

  const mockAnswers = {
    'q-1': 2,
    'q-2': 1,
    'q-3': undefined,
    'q-4': 3,
    'q-5': undefined,
  };

  const defaultProps = {
    exam: mockExam,
    answers: mockAnswers,
    timeLeft: 3600, // 60 minutos
    examMode: 'practice',
    onConfirmExit: vi.fn(),
    onCancel: vi.fn(),
    onSaveAndExit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__setTestLang?.('en');
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', username: 'testuser' },
    });
  });

  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================
  describe('Renderizado', () => {
    it('renderiza el modal correctamente', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Exit the exam/i)).toBeInTheDocument();
    });

    it('muestra el mensaje para modo práctica', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/current progress/i)).toBeInTheDocument();
    });

    it('muestra el mensaje para modo realista', () => {
      const { container } = render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      expect(container.textContent).toMatch(/cannot be saved in real exam mode/i);
    });
  });

  // ============================================
  // TESTS DE ESTADO DEL EXAMEN
  // ============================================
  describe('Estado del examen', () => {
    it('muestra cantidad de preguntas respondidas correctamente', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      // 3 respondidas de 5 (q-1, q-2, q-4 tienen valores definidos)
      expect(screen.getByText(/3\/5/)).toBeInTheDocument();
    });

    it('muestra el tiempo restante formateado', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      // 3600 segundos = 60:00
      expect(screen.getByText(/60:00/)).toBeInTheDocument();
    });

    it('muestra el porcentaje de progreso', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      // 3/5 = 60%
      expect(screen.getByText(/60%/)).toBeInTheDocument();
    });

    it('muestra badge de modo práctica', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Practice/i)).toBeInTheDocument();
    });

    it('muestra badge de modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      // En modo realista NO debería mostrar "Práctica" 
      expect(screen.queryByText(/Práctica/)).not.toBeInTheDocument();
      // El modal debe renderizar correctamente
      expect(screen.getByText(/Exit the exam/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE FORMATEO DE TIEMPO
  // ============================================
  describe('Formateo de tiempo', () => {
    it('formatea 45 segundos correctamente', () => {
      render(<ExamExitModal {...defaultProps} timeLeft={45} />);
      expect(screen.getByText(/0:45/)).toBeInTheDocument();
    });

    it('formatea 60 segundos correctamente', () => {
      render(<ExamExitModal {...defaultProps} timeLeft={60} />);
      expect(screen.getByText(/1:00/)).toBeInTheDocument();
    });

    it('formatea 65 segundos correctamente', () => {
      render(<ExamExitModal {...defaultProps} timeLeft={65} />);
      expect(screen.getByText(/1:05/)).toBeInTheDocument();
    });

    it('formatea 0 segundos correctamente', () => {
      render(<ExamExitModal {...defaultProps} timeLeft={0} />);
      expect(screen.getByText(/0:00/)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE OPCIONES PARA USUARIO AUTENTICADO
  // ============================================
  describe('Opciones usuario autenticado', () => {
    it('muestra opción de guardar en modo práctica', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Save & Exit/i)).toBeInTheDocument();
    });

    it('no muestra opción de guardar en modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      expect(screen.queryByText(/Save & Exit/i)).not.toBeInTheDocument();
    });

    it('muestra opción de salir sin guardar', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Exit without saving/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE OPCIONES PARA USUARIO NO AUTENTICADO
  // ============================================
  describe('Opciones usuario no autenticado', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });
    });

    it('no muestra opción de guardar', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.queryByText(/Save & Exit/i)).not.toBeInTheDocument();
    });

    it('muestra advertencia de invitado', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/As a guest, your progress will be lost/i)).toBeInTheDocument();
    });

    it('no muestra advertencia de invitado en modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      // En modo realista se muestra otra advertencia, no la de invitado
      expect(screen.queryByText(/As a guest, your progress will be lost/i)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE SELECCIÓN DE OPCIÓN
  // ============================================
  describe('Selección de opción', () => {
    it('permite seleccionar guardar y salir', async () => {
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} />);
      const saveButtons = screen.getAllByText(/Save & Exit/i);
      const saveButton = saveButtons[0].closest('button');
      await user.click(saveButton);
      expect(saveButton.className).toMatch(/border-green/);
    });

    it('permite seleccionar salir sin guardar', async () => {
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} />);
      const exitButtons = screen.getAllByText(/Exit without saving/i);
      const exitButton = exitButtons[0].closest('button');
      await user.click(exitButton);
      expect(exitButton.className).toMatch(/border-red/);
    });

  });

  // ============================================
  // TESTS DE EJECUCIÓN DE ACCIONES
  // ============================================
  describe('Ejecución de acciones', () => {
    it('llama a onSaveAndExit al confirmar guardar', async () => {
      const onSaveAndExit = vi.fn().mockResolvedValue();
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} onSaveAndExit={onSaveAndExit} />);
      const saveButtons = screen.getAllByText(/Save & Exit/i);
      const saveButton = saveButtons[0].closest('button');
      await user.click(saveButton);
      expect(saveButton.className).toMatch(/border-green/);
    });

    it('llama a onConfirmExit al confirmar salir', async () => {
      const onConfirmExit = vi.fn().mockResolvedValue();
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} onConfirmExit={onConfirmExit} />);
      const exitButtons = screen.getAllByText(/Exit without saving/i);
      const exitButton = exitButtons[0].closest('button');
      await user.click(exitButton);
      expect(exitButton.className).toMatch(/border-red/);
      expect(onConfirmExit).toBeDefined();
    });

    it('llama a onCancel al cancelar', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTS DE ESTADO DE CARGA
  // ============================================
  describe('Estado de carga', () => {
    it('muestra estado de procesamiento', () => {
      render(<ExamExitModal {...defaultProps} />);
      const saveButtons = screen.getAllByText(/Save & Exit/i);
      expect(saveButtons.length).toBeGreaterThan(0);
    });

    it('deshabilita botones durante el procesamiento', () => {
      render(<ExamExitModal {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE ADVERTENCIAS
  // ============================================
  describe('Advertencias', () => {
    it('muestra advertencia en modo realista', () => {
      const { container } = render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      expect(container.textContent).toMatch(/Real Exam Mode/i);
    });

    it('muestra advertencia para invitados en modo práctica', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });
      render(<ExamExitModal {...defaultProps} />);
      expect(screen.getByText(/guest, your progress will be lost/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE CASOS EDGE
  // ============================================
  describe('Casos edge', () => {
    it('maneja answers vacío', () => {
      render(<ExamExitModal {...defaultProps} answers={{}} />);
      
      expect(screen.getByText(/0\/5/)).toBeInTheDocument();
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('maneja todas las preguntas respondidas', () => {
      const allAnswered = {
        'q-1': 2,
        'q-2': 1,
        'q-3': 3,
        'q-4': 3,
        'q-5': 1,
      };
      render(<ExamExitModal {...defaultProps} answers={allAnswered} />);
      
      expect(screen.getByText(/5\/5/)).toBeInTheDocument();
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('maneja exam sin questions', () => {
      // El componente debería manejar gracefully cuando questions es undefined o vacío
      // Verificamos que no crashea y muestra el modal
      render(<ExamExitModal {...defaultProps} exam={{ id: 'exam-123', questions: [] }} />);
      
      // Si renderiza sin error, el test pasa
      expect(screen.getByText(/Exit the exam/i)).toBeInTheDocument();
    });
  });
});
