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
      
      expect(screen.getByText(/Salir del examen/i)).toBeInTheDocument();
    });

    it('muestra el mensaje para modo práctica', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/guardar tu progreso/i)).toBeInTheDocument();
    });

    it('muestra el mensaje para modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      expect(screen.getByText(/perder todo el progreso/i)).toBeInTheDocument();
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
      
      expect(screen.getByText(/Práctica/i)).toBeInTheDocument();
    });

    it('muestra badge de modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      // En modo realista NO debería mostrar "Práctica" 
      expect(screen.queryByText(/Práctica/)).not.toBeInTheDocument();
      // El modal debe renderizar correctamente
      expect(screen.getByText(/Salir del examen/i)).toBeInTheDocument();
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
      
      expect(screen.getByText(/Guardar y continuar después/i)).toBeInTheDocument();
    });

    it('no muestra opción de guardar en modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      expect(screen.queryByText(/Guardar y continuar después/i)).not.toBeInTheDocument();
    });

    it('muestra opción de salir sin guardar', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Salir sin guardar/i)).toBeInTheDocument();
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
      
      expect(screen.queryByText(/Guardar y continuar después/i)).not.toBeInTheDocument();
    });

    it('muestra advertencia de invitado', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Modo Invitado/i)).toBeInTheDocument();
    });

    it('no muestra advertencia de invitado en modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      // En modo realista se muestra otra advertencia, no la de invitado
      expect(screen.queryByText(/Modo Invitado/i)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE SELECCIÓN DE OPCIÓN
  // ============================================
  describe('Selección de opción', () => {
    it('permite seleccionar guardar y salir', async () => {
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} />);
      
      const saveOption = screen.getByText(/Guardar y continuar después/i).closest('button');
      await user.click(saveOption);
      
      // Debería aparecer el botón de confirmar
      expect(screen.getByText(/Guardar y Salir/i)).toBeInTheDocument();
    });

    it('permite seleccionar salir sin guardar', async () => {
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} />);
      
      // Buscar el botón que contiene "Salir sin guardar"
      const exitButton = screen.getByText(/Salir sin guardar/i).closest('button');
      await user.click(exitButton);
      
      // Después de seleccionar, debería aparecer el botón de confirmar con emoji 🚪
      await waitFor(() => {
        expect(screen.getByText(/Salir sin Guardar/)).toBeInTheDocument();
      });
    });

    it('muestra mensaje de selección cuando no hay opción elegida', () => {
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Selecciona una opción para continuar/i)).toBeInTheDocument();
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
      
      // Seleccionar guardar
      const saveOption = screen.getByText(/Guardar y continuar después/i).closest('button');
      await user.click(saveOption);
      
      // Confirmar
      const confirmButton = screen.getByText(/Guardar y Salir/i);
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(onSaveAndExit).toHaveBeenCalled();
      });
    });

    it('llama a onConfirmExit al confirmar salir', async () => {
      const onConfirmExit = vi.fn().mockResolvedValue();
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} onConfirmExit={onConfirmExit} />);
      
      // Seleccionar salir
      const exitOption = screen.getByText(/Salir sin guardar/i).closest('button');
      await user.click(exitOption);
      
      // Esperar a que aparezca el botón de confirmar y hacer clic
      await waitFor(() => {
        expect(screen.getByText(/Salir sin Guardar/)).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText(/Salir sin Guardar/).closest('button');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(onConfirmExit).toHaveBeenCalled();
      });
    });

    it('llama a onCancel al cancelar', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTS DE ESTADO DE CARGA
  // ============================================
  describe('Estado de carga', () => {
    it('muestra estado de procesamiento', async () => {
      const onSaveAndExit = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} onSaveAndExit={onSaveAndExit} />);
      
      // Seleccionar y confirmar guardar
      const saveOption = screen.getByText(/Guardar y continuar después/i).closest('button');
      await user.click(saveOption);
      
      const confirmButton = screen.getByText(/Guardar y Salir/i);
      await user.click(confirmButton);
      
      expect(screen.getByText(/Procesando/i)).toBeInTheDocument();
    });

    it('deshabilita botones durante el procesamiento', async () => {
      const onSaveAndExit = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const user = userEvent.setup();
      render(<ExamExitModal {...defaultProps} onSaveAndExit={onSaveAndExit} />);
      
      // Seleccionar y confirmar guardar
      const saveOption = screen.getByText(/Guardar y continuar después/i).closest('button');
      await user.click(saveOption);
      
      const confirmButton = screen.getByText(/Guardar y Salir/i);
      await user.click(confirmButton);
      
      // El botón de cancelar debería estar deshabilitado
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  // ============================================
  // TESTS DE ADVERTENCIAS
  // ============================================
  describe('Advertencias', () => {
    it('muestra advertencia en modo realista', () => {
      render(<ExamExitModal {...defaultProps} examMode="realistic" />);
      
      // El componente muestra "Modo Examen Real:" en negrita
      expect(screen.getByText(/Modo Examen Real/)).toBeInTheDocument();
    });

    it('muestra advertencia para invitados en modo práctica', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });
      
      render(<ExamExitModal {...defaultProps} />);
      
      expect(screen.getByText(/Modo Invitado/i)).toBeInTheDocument();
      expect(screen.getByText(/necesitas crear una cuenta/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Salir del examen/i)).toBeInTheDocument();
    });
  });
});
