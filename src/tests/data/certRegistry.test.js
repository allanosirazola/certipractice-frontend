// src/tests/data/certRegistry.test.js
import { describe, it, expect } from 'vitest';
import { CERT_REGISTRY, LOCAL_CERT_CODES, getCertMeta } from '../../data/certRegistry.js';

describe('certRegistry', () => {
  it('exports a non-empty registry', () => {
    expect(Array.isArray(CERT_REGISTRY)).toBe(true);
    expect(CERT_REGISTRY.length).toBeGreaterThan(40);
  });

  it('every entry has the required fields', () => {
    for (const c of CERT_REGISTRY) {
      expect(c.code, `cert without code: ${JSON.stringify(c)}`).toBeTruthy();
      expect(c.provider, `cert without provider: ${c.code}`).toBeTruthy();
      expect(c.glyph, `cert without glyph: ${c.code}`).toBeTruthy();
      expect(c.tag, `cert without tag: ${c.code}`).toBeTruthy();
    }
  });

  it('has no duplicate codes', () => {
    const codes = CERT_REGISTRY.map(c => c.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('all codes are uppercase', () => {
    for (const c of CERT_REGISTRY) {
      expect(c.code).toBe(c.code.toUpperCase());
    }
  });

  it('LOCAL_CERT_CODES matches CERT_REGISTRY', () => {
    expect(LOCAL_CERT_CODES.size).toBe(CERT_REGISTRY.length);
    for (const c of CERT_REGISTRY) {
      expect(LOCAL_CERT_CODES.has(c.code)).toBe(true);
    }
  });

  it('uses only known providers', () => {
    const known = new Set(['AWS', 'GCP', 'Azure', 'Databricks', 'Snowflake', 'HashiCorp', 'Salesforce']);
    for (const c of CERT_REGISTRY) {
      expect(known.has(c.provider), `unknown provider for ${c.code}: ${c.provider}`).toBe(true);
    }
  });

  it('uses only known glyphs', () => {
    const knownGlyphs = new Set([
      'architect', 'developer', 'sysops', 'security', 'data', 'ml',
      'network', 'cloud', 'database', 'fundamentals', 'devops',
      'practitioner', 'engineer', 'analyst',
    ]);
    for (const c of CERT_REGISTRY) {
      expect(knownGlyphs.has(c.glyph), `unknown glyph for ${c.code}: ${c.glyph}`).toBe(true);
    }
  });

  describe('getCertMeta', () => {
    it('returns metadata for known code', () => {
      const meta = getCertMeta('SAA-C03');
      expect(meta).toMatchObject({ code: 'SAA-C03', provider: 'AWS', glyph: 'architect' });
    });

    it('is case-insensitive', () => {
      expect(getCertMeta('saa-c03')?.code).toBe('SAA-C03');
      expect(getCertMeta('  SAA-C03  ')?.code).toBe('SAA-C03');
    });

    it('returns null for unknown code', () => {
      expect(getCertMeta('UNKNOWN-XYZ')).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(getCertMeta('')).toBeNull();
      expect(getCertMeta(null)).toBeNull();
      expect(getCertMeta(undefined)).toBeNull();
    });
  });

  describe('coverage by provider', () => {
    it('covers AWS with at least 10 certs', () => {
      const aws = CERT_REGISTRY.filter(c => c.provider === 'AWS');
      expect(aws.length).toBeGreaterThanOrEqual(10);
    });

    it('covers Azure with at least 15 certs', () => {
      const az = CERT_REGISTRY.filter(c => c.provider === 'Azure');
      expect(az.length).toBeGreaterThanOrEqual(15);
    });

    it('covers GCP with at least 8 certs', () => {
      const gcp = CERT_REGISTRY.filter(c => c.provider === 'GCP');
      expect(gcp.length).toBeGreaterThanOrEqual(8);
    });
  });
});
