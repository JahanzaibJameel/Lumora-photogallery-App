import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './components/ErrorBoundary';
import { GridSizeProvider } from './contexts/GridSizeContext';
import { ReducedMotionProvider } from './contexts/ReducedMotionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './hooks/useTheme';
import RootNavigator from './navigation/RootNavigator';
import { ServiceTokens, resolveService } from './services/di';
import { IPerformanceMonitoringService } from './services/performance.service';
import { errorReporter } from './utils/errorReporting';

errorReporter.init();

function MainApp() {
  const { isDark } = useTheme();

  useEffect(() => {
    const perfService = resolveService<IPerformanceMonitoringService>(ServiceTokens.PerformanceService);
    if (perfService) {
      perfService.initialize();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ErrorBoundary>
        <RootNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ReducedMotionProvider>
        <GridSizeProvider>
          <GestureHandlerRootView style={{ flex: 1 }} accessible={true}>
            <MainApp />
          </GestureHandlerRootView>
        </GridSizeProvider>
      </ReducedMotionProvider>
    </ThemeProvider>
  );
}
