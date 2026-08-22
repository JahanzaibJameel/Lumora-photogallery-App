import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from '../../test-utils';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders without crashing with a value', () => {
    const { getByDisplayValue } = renderWithProviders(
      <SearchBar value="test query" onChangeText={jest.fn()} />
    );
    expect(getByDisplayValue('test query')).toBeTruthy();
  });

  it('uses default placeholder', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} />
    );
    expect(getByPlaceholderText('Search photos...')).toBeTruthy();
  });

  it('uses custom placeholder', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="Search albums..." />
    );
    expect(getByPlaceholderText('Search albums...')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = renderWithProviders(
      <SearchBar value="a" onChangeText={onChangeText} />
    );
    const input = getByDisplayValue('a');
    fireEvent.changeText(input, 'ab');
    expect(onChangeText).toHaveBeenCalledWith('ab');
  });

  it('shows clear button when value is non-empty', () => {
    const { getByLabelText } = renderWithProviders(
      <SearchBar value="text" onChangeText={jest.fn()} />
    );
    expect(getByLabelText('Clear search')).toBeTruthy();
  });

  it('hides clear button when value is empty', () => {
    const { queryByLabelText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} />
    );
    expect(queryByLabelText('Clear search')).toBeNull();
  });

  it('clears text when clear button is pressed', () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <SearchBar value="text" onChangeText={onChangeText} />
    );
    fireEvent.press(getByLabelText('Clear search'));
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('calls onClear when clear button is pressed', () => {
    const onClear = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <SearchBar value="text" onChangeText={jest.fn()} onClear={onClear} />
    );
    fireEvent.press(getByLabelText('Clear search'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('uses default accessibilityLabel', () => {
    const { getByLabelText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} />
    );
    expect(getByLabelText('Search photos')).toBeTruthy();
  });

  it('uses custom accessibilityLabel', () => {
    const { getByLabelText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} accessibilityLabel="Custom search" />
    );
    expect(getByLabelText('Custom search')).toBeTruthy();
  });

  it('passes ref to TextInput', () => {
    const ref = React.createRef<any>();
    renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} ref={ref} />
    );
    expect(ref.current).toBeTruthy();
  });
});
