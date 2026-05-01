// src/tests/components/CertificationLogo.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificationLogo, { CERTIFICATION_LOGOS, PROVIDER_COLORS } from '../../components/common/CertificationLogo';

describe('CertificationLogo', () => {
  describe('Mapping de logos', () => {
    it('exporta el mapa de logos', () => {
      expect(CERTIFICATION_LOGOS).toBeDefined();
      expect(typeof CERTIFICATION_LOGOS).toBe('object');
    });

    it('contiene logos AWS principales', () => {
      expect(CERTIFICATION_LOGOS['SAA-C03']).toBeDefined();
      expect(CERTIFICATION_LOGOS['DVA-C02']).toBeDefined();
      expect(CERTIFICATION_LOGOS['CLF-C02']).toBeDefined();
    });

    it('contiene logos Azure principales', () => {
      expect(CERTIFICATION_LOGOS['AZ-900']).toBeDefined();
      expect(CERTIFICATION_LOGOS['AZ-104']).toBeDefined();
    });

    it('contiene logos Google Cloud principales', () => {
      expect(CERTIFICATION_LOGOS['GCP-ACE']).toBeDefined();
      expect(CERTIFICATION_LOGOS['GCP-PCA']).toBeDefined();
    });

    it('exporta colores por proveedor', () => {
      expect(PROVIDER_COLORS['AWS']).toBeDefined();
      expect(PROVIDER_COLORS['AWS'].gradient).toBeDefined();
    });
  });

  describe('Renderizado con código válido', () => {
    it('renderiza una imagen para un código conocido', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" />);
      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('awsstatic.com');
    });

    it('incluye alt text descriptivo', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" />);
      const img = document.querySelector('img');
      expect(img.alt).toContain('Solutions Architect');
    });

    it('aplica clase de tamaño md por defecto', () => {
      render(<CertificationLogo code="SAA-C03" name="SAA" provider="AWS" />);
      const img = document.querySelector('img');
      expect(img.className).toContain('w-12 h-12');
    });

    it('aplica tamaño sm cuando se especifica', () => {
      render(<CertificationLogo code="SAA-C03" name="SAA" provider="AWS" size="sm" />);
      const img = document.querySelector('img');
      expect(img.className).toContain('w-8 h-8');
    });

    it('aplica tamaño lg cuando se especifica', () => {
      render(<CertificationLogo code="SAA-C03" name="SAA" provider="AWS" size="lg" />);
      const img = document.querySelector('img');
      expect(img.className).toContain('w-16 h-16');
    });
  });

  describe('Fallback con iniciales', () => {
    it('usa iniciales cuando no hay código en el mapa', () => {
      render(<CertificationLogo code="UNKNOWN-XYZ" name="Custom" provider="AWS" />);
      expect(screen.getByText('UNK')).toBeInTheDocument();
    });

    it('usa "?" cuando no hay código', () => {
      render(<CertificationLogo provider="AWS" />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('aplica color del proveedor al fallback', () => {
      const { container } = render(<CertificationLogo code="UNKNOWN" provider="AWS" />);
      const fallback = container.querySelector('div[title]');
      expect(fallback?.className).toContain('from-orange-500');
    });

    it('aplica color por defecto si proveedor desconocido', () => {
      const { container } = render(<CertificationLogo code="UNKNOWN" provider="Unknown Provider" />);
      const fallback = container.querySelector('div[title]');
      expect(fallback?.className).toContain('from-gray-500');
    });
  });

  describe('Manejo de errores de carga', () => {
    it('cambia a fallback al fallar la carga de la imagen', () => {
      render(<CertificationLogo code="SAA-C03" name="SAA" provider="AWS" />);
      const img = document.querySelector('img');
      fireEvent.error(img);
      expect(screen.getByText('SAA')).toBeInTheDocument();
    });
  });

  describe('Modo con nombre visible', () => {
    it('muestra el nombre cuando showName es true', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" showName />);
      expect(screen.getByText('Solutions Architect')).toBeInTheDocument();
    });

    it('no muestra el nombre por defecto', () => {
      render(<CertificationLogo code="SAA-C03" name="Solutions Architect" provider="AWS" />);
      expect(screen.queryByText(/^Solutions Architect$/)).not.toBeInTheDocument();
    });
  });
});
