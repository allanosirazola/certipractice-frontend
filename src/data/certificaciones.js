// src/data/certificaciones.js - Simplificado para PostgreSQL backend

// Mapeo de proveedores con información de UI
export const providerMapping = {
  'AWS': {
    id: 'aws',
    nombre: 'Amazon Web Services',
    descripcion: 'Prepárate para los exámenes de certificación de AWS',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  },
  'Google Cloud': {
    id: 'google-cloud',
    nombre: 'Google Cloud Platform',
    descripcion: 'Practica para los exámenes oficiales de Google Cloud',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  'Microsoft Azure': {
    id: 'microsoft-azure',
    nombre: 'Microsoft Azure',
    descripcion: 'Simula exámenes de certificación de Microsoft Azure',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  'Databricks': {
    id: 'databricks',
    nombre: 'Databricks',
    descripcion: 'Certificaciones de Data Engineering y Machine Learning',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  },
  'Snowflake': {
    id: 'snowflake',
    nombre: 'Snowflake',
    descripcion: 'Certificaciones de Data Warehouse y Analytics',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200'
  },
  'HashiCorp': {
    id: 'hashicorp',
    nombre: 'HashiCorp',
    descripcion: 'Certificaciones de Terraform, Vault y herramientas DevOps',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200'
  },
  'Salesforce': {
    id: 'salesforce',
    nombre: 'Salesforce',
    descripcion: 'Certificaciones de CRM y plataforma Salesforce',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200'
  },
  'General': {
    id: 'general',
    nombre: 'General',
    descripcion: 'Preguntas generales de tecnología',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200'
  }
};

// Configuración por defecto para exámenes (se usará como fallback)
export const examDefaults = {
  questionCount: 20,
  timeLimit: 60, // minutos
  passingScore: 75,
  examMode: 'practice',
  settings: {
    randomizeQuestions: true,
    randomizeAnswers: false,
    showExplanations: true,
    allowPause: true,
    allowReview: true
  }
};

// Función para obtener información de proveedor
export const getProviderInfo = (providerId) => {
  return providerMapping[providerId] || providerMapping['General'];
};

// Función para parsear datos de proveedor desde PostgreSQL
export const parseProviderData = (providerData) => {
  // Si ya es un objeto procesado, devolverlo tal como está
  if (typeof providerData === 'object' && providerData.name) {
    return providerData;
  }
  
  // Si es un string (nombre del proveedor), crear objeto básico
  if (typeof providerData === 'string') {
    const providerInfo = getProviderInfo(providerData);
    return {
      name: providerData,
      description: providerInfo.descripcion,
      questionCount: 0,
      certificationCount: 0,
      color: providerInfo.color,
      bgColor: providerInfo.bgColor,
      textColor: providerInfo.textColor,
      borderColor: providerInfo.borderColor
    };
  }
  
  // Si es un objeto de la base de datos PostgreSQL
  const provider = {
    name: providerData.provider_name || providerData.name || 'Unknown',
    description: providerData.description || '',
    questionCount: parseInt(providerData.question_count) || 0,
    certificationCount: parseInt(providerData.certification_count) || 0
  };
  
  // Añadir información de UI desde el mapeo
  const providerInfo = getProviderInfo(provider.name);
  return {
    ...provider,
    color: providerInfo.color,
    bgColor: providerInfo.bgColor,
    textColor: providerInfo.textColor,
    borderColor: providerInfo.borderColor,
    description: provider.description || providerInfo.descripcion
  };
};

// Función para formatear datos de certificación desde PostgreSQL
export const formatCertification = (certificationData) => {
  // Si ya es un objeto procesado, devolverlo tal como está
  if (typeof certificationData === 'object' && (certificationData.code || certificationData.name)) {
    return certificationData;
  }
  
  // Si es un string (nombre de certificación), crear objeto básico
  if (typeof certificationData === 'string') {
    return {
      code: extractCertificationCode(certificationData) || certificationData,
      name: certificationData,
      fullName: certificationData,
      questionCount: certificationData.total_questions,
      difficulty: certificationData. difficulty_level,
      duration: certificationData.duration_minutes,
      passingScore: certificationData.passing_score
    };
  }
  
  // Si es un objeto de la base de datos PostgreSQL
  const certification = {
    code: certificationData.certification_code || 
          certificationData.code || 
          extractCertificationCode(certificationData.certification_name) ||
          certificationData.certification_name || 
          certificationData.name,
    name: certificationData.certification_name || 
          certificationData.name ||
          certificationData.code,
    fullName: certificationData.full_name || 
              certificationData.certification_name || 
              certificationData.name,
    questionCount: parseInt(certificationData.total_questions) || 0,
    difficulty: certificationData.difficulty || 'medium',
    duration: parseInt(certificationData.duration_minutes) || examDefaults.timeLimit,
    passingScore: parseFloat(certificationData.passing_score) || examDefaults.passingScore,
    provider: certificationData.provider || null
  };
  
  return certification;
};

// Función para extraer el código de certificación desde el nombre completo
export const extractCertificationCode = (certName) => {
  if (!certName) return null;
  
  // Buscar patrones como (SAA-C03), (AZ-900), etc.
  const codeMatch = certName.match(/\(([A-Z]{2,3}-[A-Z0-9]+)\)$/);
  if (codeMatch) {
    return codeMatch[1];
  }
  
  return null;
};

// Función para normalizar nombres de certificación
export const normalizeCertificationName = (certName) => {
  if (!certName) return '';
  
  // Remover prefijos comunes
  let normalized = certName
    .replace(/^(AWS Certified|Google Cloud Certified|Microsoft Certified|Databricks Certified|Salesforce Certified|HashiCorp Certified):\s*/i, '')
    .replace(/\s*\([^)]+\)$/, '') // Remover códigos entre paréntesis al final
    .trim();
  
  return normalized;
};

// Función para obtener color por dificultad
export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: 'green',
    medium: 'yellow', 
    hard: 'red',
    expert: 'purple'
  };
  return colors[difficulty?.toLowerCase()] || 'gray';
};

