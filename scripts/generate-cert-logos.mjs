// generate-cert-logos.mjs
// Builds SVG cert logos in public/images/certifications
// Each logo: provider-themed gradient ring + cert code + speciality icon
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('public/images/certifications');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Theme per provider ────────────────────────────────────────────────
const THEMES = {
  AWS:        { primary: '#FF9900', secondary: '#232F3E', accent: '#FFFFFF' },
  GCP:        { primary: '#4285F4', secondary: '#0F9D58', accent: '#FFFFFF' },
  Azure:      { primary: '#0078D4', secondary: '#50E6FF', accent: '#FFFFFF' },
  Databricks: { primary: '#FF3621', secondary: '#1B3139', accent: '#FFFFFF' },
  Snowflake:  { primary: '#29B5E8', secondary: '#11567F', accent: '#FFFFFF' },
  HashiCorp:  { primary: '#7B42BC', secondary: '#1B0D2A', accent: '#FFFFFF' },
  Salesforce: { primary: '#00A1E0', secondary: '#032E61', accent: '#FFFFFF' },
};

// ─── Speciality glyph (path data) ──────────────────────────────────────
const GLYPHS = {
  architect:   'M50 20 L80 70 L50 60 L20 70 Z M30 70 L50 90 L70 70',     // pyramid
  developer:   'M30 35 L18 50 L30 65 M70 35 L82 50 L70 65 M58 28 L42 72', // </>
  sysops:      'M50 25 a25 25 0 1 1 0 50 a25 25 0 1 1 0 -50 M50 35 v15 l10 7', // clock/gear
  security:    'M50 18 L75 28 V52 Q75 70 50 82 Q25 70 25 52 V28 Z',       // shield
  data:        'M30 30 h40 v8 h-40 z M30 46 h40 v8 h-40 z M30 62 h40 v8 h-40 z', // bars
  ml:          'M35 35 a8 8 0 1 1 0 0.1 M65 35 a8 8 0 1 1 0 0.1 M50 65 a8 8 0 1 1 0 0.1 M35 35 L50 65 M65 35 L50 65 M35 35 L65 35', // network
  network:     'M25 50 h50 M50 25 v50 M30 30 l40 40 M70 30 l-40 40',     // grid
  cloud:       'M28 60 a12 12 0 0 1 8 -22 a14 14 0 0 1 26 -2 a10 10 0 0 1 8 24 z', // cloud
  database:    'M25 32 a25 8 0 0 0 50 0 a25 8 0 0 0 -50 0 v36 a25 8 0 0 0 50 0 v-36 M25 50 a25 8 0 0 0 50 0', // db
  fundamentals:'M50 22 L78 38 V62 L50 78 L22 62 V38 Z',                   // hex
  devops:      'M40 30 a12 12 0 1 0 12 12 M52 42 v18 M44 60 h16 M48 18 l4 -8 l4 8',   // infinity-ish
  practitioner:'M30 70 V40 L50 25 L70 40 V70 Z M40 70 V55 h20 V70',       // house
  engineer:    'M30 30 h40 v40 h-40 z M40 30 v40 M60 30 v40 M30 50 h40', // grid
  analyst:     'M25 70 L40 55 L50 60 L75 30 M65 30 h10 v10',             // chart
};

