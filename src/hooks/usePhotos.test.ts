import { renderHook, act, waitFor } from '@testing-library/react-native';
import { getMediaService } from '../services/media.service';
import { makePhoto } from '../test-utils';
import { usePhotos } from './usePhotos';

jest.mock('../services/media.service');
const mockGetMediaService = getMediaService as jest.MockedFunction<typeof getMediaService>;
const mockMediaService = {
  getPhotosFromAlbum: jest.fn(),
  clearCache: jest.fn(),
  deletePhoto: jest.fn(),
};

describe('usePhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMediaService.mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockMediaService.getPhotosFromAlbum.mockResolvedValue({
      photos: [],
      endCursor: null,
      hasNextPage: false,
    });
  });

  it('starts in loading state with empty photos', () => {
    const { result } = renderHook(() => usePhotos('album-1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.photos).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads photos on mount', async () => {
    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.photos).toEqual([]);
    expect(mockMediaService.getPhotosFromAlbum).toHaveBeenCalled();
  });

  it('loads and displays photos', async () => {
    const photos = [
      makePhoto({ id: 'p1' }),
      makePhoto({ id: 'p2' }),
      makePhoto({ id: 'p3' }),
    ];
    mockMediaService.getPhotosFromAlbum.mockResolvedValue({
      photos,
      endCursor: 'cursor-1',
      hasNextPage: true,
    });

    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(3));
    expect(result.current.photos[0].id).toBe('p1');
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    mockMediaService.getPhotosFromAlbum.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.photos).toEqual([]);
  });

  it('appends photos on loadMore', async () => {
    mockMediaService.getPhotosFromAlbum
      .mockResolvedValueOnce({
        photos: [makePhoto({ id: 'p1' })],
        endCursor: 'cursor-1',
        hasNextPage: true,
      })
      .mockResolvedValueOnce({
        photos: [makePhoto({ id: 'p2' }), makePhoto({ id: 'p3' })],
        endCursor: null,
        hasNextPage: false,
      });

    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(1));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.photos).toHaveLength(3));
    expect(result.current.photos[1].id).toBe('p2');
    expect(result.current.photos[2].id).toBe('p3');
  });

  it('does not load more when hasMore is false', async () => {
    mockMediaService.getPhotosFromAlbum.mockResolvedValue({
      photos: [makePhoto({ id: 'p1' })],
      endCursor: null,
      hasNextPage: false,
    });

    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(1));

    act(() => {
      result.current.loadMore();
    });

    // Only the initial call should have happened
    expect(mockMediaService.getPhotosFromAlbum).toHaveBeenCalledTimes(1);
  });

  it('refreshes photos on refreshPhotos', async () => {
    mockMediaService.getPhotosFromAlbum
      .mockResolvedValueOnce({
        photos: [makePhoto({ id: 'old-p1' }), makePhoto({ id: 'old-p2' })],
        endCursor: null,
        hasNextPage: false,
      })
      .mockResolvedValueOnce({
        photos: [makePhoto({ id: 'new-p1' })],
        endCursor: null,
        hasNextPage: false,
      });

    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    await act(async () => {
      result.current.refreshPhotos();
    });

    await waitFor(() => expect(result.current.photos).toHaveLength(1));

    expect(result.current.refreshing).toBe(false);
    expect(result.current.photos[0].id).toBe('new-p1');
    expect(mockMediaService.clearCache).toHaveBeenCalled();
  });

  it('deletes a photo', async () => {
    const photos = [makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' })];
    mockMediaService.getPhotosFromAlbum.mockResolvedValue({
      photos,
      endCursor: null,
      hasNextPage: false,
    });
    mockMediaService.deletePhoto.mockResolvedValue(true);

    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    await act(async () => {
      await result.current.deletePhoto('p1');
    });

    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].id).toBe('p2');
    expect(mockMediaService.deletePhoto).toHaveBeenCalledWith('p1');
  });

  it('throws when deletePhoto fails', async () => {
    mockMediaService.getPhotosFromAlbum.mockResolvedValue({ photos: [], endCursor: null, hasNextPage: false });
    mockMediaService.deletePhoto.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => usePhotos('album-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.deletePhoto('p1')).rejects.toThrow('Delete failed');
  });

});

describe('usePhotos retry behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetMediaService.mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockMediaService.getPhotosFromAlbum.mockRejectedValue(new Error('Network error'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries after a delay following a failure', async () => {
    const { result } = renderHook(() => usePhotos('album-1'));

    await act(async () => {});
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.retryCount).toBe(1);

    act(() => { result.current.retryLoad(); });
    expect(mockMediaService.getPhotosFromAlbum).toHaveBeenCalledTimes(1);

    // First retry delay is 1000ms * retryCount(1)
    act(() => { jest.advanceTimersByTime(1000); });
    await act(async () => {});

    expect(mockMediaService.getPhotosFromAlbum).toHaveBeenCalledTimes(2);
    expect(result.current.retryCount).toBe(2);
  });

  it('stops retrying and reports MAX_RETRIES_EXCEEDED after repeated failures', async () => {
    const { result } = renderHook(() => usePhotos('album-1'));

    await act(async () => {});

    act(() => { result.current.retryLoad(); });
    act(() => { jest.advanceTimersByTime(1000); });
    await act(async () => {});
    expect(result.current.retryCount).toBe(2);

    // retryCount (2) has reached MAX_RETRIES - terminal error, no further fetch.
    act(() => { result.current.retryLoad(); });
    await act(async () => {});

    expect(result.current.error?.code).toBe('MAX_RETRIES_EXCEEDED');
    expect(mockMediaService.getPhotosFromAlbum).toHaveBeenCalledTimes(2);
  });
});

describe('usePhotos cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMediaService.mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockMediaService.getPhotosFromAlbum.mockResolvedValue({
      photos: [],
      endCursor: null,
      hasNextPage: false,
    });
  });

  it('does not update state after unmount', async () => {
    let resolvePhotos!: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    const pending = new Promise<any>((resolve) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      resolvePhotos = resolve;
    });
    mockMediaService.getPhotosFromAlbum.mockReturnValue(pending);

    const { result, unmount } = renderHook(() => usePhotos('album-1'));
    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      resolvePhotos({ photos: [makePhoto({ id: 'p1' })], endCursor: null, hasNextPage: false });
      await pending;
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.photos).toEqual([]);
  });

  it('does not update error state after unmount on failure', async () => {
    let rejectPhotos!: (error: unknown) => void;
    const pending = new Promise<any>((_resolve, reject) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      rejectPhotos = reject;
    });
    mockMediaService.getPhotosFromAlbum.mockReturnValue(pending);

    const { result, unmount } = renderHook(() => usePhotos('album-1'));
    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      rejectPhotos(new Error('Late failure'));
      try { await pending; } catch { /* expected */ }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
