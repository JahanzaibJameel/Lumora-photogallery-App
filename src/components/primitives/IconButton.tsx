import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface IconButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  background?: string;
  disabled?: boolean;
}

export const IconButton = forwardRef<React.ElementRef<typeof TouchableOpacity>, IconButtonProps>(
  (props, ref) => {
    const { colors } = useTheme();
    const {
      name,
      size = 24,
      color = colors.textPrimary,
      onPress,
      accessibilityLabel,
      accessibilityHint,
      background,
      disabled,
      style,
      hitSlop = { top: 12, bottom: 12, left: 12, right: 12 },
      ...rest
    } = props;

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled ?? false }}
        hitSlop={hitSlop}
        activeOpacity={0.7}
        style={[
          styles.container,
          background ? { backgroundColor: background } : null,
          disabled ? { opacity: 0.4 } : null,
          style,
        ]}
        {...rest}
      >
        <Ionicons name={name} size={size} color={disabled ? colors.textTertiary : color} />
      </TouchableOpacity>
    );
  }
);

IconButton.displayName = 'IconButton';

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
});

export default IconButton;
