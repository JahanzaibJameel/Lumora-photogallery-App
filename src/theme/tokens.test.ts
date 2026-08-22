import { borderRadius } from './borderRadius';
import { lightColors, darkColors } from './colors';
import { elevation } from './elevation';
import { opacity } from './opacity';
import { spacing } from './spacing';
import { theme } from './tokens';
import { typography } from './typography';

describe('Design Tokens', () => {
  describe('colors', () => {
    it('lightColors and darkColors have the same keys', () => {
      const lightKeys = Object.keys(lightColors);
      const darkKeys = Object.keys(darkColors);
      expect(lightKeys).toEqual(darkKeys);
    });

    it('lightColors contains semantic tokens', () => {
      expect(lightColors).toHaveProperty('onSurface');
      expect(lightColors).toHaveProperty('scrim');
      expect(lightColors).toHaveProperty('outline');
      expect(lightColors).toHaveProperty('outlineVariant');
    });

    it('darkColors contains semantic tokens', () => {
      expect(darkColors).toHaveProperty('onSurface');
      expect(darkColors).toHaveProperty('scrim');
      expect(darkColors).toHaveProperty('outline');
      expect(darkColors).toHaveProperty('outlineVariant');
    });
  });

  describe('spacing', () => {
    it('has expected scale values', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
      expect(spacing.xxl).toBe(48);
    });
  });

  describe('typography', () => {
    it('has all expected variants', () => {
      expect(typography).toHaveProperty('h1');
      expect(typography).toHaveProperty('h2');
      expect(typography).toHaveProperty('h3');
      expect(typography).toHaveProperty('title');
      expect(typography).toHaveProperty('body');
      expect(typography).toHaveProperty('bodySmall');
      expect(typography).toHaveProperty('caption');
      expect(typography).toHaveProperty('overline');
    });

    it('variants include letterSpacing and textTransform', () => {
      Object.values(typography).forEach((style) => {
        expect(style).toHaveProperty('fontSize');
        expect(style).toHaveProperty('fontWeight');
        expect(style).toHaveProperty('lineHeight');
        expect(style).toHaveProperty('letterSpacing');
        expect(style).toHaveProperty('textTransform');
      });
    });
  });

  describe('borderRadius', () => {
    it('has expected scale values', () => {
      expect(borderRadius.none).toBe(0);
      expect(borderRadius.sm).toBe(4);
      expect(borderRadius.md).toBe(8);
      expect(borderRadius.lg).toBe(12);
      expect(borderRadius.xl).toBe(16);
      expect(borderRadius.xxl).toBe(24);
      expect(borderRadius.full).toBe(9999);
    });
  });

  describe('elevation', () => {
    it('has all expected levels', () => {
      expect(elevation).toHaveProperty('none');
      expect(elevation).toHaveProperty('sm');
      expect(elevation).toHaveProperty('md');
      expect(elevation).toHaveProperty('lg');
    });

    it('elevation values include shadow and elevation properties', () => {
      Object.values(elevation).forEach((style) => {
        expect(style).toHaveProperty('shadowOffset');
        expect(style).toHaveProperty('shadowOpacity');
        expect(style).toHaveProperty('shadowRadius');
        expect(style).toHaveProperty('elevation');
      });
    });
  });

  describe('opacity', () => {
    it('has expected scale values', () => {
      expect(opacity.disabled).toBe(0.4);
      expect(opacity.overlay).toBe(0.6);
      expect(opacity.pressed).toBe(0.7);
      expect(opacity.skeleton).toBe(0.5);
    });
  });

  describe('composite theme', () => {
    it('exports a unified theme object', () => {
      expect(theme).toHaveProperty('lightColors');
      expect(theme).toHaveProperty('darkColors');
      expect(theme).toHaveProperty('spacing');
      expect(theme).toHaveProperty('typography');
      expect(theme).toHaveProperty('borderRadius');
      expect(theme).toHaveProperty('elevation');
      expect(theme).toHaveProperty('opacity');
    });
  });
});
