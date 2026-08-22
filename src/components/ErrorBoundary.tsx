import React, { Component, ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius } from '../theme/tokens';
import { errorReporter } from '../utils/errorReporting';
import { AppError, ErrorCategory, ErrorSeverity } from '../utils/errors';
import { Text } from './primitives/Text';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: AppError; reset: () => void }>;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    const appError = error instanceof AppError
      ? error
      : new AppError({
          message: error.message,
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          code: 'RENDER_ERROR',
          originalError: error,
        });

    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    const appError = this.state.error ?? new AppError({
      message: error.message,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      code: 'RENDER_ERROR',
      originalError: error,
      context: { componentStack: info.componentStack },
    });

    errorReporter.capture(appError, {
      componentStack: info.componentStack,
      lifecycle: 'componentDidCatch',
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error} reset={this.handleRetry} />;
    }
    return this.props.children;
  }
}

interface FallbackProps {
  error: AppError;
  reset: () => void;
}

const DefaultErrorFallback = ({ error, reset }: FallbackProps) => {
  const { colors } = useTheme();

  const title =
    error.category === ErrorCategory.NETWORK ? 'Connection Issue'
    : error.category === ErrorCategory.PERMISSION ? 'Permission Required'
    : 'Something went wrong';

  const message =
    error.severity === ErrorSeverity.CRITICAL
      ? 'A critical error occurred. Please restart the app.'
      : error.message || 'An unexpected error occurred.';

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={title}
    >
      <View style={styles.inner}>
        <Text variant="h2" color="primary" style={styles.title}>
          {title}
        </Text>
        <Text variant="body" color="secondary" style={styles.message}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={reset}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          accessibilityHint="Attempts to recover from the error"
          style={[styles.button, { backgroundColor: colors.accent }]}
          activeOpacity={0.7}
        >
          <Text variant="title" color="onSurface" style={styles.buttonText}>
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  inner: {
    alignItems: 'center',
    maxWidth: 480,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});

export const ErrorBoundary = ErrorBoundaryClass;
export default ErrorBoundary;
