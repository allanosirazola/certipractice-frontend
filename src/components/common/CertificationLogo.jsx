// CertificationLogo.jsx - Logos de certificaciones con CDN y fallbacks
import { useState, useEffect } from 'react';

// CDN de logos de certificaciones
const CERTIFICATION_LOGOS = {
  // AWS Certifications
  'SAA-C03': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Solutions-Architect-Associate_badge.3419559c682629072f1eb968d59dea0741772c0f.png',
  'DVA-C02': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Developer-Associate_badge.5c083fa855fe82c1cf2d0c8b883c265ec72a17c0.png',
  'SOA-C02': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-SysOps-Administrator-Associate_badge.c3586b02748654fb588633f5dfb1b3e370bfa22e.png',
  'SAP-C02': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Solutions-Architect-Professional_badge.69d82ff1b2861e1089539ebba906c70b011b928a.png',
  'DOP-C02': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-DevOps-Engineer-Professional_badge.8b8c1e64e3a4e11a6a3952ec4a7e51bc0a7d7b56.png',
  'CLF-C02': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Cloud-Practitioner_badge.634f8a21af2e0e956ed8905a72366146ba22b74c.png',
  'MLS-C01': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Machine-Learning-Specialty_badge.e5d66b56552bbf046f905bacaecef6c87b575583.png',
  'DBS-C01': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Database-Specialty_badge.c33e25fc22fd70e8cf62b4e8c8ac07c93e25bb2a.png',
  'ANS-C01': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Advanced-Networking-Specialty_badge.e907f6c7f9fd92e48eeae4a0a72e5a3f96e3fa23.png',
  'SCS-C02': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Security-Specialty_badge.b3c21ba2be19e81ff55fb2ea66ac5c5e9fb0f50d.png',
  'DEA-C01': 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Data-Engineer-Associate_badge.c1ffe7a1dd10b0be9b7a39e6b9e3e6e6f7f8e7b1.png',
  
  // Google Cloud Certifications
  'GCP-ACE': 'https://cloud.google.com/static/images/certification/badges/ace-badge.png',
  'GCP-PCA': 'https://cloud.google.com/static/images/certification/badges/pca-badge.png',
  'GCP-PDE': 'https://cloud.google.com/static/images/certification/badges/pde-badge.png',
  'GCP-PMLE': 'https://cloud.google.com/static/images/certification/badges/pmle-badge.png',
  'GCP-PCN': 'https://cloud.google.com/static/images/certification/badges/pcn-badge.png',
  'GCP-PCS': 'https://cloud.google.com/static/images/certification/badges/pcs-badge.png',
  'GCP-CDL': 'https://cloud.google.com/static/images/certification/badges/cdl-badge.png',
  
  // Azure Certifications
  'AZ-900': 'https://images.credly.com/size/680x680/images/be8fcaeb-c769-4858-b567-ffaaa73ce8cf/image.png',
  'AZ-104': 'https://images.credly.com/size/680x680/images/336eebfc-0ac3-4553-9a67-b402f491f185/azure-administrator-associate-600x600.png',
  'AZ-204': 'https://images.credly.com/size/680x680/images/63316b60-f62d-4e51-aacc-c23cb850089c/azure-developer-associate-600x600.png',
  'AZ-305': 'https://images.credly.com/size/680x680/images/987adb7e-49be-4f24-8e22-55f0bf8ae4a2/azure-solutions-architect-expert-600x600.png',
  'AZ-400': 'https://images.credly.com/size/680x680/images/c3ab66f8-5d59-4afa-a6c2-0ba30a1989ca/CERT-Expert-DevOps-Engineer-600x600.png',
  'AZ-500': 'https://images.credly.com/size/680x680/images/1ad16b6f-2c71-4a2e-ae74-ec69c4766039/azure-security-engineer-associate600x600.png',
  'AI-900': 'https://images.credly.com/size/680x680/images/4136ced8-75d5-4afb-8677-40b6236e2672/azure-ai-fundamentals-600x600.png',
  'DP-900': 'https://images.credly.com/size/680x680/images/70eb1e3f-d4de-4377-a062-b20fb29594ea/azure-data-fundamentals-600x600.png',
  'DP-203': 'https://images.credly.com/size/680x680/images/61542181-0e8d-496c-a17c-3d4bf590edd1/azure-data-engineer-associate-600x600.png',
  'DP-300': 'https://images.credly.com/size/680x680/images/edc0b0d8-55ec-4cc4-9571-aa93eb80c2f2/azure-database-administrator-associate-600x600.png',
  
  // Databricks Certifications
  'DATABRICKS-DE': 'https://www.databricks.com/sites/default/files/2022-04/data-engineer-badge.png',
  'DATABRICKS-ML': 'https://www.databricks.com/sites/default/files/2022-04/ml-practitioner-badge.png',
  'DATABRICKS-DA': 'https://www.databricks.com/sites/default/files/2022-04/data-analyst-badge.png',
  
  // Snowflake Certifications
  'SNOWPRO-CORE': 'https://www.snowflake.com/wp-content/uploads/2021/01/SnowPro-Core-Certification.png',
  'SNOWPRO-ADV': 'https://www.snowflake.com/wp-content/uploads/2021/01/SnowPro-Advanced.png',
  
  // HashiCorp Certifications
  'TERRAFORM': 'https://www.hashicorp.com/_next/static/media/terraform-associate.4f08b871.svg',
  'VAULT': 'https://www.hashicorp.com/_next/static/media/vault-associate.c9f2b7c4.svg',
  'CONSUL': 'https://www.hashicorp.com/_next/static/media/consul-associate.d7ee2c8c.svg'
};

