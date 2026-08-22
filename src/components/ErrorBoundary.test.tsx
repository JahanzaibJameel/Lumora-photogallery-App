import { fireEvent, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text as RNText } from 'react-native';
import { renderWithProviders } from '../test-utils';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let shouldThrow: boolean;

  const Thrower = () => {
    if (shouldThrow) {
      throw new Error('Test error message');
    }
    return <RNText>Child content</RNText>;
  };

  beforeEach(() => {
    shouldThrow = false;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error', () => {
    shouldThrow = false;
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <RNText>Child content</RNText>
      </ErrorBoundary>
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  it('catches errors and renders fallback', () => {
    shouldThrow = true;
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('displays the error message in fallback', () => {
    shouldThrow = true;
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText('Test error message')).toBeTruthy();
  });

  it('shows "Try again" button', () => {
    shouldThrow = true;
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText('Try again')).toBeTruthy();
  });

  it('retry button resets error state and renders children', async () => {
    shouldThrow = true;
    const { getByText, queryByText } = renderWithProviders(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeTruthy();

    shouldThrow = false;
    act(() => {
      fireEvent.press(getByText('Try again'));
    });

    await waitFor(() => expect(queryByText('Something went wrong')).toBeNull());
    expect(getByText('Child content')).toBeTruthy();
  });

  it('logs the error via console.error', () => {
    shouldThrow = true;
    renderWithProviders(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    const calls = consoleErrorSpy.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(typeof calls[0][0]).toBe('string');
  });
});
