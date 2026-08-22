import { render, renderHook, waitFor, act, fireEvent } from '@testing-library/react-native';
import React, { ReactElement } from 'react';
import { ComponentType } from 'react';
import { ReducedMotionProvider } from '../contexts/ReducedMotionContext';
import { ThemeProvider } from '../contexts/ThemeContext';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ReducedMotionProvider>{children}</ReducedMotionProvider>
  </ThemeProvider>
);

type TypeIdentifier = string | ComponentType<unknown>;

type RenderAPI = ReturnType<typeof render>;

type ExtendedRenderResult = Omit<RenderAPI,
  'UNSAFE_getByType' | 'UNSAFE_getAllByType' | 'UNSAFE_queryByType' | 'UNSAFE_queryAllByType'
> & {
  UNSAFE_getByType: (type: TypeIdentifier) => any,
  UNSAFE_getAllByType: (type: TypeIdentifier) => any[],
  UNSAFE_queryByType: (type: TypeIdentifier) => any | null,
  UNSAFE_queryAllByType: (type: TypeIdentifier) => any[],
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Parameters<typeof render>[1],
): ExtendedRenderResult => {
  const result = render(ui, { wrapper: AllProviders, ...options });
  return result as unknown as ExtendedRenderResult;
};

export { renderHook, waitFor, act, fireEvent };
export { render } from '@testing-library/react-native';
export * from '@testing-library/jest-native';

export { makePhoto, makeAlbum, makeAlbumResult, makeFullBatch, makeWidgetData, makeWidgetConfig, makeMediaLibraryAlbum, makeMediaLibraryAsset } from './factories';
export { makeMockMediaService, makeMockWidgetService, mockMediaServiceDefaults, mockWidgetServiceDefaults } from './mocks';
