import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { darkColors, lightColors } from '../theme/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  colors: typeof lightColors;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const colors = themeMode === 'dark' ? darkColors : lightColors;
  const isDark = themeMode === 'dark';

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('lumora_theme');
      if (savedTheme) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    await AsyncStorage.setItem('lumora_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ colors, themeMode, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};