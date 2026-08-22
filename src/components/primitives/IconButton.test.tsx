import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from '../../test-utils';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders without crashing', () => {
    const { getByLabelText } = renderWithProviders(
      <IconButton name="search" accessibilityLabel="Search" />
    );
    expect(getByLabelText('Search')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <IconButton name="search" onPress={onPress} accessibilityLabel="Search" />
    );
    fireEvent.press(getByLabelText('Search'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <IconButton name="search" onPress={onPress} accessibilityLabel="Search" disabled />
    );
    fireEvent.press(getByLabelText('Search'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies background color when provided', () => {
    const { getByLabelText } = renderWithProviders(
      <IconButton name="search" accessibilityLabel="Search" background="rgba(0,0,0,0.5)" />
    );
    const button = getByLabelText('Search');
    const styles = Array.isArray(button.props.style) ? button.props.style : [button.props.style];
    const bgStyle = styles.find((s: Record<string, unknown>) => s && (s as Record<string, unknown>).backgroundColor);
    expect(bgStyle?.backgroundColor).toBe('rgba(0,0,0,0.5)');
  });

  it('passes ref to TouchableOpacity', () => {
    const ref = React.createRef<any>();
    renderWithProviders(
      <IconButton name="search" ref={ref} accessibilityLabel="Search" />
    );
    expect(ref.current).toBeTruthy();
  });
});
