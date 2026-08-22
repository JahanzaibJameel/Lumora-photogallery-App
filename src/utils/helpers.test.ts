import { hexToRgba } from './helpers';

describe('hexToRgba', () => {
  it('converts a 6-digit hex to rgba', () => {
    expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('converts #000000 to rgba', () => {
    expect(hexToRgba('#000000', 0.3)).toBe('rgba(0, 0, 0, 0.3)');
  });

  it('converts #FFFFFF to rgba', () => {
    expect(hexToRgba('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('converts a hex with uppercase letters', () => {
    expect(hexToRgba('#5856D6', 0.2)).toBe('rgba(88, 86, 214, 0.2)');
  });

  it('returns the input as-is when hex does not start with #', () => {
    expect(hexToRgba('FF0000', 0.5)).toBe('FF0000');
  });

  it('returns the input as-is when hex is empty', () => {
    expect(hexToRgba('', 0.5)).toBe('');
  });

  it('returns the input as-is when hex is null', () => {
    expect(hexToRgba(null as any, 0.5)).toBe(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  it('handles alpha of 0', () => {
    expect(hexToRgba('#FF0000', 0)).toBe('rgba(255, 0, 0, 0)');
  });
});
