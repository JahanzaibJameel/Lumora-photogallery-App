import { renderHook } from '@testing-library/react-native';
import { useAccessibility } from '../hooks/useAccessibility';
import { ACCESSIBILITY_HINTS, MIN_TOUCH_TARGET } from './accessibility';

describe('Accessibility Utilities', () => {
  describe('useAccessibility', () => {
    it('returns getButtonProps with correct accessibility props', () => {
      const { result } = renderHook(() => useAccessibility());
      const buttonProps = result.current.getButtonProps({
        label: 'Test button',
        hint: 'Does something',
        role: 'button',
        disabled: true,
        selected: false,
      });

      expect(buttonProps.accessibilityRole).toBe('button');
      expect(buttonProps.accessibilityLabel).toBe('Test button');
      expect(buttonProps.accessibilityHint).toBe('Does something');
      expect(buttonProps.accessibilityState).toEqual({ disabled: true, selected: false });
    });

    it('returns getButtonProps with default values', () => {
      const { result } = renderHook(() => useAccessibility());
      const buttonProps = result.current.getButtonProps({
        label: 'Test button',
      });

      expect(buttonProps.accessibilityRole).toBe('button');
      expect(buttonProps.accessibilityLabel).toBe('Test button');
      expect(buttonProps.accessibilityState).toEqual({ disabled: false, selected: false });
    });

    it('returns getInputProps with correct accessibility props', () => {
      const { result } = renderHook(() => useAccessibility());
      const inputProps = result.current.getInputProps({
        label: 'Search input',
        hint: 'Type to search',
      });

      expect(inputProps.accessibilityRole).toBe('text');
      expect(inputProps.accessibilityLabel).toBe('Search input');
      expect(inputProps.accessibilityHint).toBe('Type to search');
    });

    it('enforces minimum touch target size', () => {
      const { result } = renderHook(() => useAccessibility());
      expect(result.current.enforceTouchTarget(40)).toBe(48);
      expect(result.current.enforceTouchTarget(48)).toBe(48);
      expect(result.current.enforceTouchTarget(60)).toBe(60);
    });

    it('exports MIN_TOUCH_TARGET constant', () => {
      expect(MIN_TOUCH_TARGET).toBe(48);
    });
  });

  describe('ACCESSIBILITY_HINTS', () => {
    it('contains standard hints', () => {
      expect(ACCESSIBILITY_HINTS).toHaveProperty('open');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('close');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('refresh');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('back');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('search');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('clear');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('delete');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('next');
      expect(ACCESSIBILITY_HINTS).toHaveProperty('previous');
    });
  });
});
