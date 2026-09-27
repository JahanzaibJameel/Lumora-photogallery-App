import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import type { TextInput } from 'react-native';
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
    const ref = React.createRef<TextInput>();
    renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} ref={ref} />
    );
    expect(ref.current).toBeTruthy();
  });

  describe('Search History', () => {
    it('does not show history dropdown when showHistory is false', () => {
      const { queryByLabelText, getByLabelText } = renderWithProviders(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          searchHistory={['photo1', 'photo2']}
          showHistory={false}
        />
      );
      const input = getByLabelText('Search photos');
      fireEvent(input, 'focus');
      expect(queryByLabelText('Recent searches')).toBeNull();
    });

    it('shows history dropdown when focused and empty with history', () => {
      const { getByLabelText } = renderWithProviders(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          searchHistory={['vacation', 'sunset']}
          showHistory={true}
        />
      );
      const input = getByLabelText('Search photos');
      fireEvent(input, 'focus');
      expect(getByLabelText('Recent searches')).toBeTruthy();
    });

    it('hides history dropdown when value is not empty', () => {
      const { queryByLabelText } = renderWithProviders(
        <SearchBar
          value="test"
          onChangeText={jest.fn()}
          searchHistory={['vacation', 'sunset']}
          showHistory={true}
        />
      );
      expect(queryByLabelText('Recent searches')).toBeNull();
    });

    it('calls onSelectHistory when history item is selected', () => {
      const onSelectHistory = jest.fn();
      const onChangeText = jest.fn();
      const { getByLabelText, getByText } = renderWithProviders(
        <SearchBar
          value=""
          onChangeText={onChangeText}
          searchHistory={['vacation']}
          onSelectHistory={onSelectHistory}
          showHistory={true}
        />
      );
      const input = getByLabelText('Search photos');
      fireEvent(input, 'focus');
      fireEvent.press(getByText('vacation'));
      expect(onSelectHistory).toHaveBeenCalledWith('vacation');
      expect(onChangeText).toHaveBeenCalledWith('vacation');
    });

    it('calls onClearHistory when Clear All is pressed', () => {
      const onClearHistory = jest.fn();
      const { getByLabelText, getByText } = renderWithProviders(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          searchHistory={['vacation', 'sunset']}
          onClearHistory={onClearHistory}
          showHistory={true}
        />
      );
      const input = getByLabelText('Search photos');
      fireEvent(input, 'focus');
      fireEvent.press(getByText('Clear All'));
      expect(onClearHistory).toHaveBeenCalledTimes(1);
    });

    it('renders multiple history items', () => {
      const { getByLabelText, getByText } = renderWithProviders(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          searchHistory={['vacation', 'sunset', 'beach']}
          showHistory={true}
        />
      );
      const input = getByLabelText('Search photos');
      fireEvent(input, 'focus');
      expect(getByText('vacation')).toBeTruthy();
      expect(getByText('sunset')).toBeTruthy();
      expect(getByText('beach')).toBeTruthy();
    });
  });
});
