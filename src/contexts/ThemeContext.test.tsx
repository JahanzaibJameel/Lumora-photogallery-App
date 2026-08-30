import { render, renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { ServiceTokens, registerService, clearServices } from '../services/di';
import { StorageKeys } from '../services/storage.service';
import { ThemeProvider, useThemeContext } from './ThemeContext';

const mockStorage = {
  get: jest.fn(),
  save: jest.fn(),
  clear: jest.fn(),
  contains: jest.fn(),
};

jest.mock('../services/storage.service', () => ({
  storageService: mockStorage,
  StorageKeys: {
    THEMES: 'lumora_themes',
  },
  getStorageService: jest.fn(() => mockStorage),
}));

const mockedStorage = mockStorage;

type CapturedThemeState = ReturnType<typeof useThemeContext>;

const TestConsumer = ({ onState }: { onState: (state: CapturedThemeState) => void }) => {
  const state = useThemeContext();
  onState(state);
  return null;
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearServices();
    registerService(ServiceTokens.StorageService, mockStorage);
    mockedStorage.get.mockReturnValue(null);
    (useColorScheme as jest.Mock).mockReturnValue('light');
  });

  it('provides default light theme and system mode when no saved preference', () => {
    const captured: CapturedThemeState[] = [];
    render(
      <ThemeProvider>
        <TestConsumer onState={(state) => captured.push(state)} />
      </ThemeProvider>
    );
    expect(captured[0].themeMode).toBe('system');
    expect(captured[0].isDark).toBe(false);
  });

  it('loads saved theme mode from storage', () => {
    mockedStorage.get.mockReturnValue('dark');

    const captured: CapturedThemeState[] = [];
    render(
      <ThemeProvider>
        <TestConsumer onState={(state) => captured.push(state)} />
      </ThemeProvider>
    );

    expect(mockedStorage.get).toHaveBeenCalledWith(StorageKeys.THEMES);
    expect(captured[captured.length - 1].themeMode).toBe('dark');
    expect(captured[captured.length - 1].isDark).toBe(true);
  });

  it('ignores invalid saved theme mode', () => {
    mockedStorage.get.mockReturnValue('invalid-mode');

    const captured: CapturedThemeState[] = [];
    render(
      <ThemeProvider>
        <TestConsumer onState={(state) => captured.push(state)} />
      </ThemeProvider>
    );

    expect(captured[captured.length - 1].themeMode).toBe('system');
  });

  it('resolves system mode to dark when system color scheme is dark', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const captured: CapturedThemeState[] = [];
    render(
      <ThemeProvider>
        <TestConsumer onState={(state) => captured.push(state)} />
      </ThemeProvider>
    );

    expect(captured[captured.length - 1].isDark).toBe(true);
  });

  it('persists theme mode change to storage', () => {
    const captured: CapturedThemeState[] = [];
    let setMode: (mode: 'light' | 'dark' | 'system') => void;

    render(
      <ThemeProvider>
        <TestConsumer onState={(state) => {
          captured.push(state);
          setMode = state.setThemeMode;
        }} />
      </ThemeProvider>
    );

    act(() => { setMode('dark'); });
    expect(mockedStorage.save).toHaveBeenCalledWith(StorageKeys.THEMES, 'dark');
    expect(captured[captured.length - 1].isDark).toBe(true);
  });

  it('toggleTheme switches from light to dark', () => {
    const captured: CapturedThemeState[] = [];
    let toggle: () => void;

    render(
      <ThemeProvider>
        <TestConsumer onState={(state) => {
          captured.push(state);
          toggle = state.toggleTheme;
        }} />
      </ThemeProvider>
    );

    expect(captured[captured.length - 1].isDark).toBe(false);
    act(() => { toggle(); });
    expect(captured[captured.length - 1].isDark).toBe(true);
  });

  it('toggleTheme switches from dark to light', () => {
    mockedStorage.get.mockReturnValue('dark');

    const captured: CapturedThemeState[] = [];
    let toggle: () => void;

    render(
      <ThemeProvider>
        <TestConsumer onState={(state) => {
          captured.push(state);
          toggle = state.toggleTheme;
        }} />
      </ThemeProvider>
    );

    expect(captured[captured.length - 1].isDark).toBe(true);
    act(() => { toggle(); });
    expect(captured[captured.length - 1].isDark).toBe(false);
  });

  it('returns fallback values when used outside provider', () => {
    const { result } = renderHook(() => useThemeContext());
    expect(result.current.themeMode).toBe('system');
    expect(result.current.isDark).toBe(false);
    expect(typeof result.current.setThemeMode).toBe('function');
    expect(typeof result.current.toggleTheme).toBe('function');
  });
});
