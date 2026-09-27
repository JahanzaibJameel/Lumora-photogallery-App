import { fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { renderWithProviders } from '../../test-utils';
import { FavoriteButton } from './FavoriteButton';

describe('FavoriteButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    const backOpacity = useSharedValue(1);
    const { getByLabelText } = renderWithProviders(
      <FavoriteButton
        onPress={mockOnPress}
        isFavorite={false}
        backOpacity={backOpacity}
        visible={true}
      />
    );

    expect(getByLabelText('Add to favorites')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const backOpacity = useSharedValue(1);
    const { queryByLabelText } = renderWithProviders(
      <FavoriteButton
        onPress={mockOnPress}
        isFavorite={false}
        backOpacity={backOpacity}
        visible={false}
      />
    );

    expect(queryByLabelText('Add to favorites')).toBeNull();
  });

  it('shows outline heart when not favorite', () => {
    const backOpacity = useSharedValue(1);
    const { getByLabelText } = renderWithProviders(
      <FavoriteButton
        onPress={mockOnPress}
        isFavorite={false}
        backOpacity={backOpacity}
        visible={true}
      />
    );

    const button = getByLabelText('Add to favorites');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityHint).toBe('Adds this photo to your favorites');
  });

  it('shows filled heart when favorite', () => {
    const backOpacity = useSharedValue(1);
    const { getByLabelText } = renderWithProviders(
      <FavoriteButton
        onPress={mockOnPress}
        isFavorite={true}
        backOpacity={backOpacity}
        visible={true}
      />
    );

    const button = getByLabelText('Remove from favorites');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityHint).toBe('Removes this photo from your favorites');
  });

  it('calls onPress when pressed', () => {
    const backOpacity = useSharedValue(1);
    const { getByLabelText } = renderWithProviders(
      <FavoriteButton
        onPress={mockOnPress}
        isFavorite={false}
        backOpacity={backOpacity}
        visible={true}
      />
    );

    fireEvent.press(getByLabelText('Add to favorites'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('respects custom top position', () => {
    const backOpacity = useSharedValue(1);
    const { getByLabelText } = renderWithProviders(
      <FavoriteButton
        onPress={mockOnPress}
        isFavorite={false}
        backOpacity={backOpacity}
        visible={true}
        top={60}
      />
    );

    const button = getByLabelText('Add to favorites');
    let container = button.parent;
    while (container) {
      const style = StyleSheet.flatten(container.props?.style);
      if (style?.top !== undefined) break;
      container = container.parent;
    }
    expect(container).toBeDefined();
    expect(StyleSheet.flatten(container!.props.style).top).toBe(60);
  });

  it('uses default top position when not specified', () => {
    const backOpacity = useSharedValue(1);
    const { getByLabelText } = renderWithProviders(
      <FavoriteButton
        onPress={mockOnPress}
        isFavorite={false}
        backOpacity={backOpacity}
        visible={true}
      />
    );

    const button = getByLabelText('Add to favorites');
    let container = button.parent;
    while (container) {
      const style = StyleSheet.flatten(container.props?.style);
      if (style?.top !== undefined) break;
      container = container.parent;
    }
    expect(container).toBeDefined();
    expect(StyleSheet.flatten(container!.props.style).top).toBe(40);
  });
});
