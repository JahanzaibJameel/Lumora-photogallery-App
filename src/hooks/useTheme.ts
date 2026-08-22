import { useThemeContext, ThemeContextType, ThemeMode, ThemeProvider } from '../contexts/ThemeContext';

export type { ThemeMode };
export type Theme = ThemeContextType;

export const useTheme = (): Theme => {
  return useThemeContext();
};

export { ThemeProvider };