// Colores por proveedor para fallback
const PROVIDER_COLORS = {
  'AWS': { bg: 'bg-orange-100', text: 'text-orange-700', gradient: 'from-orange-500 to-orange-600' },
  'Google Cloud': { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-500 to-blue-600' },
  'Microsoft Azure': { bg: 'bg-sky-100', text: 'text-sky-700', gradient: 'from-sky-500 to-sky-600' },
  'Databricks': { bg: 'bg-red-100', text: 'text-red-700', gradient: 'from-red-500 to-red-600' },
  'Snowflake': { bg: 'bg-cyan-100', text: 'text-cyan-700', gradient: 'from-cyan-500 to-cyan-600' },
  'HashiCorp': { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-500 to-purple-600' }
};

export default function CertificationLogo({ 
  code, 
  name, 
  provider,
  size = 'md', // sm, md, lg, xl
  showName = false,
  className = ''
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const logoUrl = CERTIFICATION_LOGOS[code];
  const colors = PROVIDER_COLORS[provider] || { bg: 'bg-gray-100', text: 'text-gray-700', gradient: 'from-gray-500 to-gray-600' };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Renderizar fallback con iniciales
  const renderFallback = () => (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-lg 
        flex items-center justify-center 
        bg-gradient-to-br ${colors.gradient} 
        text-white font-bold 
        ${textSizeClasses[size]}
        shadow-sm
        ${className}
      `}
      title={name || code}
    >
      {code?.substring(0, 3) || '?'}
    </div>
  );

  // Si no hay URL o hubo error, mostrar fallback
  if (!logoUrl || imageError) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {renderFallback()}
        {showName && (
          <span className={`font-medium ${colors.text} ${textSizeClasses[size]}`}>
            {name || code}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {!imageLoaded && (
          <div className={`absolute inset-0 ${colors.bg} rounded-lg animate-pulse`}></div>
        )}
        <img
          src={logoUrl}
          alt={`${name || code} certification logo`}
          className={`
            ${sizeClasses[size]} 
            object-contain 
            rounded-lg
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-200
          `}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
      {showName && (
        <span className={`font-medium text-gray-800 ${textSizeClasses[size]}`}>
          {name || code}
        </span>
      )}
    </div>
  );
}

// Hook para precargar logos
export const usePreloadCertificationLogos = (codes) => {
  useEffect(() => {
    codes.forEach(code => {
      const url = CERTIFICATION_LOGOS[code];
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [codes]);
};

// Exportar mapeo de logos para uso externo
export { CERTIFICATION_LOGOS, PROVIDER_COLORS };