// ─── Cert catalog ──────────────────────────────────────────────────────
const CERTS = [
  // ── AWS ──
  { code: 'CLF-C02', provider: 'AWS', glyph: 'practitioner', tag: 'Cloud Practitioner' },
  { code: 'SAA-C03', provider: 'AWS', glyph: 'architect', tag: 'Solutions Architect' },
  { code: 'DVA-C02', provider: 'AWS', glyph: 'developer', tag: 'Developer' },
  { code: 'SOA-C02', provider: 'AWS', glyph: 'sysops', tag: 'SysOps Admin' },
  { code: 'SAP-C02', provider: 'AWS', glyph: 'architect', tag: 'Solutions Architect Pro' },
  { code: 'DOP-C02', provider: 'AWS', glyph: 'devops', tag: 'DevOps Engineer Pro' },
  { code: 'MLS-C01', provider: 'AWS', glyph: 'ml', tag: 'Machine Learning' },
  { code: 'DBS-C01', provider: 'AWS', glyph: 'database', tag: 'Database' },
  { code: 'ANS-C01', provider: 'AWS', glyph: 'network', tag: 'Advanced Networking' },
  { code: 'SCS-C02', provider: 'AWS', glyph: 'security', tag: 'Security' },
  { code: 'DEA-C01', provider: 'AWS', glyph: 'data', tag: 'Data Engineer' },
  { code: 'DAS-C01', provider: 'AWS', glyph: 'analyst', tag: 'Data Analytics' },
  { code: 'MLA-C01', provider: 'AWS', glyph: 'ml', tag: 'ML Engineer Associate' },
  { code: 'AIF-C01', provider: 'AWS', glyph: 'fundamentals', tag: 'AI Practitioner' },

  // ── Google Cloud ──
  { code: 'GCP-CDL', provider: 'GCP', glyph: 'fundamentals', tag: 'Cloud Digital Leader' },
  { code: 'GCP-ACE', provider: 'GCP', glyph: 'sysops', tag: 'Associate Cloud Engineer' },
  { code: 'GCP-PCA', provider: 'GCP', glyph: 'architect', tag: 'Cloud Architect' },
  { code: 'GCP-PDE', provider: 'GCP', glyph: 'data', tag: 'Data Engineer' },
  { code: 'GCP-PMLE',provider: 'GCP', glyph: 'ml', tag: 'ML Engineer' },
  { code: 'GCP-PCN', provider: 'GCP', glyph: 'network', tag: 'Cloud Network Engineer' },
  { code: 'GCP-PCS', provider: 'GCP', glyph: 'security', tag: 'Cloud Security Engineer' },
  { code: 'GCP-PCD', provider: 'GCP', glyph: 'developer', tag: 'Cloud Developer' },
  { code: 'GCP-PCDE',provider: 'GCP', glyph: 'devops', tag: 'Cloud DevOps Engineer' },
  { code: 'GCP-PDB', provider: 'GCP', glyph: 'database', tag: 'Cloud Database Engineer' },

  // ── Microsoft Azure ──
  { code: 'AZ-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Azure Fundamentals' },
  { code: 'AZ-104',  provider: 'Azure', glyph: 'sysops', tag: 'Azure Administrator' },
  { code: 'AZ-204',  provider: 'Azure', glyph: 'developer', tag: 'Azure Developer' },
  { code: 'AZ-305',  provider: 'Azure', glyph: 'architect', tag: 'Solutions Architect' },
  { code: 'AZ-400',  provider: 'Azure', glyph: 'devops', tag: 'DevOps Engineer Expert' },
  { code: 'AZ-500',  provider: 'Azure', glyph: 'security', tag: 'Security Engineer' },
  { code: 'AZ-700',  provider: 'Azure', glyph: 'network', tag: 'Network Engineer' },
  { code: 'AZ-800',  provider: 'Azure', glyph: 'sysops', tag: 'Hybrid Identity Admin' },
  { code: 'AI-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'AI Fundamentals' },
  { code: 'AI-102',  provider: 'Azure', glyph: 'ml', tag: 'AI Engineer' },
  { code: 'DP-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Data Fundamentals' },
  { code: 'DP-203',  provider: 'Azure', glyph: 'data', tag: 'Data Engineer' },
  { code: 'DP-300',  provider: 'Azure', glyph: 'database', tag: 'Database Administrator' },
  { code: 'DP-100',  provider: 'Azure', glyph: 'ml', tag: 'Data Scientist' },
  { code: 'DP-700',  provider: 'Azure', glyph: 'data', tag: 'Fabric Data Engineer' },
  { code: 'SC-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Security Fundamentals' },
  { code: 'SC-200',  provider: 'Azure', glyph: 'security', tag: 'Security Operations' },
  { code: 'SC-300',  provider: 'Azure', glyph: 'security', tag: 'Identity & Access' },
  { code: 'MS-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'M365 Fundamentals' },
  { code: 'PL-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Power Platform Fundamentals' },
  { code: 'PL-300',  provider: 'Azure', glyph: 'analyst', tag: 'Power BI Data Analyst' },

  // ── Databricks ──
  { code: 'DATABRICKS-DE',  provider: 'Databricks', glyph: 'data', tag: 'Data Engineer' },
  { code: 'DATABRICKS-ML',  provider: 'Databricks', glyph: 'ml', tag: 'ML Practitioner' },
  { code: 'DATABRICKS-DA',  provider: 'Databricks', glyph: 'analyst', tag: 'Data Analyst' },
  { code: 'DATABRICKS-GAI', provider: 'Databricks', glyph: 'ml', tag: 'GenAI Engineer' },

  // ── Snowflake ──
  { code: 'SNOWPRO-CORE',     provider: 'Snowflake', glyph: 'fundamentals', tag: 'Core' },
  { code: 'SNOWPRO-ADV',      provider: 'Snowflake', glyph: 'database', tag: 'Advanced' },
  { code: 'SNOWPRO-ARCHITECT',provider: 'Snowflake', glyph: 'architect', tag: 'Architect' },
  { code: 'SNOWPRO-DE',       provider: 'Snowflake', glyph: 'data', tag: 'Data Engineer' },

  // ── HashiCorp ──
  { code: 'TERRAFORM',  provider: 'HashiCorp', glyph: 'devops', tag: 'Terraform Associate' },
  { code: 'VAULT',      provider: 'HashiCorp', glyph: 'security', tag: 'Vault Associate' },
  { code: 'CONSUL',     provider: 'HashiCorp', glyph: 'network', tag: 'Consul Associate' },
  { code: 'NOMAD',      provider: 'HashiCorp', glyph: 'devops', tag: 'Nomad Associate' },

  // ── Salesforce ──
  { code: 'SF-ADMIN',         provider: 'Salesforce', glyph: 'sysops', tag: 'Administrator' },
  { code: 'SF-PD1',           provider: 'Salesforce', glyph: 'developer', tag: 'Platform Developer I' },
  { code: 'SF-PD2',           provider: 'Salesforce', glyph: 'developer', tag: 'Platform Developer II' },
  { code: 'SF-ARCHITECT',     provider: 'Salesforce', glyph: 'architect', tag: 'Application Architect' },
];

// ─── SVG template ──────────────────────────────────────────────────────
function renderSvg({ code, provider, glyph, tag }) {
  const t = THEMES[provider] || THEMES.AWS;
  const glyphPath = GLYPHS[glyph] || GLYPHS.fundamentals;

  // Truncate long codes for visual
  const displayCode = code.length > 10 ? code.slice(0, 10) : code;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${code} ${tag} certification badge">
  <defs>
    <linearGradient id="g-${code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.primary}"/>
      <stop offset="100%" stop-color="${t.secondary}"/>
    </linearGradient>
    <radialGradient id="r-${code}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow-${code}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- outer ring -->
  <circle cx="100" cy="100" r="94" fill="url(#g-${code})" filter="url(#shadow-${code})"/>
  <circle cx="100" cy="100" r="94" fill="url(#r-${code})"/>

  <!-- inner disk -->
  <circle cx="100" cy="100" r="80" fill="${t.secondary}" opacity="0.92"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="${t.accent}" stroke-opacity="0.18" stroke-width="2"/>

  <!-- speciality glyph (centered, scaled to 100x100 box at 50,40) -->
  <g transform="translate(50,40)">
    <path d="${glyphPath}" fill="none" stroke="${t.accent}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
  </g>

  <!-- cert code label band -->
  <rect x="20" y="138" width="160" height="34" rx="6" fill="${t.primary}" opacity="0.96"/>
  <text x="100" y="161" text-anchor="middle"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="${displayCode.length > 8 ? 16 : 19}"
    font-weight="800"
    fill="${t.accent}"
    letter-spacing="1">${displayCode}</text>

  <!-- provider mark -->
  <text x="100" y="118" text-anchor="middle"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="9"
    font-weight="600"
    fill="${t.accent}"
    opacity="0.75"
    letter-spacing="2">${provider.toUpperCase()}</text>
</svg>`;
}

// ─── Generate ──────────────────────────────────────────────────────────
let count = 0;
for (const c of CERTS) {
  const svg = renderSvg(c);
  fs.writeFileSync(path.join(OUT_DIR, `${c.code}.svg`), svg);
  count++;
}

// ─── Generic fallback ──────────────────────────────────────────────────
fs.writeFileSync(path.join(OUT_DIR, '_default.svg'), renderSvg({
  code: 'CERT', provider: 'AWS', glyph: 'fundamentals', tag: 'Certification'
}));

console.log(`Generated ${count} certification SVGs in ${OUT_DIR}`);
