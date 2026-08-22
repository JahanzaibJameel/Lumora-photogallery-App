import { renderHook, act } from '@testing-library/react-native';
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
} from '../services/storage.service';
import { useSearchHistory, useDebouncedValue } from './useSearch';

jest.mock('../services/storage.service');

const mockAddSearchHistory = addSearchHistory as jest.MockedFunction<typeof addSearchHistory>;
const mockClearSearchHistory = clearSearchHistory as jest.MockedFunction<typeof clearSearchHistory>;
const mockGetSearchHistory = getSearchHistory as jest.MockedFunction<typeof getSearchHistory>;

describe('useSearchHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSearchHistory.mockReturnValue([]);
  });

  it('loads search history on mount', () => {
    mockGetSearchHistory.mockReturnValue(['cats', 'dogs']);
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(['cats', 'dogs']);
  });

  it('returns empty history when none stored', () => {
    mockGetSearchHistory.mockReturnValue([]);
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it('records a query by adding to storage and updating state', () => {
    mockGetSearchHistory
      .mockReturnValueOnce([])
      .mockReturnValueOnce(['cats']);

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);

    act(() => {
      result.current.recordQuery('cats');
    });

    expect(mockAddSearchHistory).toHaveBeenCalledWith('cats');
    expect(result.current.history).toEqual(['cats']);
  });

  it('clears history', () => {
    mockGetSearchHistory.mockReturnValue(['cats', 'dogs']);
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.clear();
    });

    expect(mockClearSearchHistory).toHaveBeenCalled();
    expect(result.current.history).toEqual([]);
  });

  it('re-fetches history after recording a query', () => {
    mockGetSearchHistory
      .mockReturnValueOnce(['existing'])
      .mockReturnValueOnce(['new', 'existing']);

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(['existing']);

    act(() => {
      result.current.recordQuery('new');
    });

    expect(result.current.history).toEqual(['new', 'existing']);
  });
});

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('updates debounced value after delay', async () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('b');
  });

  it('clears previous timeout on rapid value changes', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    rerender({ value: 'c' });

    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('c');
  });

  it('uses default delay of 300ms', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('handles numeric values', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 1 },
    });

    rerender({ value: 42 });

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);
  });
});
