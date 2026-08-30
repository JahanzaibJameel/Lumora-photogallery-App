import { AppError, ErrorCategory, ErrorSeverity } from './errors';

type ErrorListener = (error: AppError) => void;

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const SENSITIVE_KEYS = ['password', 'token', 'email', 'secret', 'authorization', 'cookie', 'session'];

function sanitizeContext(context: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!context) return context;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class ErrorReporter {
  private listeners: ErrorListener[] = [];
  private sentryAvailable = false;

  init() {
    this.checkSentryAvailability();
    if (this.listeners.length === 0) {
      this.addListener(this.createDefaultListener());
    }
  }

  private createDefaultListener(): ErrorListener {
    return (error: AppError) => {
      if (this.sentryAvailable) {
        return;
      }

      if (isDevelopment) {
        console.warn('[ErrorReporter]', error.category, error.code, error.message, sanitizeContext(error.context));
      }
    };
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
    let appError = error instanceof AppError
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
      appError = new AppError({
        message: appError.message,
        category: appError.category,
        severity: appError.severity,
        code: appError.code,
        context: { ...appError.context, ...context },
        originalError: appError.originalError,
      });
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
