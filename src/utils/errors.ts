export enum ErrorCategory {
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  MEDIA_LIBRARY = 'MEDIA_LIBRARY',
  STORAGE = 'STORAGE',
  WIDGET = 'WIDGET',
  NAVIGATION = 'NAVIGATION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  context: Record<string, unknown>;
  originalError?: Error;

  constructor(options: {
    message: string;
    category: ErrorCategory;
    severity?: ErrorSeverity;
    code?: string;
    context?: Record<string, unknown>;
    originalError?: Error;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.category = options.category;
    this.severity = options.severity ?? ErrorSeverity.MEDIUM;
    this.code = options.code ?? 'UNKNOWN';
    this.context = options.context ?? {};
    this.originalError = options.originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  isRetryable(): boolean {
    return this.category === ErrorCategory.NETWORK || this.code === 'MEDIA_LIBRARY_TRANSIENT';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

export const categorizeError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  if (message.includes('network') || message.includes('timeout') || message.includes('fetch failed') || message.includes('econnreset')) {
    return new AppError({
      message: err.message,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      code: 'NETWORK_ERROR',
      originalError: err,
    });
  }

  if (message.includes('permission') || message.includes('denied') || message.includes('blocked')) {
    return new AppError({
      message: err.message,
      category: ErrorCategory.PERMISSION,
      severity: ErrorSeverity.HIGH,
      code: 'PERMISSION_DENIED',
      originalError: err,
    });
  }

  if (message.includes('media') || message.includes('album') || message.includes('photo') || message.includes('asset')) {
    return new AppError({
      message: err.message,
      category: ErrorCategory.MEDIA_LIBRARY,
      severity: ErrorSeverity.MEDIUM,
      code: 'MEDIA_LIBRARY_ERROR',
      originalError: err,
    });
  }

  if (message.includes('storage') || message.includes('mmkv') || message.includes('json')) {
    return new AppError({
      message: err.message,
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.LOW,
      code: 'STORAGE_ERROR',
      originalError: err,
    });
  }

  return new AppError({
    message: err.message,
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    code: 'UNKNOWN_ERROR',
    originalError: err,
  });
};
