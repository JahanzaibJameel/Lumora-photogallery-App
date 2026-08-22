import { useMemo } from 'react';
import { AccessibilityProps, AccessibilityRole } from 'react-native';
import { ACCESSIBILITY_HINTS, MIN_TOUCH_TARGET } from '../utils/accessibility';

interface AccessibilityButtonProps {
  label: string;
  hint?: string;
  role?: AccessibilityRole;
  disabled?: boolean;
  selected?: boolean;
}

interface AccessibilityInputProps {
  label: string;
  hint?: string;
}

export const useAccessibility = () => {
  const getButtonProps = useMemo(() => ({
    label,
    hint,
    role = 'button',
    disabled,
    selected,
  }: AccessibilityButtonProps): Pick<AccessibilityProps, 'accessibilityRole' | 'accessibilityLabel' | 'accessibilityHint' | 'accessibilityState'> => ({
    accessibilityRole: role,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { disabled: disabled ?? false, selected: selected ?? false },
  }), []);

  const getInputProps = useMemo(() => ({
    label,
    hint,
  }: AccessibilityInputProps): Pick<AccessibilityProps, 'accessibilityRole' | 'accessibilityLabel' | 'accessibilityHint'> => ({
    accessibilityRole: 'text',
    accessibilityLabel: label,
    accessibilityHint: hint,
  }), []);

  const enforceTouchTarget = (size: number): number => {
    return Math.max(size, MIN_TOUCH_TARGET);
  };

  return {
    getButtonProps,
    getInputProps,
    enforceTouchTarget,
    MIN_TOUCH_TARGET,
    ACCESSIBILITY_HINTS,
  };
};
