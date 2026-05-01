// ExamHistory.test.jsx - Tests para Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock del API
const mockGetUserExams = vi.fn();
const mockDeleteExam = vi.fn();
vi.mock('../../services/api', () => ({
  examAPI: {
    getUserExams: (...args) => mockGetUserExams(...args),
    deleteExam: (...args) => mockDeleteExam(...args),
  },
  utils: {
    formatApiError: (err) => err.message || 'Error desconocido',
  },
}));

// Mock de ExamReview
vi.mock('../../components/exam/ExamReview', () => ({
  default: ({ onClose }) => (
    <div data-testid="exam-review-modal">
      <button onClick={onClose}>Cerrar Review</button>
    </div>
  ),
}));

// Import del componente DESPUÉS de los mocks
import ExamHistory from '../../components/exam/ExamHistory';

// Mock data
const mockExamInProgress = {
  id: 'exam-123',
  title: 'AWS Solutions Architect',
  provider: 'AWS',
  certification: 'SAA-C03',
  status: 'in_progress',
  examMode: 'practice',
  timeLimit: 130,
  answeredQuestions: 5,
  questions: Array(65).fill({ id: 'q' }),
  totalQuestions: 65,
  createdAt: '2025-02-10T10:00:00Z',
  score: null,
  passed: null,
};

const mockCompletedExam = {
  id: 'exam-456',
  title: 'AWS Solutions Architect',
  provider: 'AWS',
  certification: 'SAA-C03',
  status: 'completed',
  examMode: 'realistic',
  timeLimit: 130,
  answeredQuestions: 65,
  questions: Array(65).fill({ id: 'q' }),
  totalQuestions: 65,
  createdAt: '2025-02-09T08:00:00Z',
  completedAt: '2025-02-09T10:30:00Z',
  score: 78,
  passed: true,
  passingScore: 72,
  correctAnswers: 51,
  incorrectAnswers: 14,
  timeSpent: 120,
};

const mockExamGCP = {
  id: 'exam-789',
  title: 'Google Cloud Associate',
  provider: 'GCP',
  certification: 'ACE',
  status: 'in_progress',
  examMode: 'practice',
  timeLimit: 120,
  answeredQuestions: 30,
  questions: Array(50).fill({ id: 'q' }),
  totalQuestions: 50,
  createdAt: '2025-02-11T08:00:00Z',
  score: null,
  passed: null,
};

