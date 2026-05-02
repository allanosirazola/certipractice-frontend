// src/data/certRegistry.js
// Single source of truth for the certifications we render local SVG logos for.
// Both the cert-logo generator script (scripts/generate-cert-logos.mjs) and
// the runtime CertificationLogo component import from here, so the two never
// drift apart.
//
// To add a new local cert logo:
// 1. Add an entry below.
// 2. Run `node scripts/generate-cert-logos.mjs` to generate the SVG file.
// 3. The component will pick it up automatically.

export const CERT_REGISTRY = [
  // ── AWS ──────────────────────────────────────────────────────────────
  { code: 'CLF-C02', provider: 'AWS', glyph: 'practitioner', tag: 'Cloud Practitioner' },
  { code: 'SAA-C03', provider: 'AWS', glyph: 'architect',    tag: 'Solutions Architect' },
  { code: 'DVA-C02', provider: 'AWS', glyph: 'developer',    tag: 'Developer' },
  { code: 'SOA-C02', provider: 'AWS', glyph: 'sysops',       tag: 'SysOps Admin' },
  { code: 'SAP-C02', provider: 'AWS', glyph: 'architect',    tag: 'Solutions Architect Pro' },
  { code: 'DOP-C02', provider: 'AWS', glyph: 'devops',       tag: 'DevOps Engineer Pro' },
  { code: 'MLS-C01', provider: 'AWS', glyph: 'ml',           tag: 'Machine Learning' },
  { code: 'DBS-C01', provider: 'AWS', glyph: 'database',     tag: 'Database' },
  { code: 'ANS-C01', provider: 'AWS', glyph: 'network',      tag: 'Advanced Networking' },
  { code: 'SCS-C02', provider: 'AWS', glyph: 'security',     tag: 'Security' },
  { code: 'DEA-C01', provider: 'AWS', glyph: 'data',         tag: 'Data Engineer' },
  { code: 'DAS-C01', provider: 'AWS', glyph: 'analyst',      tag: 'Data Analytics' },
  { code: 'MLA-C01', provider: 'AWS', glyph: 'ml',           tag: 'ML Engineer Associate' },
  { code: 'AIF-C01', provider: 'AWS', glyph: 'fundamentals', tag: 'AI Practitioner' },

  // ── Google Cloud ─────────────────────────────────────────────────────
  { code: 'GCP-CDL',  provider: 'GCP', glyph: 'fundamentals', tag: 'Cloud Digital Leader' },
  { code: 'GCP-ACE',  provider: 'GCP', glyph: 'sysops',       tag: 'Associate Cloud Engineer' },
  { code: 'GCP-PCA',  provider: 'GCP', glyph: 'architect',    tag: 'Cloud Architect' },
  { code: 'GCP-PDE',  provider: 'GCP', glyph: 'data',         tag: 'Data Engineer' },
  { code: 'GCP-PMLE', provider: 'GCP', glyph: 'ml',           tag: 'ML Engineer' },
  { code: 'GCP-PCN',  provider: 'GCP', glyph: 'network',      tag: 'Cloud Network Engineer' },
  { code: 'GCP-PCS',  provider: 'GCP', glyph: 'security',     tag: 'Cloud Security Engineer' },
  { code: 'GCP-PCD',  provider: 'GCP', glyph: 'developer',    tag: 'Cloud Developer' },
  { code: 'GCP-PCDE', provider: 'GCP', glyph: 'devops',       tag: 'Cloud DevOps Engineer' },
  { code: 'GCP-PDB',  provider: 'GCP', glyph: 'database',     tag: 'Cloud Database Engineer' },

  // ── Microsoft Azure ──────────────────────────────────────────────────
  { code: 'AZ-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Azure Fundamentals' },
  { code: 'AZ-104',  provider: 'Azure', glyph: 'sysops',       tag: 'Azure Administrator' },
  { code: 'AZ-204',  provider: 'Azure', glyph: 'developer',    tag: 'Azure Developer' },
  { code: 'AZ-305',  provider: 'Azure', glyph: 'architect',    tag: 'Solutions Architect' },
  { code: 'AZ-400',  provider: 'Azure', glyph: 'devops',       tag: 'DevOps Engineer Expert' },
  { code: 'AZ-500',  provider: 'Azure', glyph: 'security',     tag: 'Security Engineer' },
  { code: 'AZ-700',  provider: 'Azure', glyph: 'network',      tag: 'Network Engineer' },
  { code: 'AZ-800',  provider: 'Azure', glyph: 'sysops',       tag: 'Hybrid Identity Admin' },
  { code: 'AI-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'AI Fundamentals' },
  { code: 'AI-102',  provider: 'Azure', glyph: 'ml',           tag: 'AI Engineer' },
  { code: 'DP-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Data Fundamentals' },
  { code: 'DP-203',  provider: 'Azure', glyph: 'data',         tag: 'Data Engineer' },
  { code: 'DP-300',  provider: 'Azure', glyph: 'database',     tag: 'Database Administrator' },
  { code: 'DP-100',  provider: 'Azure', glyph: 'ml',           tag: 'Data Scientist' },
  { code: 'DP-700',  provider: 'Azure', glyph: 'data',         tag: 'Fabric Data Engineer' },
  { code: 'SC-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Security Fundamentals' },
  { code: 'SC-200',  provider: 'Azure', glyph: 'security',     tag: 'Security Operations' },
  { code: 'SC-300',  provider: 'Azure', glyph: 'security',     tag: 'Identity & Access' },
  { code: 'MS-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'M365 Fundamentals' },
  { code: 'PL-900',  provider: 'Azure', glyph: 'fundamentals', tag: 'Power Platform Fundamentals' },
  { code: 'PL-300',  provider: 'Azure', glyph: 'analyst',      tag: 'Power BI Data Analyst' },

  // ── Databricks ───────────────────────────────────────────────────────
  { code: 'DATABRICKS-DE',  provider: 'Databricks', glyph: 'data',    tag: 'Data Engineer' },
  { code: 'DATABRICKS-ML',  provider: 'Databricks', glyph: 'ml',      tag: 'ML Practitioner' },
  { code: 'DATABRICKS-DA',  provider: 'Databricks', glyph: 'analyst', tag: 'Data Analyst' },
  { code: 'DATABRICKS-GAI', provider: 'Databricks', glyph: 'ml',      tag: 'GenAI Engineer' },

  // ── Snowflake ────────────────────────────────────────────────────────
  { code: 'SNOWPRO-CORE',      provider: 'Snowflake', glyph: 'fundamentals', tag: 'Core' },
  { code: 'SNOWPRO-ADV',       provider: 'Snowflake', glyph: 'database',    tag: 'Advanced' },
  { code: 'SNOWPRO-ARCHITECT', provider: 'Snowflake', glyph: 'architect',   tag: 'Architect' },
  { code: 'SNOWPRO-DE',        provider: 'Snowflake', glyph: 'data',        tag: 'Data Engineer' },

  // ── HashiCorp ────────────────────────────────────────────────────────
  { code: 'TERRAFORM', provider: 'HashiCorp', glyph: 'devops',   tag: 'Terraform Associate' },
  { code: 'VAULT',     provider: 'HashiCorp', glyph: 'security', tag: 'Vault Associate' },
  { code: 'CONSUL',    provider: 'HashiCorp', glyph: 'network',  tag: 'Consul Associate' },
  { code: 'NOMAD',     provider: 'HashiCorp', glyph: 'devops',   tag: 'Nomad Associate' },

  // ── Salesforce ───────────────────────────────────────────────────────
  { code: 'SF-ADMIN',     provider: 'Salesforce', glyph: 'sysops',    tag: 'Administrator' },
  { code: 'SF-PD1',       provider: 'Salesforce', glyph: 'developer', tag: 'Platform Developer I' },
  { code: 'SF-PD2',       provider: 'Salesforce', glyph: 'developer', tag: 'Platform Developer II' },
  { code: 'SF-ARCHITECT', provider: 'Salesforce', glyph: 'architect', tag: 'Application Architect' },
];

/** Set of all certification codes for which a local SVG exists. */
export const LOCAL_CERT_CODES = new Set(CERT_REGISTRY.map(c => c.code));

/** Lookup metadata for a given cert code (case-insensitive). */
export function getCertMeta(code) {
  if (!code) return null;
  const normalized = String(code).toUpperCase().trim();
  return CERT_REGISTRY.find(c => c.code === normalized) || null;
}
