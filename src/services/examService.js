// src/services/examService.js
const API_BASE_URL = config.API_URL;

class ExamService {
  // Crear un nuevo examen
  async createExam(examData, token) {
    try {
      const response = await fetch(`${API_URL}/exams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(examData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, exam: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error creando examen:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener exámenes del usuario
  async getUserExams(token, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`${API_URL}/exams?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, exams: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error obteniendo exámenes:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener un examen específico
  async getExamById(examId, token) {
    try {
      const response = await fetch(`${API_URL}/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, exam: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error obteniendo examen:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Iniciar un examen
  async startExam(examId, token) {
    try {
      const response = await fetch(`${API_URL}/exams/${examId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, exam: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error iniciando examen:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Enviar respuesta a una pregunta
  async submitAnswer(examId, questionId, answer, token) {
    try {
      const response = await fetch(`${API_URL}/exams/${examId}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionId, answer })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Completar examen
  async completeExam(examId, token) {
    try {
      const response = await fetch(`${API_URL}/exams/${examId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, exam: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error completando examen:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener resultados del examen
  async getExamResults(examId, token) {
    try {
      const response = await fetch(`${API_URL}/exams/${examId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, results: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error obteniendo resultados:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Eliminar examen
  async deleteExam(examId, token) {
    try {
      const response = await fetch(`${API_URL}/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error eliminando examen:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
}

export default new ExamService();