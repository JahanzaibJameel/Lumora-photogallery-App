import { AppError, ErrorCategory, ErrorSeverity, categorizeError } from './errors';

describe('AppError', () => {
  it('creates an error with required fields', () => {
    const error = new AppError({
      message: 'Something failed',
      category: ErrorCategory.NETWORK,
    });

    expect(error.message).toBe('Something failed');
    expect(error.category).toBe(ErrorCategory.NETWORK);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.code).toBe('UNKNOWN');
    expect(error.context).toEqual({});
    expect(error.name).toBe('AppError');
  });

  it('creates an error with all optional fields', () => {
    const original = new Error('Original');
    const error = new AppError({
      message: 'Wrapped error',
      category: ErrorCategory.MEDIA_LIBRARY,
      severity: ErrorSeverity.HIGH,
      code: 'MEDIA_LIBRARY_TRANSIENT',
      context: { albumId: 'a1' },
      originalError: original,
    });

    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.code).toBe('MEDIA_LIBRARY_TRANSIENT');
    expect(error.context).toEqual({ albumId: 'a1' });
    expect(error.originalError).toBe(original);
  });

  it('isRetryable returns true for NETWORK category', () => {
    const error = new AppError({
      message: 'Network timeout',
      category: ErrorCategory.NETWORK,
    });
    expect(error.isRetryable()).toBe(true);
  });

  it('isRetryable returns true for retryable codes', () => {
    const error = new AppError({
      message: 'Storage failure',
      category: ErrorCategory.STORAGE,
      code: 'STORAGE_ERROR',
    });
    expect(error.isRetryable()).toBe(true);
  });

  it('isRetryable returns false for non-retryable errors', () => {
    const error = new AppError({
      message: 'Permission denied',
      category: ErrorCategory.PERMISSION,
      code: 'PERMISSION_DENIED',
    });
    expect(error.isRetryable()).toBe(false);
  });

  it('toJSON serializes all fields', () => {
    const error = new AppError({
      message: 'Test',
      category: ErrorCategory.DATA,
      severity: ErrorSeverity.LOW,
      code: 'DATA_ERROR',
      context: { key: 'value' },
    });

    const json = error.toJSON();
    expect(json).toEqual({
      name: 'AppError',
      message: 'Test',
      category: ErrorCategory.DATA,
      severity: ErrorSeverity.LOW,
      code: 'DATA_ERROR',
      context: { key: 'value' },
      stack: error.stack,
    });
  });
});

describe('categorizeError', () => {
  it('returns AppError unchanged if already an AppError', () => {
    const error = new AppError({
      message: 'Already categorized',
      category: ErrorCategory.NETWORK,
    });
    expect(categorizeError(error)).toBe(error);
  });

  it('categorizes network errors', () => {
    const error = new Error('network request failed');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.NETWORK);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it('categorizes timeout errors', () => {
    const error = new Error('Connection timeout');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.NETWORK);
    expect(result.code).toBe('NETWORK_ERROR');
  });

  it('categorizes fetch failed errors', () => {
    const error = new Error('fetch failed');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.NETWORK);
  });

  it('categorizes ECONNRESET errors', () => {
    const error = new Error('socket hang up econnreset');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.NETWORK);
  });

  it('categorizes permission errors', () => {
    const error = new Error('permission denied');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.PERMISSION);
    expect(result.code).toBe('PERMISSION_DENIED');
    expect(result.severity).toBe(ErrorSeverity.HIGH);
  });

  it('categorizes blocked errors', () => {
    const error = new Error('access blocked');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.PERMISSION);
  });

  it('categorizes media library errors', () => {
    const error = new Error('album not found');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.MEDIA_LIBRARY);
    expect(result.code).toBe('MEDIA_LIBRARY_ERROR');
    expect(result.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it('categorizes photo-related errors', () => {
    const error = new Error('photo asset is corrupted');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.MEDIA_LIBRARY);
  });

  it('categorizes storage errors', () => {
    const error = new Error('mmkv read failed');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.STORAGE);
    expect(result.code).toBe('STORAGE_ERROR');
    expect(result.severity).toBe(ErrorSeverity.LOW);
  });

  it('categorizes JSON parse errors', () => {
    const error = new Error('Unexpected token in JSON');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.STORAGE);
  });

  it('categorizes unknown errors', () => {
    const error = new Error('something completely unexpected');
    const result = categorizeError(error);

    expect(result.category).toBe(ErrorCategory.UNKNOWN);
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it('wraps non-Error values', () => {
    const result = categorizeError('string error');

    expect(result.message).toBe('string error');
    expect(result.category).toBe(ErrorCategory.UNKNOWN);
  });

  it('wraps null values', () => {
    const result = categorizeError(null);

    expect(result.message).toBe('null');
    expect(result.category).toBe(ErrorCategory.UNKNOWN);
  });

  it('preserves original error reference', () => {
    const error = new Error('network down');
    const result = categorizeError(error);

    expect(result.originalError).toBe(error);
  });
});
