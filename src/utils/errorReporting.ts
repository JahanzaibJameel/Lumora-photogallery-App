import { AppError, ErrorCategory, ErrorSeverity } from './errors';

type ErrorListener = (error: AppError) => void;

class ErrorReporter {
  private listeners: ErrorListener[] = [];
  private sentryAvailable = false;

  init() {
    this.checkSentryAvailability();
  }

  private checkSentryAvailability() {
    try {
      // Sentry integration point:
      // Uncomment when @sentry/react-native is installed:
      //
      // import * as Sentry from '@sentry/react-native';
      // this.sentryAvailable = true;
      // this.listeners.push((error) => {
      //   Sentry.captureException(error.originalError ?? error, {
      //     tags: { category: error.category, code: error.code },
      //     level: this.mapSeverity(error.severity),
      //     extra: error.context,
      //   });
      // });
    } catch {
      this.sentryAvailable = false;
    }
  }

  private mapSeverity(severity: ErrorSeverity): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case ErrorSeverity.LOW: return 'info';
      case ErrorSeverity.MEDIUM: return 'warning';
      case ErrorSeverity.HIGH: return 'error';
      case ErrorSeverity.CRITICAL: return 'fatal';
      default: return 'error';
    }
  }

  capture(error: unknown, context?: Record<string, unknown>) {
    const appError = error instanceof AppError
      ? error
      : new AppError({
          message: error instanceof Error ? error.message : String(error),
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          code: 'UNCAUGHT_ERROR',
          context: context ?? {},
          originalError: error instanceof Error ? error : undefined,
        });

    if (context) {
      appError.context = { ...appError.context, ...context };
    }

    for (const listener of this.listeners) {
      try {
        listener(appError);
      } catch {
        // prevent listener errors from cascading
      }
    }
  }

  addListener(listener: ErrorListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const errorReporter = new ErrorReporter();
