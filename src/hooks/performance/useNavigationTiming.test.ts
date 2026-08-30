import { renderHook } from '@testing-library/react-native';
import { useNavigationTiming } from './useNavigationTiming';
import { usePerformanceMonitoring } from './index';

jest.mock('./index', () => ({
  usePerformanceMonitoring: jest.fn(),
}));

const mockPerfService = {
  recordNavigation: jest.fn(),
};

describe('useNavigationTiming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (usePerformanceMonitoring as jest.Mock).mockReturnValue(mockPerfService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns screenName and startTime', () => {
    const { result } = renderHook(() => useNavigationTiming('Albums'));

    expect(result.current.screenName).toBe('Albums');
    expect(typeof result.current.startTime).toBe('number');
  });

  it('records navigation metric after mount', () => {
    renderHook(() => useNavigationTiming('Photos', false));

    jest.runOnlyPendingTimers();

    expect(mockPerfService.recordNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        screenName: 'Photos',
        coldStart: false,
      })
    );
  });

  it('passes coldStart flag to recordNavigation', () => {
    renderHook(() => useNavigationTiming('Albums', true));

    jest.runOnlyPendingTimers();

    expect(mockPerfService.recordNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        screenName: 'Albums',
        coldStart: true,
      })
    );
  });

  it('does not record when perf service is null', () => {
    (usePerformanceMonitoring as jest.Mock).mockReturnValue(null);

    renderHook(() => useNavigationTiming('Albums'));

    jest.runOnlyPendingTimers();

    expect(mockPerfService.recordNavigation).not.toHaveBeenCalled();
  });

  it('does not record twice for the same screen', () => {
    renderHook(() => useNavigationTiming('Albums'));

    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();

    expect(mockPerfService.recordNavigation).toHaveBeenCalledTimes(1);
  });

  it('records again when screenName changes', () => {
    const { rerender } = renderHook(
      ({ screenName }) => useNavigationTiming(screenName),
      { initialProps: { screenName: 'Albums' } }
    );

    jest.runOnlyPendingTimers();
    expect(mockPerfService.recordNavigation).toHaveBeenCalledTimes(1);

    rerender({ screenName: 'Photos' });
    jest.runOnlyPendingTimers();
    expect(mockPerfService.recordNavigation).toHaveBeenCalledTimes(2);
  });
});
