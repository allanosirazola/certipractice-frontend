// CertificationLogo.jsx - Logos locales en /public/images/certifications/{CODE}.svg
// Con fallback inteligente: cert local → provider PNG local → iniciales en gradiente
import { useState, useEffect } from 'react';
import { LOCAL_CERT_CODES } from '../../data/certRegistry.js';

// Mapa de provider name → logo PNG local en /public/images
const PROVIDER_LOGO_FILE = {
  'AWS': '/images/aws-logo.png',
  'Amazon Web Services': '/images/aws-logo.png',
  'Google Cloud': '/images/google-cloud-logo.png',
  'Google Cloud Platform': '/images/google-cloud-logo.png',
  'GCP': '/images/google-cloud-logo.png',
  'Microsoft Azure': '/images/microsoft-azure-logo.png',
  'Azure': '/images/microsoft-azure-logo.png',
  'Databricks': '/images/databricks-logo.png',
  'Snowflake': '/images/snowflake-logo.png',
  'HashiCorp': '/images/hashicorp-logo.png',
  'Salesforce': '/images/salesforce-logo.png',
};

// Colores de gradiente para fallback inicial-based
const PROVIDER_COLORS = {
  'AWS':              { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-200', gradient: 'from-orange-500 to-orange-600' },
  'Amazon Web Services': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-200', gradient: 'from-orange-500 to-orange-600' },
  'Google Cloud':     { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-200',   gradient: 'from-blue-500 to-green-500' },
  'GCP':              { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-200',   gradient: 'from-blue-500 to-green-500' },
  'Microsoft Azure':  { bg: 'bg-sky-100 dark:bg-sky-900/40',     text: 'text-sky-700 dark:text-sky-200',     gradient: 'from-sky-500 to-cyan-500' },
  'Azure':            { bg: 'bg-sky-100 dark:bg-sky-900/40',     text: 'text-sky-700 dark:text-sky-200',     gradient: 'from-sky-500 to-cyan-500' },
  'Databricks':       { bg: 'bg-red-100 dark:bg-red-900/40',     text: 'text-red-700 dark:text-red-200',     gradient: 'from-red-500 to-orange-600' },
  'Snowflake':        { bg: 'bg-cyan-100 dark:bg-cyan-900/40',   text: 'text-cyan-700 dark:text-cyan-200',   gradient: 'from-cyan-500 to-blue-600' },
  'HashiCorp':        { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-200', gradient: 'from-purple-500 to-violet-700' },
  'Salesforce':       { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-200', gradient: 'from-blue-400 to-blue-700' },
};

// Resuelve la URL del logo. Public order:
// 1. SVG específico de la certificación si existe el código en LOCAL_CERT_CODES
// 2. PNG del proveedor
// 3. null (= usar fallback con iniciales)
export function resolveCertLogoUrl(code, provider) {
  if (code) {
    const normalized = String(code).toUpperCase().trim();
    if (LOCAL_CERT_CODES.has(normalized)) {
      return `/images/certifications/${normalized}.svg`;
    }
  }
  if (provider && PROVIDER_LOGO_FILE[provider]) {
    return PROVIDER_LOGO_FILE[provider];
  }
  return null;
}

const SIZE_CLASSES = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16', xl: 'w-24 h-24' };
const TEXT_SIZE = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg', xl: 'text-xl' };

export default function CertificationLogo({
  code,
  name,
  provider,
  size = 'md',
  showName = false,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset on prop change
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [code, provider]);

  const logoUrl = imageError ? null : resolveCertLogoUrl(code, provider);
  const colors = PROVIDER_COLORS[provider] || {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-200',
    gradient: 'from-gray-500 to-gray-600',
  };

  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const textCls = TEXT_SIZE[size] || TEXT_SIZE.md;

  // Fallback: iniciales en cuadrado con gradiente del proveedor
  const renderFallback = () => (
    <div
      className={`${sizeCls} rounded-lg flex items-center justify-center bg-gradient-to-br ${colors.gradient} text-white font-bold ${textCls} shadow-sm`}
      title={name || code || 'Certification'}
      data-testid="cert-logo-fallback"
    >
      {(code?.toString().substring(0, 3) || provider?.toString().substring(0, 2) || '?').toUpperCase()}
    </div>
  );

  const wrapperCls = `flex items-center gap-2 ${className}`;

  if (!logoUrl) {
    return (
      <div className={wrapperCls}>
        {renderFallback()}
        {showName && (
          <span className={`font-medium ${colors.text} ${textCls}`}>{name || code}</span>
        )}
      </div>
    );
  }

  return (
    <div className={wrapperCls}>
      <div className={`${sizeCls} relative flex-shrink-0`}>
        {!imageLoaded && (
          <div className={`absolute inset-0 ${colors.bg} rounded-lg animate-pulse`} aria-hidden="true" />
        )}
        <img
          src={logoUrl}
          alt={`${name || code || provider} certification logo`}
          className={`${sizeCls} object-contain rounded-lg ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
          data-testid="cert-logo-img"
        />
      </div>
      {showName && (
        <span className={`font-medium text-gray-800 dark:text-gray-100 ${textCls}`}>
          {name || code}
        </span>
      )}
    </div>
  );
}

// Hook para precargar logos en background
export const usePreloadCertificationLogos = (codes = []) => {
  useEffect(() => {
    codes.forEach(code => {
      const url = resolveCertLogoUrl(code);
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [codes]);
};

export { LOCAL_CERT_CODES, PROVIDER_COLORS, PROVIDER_LOGO_FILE };
