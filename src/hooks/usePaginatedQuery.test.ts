import { renderHook, act } from '@testing-library/react-native';
import { usePaginatedQuery } from './usePaginatedQuery';

describe('usePaginatedQuery', () => {
  it('starts in loading state', () => {
    const fetchPage = jest.fn().mockResolvedValue({ items: [], nextCursor: null, hasNextPage: false });
    const { result } = renderHook(() => usePaginatedQuery({ fetchPage }));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('loads data on mount', async () => {
    const fetchPage = jest.fn().mockResolvedValue({ items: ['a', 'b'], nextCursor: null, hasNextPage: false });
    const { result } = renderHook(() => usePaginatedQuery({ fetchPage }));
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.loading).toBe(false);
  });

  it('handles errors', async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePaginatedQuery({ fetchPage }));
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it('refresh resets data', async () => {
    let callCount = 0;
    const fetchPage = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ items: [`item-${callCount}`], nextCursor: null, hasNextPage: false });
    });
    const { result } = renderHook(() => usePaginatedQuery({ fetchPage }));
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    expect(result.current.data).toEqual(['item-1']);
    await act(async () => {
      result.current.refresh();
      await new Promise(r => setTimeout(r, 0));
    });
    expect(result.current.data).toEqual(['item-2']);
  });
});
