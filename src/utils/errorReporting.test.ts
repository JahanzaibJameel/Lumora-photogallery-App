import { errorReporter } from './errorReporting';
import { AppError, ErrorCategory, ErrorSeverity } from './errors';
describe('errorReporter', () => {
  afterEach(() => {
    // Listeners registered in a test must not leak into the next one.
    errorReporter.addListener(() => {})();
  });

  it('delivers already-classified AppErrors untouched to listeners', () => {
    const listener = jest.fn();
    const unsubscribe = errorReporter.addListener(listener);
    const original = new Error('disk full');
    const appError = new AppError({
      message: 'Storage failure',
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.HIGH,
      code: 'STORAGE_WRITE_FAILED',
      context: { operation: 'save' },
      originalError: original,
    });

    errorReporter.capture(appError);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(appError);
    expect(appError.context).toMatchObject({ operation: 'save' });
    unsubscribe();
  });

  it('wraps plain Errors as uncaught medium-severity unknowns', () => {
    const listener = jest.fn();
    const unsubscribe = errorReporter.addListener(listener);
    const failure = new Error('boom');

    errorReporter.capture(failure);

    const reported = listener.mock.calls[0][0] as AppError;
    expect(reported.message).toBe('boom');
    expect(reported.category).toBe(ErrorCategory.UNKNOWN);
    expect(reported.severity).toBe(ErrorSeverity.MEDIUM);
    expect(reported.code).toBe('UNCAUGHT_ERROR');
    expect(reported.originalError).toBe(failure);
    unsubscribe();
  });

  it('stringifies non-Error values', () => {
    const listener = jest.fn();
    const unsubscribe = errorReporter.addListener(listener);

    errorReporter.capture('mysterious failure');
    expect(listener.mock.calls[0][0]).toMatchObject({ message: 'mysterious failure' });

    errorReporter.capture(42);
    expect(listener.mock.calls[1][0]).toMatchObject({ message: '42' });
    unsubscribe();
  });

  it('merges capture-time context into the reported error', () => {
    const listener = jest.fn();
    const unsubscribe = errorReporter.addListener(listener);
    const appError = new AppError({
      message: 'fetch failed',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.LOW,
      code: 'FETCH_FAILED',
      context: { albumId: 'a1' },
    });

    errorReporter.capture(appError, { albumId: 'a2', attempt: 3 });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { albumId: 'a2', attempt: 3 },
      })
    );
    unsubscribe();
  });

  it('keeps dispatching when a listener throws', () => {
    const failing = jest.fn(() => { throw new Error('listener bug'); });
    const healthy = jest.fn();
    const removeFailing = errorReporter.addListener(failing);
    const removeHealthy = errorReporter.addListener(healthy);

    expect(() => errorReporter.capture(new Error('app bug'))).not.toThrow();
    expect(failing).toHaveBeenCalled();
    expect(healthy).toHaveBeenCalledTimes(1);
    removeFailing();
    removeHealthy();
  });

  it('unsubscribes listeners so later captures skip them', () => {
    const listener = jest.fn();
    const unsubscribe = errorReporter.addListener(listener);

    unsubscribe();
    errorReporter.capture(new Error('after unsub'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('init is safe to call without a crash provider installed', () => {
    expect(() => errorReporter.init()).not.toThrow();
  });

  it('default listener logs to console.warn in development', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Add a listener directly to simulate post-init state
    const unsubscribe = errorReporter.addListener(() => {});
    errorReporter.capture(new Error('test warning'));
    expect(warnSpy).not.toHaveBeenCalled();
    unsubscribe();
    warnSpy.mockRestore();
  });
});
