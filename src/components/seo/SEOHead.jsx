import { useEffect } from 'react';

const DEFAULT_SEO = {
  title: 'CertiPractice - Exámenes de Práctica para Certificaciones Cloud',
  description: 'Practica para tus certificaciones de AWS, Google Cloud, Azure, Databricks y más. Miles de preguntas reales de examen con explicaciones detalladas.',
  keywords: 'certificaciones cloud, exámenes práctica, AWS certification, Google Cloud exam, Azure certification, Databricks, preparación exámenes',
  image: '/og-image.jpg',
  url: 'https://certipractice.vercel.app'
};

// Datos estructurados para SEO
const generateStructuredData = (pageType, data = {}) => {
  const baseOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CertiPractice",
    "url": DEFAULT_SEO.url,
    "logo": `${DEFAULT_SEO.url}/logo.png`,
    "description": DEFAULT_SEO.description
  };

  const structures = {
    home: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "CertiPractice",
      "url": DEFAULT_SEO.url,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${DEFAULT_SEO.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    certification: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": data.certificationName || "Certification Practice",
      "description": data.description || DEFAULT_SEO.description,
      "provider": {
        "@type": "Organization",
        "name": data.provider || "CertiPractice"
      },
      "educationalCredentialAwarded": data.certificationCode || ""
    },
    exam: {
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": data.examName || "Practice Exam",
      "about": {
        "@type": "Thing",
        "name": data.certification || "Cloud Certification"
      },
      "educationalAlignment": {
        "@type": "AlignmentObject",
        "educationalFramework": data.provider || "Cloud Provider"
      }
    },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": data.faqs || []
    }
  };

  return structures[pageType] || baseOrg;
};

export default function SEOHead({ 
  title,
  description,
  keywords,
  image,
  url,
  pageType = 'home',
  structuredData = {},
  noIndex = false
}) {
  const seo = {
    title: title ? `${title} | CertiPractice` : DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: keywords || DEFAULT_SEO.keywords,
    image: image || DEFAULT_SEO.image,
    url: url || DEFAULT_SEO.url
  };

  useEffect(() => {
    // Actualizar título
    document.title = seo.title;

    // Función helper para actualizar o crear meta tags
    const setMetaTag = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Meta tags básicos
    setMetaTag('description', seo.description);
    setMetaTag('keywords', seo.keywords);
    
    // Robots
    setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    setMetaTag('og:title', seo.title, true);
    setMetaTag('og:description', seo.description, true);
    setMetaTag('og:image', seo.image, true);
    setMetaTag('og:url', seo.url, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', 'CertiPractice', true);

    // Twitter Cards
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', seo.title);
    setMetaTag('twitter:description', seo.description);
    setMetaTag('twitter:image', seo.image);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seo.url);

    // Structured Data (JSON-LD)
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(generateStructuredData(pageType, structuredData));

    // Cleanup
    return () => {
      // Los meta tags permanecen para evitar parpadeo
    };
  }, [seo, pageType, structuredData, noIndex]);

  return null;
}

// Hook para páginas específicas
export const useSEO = (config) => {
  return <SEOHead {...config} />;
};

// Configuraciones predefinidas para páginas comunes
export const SEO_CONFIGS = {
  home: {
    title: null, // Usa el default
    description: DEFAULT_SEO.description,
    pageType: 'home'
  },
  awsCertifications: {
    title: 'Exámenes de Práctica AWS - Certificaciones Cloud',
    description: 'Prepárate para las certificaciones AWS: Solutions Architect, Developer, SysOps, DevOps y más. Miles de preguntas de práctica con explicaciones.',
    keywords: 'AWS certification, AWS Solutions Architect, AWS Developer, AWS exam practice, AWS SAA-C03, AWS DVA-C02',
    pageType: 'certification',
    structuredData: {
      provider: 'Amazon Web Services',
      certificationName: 'AWS Certifications Practice Exams'
    }
  },
  gcpCertifications: {
    title: 'Exámenes de Práctica Google Cloud - GCP Certifications',
    description: 'Practica para certificaciones Google Cloud: Professional Cloud Architect, Data Engineer, ML Engineer y más.',
    keywords: 'Google Cloud certification, GCP exam, Cloud Architect, Data Engineer, GCP practice',
    pageType: 'certification',
    structuredData: {
      provider: 'Google Cloud',
      certificationName: 'Google Cloud Certifications Practice Exams'
    }
  },
  azureCertifications: {
    title: 'Exámenes de Práctica Microsoft Azure - Azure Certifications',
    description: 'Prepárate para las certificaciones Azure: AZ-900, AZ-104, AZ-204, AZ-305 y más.',
    keywords: 'Azure certification, Microsoft Azure exam, AZ-900, AZ-104, Azure fundamentals',
    pageType: 'certification',
    structuredData: {
      provider: 'Microsoft Azure',
      certificationName: 'Microsoft Azure Certifications Practice Exams'
    }
  }
};