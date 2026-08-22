import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../src/app';

describe('App', () => {
  it('renders the app without crashing and shows the Albums screen', async () => {
    const { findByText, getByText } = render(<App />);

    // Header "Albums" renders synchronously from the navigator's custom header.
    expect(getByText('Albums')).toBeTruthy();

    // Once permission + media requests resolve against an empty library,
    // the Albums screen renders its empty state.
    expect((await findByText('No Albums Found')).props).toBeTruthy();
  });
});