// Función para obtener clases CSS por dificultad
export const getDifficultyClasses = (difficulty) => {
  const classes = {
    easy: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-800'
    },
    medium: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    hard: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800'
    },
    expert: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-800'
    }
  };
  return classes[difficulty?.toLowerCase()] || classes.medium;
};

// Función para obtener color por proveedor
export const getProviderColor = (providerId) => {
  const providerInfo = getProviderInfo(providerId);
  return providerInfo.color;
};

// Función para obtener clases CSS por proveedor
export const getProviderClasses = (providerId) => {
  const providerInfo = getProviderInfo(providerId);
  return {
    bg: providerInfo.bgColor,
    text: providerInfo.textColor,
    border: providerInfo.borderColor,
    color: providerInfo.color
  };
};

// FUNCIÓN SIMPLIFICADA: Ya no necesitamos getCertificationLogo
// Los logos se manejarán directamente en los componentes como fallbacks
export const getCertificationLogo = (certId) => {
  // Retorna null para forzar el uso de fallbacks en los componentes
  return null;
};

// FUNCIÓN SIMPLIFICADA: Ya no necesitamos getProviderLogo  
// Los logos se manejarán directamente en los componentes
export const getProviderLogo = (providerName) => {
  // Retorna null para forzar el uso de fallbacks en los componentes
  return null;
};

// Lista de todos los proveedores disponibles
export const availableProviders = Object.keys(providerMapping);

// Configuración de tipos de pregunta (para PostgreSQL)
export const questionTypes = {
  'single_choice': {
    id: 'single_choice',
    name: 'Opción Única',
    description: 'Selecciona una respuesta correcta',
    icon: '○'
  },
  'multiple_choice': {
    id: 'multiple_choice', 
    name: 'Opción Múltiple',
    description: 'Selecciona todas las respuestas correctas',
    icon: '☑'
  },
  'true_false': {
    id: 'true_false',
    name: 'Verdadero/Falso',
    description: 'Determina si la afirmación es verdadera o falsa',
    icon: '◐'
  },
  'scenario': {
    id: 'scenario',
    name: 'Escenario',
    description: 'Pregunta basada en un caso de uso específico',
    icon: '📋'
  }
};

// Función para obtener información de tipo de pregunta
export const getQuestionTypeInfo = (typeId) => {
  return questionTypes[typeId] || {
    id: typeId,
    name: typeId,
    description: 'Tipo de pregunta',
    icon: '?'
  };
};

// FUNCIÓN REMOVIDA: createExamConfig ya no es necesaria
// La configuración del examen se creará directamente en los componentes
// usando los datos de la certificación de PostgreSQL

// Función para validar si una certificación existe (simplificada)
export const isValidCertification = (provider, certification) => {
  // Como los datos vienen de PostgreSQL, asumimos que son válidos
  return !!(provider && certification);
};

// Función para obtener nombre legible de certificación (simplificada)
export const getCertificationName = (certId) => {
  return normalizeCertificationName(certId) || certId;
};

// Función para obtener información completa de certificación
export const getCertificationInfo = (certId) => {
  return {
    id: certId,
    name: getCertificationName(certId),
    logo: null // Se manejará en el componente
  };
};

// Función para buscar certificaciones por texto (simplificada)
export const searchCertifications = (searchTerm, allCertifications = []) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const term = searchTerm.toLowerCase();
  
  return allCertifications.filter(cert => 
    cert.name?.toLowerCase().includes(term) ||
    cert.code?.toLowerCase().includes(term) ||
    cert.provider?.toLowerCase().includes(term)
  );
};