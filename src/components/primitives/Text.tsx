import React, { forwardRef } from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/tokens';

type Variant = 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'label' | 'caption';
type ColorToken = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'error' | 'success' | 'warning' | 'info' | 'onSurface';

const VARIANT_MAP: Record<Variant, keyof typeof typography> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  title: 'title',
  body: 'body',
  label: 'bodySmall',
  caption: 'caption',
};

export interface TextPropsExtended extends TextProps {
  variant?: Variant;
  color?: ColorToken;
  center?: boolean;
  numberOfLines?: number;
}

export const Text = forwardRef<RNText, TextPropsExtended>((props, ref) => {
  const { colors } = useTheme();
  const {
    variant = 'body',
    color = 'primary',
    center,
    style,
    numberOfLines,
    ...rest
  } = props;

  const colorMap: Record<ColorToken, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.accent,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    onSurface: colors.textOnSurface,
  };

  const tokenKey = VARIANT_MAP[variant];
  const tokenStyle = typography[tokenKey];

  return (
    <RNText
      ref={ref}
      numberOfLines={numberOfLines}
      accessibilityRole="text"
      style={[
        tokenStyle,
        { color: colorMap[color] },
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
});

Text.displayName = 'Text';

export default Text;
