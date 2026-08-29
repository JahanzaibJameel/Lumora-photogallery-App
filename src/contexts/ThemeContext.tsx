import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getStorageService, StorageKeys } from '../services/storage.service';
import { lightColors, darkColors } from '../theme/tokens';
import type { ColorTokens } from '../theme/tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  colors: ColorTokens;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const saved = getStorageService().get<string>(StorageKeys.THEMES);
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeModeState(saved as ThemeMode);
    }
  }, []);

  const effectiveMode = themeMode === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const isDark = effectiveMode === 'dark';
  const colors = (isDark ? darkColors : lightColors) as ColorTokens;

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    getStorageService().save(StorageKeys.THEMES, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = effectiveMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  }, [effectiveMode, setThemeMode]);

  // Stable identity: without memoization every provider render hands consumers
  // a fresh value object and re-renders the entire tree below it.
  const value = useMemo(
    () => ({ colors, themeMode, isDark, setThemeMode, toggleTheme }),
    [colors, themeMode, isDark, setThemeMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      colors: lightColors,
      themeMode: 'system',
      isDark: false,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
};
