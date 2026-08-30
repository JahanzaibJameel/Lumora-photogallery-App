import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from '../test-utils';
import BlurHeader from './BlurHeader';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    dispatch: jest.fn(),
    canGoBack: () => false,
    isFocused: () => true,
    setParams: jest.fn(),
    getState: () => ({ key: 'root', index: 0, routes: [] }),
    dangerouslyGetState: () => ({ key: 'root', index: 0, routes: [] }),
    addListener: () => ({ remove: () => {} }),
  }),
  useRoute: () => ({ key: 'route-key', name: 'Albums', params: {} }),
}));

describe('BlurHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with a title', () => {
    const { getByText } = renderWithProviders(<BlurHeader title="My Albums" />);
    expect(getByText('My Albums')).toBeTruthy();
  });

  it('does not show back button by default', () => {
    const { queryByLabelText } = renderWithProviders(<BlurHeader title="Title" />);
    expect(queryByLabelText('Go back')).toBeNull();
  });

  it('shows back button when showBack is true', () => {
    const { getByLabelText } = renderWithProviders(<BlurHeader title="Title" showBack />);
    expect(getByLabelText('Go back')).toBeTruthy();
  });

  it('calls navigation.goBack when back button is pressed', () => {
    const { getByLabelText } = renderWithProviders(<BlurHeader title="Title" showBack />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('does not show search button by default', () => {
    const { queryByLabelText } = renderWithProviders(<BlurHeader title="Title" />);
    expect(queryByLabelText('Open search')).toBeNull();
  });

  it('shows search button when showSearch is true', () => {
    const { getByLabelText } = renderWithProviders(<BlurHeader title="Title" showSearch />);
    expect(getByLabelText('Open search')).toBeTruthy();
  });

  it('toggles search bar when search button is pressed', () => {
    const { getByLabelText, queryByLabelText } = renderWithProviders(
      <BlurHeader title="Title" showSearch />
    );
    expect(queryByLabelText('Search photos')).toBeNull();
    fireEvent.press(getByLabelText('Open search'));
    expect(getByLabelText('Search photos')).toBeTruthy();
    fireEvent.press(getByLabelText('Close search'));
    expect(queryByLabelText('Search photos')).toBeNull();
  });

  it('calls onSearchChange when text is entered', () => {
    const onSearchChange = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <BlurHeader title="Title" showSearch onSearchChange={onSearchChange} />
    );
    fireEvent.press(getByLabelText('Open search'));
    const input = getByLabelText('Search photos');
    fireEvent.changeText(input, 'hello');
    expect(onSearchChange).toHaveBeenCalledWith('hello');
  });

  it('shows widgets button when showWidgets is true', () => {
    const { getByLabelText } = renderWithProviders(<BlurHeader title="Title" showWidgets />);
    expect(getByLabelText('Open widgets')).toBeTruthy();
  });

  it('calls navigation.navigate with "Widgets" when widgets button is pressed', () => {
    const { getByLabelText } = renderWithProviders(<BlurHeader title="Title" showWidgets />);
    fireEvent.press(getByLabelText('Open widgets'));
    expect(mockNavigate).toHaveBeenCalledWith('Widgets');
  });
});