import { renderHook, act, waitFor } from '@testing-library/react-native';
import { getMediaService } from '../services/media.service';
import { makeAlbum, makeFullBatch } from '../test-utils';
import { useAlbums } from './useAlbums';

jest.mock('../services/media.service');

const mockGetMediaService = getMediaService as jest.MockedFunction<typeof getMediaService>;

const mockMediaService = {
  getAlbums: jest.fn(),
  clearCache: jest.fn(),
  deletePhoto: jest.fn(),
  getPhotosFromAlbum: jest.fn(),
};

describe('useAlbums', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMediaService.mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockMediaService.getAlbums.mockResolvedValue([]);
  });

  it('starts in loading state with empty albums', () => {
    const { result } = renderHook(() => useAlbums());
    expect(result.current.loading).toBe(true);
    expect(result.current.albums).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads albums on mount', async () => {
    const albums = [makeAlbum('a1'), makeAlbum('a2')];
    mockMediaService.getAlbums.mockResolvedValue(albums);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.albums).toHaveLength(2);
    expect(result.current.albums[0].id).toBe('a1');
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    mockMediaService.getAlbums.mockRejectedValue(new Error('Library error'));

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('Library error');
    expect(result.current.albums).toEqual([]);
  });

  it('fetches all albums at once', async () => {
    const albums = makeFullBatch(1, 5);
    mockMediaService.getAlbums.mockResolvedValue(albums);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.albums).toHaveLength(5));

    // All albums are fetched in a single call
    expect(mockMediaService.getAlbums).toHaveBeenCalledTimes(1);
  });

  it('refreshes albums on refreshAlbums', async () => {
    const original = makeFullBatch(1, 5);
    const refreshed = [makeAlbum('new-1')];

    mockMediaService.getAlbums
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(refreshed);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.albums).toHaveLength(5));

    await act(async () => {
      result.current.refreshAlbums();
    });

    await waitFor(() => expect(result.current.albums).toHaveLength(1));
    expect(result.current.albums[0].id).toBe('new-1');
    expect(result.current.refreshing).toBe(false);
  });
});

describe('useAlbums retry behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetMediaService.mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockMediaService.getAlbums.mockRejectedValue(new Error('Library error'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries after a delay following a failure', async () => {
    const { result } = renderHook(() => useAlbums());

    await act(async () => {});
    expect(result.current.retryCount).toBe(1);

    act(() => { result.current.retryLoad(); });
    expect(mockMediaService.getAlbums).toHaveBeenCalledTimes(1);

    // First retry delay is 1000ms * retryCount(1)
    act(() => { jest.advanceTimersByTime(1000); });
    await act(async () => {});

    expect(mockMediaService.getAlbums).toHaveBeenCalledTimes(2);
    expect(result.current.retryCount).toBe(2);
  });

  it('stops retrying and reports MAX_RETRIES_EXCEEDED after repeated failures', async () => {
    const { result } = renderHook(() => useAlbums());

    await act(async () => {});

    act(() => { result.current.retryLoad(); });
    act(() => { jest.advanceTimersByTime(1000); });
    await act(async () => {});
    expect(result.current.retryCount).toBe(2);

    // retryCount (2) has reached MAX_RETRIES - terminal error, no further fetch.
    act(() => { result.current.retryLoad(); });
    await act(async () => {});

    expect(result.current.error?.code).toBe('MAX_RETRIES_EXCEEDED');
    expect(mockMediaService.getAlbums).toHaveBeenCalledTimes(2);
  });
});

describe('useAlbums cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMediaService.mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockMediaService.getAlbums.mockResolvedValue([]);
  });

  it('does not update state after unmount', async () => {
    let resolveAlbums!: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    const pending = new Promise<any>((resolve) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      resolveAlbums = resolve;
    });
    mockMediaService.getAlbums.mockReturnValue(pending);

    const { result, unmount } = renderHook(() => useAlbums());
    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      resolveAlbums([makeAlbum('a1'), makeAlbum('a2')]);
      await pending;
    });

    // The cancelled flag must prevent the success + finally setState calls,
    // so loading stays true and albums stay empty.
    expect(result.current.loading).toBe(true);
    expect(result.current.albums).toEqual([]);
  });

  it('does not update error state after unmount on failure', async () => {
    let rejectAlbums!: (error: unknown) => void;
    const pending = new Promise<any>((_resolve, reject) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      rejectAlbums = reject;
    });
    mockMediaService.getAlbums.mockReturnValue(pending);

    const { result, unmount } = renderHook(() => useAlbums());
    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      rejectAlbums(new Error('Late failure'));
      try { await pending; } catch { /* expected */ }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
