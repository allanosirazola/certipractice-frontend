// src/tests/components/CertificationLogo.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificationLogo, {
  resolveCertLogoUrl,
  LOCAL_CERT_CODES,
  PROVIDER_COLORS,
  PROVIDER_LOGO_FILE,
} from '../../components/common/CertificationLogo';

describe('CertificationLogo', () => {
  // ────────────────────────────────────────────────────────────
  // Exports
  // ────────────────────────────────────────────────────────────
  describe('module exports', () => {
    it('exports the local cert codes set', () => {
      expect(LOCAL_CERT_CODES).toBeInstanceOf(Set);
      expect(LOCAL_CERT_CODES.size).toBeGreaterThan(40);
    });

    it('contains key AWS certs', () => {
      expect(LOCAL_CERT_CODES.has('SAA-C03')).toBe(true);
      expect(LOCAL_CERT_CODES.has('DVA-C02')).toBe(true);
      expect(LOCAL_CERT_CODES.has('CLF-C02')).toBe(true);
      expect(LOCAL_CERT_CODES.has('AIF-C01')).toBe(true);
    });

    it('contains key Azure certs', () => {
      expect(LOCAL_CERT_CODES.has('AZ-900')).toBe(true);
      expect(LOCAL_CERT_CODES.has('AZ-104')).toBe(true);
      expect(LOCAL_CERT_CODES.has('AI-102')).toBe(true);
    });

    it('contains key GCP certs', () => {
      expect(LOCAL_CERT_CODES.has('GCP-ACE')).toBe(true);
      expect(LOCAL_CERT_CODES.has('GCP-PCA')).toBe(true);
    });

    it('contains Databricks/Snowflake/HashiCorp certs', () => {
      expect(LOCAL_CERT_CODES.has('DATABRICKS-DE')).toBe(true);
      expect(LOCAL_CERT_CODES.has('SNOWPRO-CORE')).toBe(true);
      expect(LOCAL_CERT_CODES.has('TERRAFORM')).toBe(true);
    });

    it('exports provider color tokens', () => {
      expect(PROVIDER_COLORS.AWS).toBeDefined();
      expect(PROVIDER_COLORS.AWS.gradient).toMatch(/orange/);
      expect(PROVIDER_COLORS['Microsoft Azure'].gradient).toMatch(/sky/);
    });

    it('exports provider logo file map', () => {
      expect(PROVIDER_LOGO_FILE.AWS).toBe('/images/aws-logo.png');
      expect(PROVIDER_LOGO_FILE['Google Cloud']).toBe('/images/google-cloud-logo.png');
      expect(PROVIDER_LOGO_FILE.Snowflake).toBe('/images/snowflake-logo.png');
    });
  });

  // ────────────────────────────────────────────────────────────
  // resolveCertLogoUrl
  // ────────────────────────────────────────────────────────────
  describe('resolveCertLogoUrl', () => {
    it('returns the cert SVG path for known code', () => {
      expect(resolveCertLogoUrl('SAA-C03')).toBe('/images/certifications/SAA-C03.svg');
    });

    it('normalises lowercase codes', () => {
      expect(resolveCertLogoUrl('saa-c03')).toBe('/images/certifications/SAA-C03.svg');
    });

    it('falls back to provider PNG for unknown code', () => {
      expect(resolveCertLogoUrl('UNKNOWN-XYZ', 'AWS')).toBe('/images/aws-logo.png');
    });

    it('returns null when neither code nor provider match', () => {
      expect(resolveCertLogoUrl(null, null)).toBeNull();
      expect(resolveCertLogoUrl('UNKNOWN', 'Unknown Provider')).toBeNull();
    });

    it('returns null when only an unknown code is given', () => {
      expect(resolveCertLogoUrl('UNKNOWN-XYZ')).toBeNull();
    });

    it('handles whitespace in code', () => {
      expect(resolveCertLogoUrl('  SAA-C03  ')).toBe('/images/certifications/SAA-C03.svg');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Rendering — known cert
  // ────────────────────────────────────────────────────────────
  describe('rendering with known cert code', () => {
    it('renders an image pointing to the local SVG', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" />);
      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('/images/certifications/SAA-C03.svg');
    });

    it('includes descriptive alt text', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" />);
      const img = document.querySelector('img');
      expect(img.alt).toContain('Solutions Architect');
    });

    it('uses md size by default', () => {
      render(<CertificationLogo code="SAA-C03" name="SAA" provider="AWS" />);
      const img = document.querySelector('img');
      expect(img.className).toContain('w-12');
      expect(img.className).toContain('h-12');
    });

    it('applies sm size', () => {
      render(<CertificationLogo code="SAA-C03" size="sm" />);
      const img = document.querySelector('img');
      expect(img.className).toContain('w-8');
    });

    it('applies lg size', () => {
      render(<CertificationLogo code="SAA-C03" size="lg" />);
      const img = document.querySelector('img');
      expect(img.className).toContain('w-16');
    });

    it('applies xl size', () => {
      render(<CertificationLogo code="SAA-C03" size="xl" />);
      const img = document.querySelector('img');
      expect(img.className).toContain('w-24');
    });

    it('applies lazy loading', () => {
      render(<CertificationLogo code="SAA-C03" />);
      const img = document.querySelector('img');
      expect(img.getAttribute('loading')).toBe('lazy');
    });

    it('applies custom className to wrapper', () => {
      const { container } = render(<CertificationLogo code="SAA-C03" className="my-custom" />);
      expect(container.firstChild.className).toContain('my-custom');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Rendering — provider fallback
  // ────────────────────────────────────────────────────────────
  describe('rendering with unknown code but known provider', () => {
    it('falls back to provider PNG', () => {
      render(<CertificationLogo code="UNKNOWN-XYZ" provider="AWS" />);
      const img = document.querySelector('img');
      expect(img.src).toContain('/images/aws-logo.png');
    });

    it('falls back to provider PNG for Snowflake', () => {
      render(<CertificationLogo code="UNKNOWN" provider="Snowflake" />);
      const img = document.querySelector('img');
      expect(img.src).toContain('/images/snowflake-logo.png');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Rendering — initials fallback
  // ────────────────────────────────────────────────────────────
  describe('initials fallback', () => {
    it('renders initials when no logo is found', () => {
      render(<CertificationLogo code="WEIRD" provider="Unknown Provider" />);
      expect(screen.getByText('WEI')).toBeInTheDocument();
    });

    it('uses provider initials when no code', () => {
      render(<CertificationLogo provider="Unknown Provider" />);
      expect(screen.getByText('UN')).toBeInTheDocument();
    });

    it('uses "?" when neither code nor provider', () => {
      render(<CertificationLogo />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('applies provider gradient to fallback', () => {
      const { container } = render(<CertificationLogo code="WEIRD" provider="Unknown Provider" />);
      const fallback = container.querySelector('[data-testid="cert-logo-fallback"]');
      expect(fallback.className).toMatch(/from-gray-500/);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Image error handling
  // ────────────────────────────────────────────────────────────
  describe('image error handling', () => {
    it('switches to fallback when image fails to load', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" />);
      const img = document.querySelector('img');
      fireEvent.error(img);
      // After error, fallback shows the cert code initials
      expect(screen.getByText('SAA')).toBeInTheDocument();
    });

    it('reveals image when load succeeds', () => {
      render(<CertificationLogo code="SAA-C03" />);
      const img = document.querySelector('img');
      // Pre-load: opacity-0 to hide flash
      expect(img.className).toContain('opacity-0');
      fireEvent.load(img);
      expect(img.className).toContain('opacity-100');
    });
  });

  // ────────────────────────────────────────────────────────────
  // showName flag
  // ────────────────────────────────────────────────────────────
  describe('showName option', () => {
    it('renders the name when showName=true', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" showName />);
      expect(screen.getByText('Solutions Architect')).toBeInTheDocument();
    });

    it('does not render the name by default', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" />);
      expect(screen.queryByText(/^Solutions Architect$/)).not.toBeInTheDocument();
    });

    it('renders name in fallback mode too', () => {
      render(<CertificationLogo code="UNKNOWN" name="Custom Cert" provider="Unknown" showName />);
      expect(screen.getByText('Custom Cert')).toBeInTheDocument();
    });
  });
});
