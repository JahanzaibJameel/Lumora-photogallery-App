import { render } from '@testing-library/react-native';
import React from 'react';
import { ReducedMotionProvider } from '../contexts/ReducedMotionContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { storageService, StorageKeys } from '../services/storage.service';
import RootNavigator from './RootNavigator';

describe('RootNavigator', () => {
  beforeEach(() => {
    storageService.clear();
  });

  it('renders the Albums screen as the initial route', async () => {
    const { getByText, findByText } = render(<RootNavigator />);

    expect(getByText('Albums')).toBeTruthy();
    expect(await findByText('No Albums Found')).toBeTruthy();
  });

  it('renders with reduced motion enabled', async () => {
    await storageService.save(StorageKeys.REDUCED_MOTION, 'always');

    const { getByText } = render(
      <ThemeProvider>
        <ReducedMotionProvider>
          <RootNavigator />
        </ReducedMotionProvider>
      </ThemeProvider>
    );

    expect(getByText('Albums')).toBeTruthy();
  });
});
