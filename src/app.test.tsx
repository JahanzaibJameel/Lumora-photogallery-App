import { render } from '@testing-library/react-native';
import React from 'react';
import App from './app';

describe('App provider composition', () => {
  it('renders the app tree without crashing', () => {
    const { UNSAFE_getAllByType } = render(<App />);
    const views = UNSAFE_getAllByType(require('react-native').View);
    expect(views.length).toBeGreaterThan(0);
  });

  it('renders navigation container with albums screen', () => {
    const { getByText } = render(<App />);
    expect(getByText('Albums')).toBeTruthy();
  });

  it('wraps navigator in all required providers', () => {
    const { UNSAFE_getAllByType } = render(<App />);
    const safeAreaProviders = UNSAFE_getAllByType(require('react-native-safe-area-context').SafeAreaProvider);
    expect(safeAreaProviders.length).toBeGreaterThan(0);
  });
});