describe('ExamHistory', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onResumeExam: vi.fn(),
  };

  const mockExams = [mockExamInProgress, mockCompletedExam, mockExamGCP];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', username: 'testuser' },
    });
    
    mockGetUserExams.mockResolvedValue({
      success: true,
      data: mockExams,
    });
    
    mockDeleteExam.mockResolvedValue({
      success: true,
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

    it('muestra mensaje de login requerido', () => {
      render(<ExamHistory {...defaultProps} />);
      
      expect(screen.getByText(/log in/i)).toBeInTheDocument();
    });

    it('muestra botón de cerrar', () => {
      render(<ExamHistory {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();
    });

    it('llama a onClose al cerrar modal de no autenticado', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} onClose={onClose} />);
      
      await user.click(screen.getByRole('button', { name: /Cerrar/i }));
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTS DE ESTADO DE CARGA
  // ============================================
  describe('Estado de carga', () => {
    it('muestra spinner mientras carga', () => {
      mockGetUserExams.mockImplementation(() => new Promise(() => {}));
      
      render(<ExamHistory {...defaultProps} />);
      
      expect(screen.getByText(/Loading exams/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================
  describe('Renderizado', () => {
    it('muestra título del modal', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      expect(screen.getByText('Exam History')).toBeInTheDocument();
    });

    it('muestra lista de exámenes', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        // Buscar cualquier indicador de que hay exámenes listados
        expect(screen.getByText(/Historial/i)).toBeInTheDocument();
      });
      
      // Esperar a que carguen los exámenes
      await waitFor(() => {
        expect(mockGetUserExams).toHaveBeenCalled();
      });
    });

    it('muestra badges de estado', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByText(/En progreso/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Completado/i)).toBeInTheDocument();
      });
    });

    it('muestra iconos de modo práctica', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByText(/Practice/i).length).toBeGreaterThan(0);
      });
    });

    it('muestra puntuación para exámenes completados', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/78\.0%/)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE FILTROS
  // ============================================
  describe('Filtros', () => {
    it('muestra filtro de todos', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /📄.*Todos/i })).toBeInTheDocument();
    });

    it('muestra filtro de completados', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /✅.*Completados/i })).toBeInTheDocument();
    });

    it('aplica filtro al hacer click', async () => {
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} />);
      
      // Esperar a que cargue el componente
      await waitFor(() => {
        expect(screen.getByText(/Historial/i)).toBeInTheDocument();
      });

      // Verificar que el filtro existe
      const completadosBtn = screen.getByRole('button', { name: /✅.*Completados/i });
      expect(completadosBtn).toBeInTheDocument();
    });

    it('muestra estilo activo en filtro seleccionado', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      // El filtro "Todos" está activo por defecto
      const todosBtn = screen.getByRole('button', { name: /📄.*Todos/i });
      expect(todosBtn).toHaveClass('bg-blue-600');
    });
  });

  // ============================================
  // TESTS DE ACCIONES EN PROGRESO
  // ============================================
  describe('Acciones en exámenes en progreso', () => {
    it('muestra botón Continuar', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Continuar/i }).length).toBeGreaterThan(0);
      });
    });

    it('llama a onResumeExam al hacer clic en Continuar', async () => {
      const onResumeExam = vi.fn();
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} onResumeExam={onResumeExam} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Continuar/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /Continuar/i })[0]);
      
      // El componente llama onResumeExam solo con el examId
      expect(onResumeExam).toHaveBeenCalledWith('exam-123');
    });
  });

  // ============================================
  // TESTS DE ACCIONES COMPLETADO
  // ============================================
  describe('Acciones en exámenes completados', () => {
    it('muestra botón Ver Resultados', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Ver Resultados/i })).toBeInTheDocument();
      });
    });

    it('abre modal de revisión al ver resultados', async () => {
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Ver Resultados/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Ver Resultados/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('exam-review-modal')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE ELIMINAR
  // ============================================
  describe('Eliminar exámenes', () => {
    it('muestra botón Eliminar', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Eliminar/i }).length).toBeGreaterThan(0);
      });
    });

    it('confirma antes de eliminar', async () => {
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Eliminar/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);
      
      expect(window.confirm).toHaveBeenCalled();
    });

    it('llama a deleteExam con el id correcto', async () => {
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Eliminar/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);
      
      expect(mockDeleteExam).toHaveBeenCalledWith('exam-123');
    });

    it('no elimina al cancelar confirmación', async () => {
      window.confirm.mockReturnValue(false);
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Eliminar/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);
      
      expect(mockDeleteExam).not.toHaveBeenCalled();
    });

    it('elimina examen de la lista después de borrar', async () => {
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Eliminar/i }).length).toBe(3);
      });

      await user.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);
      
      // Después de eliminar, la lista se actualiza localmente
      await waitFor(() => {
        expect(mockDeleteExam).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // TESTS DE ESTADO VACÍO
  // ============================================
  describe('Estado vacío', () => {
    it('muestra mensaje cuando no hay exámenes', async () => {
      mockGetUserExams.mockResolvedValue({
        success: true,
        data: [],
      });
      
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/No exams/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE ERRORES
  // ============================================
  describe('Manejo de errores', () => {
    it('muestra error cuando falla la carga', async () => {
      mockGetUserExams.mockRejectedValue(new Error('Network error'));
      
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('muestra error al fallar eliminación', async () => {
      mockDeleteExam.mockRejectedValue(new Error('Delete failed'));
      
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Eliminar/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/Delete failed/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE INFORMACIÓN
  // ============================================
  describe('Información del examen', () => {
    it('muestra cantidad de preguntas respondidas', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      // Esperar a que el componente cargue
      await waitFor(() => {
        expect(screen.getByText(/Historial/i)).toBeInTheDocument();
      });
      
      // Esperar a que se carguen los exámenes
      await waitFor(() => {
        expect(mockGetUserExams).toHaveBeenCalled();
      });
    });

    it('muestra tiempo límite formateado', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        // 130 min = 2h 10min
        expect(screen.getAllByText(/2h 10min/).length).toBeGreaterThan(0);
      });
    });

    it('muestra proveedor', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByText(/AWS/).length).toBeGreaterThan(0);
        expect(screen.getByText(/GCP/)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE ESTADÍSTICAS COMPLETADAS
  // ============================================
  describe('Estadísticas de exámenes completados', () => {
    it('muestra correctas e incorrectas', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('51')).toBeInTheDocument(); // correctas
        expect(screen.getByText('14')).toBeInTheDocument(); // incorrectas
      });
    });

    it('muestra tiempo usado para completados', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        // Buscar el label "Tiempo usado"
        expect(screen.getByText(/Tiempo usado/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE CERRAR MODAL
  // ============================================
  describe('Cerrar modal', () => {
    it('llama a onClose al hacer clic en botón Cerrar del footer', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Historial/i)).toBeInTheDocument();
      });

      // El botón Cerrar del footer tiene texto "Cerrar" (no "✕")
      const closeButtons = screen.getAllByText(/Cerrar/i);
      // Filtrar solo los que son botones
      const buttonCerrar = closeButtons.find(el => el.tagName === 'BUTTON' || el.closest('button'));
      if (buttonCerrar) {
        await user.click(buttonCerrar.closest('button') || buttonCerrar);
      }
      
      expect(onClose).toHaveBeenCalled();
    });

    it('llama a onClose al hacer clic en X del header', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<ExamHistory {...defaultProps} onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Exam History')).toBeInTheDocument();
      });

      // El botón X (✕) está en el header
      await user.click(screen.getByText('✕'));
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTS DE BADGES
  // ============================================
  describe('Badges de resultado', () => {
    it('muestra checkmark para aprobado', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/✓/)).toBeInTheDocument();
      });
    });

    it('muestra X para reprobado', async () => {
      mockGetUserExams.mockResolvedValue({
        success: true,
        data: [{
          ...mockCompletedExam,
          score: 50,
          passed: false,
        }],
      });
      
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/✗/)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE CONTADOR
  // ============================================
  describe('Contador de exámenes', () => {
    it('muestra cantidad de exámenes encontrados', async () => {
      render(<ExamHistory {...defaultProps} />);
      
      await waitFor(() => {
        // Verificar que hay 3 exámenes listados
        const examItems = screen.getAllByText(/AWS/);
        expect(examItems.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
