import { borderRadius } from './borderRadius';
import { lightColors, darkColors } from './colors';
import { elevation } from './elevation';
import { opacity } from './opacity';
import { spacing } from './spacing';
import { typography } from './typography';

export { lightColors, darkColors };
export type { ColorTokens } from './colors';
export { spacing };
export type { SpacingScale } from './spacing';
export { typography };
export type { TypographyScale } from './typography';
export { borderRadius };
export type { BorderRadiusScale } from './borderRadius';
export { elevation };
export type { ElevationScale } from './elevation';
export { opacity };
export type { OpacityScale } from './opacity';

export const theme = {
  lightColors,
  darkColors,
  spacing,
  typography,
  borderRadius,
  elevation,
  opacity,
} as const;
