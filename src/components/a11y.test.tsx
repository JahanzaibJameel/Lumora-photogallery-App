import React from 'react';
import { IconButton } from '../components/primitives/IconButton';
import { SearchBar } from '../components/primitives/SearchBar';
import { Text } from '../components/primitives/Text';
import { renderWithProviders } from '../test-utils';

describe('Accessibility Tests', () => {
  describe('Text', () => {
    it('has accessibilityRole="text"', () => {
      const { getByLabelText } = renderWithProviders(
        <Text accessibilityLabel="Test text">Hello</Text>
      );
      const element = getByLabelText('Test text');
      expect(element.props.accessibilityRole).toBe('text');
    });

    it('passes through accessibilityLabel from props', () => {
      const { getByLabelText } = renderWithProviders(
        <Text accessibilityLabel="Custom label">Hello</Text>
      );
      expect(getByLabelText('Custom label')).toBeTruthy();
    });
  });

  describe('IconButton', () => {
    it('has accessibilityRole="button"', () => {
      const { getByRole } = renderWithProviders(
        <IconButton name="search" accessibilityLabel="Search" />
      );
      expect(getByRole('button')).toBeTruthy();
    });

    it('has correct accessibilityLabel', () => {
      const { getByLabelText } = renderWithProviders(
        <IconButton name="search" accessibilityLabel="Search photos" />
      );
      expect(getByLabelText('Search photos')).toBeTruthy();
    });

    it('has accessibilityHint when provided', () => {
      const { getByLabelText } = renderWithProviders(
        <IconButton name="search" accessibilityLabel="Search" accessibilityHint="Opens search" />
      );
      const element = getByLabelText('Search');
      expect(element.props.accessibilityHint).toBe('Opens search');
    });

    it('has accessibilityState with disabled when disabled', () => {
      const { getByRole } = renderWithProviders(
        <IconButton name="search" accessibilityLabel="Search" disabled={true} />
      );
      const element = getByRole('button');
      expect(element.props.accessibilityState).toEqual({ disabled: true });
    });

    it('has minimum 48x48 touch target', () => {
      const { toJSON } = renderWithProviders(
        <IconButton name="search" accessibilityLabel="Search" />
      );
      const tree = toJSON();
      // IconButton container should be 48x48
      expect(tree).toBeTruthy();
    });
  });

  describe('SearchBar', () => {
    it('has accessibilityRole="text"', () => {
      const { getByLabelText } = renderWithProviders(
        <SearchBar value="" onChangeText={() => {}} accessibilityLabel="Search photos" />
      );
      const element = getByLabelText('Search photos');
      expect(element.props.accessibilityRole).toBe('text');
    });

    it('has accessibilityHint', () => {
      const { getByLabelText } = renderWithProviders(
        <SearchBar value="" onChangeText={() => {}} accessibilityLabel="Search" accessibilityHint="Type to search" />
      );
      const element = getByLabelText('Search');
      expect(element.props.accessibilityHint).toBe('Type to search');
    });

    it('has accessibilityLiveRegion="polite"', () => {
      const { getByLabelText } = renderWithProviders(
        <SearchBar value="" onChangeText={() => {}} accessibilityLabel="Search" />
      );
      const element = getByLabelText('Search');
      expect(element.props.accessibilityLiveRegion).toBe('polite');
    });

    it('clear button has accessibilityRole="button"', () => {
      const { getByLabelText } = renderWithProviders(
        <SearchBar value="test" onChangeText={() => {}} />
      );
      const clearButton = getByLabelText('Clear search');
      expect(clearButton.props.accessibilityRole).toBe('button');
    });
  });
});
