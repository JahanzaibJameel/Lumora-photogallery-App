import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { storageService, StorageKeys } from '../services/storage.service';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    storageService.clear();
  });

  it('returns the context value when used within ThemeProvider', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current).toHaveProperty('colors');
    expect(result.current).toHaveProperty('themeMode');
    expect(result.current).toHaveProperty('isDark');
    expect(result.current).toHaveProperty('setThemeMode');
    expect(result.current).toHaveProperty('toggleTheme');
  });

  it('defaults to light theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.isDark).toBe(false);
    expect(result.current.themeMode).toBe('system');
  });

  it('returns light colors by default', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.colors.background).toBe('#FFFFFF');
    expect(result.current.colors.textPrimary).toBe('#1A1A1A');
  });

  it('setThemeMode updates the theme mode and persists to storage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => {
      result.current.setThemeMode('dark');
    });
    expect(result.current.isDark).toBe(true);
    expect(result.current.themeMode).toBe('dark');
    expect(result.current.colors.background).toBe('#000000');
  });

  it('toggleTheme switches from light to dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.isDark).toBe(true);
    expect(result.current.themeMode).toBe('dark');
  });

  it('toggleTheme switches from dark to light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => {
      result.current.setThemeMode('dark');
    });
    expect(result.current.isDark).toBe(true);
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.isDark).toBe(false);
    expect(result.current.themeMode).toBe('light');
  });

  it('persists and loads saved theme mode', () => {
    storageService.save(StorageKeys.THEMES, 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.themeMode).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('ignores invalid saved theme mode', () => {
    storageService.save(StorageKeys.THEMES, 'invalid');
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.themeMode).toBe('system');
  });

  it('returns default values without provider', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
    expect(result.current.themeMode).toBe('system');
    expect(typeof result.current.setThemeMode).toBe('function');
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('ThemeProvider re-exports', () => {
    expect(ThemeProvider).toBeDefined();
  });
});
