import { render } from '@testing-library/react-native';
import React from 'react';
import { BackButton, NavArrow, PhotoInfoBadge } from './PhotoViewerOverlay';

const mockUseTheme = jest.fn();
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
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

describe('PhotoViewerOverlay', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      colors: { overlay: 'rgba(0,0,0,0.5)' },
    });
  });

  it('BackButton renders when visible', () => {
    const { getByLabelText } = render(
      <BackButton onPress={jest.fn()} backOpacity={{ value: 1 } as any} visible />
    );
    expect(getByLabelText('Close viewer')).toBeTruthy();
  });

  it('BackButton returns null when not visible', () => {
    const { queryByLabelText } = render(
      <BackButton onPress={jest.fn()} backOpacity={{ value: 1 } as any} visible={false} />
    );
    expect(queryByLabelText('Close viewer')).toBeNull();
  });

  it('NavArrow renders with button role', () => {
    const { getByLabelText } = render(
      <NavArrow onPress={jest.fn()} backOpacity={{ value: 1 } as any} direction="left" visible />
    );
    const button = getByLabelText('Previous photo');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('NavArrow returns null when not visible', () => {
    const { queryByLabelText } = render(
      <NavArrow onPress={jest.fn()} backOpacity={{ value: 1 } as any} direction="right" visible={false} />
    );
    expect(queryByLabelText('Next photo')).toBeNull();
  });

  it('PhotoInfoBadge renders index and total', () => {
    const { getByText } = render(
      <PhotoInfoBadge currentIndex={2} total={10} backOpacity={{ value: 1 } as any} />
    );
    expect(getByText('3 / 10')).toBeTruthy();
  });
});
