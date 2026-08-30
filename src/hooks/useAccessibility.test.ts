import { renderHook } from '@testing-library/react-native';
import { useAccessibility } from './useAccessibility';

describe('useAccessibility', () => {
  it('returns button accessibility props', () => {
    const { result } = renderHook(() => useAccessibility());
    const props = result.current.getButtonProps({
      label: 'Test Button',
      hint: 'Test hint',
    });
    expect(props.accessibilityRole).toBe('button');
    expect(props.accessibilityLabel).toBe('Test Button');
    expect(props.accessibilityHint).toBe('Test hint');
    expect(props.accessibilityState).toEqual({ disabled: false, selected: false });
  });

  it('returns input accessibility props', () => {
    const { result } = renderHook(() => useAccessibility());
    const props = result.current.getInputProps({
      label: 'Test Input',
      hint: 'Input hint',
    });
    expect(props.accessibilityRole).toBe('text');
    expect(props.accessibilityLabel).toBe('Test Input');
    expect(props.accessibilityHint).toBe('Input hint');
  });

  it('enforces minimum touch target', () => {
    const { result } = renderHook(() => useAccessibility());
    expect(result.current.enforceTouchTarget(30)).toBe(48);
    expect(result.current.enforceTouchTarget(50)).toBe(50);
    expect(result.current.enforceTouchTarget(48)).toBe(48);
  });

  it('exposes MIN_TOUCH_TARGET constant', () => {
    const { result } = renderHook(() => useAccessibility());
    expect(result.current.MIN_TOUCH_TARGET).toBe(48);
  });
});
