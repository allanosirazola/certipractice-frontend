// ExamReview.test.jsx - Tests para Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del API
const mockGetExamForReview = vi.fn();
const mockGetExam = vi.fn();
const mockGetResults = vi.fn();
const mockGetQuestion = vi.fn();

vi.mock('../../services/api', () => ({
  examAPI: {
    getExamForReview: (...args) => mockGetExamForReview(...args),
    getExam: (...args) => mockGetExam(...args),
    getResults: (...args) => mockGetResults(...args),
  },
  questionAPI: {
    getQuestion: (...args) => mockGetQuestion(...args),
  },
}));

import ExamReview from '../../components/exam/ExamReview';

// Mock data
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
  correctAnswers: 0,
  explanation: 'Madrid es la capital de España',
};

const mockResults = {
  examId: 'exam-456',
  score: 78,
  passed: true,
  totalQuestions: 1,
  correctAnswers: 1,
  incorrectAnswers: 0,
  examSummary: {
    score: 78,
  },
  questionResults: [
    {
      questionId: 'q-001',
      questionText: '¿Cuál es la capital de España?',
      category: 'Geography',
      difficulty: 'Easy',
      questionType: 'single_answer',
      expectedAnswers: 1,
      userAnswer: 0,
      isAnswered: true,
      isCorrect: true,
      correctAnswers: 0,
      explanation: 'Madrid es la capital de España',
    },
  ],
};

// examData con results (el caso más común desde ExamHistory)
const mockExamData = {
  examSummary: {
    id: 'exam-456',
    title: 'AWS Solutions Architect',
    provider: 'AWS',
    certification: 'SAA-C03',
    status: 'completed',
  },
  results: mockResults,
};

describe('ExamReview', () => {
  const defaultProps = {
    examId: 'exam-456',
    examData: mockExamData,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockGetExamForReview.mockResolvedValue({
      success: true,
      data: {
        id: 'exam-456',
        title: 'AWS Solutions Architect',
        provider: 'AWS',
        certification: 'SAA-C03',
        status: 'completed',
        examMode: 'practice',
        questions: [mockQuestion],
        answers: { 'q-001': 0 },
      },
    });
    
    mockGetResults.mockResolvedValue({
      success: true,
      data: mockResults,
    });
    
    mockGetQuestion.mockResolvedValue({
      success: true,
      data: mockQuestion,
    });
  });

  // ============================================
  // TESTS DE ESTADO DE CARGA
  // ============================================
  describe('Estado de carga', () => {
    it('muestra spinner mientras carga', () => {
      // Sin examData, debe cargar de API y mostrar loading
      mockGetExamForReview.mockImplementation(() => new Promise(() => {}));
      render(<ExamReview examId="exam-456" onClose={vi.fn()} />);
      
      expect(screen.getByText(/Loading review/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================
  describe('Renderizado', () => {
    it('muestra título del modal', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Exam Review')).toBeInTheDocument();
      });
    });

    it('muestra puntuación', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/78%/)).toBeInTheDocument();
      });
    });

    it('muestra resultado aprobado', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Aprobado/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE FILTROS
  // ============================================
  describe('Filtros', () => {
    it('muestra filtros de preguntas', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /📄.*Todas/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /✅.*Correctas/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /❌.*Incorrectas/i })).toBeInTheDocument();
      });
    });

    it('aplica filtro de incorrectas', async () => {
      render(<ExamReview {...defaultProps} />);
      
      // Esperar a que cargue
      await waitFor(() => {
        expect(screen.getByText(/Revisión/i)).toBeInTheDocument();
      });

      // Verificar que el botón de filtro existe
      const incorrectasBtn = screen.queryByRole('button', { name: /❌.*Incorrectas/i }) || 
                              screen.queryByText(/Incorrectas/i);
      expect(incorrectasBtn).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTS DE VISUALIZACIÓN DE PREGUNTAS
  // ============================================
  describe('Visualización de preguntas', () => {
    it('muestra texto de la pregunta', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/capital de España/i)).toBeInTheDocument();
      });
    });

    it('muestra opciones de respuesta', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Madrid')).toBeInTheDocument();
      });
    });

    it('muestra categoría de la pregunta', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Geography')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE NAVEGACIÓN
  // ============================================
  describe('Navegación', () => {
    it('muestra botones de navegación', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /← Anterior/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Siguiente →/i })).toBeInTheDocument();
      });
    });

    it('deshabilita anterior en primera pregunta', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /← Anterior/i });
        expect(prevButton).toBeDisabled();
      });
    });
  });

  // ============================================
  // TESTS DE EXPLICACIÓN
  // ============================================
  describe('Explanation', () => {
    it('muestra sección de explicación', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Explanation')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE CERRAR
  // ============================================
  describe('Cerrar', () => {
    it('llama a onClose al hacer clic en cerrar', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<ExamReview {...defaultProps} onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Close Review/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Close Review/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it('llama a onClose al hacer clic en X', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<ExamReview {...defaultProps} onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('✕')).toBeInTheDocument();
      });

      await user.click(screen.getByText('✕'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTS DE ERRORES
  // ============================================
  describe('Errores', () => {
    it('muestra error cuando falla la carga', async () => {
      mockGetExamForReview.mockRejectedValue(new Error('Network error'));
      
      render(<ExamReview examId="exam-456" onClose={vi.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // TESTS DE ESTADO DE RESPUESTA
  // ============================================
  describe('Estado de respuesta', () => {
    it('muestra indicador de estado de pregunta', async () => {
      render(<ExamReview {...defaultProps} />);
      
      await waitFor(() => {
        // Buscar el indicador de estado
        expect(screen.getByText(/Estado:/i)).toBeInTheDocument();
      });
    });
  });
});
