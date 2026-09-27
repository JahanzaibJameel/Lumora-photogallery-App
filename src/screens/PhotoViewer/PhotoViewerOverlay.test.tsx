import { render } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';
import { BackButton, NavArrow, PhotoInfoBadge } from './PhotoViewerOverlay';

const mockUseTheme = jest.fn();
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
}));

jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  const Actual = jest.requireActual('react-native-reanimated');
  return {
    ...Actual,
    useAnimatedStyle: () => ({}),
    View,
    Text,
    __esModule: true,
  };
});

const mockBackOpacity = { value: 1 } as unknown as SharedValue<number>;

describe('PhotoViewerOverlay', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      colors: { overlay: 'rgba(0,0,0,0.5)' },
    });
  });

  it('BackButton renders when visible', () => {
    const { getByLabelText } = render(
      <BackButton onPress={jest.fn()} backOpacity={mockBackOpacity} visible />
    );
    expect(getByLabelText('Close viewer')).toBeTruthy();
  });

  it('BackButton returns null when not visible', () => {
    const { queryByLabelText } = render(
      <BackButton onPress={jest.fn()} backOpacity={mockBackOpacity} visible={false} />
    );
    expect(queryByLabelText('Close viewer')).toBeNull();
  });

  it('NavArrow renders with button role', () => {
    const { getByLabelText } = render(
      <NavArrow onPress={jest.fn()} backOpacity={mockBackOpacity} direction="left" visible />
    );
    const button = getByLabelText('Previous photo');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('NavArrow returns null when not visible', () => {
    const { queryByLabelText } = render(
      <NavArrow onPress={jest.fn()} backOpacity={mockBackOpacity} direction="right" visible={false} />
    );
    expect(queryByLabelText('Next photo')).toBeNull();
  });

  it('PhotoInfoBadge renders index and total', () => {
    const { getByText } = render(
      <PhotoInfoBadge currentIndex={2} total={10} backOpacity={mockBackOpacity} />
    );
    expect(getByText('3 / 10')).toBeTruthy();
  });
});
