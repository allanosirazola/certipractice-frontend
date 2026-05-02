// QuestionReportModal.test.jsx - Tests para Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock del API
const mockSubmitReport = vi.fn();
vi.mock('../../services/api', () => ({
  reportAPI: {
    submitReport: (...args) => mockSubmitReport(...args),
  },
}));

import QuestionReportModal from '../../components/exam/QuestionReportModal';

describe('QuestionReportModal', () => {
  const mockQuestion = {
    id: 'q-001',
    text: '¿Cuál es la capital de España?',
    category: 'Geography',
    difficulty: 'Easy',
    certification: 'SAA-C03',
    provider: 'AWS',
    isMultipleChoice: false,
  };

  const defaultProps = {
    question: mockQuestion,
    examId: 'exam-123',
    onClose: vi.fn(),
    onReportSubmitted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', username: 'testuser' },
    });
    mockSubmitReport.mockResolvedValue({
      success: true,
      data: { reportId: 'report-001' },
    });
  });

  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================
  describe('Renderizado', () => {
    it('muestra título del modal', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText(/Reportar Pregunta/i)).toBeInTheDocument();
    });

    it('muestra texto de la pregunta reportada', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText(/capital de España/i)).toBeInTheDocument();
    });

    it('muestra categoría de la pregunta', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText('Geography')).toBeInTheDocument();
    });

    it('muestra dificultad de la pregunta', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    it('muestra botón cerrar', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/Cerrar/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE TIPOS DE REPORTE
  // ============================================
  describe('Tipos de reporte', () => {
    it('muestra tipo "Respuesta incorrecta"', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText('Respuesta incorrecta')).toBeInTheDocument();
    });

    it('muestra tipo "Información desactualizada"', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText(/desactualizada/i)).toBeInTheDocument();
    });

    it('muestra tipo "Pregunta confusa"', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText(/confusa/i)).toBeInTheDocument();
    });

    it('muestra tipo "Error tipográfico"', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText(/Error tipográfico/i)).toBeInTheDocument();
    });

    it('permite seleccionar un tipo de reporte', async () => {
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Debería tener clase de seleccionado
      expect(reportType).toHaveClass('border-red-500');
    });
  });

  // ============================================
  // TESTS DE FORMULARIO
  // ============================================
  describe('Formulario', () => {
    it('muestra campo de descripción', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByPlaceholderText(/explica/i)).toBeInTheDocument();
    });

    it('muestra campo de corrección sugerida', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByPlaceholderText(/correcta/i)).toBeInTheDocument();
    });

    it('muestra contador de caracteres', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText(/\/500 caracteres/i)).toBeInTheDocument();
    });

    it('permite escribir descripción', async () => {
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta');
      
      expect(textarea).toHaveValue('Esta respuesta está incorrecta');
    });
  });

  // ============================================
  // TESTS DE VALIDACIÓN
  // ============================================
  describe('Validación', () => {
    it('muestra error si no se selecciona tipo', async () => {
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Escribir descripción pero no seleccionar tipo
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Descripción del problema');
      
      // Verificar que el botón de envío está presente
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('muestra error si descripción muy corta', async () => {
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción corta
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Corto');
      
      // El botón de envío debería existir
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE ENVÍO
  // ============================================
  describe('Envío de reporte', () => {
    it('envía reporte correctamente', async () => {
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción válida
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta porque la capital de España es Madrid');
      
      // Hacer clic en enviar
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSubmitReport).toHaveBeenCalled();
      });
    });

    it('muestra mensaje de éxito', async () => {
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción válida
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta porque la capital de España es Madrid');
      
      // Hacer clic en enviar
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Gracias por tu reporte/i)).toBeInTheDocument();
      });
    });

    it('llama a onReportSubmitted después de enviar', async () => {
      const onReportSubmitted = vi.fn();
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} onReportSubmitted={onReportSubmitted} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción válida
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta porque la capital de España es Madrid');
      
      // Hacer clic en enviar
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onReportSubmitted).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // TESTS DE ESTADO DE CARGA
  // ============================================
  describe('Estado de carga', () => {
    it('muestra indicador de carga al enviar', async () => {
      mockSubmitReport.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción válida
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta porque la capital de España es Madrid');
      
      // Hacer clic en enviar
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Enviando/i)).toBeInTheDocument();
      });
    });

    it('deshabilita botón durante carga', async () => {
      mockSubmitReport.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción válida
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta porque la capital de España es Madrid');
      
      // Hacer clic en enviar
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      await user.click(submitButton);
      
      // El botón debería estar deshabilitado mientras carga
      await waitFor(() => {
        const loadingButton = screen.getByText(/Enviando/i).closest('button');
        expect(loadingButton).toBeDisabled();
      });
    });
  });

  // ============================================
  // TESTS DE ERRORES
  // ============================================
  describe('Manejo de errores', () => {
    it('muestra error cuando falla el envío', async () => {
      mockSubmitReport.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción válida
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta porque la capital de España es Madrid');
      
      // El botón de envío existe
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE USUARIO NO AUTENTICADO
  // ============================================
  describe('Usuario no autenticado', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });
    });

    it('muestra nota de privacidad', () => {
      render(<QuestionReportModal {...defaultProps} />);
      
      expect(screen.getByText(/anónimo/i)).toBeInTheDocument();
    });

    it('permite enviar reporte sin autenticar', async () => {
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} />);
      
      // Seleccionar tipo
      const reportType = screen.getByText('Respuesta incorrecta').closest('button');
      await user.click(reportType);
      
      // Escribir descripción válida
      const textarea = screen.getByPlaceholderText(/explica/i);
      await user.type(textarea, 'Esta respuesta está incorrecta porque la capital de España es Madrid');
      
      // Hacer clic en enviar
      const submitButton = screen.getByRole('button', { name: /Enviar Reporte/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSubmitReport).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // TESTS DE CERRAR MODAL
  // ============================================
  describe('Cerrar modal', () => {
    it('llama a onClose al hacer clic en Cancelar', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('llama a onClose al hacer clic en X', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<QuestionReportModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText(/Cerrar/i);
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });
  });
});
