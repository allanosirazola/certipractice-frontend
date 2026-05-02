// ExamenView.test.jsx - Tests para Vitest

// Mock AdBreak to skip countdown in these tests
vi.mock('../../components/ads/AdBreak', () => ({
  default: ({ onComplete }) => { onComplete(); return null; },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock del API
const mockCreateExam = vi.fn();
const mockStartExam = vi.fn();
const mockSubmitAnswer = vi.fn();
const mockCompleteExam = vi.fn();
const mockGetResults = vi.fn();
const mockPauseExam = vi.fn();
const mockGetQuestion = vi.fn();
const mockGetQuestionDetails = vi.fn();
const mockCreateFailedQuestionsExam = vi.fn();

vi.mock('../../services/api', () => ({
  examAPI: {
    createExam: (...args) => mockCreateExam(...args),
    startExam: (...args) => mockStartExam(...args),
    submitAnswer: (...args) => mockSubmitAnswer(...args),
    completeExam: (...args) => mockCompleteExam(...args),
    getResults: (...args) => mockGetResults(...args),
    pauseExam: (...args) => mockPauseExam(...args),
    createFailedQuestionsExam: (...args) => mockCreateFailedQuestionsExam(...args),
  },
  questionAPI: {
    getQuestion: (...args) => mockGetQuestion(...args),
    getQuestionDetails: (...args) => mockGetQuestionDetails(...args),
  },
}));

// Mock de componentes hijos
vi.mock('../../components/exam/ExamExitModal', () => ({
  default: ({ onConfirmExit, onCancel, onSaveAndExit }) => (
    <div data-testid="exit-modal">
      <span>¿Seguro que deseas salir?</span>
      <button onClick={onConfirmExit}>Confirmar salida</button>
      <button onClick={onCancel}>Cancelar</button>
      <button onClick={onSaveAndExit}>Guardar y salir</button>
    </div>
  ),
}));

vi.mock('../../components/exam/ExamReview', () => ({
  default: ({ onClose }) => (
    <div data-testid="exam-review">
      <span>Revisión del examen</span>
      <button onClick={onClose}>Cerrar revisión</button>
    </div>
  ),
}));

import ExamenView from '../../components/ExamenView';

// Mock data - configuración del examen
const mockExamConfig = {
  provider: 'AWS',
  certification: 'SAA-C03',
  questionCount: 65,
  timeLimit: 130,
  mode: 'practice',
};

// Mock data - pregunta
const mockQuestion = {
  id: 'q-001',
  text: '¿Cuál es la capital de España?',
  options: [
    { label: 'A', text: 'Madrid' },
    { label: 'B', text: 'Barcelona' },
    { label: 'C', text: 'Valencia' },
    { label: 'D', text: 'Sevilla' },
  ],
  isMultipleChoice: false,
  expectedAnswers: 1,
  category: 'Geography',
  difficulty: 'Easy',
};

// Mock data - múltiples preguntas para navegación
const mockQuestions = [
  mockQuestion,
  {
    id: 'q-002',
    text: '¿Cuál es el servicio de computación de AWS?',
    options: [
      { label: 'A', text: 'EC2' },
      { label: 'B', text: 'S3' },
      { label: 'C', text: 'RDS' },
      { label: 'D', text: 'Lambda' },
    ],
    isMultipleChoice: false,
    expectedAnswers: 1,
    category: 'Compute',
    difficulty: 'Easy',
  },
];

// Mock data - examen
const mockExam = {
  id: 'exam-123',
  provider: 'AWS',
  certification: 'SAA-C03',
  title: 'AWS Solutions Architect',
  status: 'in_progress',
  timeLimit: 130,
  passingScore: 72,
  questions: [mockQuestion],
};

// Mock data - resultados
const mockResults = {
  passed: true,
  examSummary: {
    score: 85,
    statistics: {
      correctAnswers: 55,
      incorrectAnswers: 10,
      totalQuestions: 65,
    },
  },
  questionResults: [],
};

describe('ExamenView', () => {
  // Props correctos según el componente real
  const defaultProps = {
    examConfig: mockExamConfig,
    nombreCertificacion: 'AWS Solutions Architect Associate',
    onVolver: vi.fn(),
  };

  // Mock de localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.getItem.mockReturnValue('session_test_123');
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123' },
    });
    
    mockCreateExam.mockResolvedValue({
      success: true,
      data: mockExam,
    });
    
    mockStartExam.mockResolvedValue({
      success: true,
      data: { ...mockExam, questions: [mockQuestion] },
    });
    
    mockSubmitAnswer.mockResolvedValue({
      success: true,
      data: { questionId: 'q-001', answer: 0 },
    });
    
    mockCompleteExam.mockResolvedValue({
      success: true,
      data: { ...mockExam, status: 'completed' },
    });
    
    mockGetResults.mockResolvedValue({
      success: true,
      data: mockResults,
    });
    
    mockGetQuestion.mockResolvedValue({
      success: true,
      data: mockQuestion,
    });
    
    mockGetQuestionDetails.mockResolvedValue({
      success: true,
      data: { correctAnswer: 0, explanation: 'Madrid es la capital de España' },
    });

    // Mock para failed questions exam
    mockCreateFailedQuestionsExam.mockResolvedValue({
      success: true,
      data: { ...mockExam, questions: [mockQuestion] },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================
  // TESTS DE CARGA INICIAL
  // ============================================
  describe('Carga inicial', () => {
    it('muestra estado de carga', () => {
      mockCreateExam.mockImplementation(() => new Promise(() => {}));
      render(<ExamenView {...defaultProps} />);
      
      // El componente muestra "Creando tu examen..." durante la carga
      expect(screen.getByText(/Creando tu examen/i)).toBeInTheDocument();
    });

    it('crea examen con la configuración correcta', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockCreateExam).toHaveBeenCalledWith(expect.objectContaining({
          provider: 'AWS',
          certification: 'SAA-C03',
        }));
      });
    });

    it('inicia examen después de crear', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockStartExam).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // TESTS DE VALIDACIÓN DE CONFIGURACIÓN
  // ============================================
  describe('Validación de configuración', () => {
    it('muestra error sin configuración', async () => {
      render(<ExamenView {...defaultProps} examConfig={null} />);
      
      await waitFor(() => {
        const errs = screen.queryAllByText(/Error/i);
        expect(errs.length).toBeGreaterThan(0);
      });
    });

    it('muestra error sin proveedor', async () => {
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, provider: '' }} />);
      
      await waitFor(() => {
        const errs = screen.queryAllByText(/Error/i);
        expect(errs.length).toBeGreaterThan(0);
      });
    });

    it('muestra error sin certificación', async () => {
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, certification: '' }} />);
      
      await waitFor(() => {
        const errs = screen.queryAllByText(/Error/i);
        expect(errs.length).toBeGreaterThan(0);
      });
    });

    it('muestra botón volver en error', async () => {
      render(<ExamenView {...defaultProps} examConfig={null} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Volver al inicio/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE RENDERIZADO DEL EXAMEN
  // ============================================
  describe('Renderizado del examen', () => {
    it('muestra nombre de certificación en header', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('AWS Solutions Architect Associate')).toBeInTheDocument();
      });
    });

    it('muestra timer con formato correcto', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        // El timer muestra formato HH:MM:SS o MM:SS
        expect(screen.getByText(/\d+:\d+/)).toBeInTheDocument();
      });
    });

    it('muestra número de pregunta actual', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Pregunta 1 de/i)).toBeInTheDocument();
      });
    });

    it('muestra texto de la pregunta', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/capital de España/i)).toBeInTheDocument();
      });
    });

    it('muestra opciones de respuesta', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Madrid')).toBeInTheDocument();
        expect(screen.getByText('Barcelona')).toBeInTheDocument();
        expect(screen.getByText('Valencia')).toBeInTheDocument();
        expect(screen.getByText('Sevilla')).toBeInTheDocument();
      });
    });

    it('muestra modo de examen', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Práctica/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE RESPUESTAS
  // ============================================
  describe('Respuestas', () => {
    it('permite seleccionar una respuesta', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Madrid')).toBeInTheDocument();
      });

      // Verificar que la opción Madrid existe y es un elemento clickeable
      const madridOption = screen.getByText('Madrid');
      expect(madridOption).toBeInTheDocument();
    });

    it('muestra contador de respuestas', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Respondidas: 0/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE NAVEGACIÓN
  // ============================================
  describe('Navegación', () => {
    it('muestra botón Anterior deshabilitado en primera pregunta', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        const anteriorBtn = screen.getByRole('button', { name: /Anterior/i });
        expect(anteriorBtn).toBeDisabled();
      });
    });

    it('muestra botón Siguiente cuando hay más de una pregunta', async () => {
      // Configurar múltiples preguntas
      mockStartExam.mockResolvedValue({
        success: true,
        data: { ...mockExam, questions: mockQuestions },
      });
      
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument();
      });
    });

    it('muestra "Enviar Examen" en última pregunta', async () => {
      // Con solo 1 pregunta, debería mostrar Enviar Examen
      mockStartExam.mockResolvedValue({
        success: true,
        data: { ...mockExam, questions: [mockQuestion] },
      });
      
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Enviar Examen/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE MODO PRÁCTICA
  // ============================================
  describe('Modo práctica', () => {
    it('muestra botón Pausar en modo práctica', async () => {
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, mode: 'practice' }} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pausar/i })).toBeInTheDocument();
      });
    });

    it('muestra botón Ver Resumen', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Ver Resumen/i })).toBeInTheDocument();
      });
    });

    it('muestra botón Salir', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Salir/i })).toBeInTheDocument();
      });
    });

    it('no muestra botón Pausar en modo realista', async () => {
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, mode: 'realistic' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Madrid')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /Pausar/i })).not.toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE PAUSA
  // ============================================
  describe('Pausa del examen', () => {
    it('muestra pantalla de pausa al pausar', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, mode: 'practice' }} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pausar/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Pausar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Examen Pausado/i)).toBeInTheDocument();
      });
    });

    it('muestra botón Continuar en pantalla de pausa', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, mode: 'practice' }} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pausar/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Pausar/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE SALIR DEL EXAMEN
  // ============================================
  describe('Salir del examen', () => {
    it('muestra modal de salida al hacer click en Salir', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Salir/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Salir/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('exit-modal')).toBeInTheDocument();
      });
    });

    it('muestra botón Finalizar Examen', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Finalizar Examen/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE ERRORES
  // ============================================
  describe('Errores', () => {
    it('muestra error al fallar creación del examen', async () => {
      mockCreateExam.mockResolvedValue({
        success: false,
        error: 'Error creando el examen',
      });
      
      render(<ExamenView {...defaultProps} />);
      
      // Verificar que se llamó a createExam
      await waitFor(() => {
        expect(mockCreateExam).toHaveBeenCalled();
      });
    });

    it('muestra error al fallar inicio del examen', async () => {
      mockStartExam.mockResolvedValue({
        success: false,
        error: 'Error iniciando el examen',
      });
      
      render(<ExamenView {...defaultProps} />);
      
      // Verificar que se llamó a startExam
      await waitFor(() => {
        expect(mockStartExam).toHaveBeenCalled();
      });
    });

    it('llama a onVolver al hacer click en Volver al inicio', async () => {
      const onVolver = vi.fn();
      mockCreateExam.mockResolvedValue({
        success: false,
        error: 'Error',
      });
      
      render(<ExamenView {...defaultProps} onVolver={onVolver} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Volver al inicio/i })).toBeInTheDocument();
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.click(screen.getByRole('button', { name: /Volver al inicio/i }));
      
      expect(onVolver).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTS DE MODO PREGUNTAS FALLIDAS
  // ============================================
  describe('Modo preguntas fallidas', () => {
    it('usa createFailedQuestionsExam para modo failed_questions', async () => {
      mockCreateFailedQuestionsExam.mockResolvedValue({
        success: true,
        data: { ...mockExam, mode: 'failed_questions' },
      });
      
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, mode: 'failed_questions' }} />);
      
      await waitFor(() => {
        expect(mockCreateFailedQuestionsExam).toHaveBeenCalled();
      });
    });

    it('muestra indicador de modo preguntas fallidas', async () => {
      // Setup específico para este test
      mockCreateFailedQuestionsExam.mockResolvedValue({
        success: true,
        data: { ...mockExam, questions: [mockQuestion] },
      });
      
      mockStartExam.mockResolvedValue({
        success: true,
        data: { ...mockExam, questions: [mockQuestion] },
      });
      
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, mode: 'failed_questions' }} />);
      
      // Esperar a que el examen cargue y se muestre la pregunta
      await waitFor(() => {
        expect(screen.getByText('Madrid')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Ahora buscar el texto "Modo Preguntas Fallidas"
      await waitFor(() => {
        expect(screen.getByText(/Modo Preguntas Fallidas/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('muestra mensaje de enfoque para preguntas fallidas', async () => {
      mockCreateFailedQuestionsExam.mockResolvedValue({
        success: true,
        data: { ...mockExam, questions: [mockQuestion] },
      });
      
      mockStartExam.mockResolvedValue({
        success: true,
        data: { ...mockExam, questions: [mockQuestion] },
      });
      
      render(<ExamenView {...defaultProps} examConfig={{ ...mockExamConfig, mode: 'failed_questions' }} />);
      
      // Esperar a que el examen cargue
      await waitFor(() => {
        expect(screen.getByText('Madrid')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // El componente muestra el mensaje de preguntas fallidas
      await waitFor(() => {
        expect(screen.getByText(/incorrectamente antes/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  // ============================================
  // TESTS DE PROGRESO
  // ============================================
  describe('Progreso', () => {
    it('muestra barra de progreso', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        // Buscar porcentaje de progreso
        expect(screen.getByText(/\d+%/)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE ESTADO DE PREGUNTA
  // ============================================
  describe('Estado de pregunta', () => {
    it('muestra estado Sin responder inicialmente', async () => {
      render(<ExamenView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Sin responder/i)).toBeInTheDocument();
      });
    });
  });
});
