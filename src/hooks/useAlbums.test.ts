import { renderHook, act, waitFor } from '@testing-library/react-native';
import { getMediaService } from '../services/media.service';
import { cacheThumbnails, loadCachedThumbnails } from '../services/storage.service';
import { makeAlbum, makeFullBatch } from '../test-utils';
import { useAlbums } from './useAlbums';

jest.mock('../services/media.service');
jest.mock('../services/storage.service');

const mockGetMediaService = getMediaService as jest.MockedFunction<typeof getMediaService>;
const mockCacheThumbnails = cacheThumbnails as jest.MockedFunction<typeof cacheThumbnails>;
const mockLoadCachedThumbnails = loadCachedThumbnails as jest.MockedFunction<typeof loadCachedThumbnails>;

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
    mockCacheThumbnails.mockResolvedValue(undefined);
    mockLoadCachedThumbnails.mockReturnValue(null);
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

  it('loads more albums on loadMore', async () => {
    const firstBatch = makeFullBatch(1, 20);
    const secondBatch = [makeAlbum('a21'), makeAlbum('a22')];

    mockMediaService.getAlbums
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce(secondBatch);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.albums).toHaveLength(20));

    mockMediaService.getAlbums.mockResolvedValue(secondBatch);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.albums).toHaveLength(22));
    expect(result.current.albums[20].id).toBe('a21');
  });

  it('stops loading more when fewer than BATCH_SIZE returned', async () => {
    mockMediaService.getAlbums.mockResolvedValue([makeAlbum('a1')]);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.albums).toHaveLength(1));

    await act(async () => {
      result.current.loadMore();
    });

    // hasMore is false because batch size was < 20
    expect(mockMediaService.getAlbums).toHaveBeenCalledTimes(1);
  });

  it('refreshes albums on refreshAlbums', async () => {
    const original = makeFullBatch(1, 20);
    const refreshed = [makeAlbum('new-1')];

    mockMediaService.getAlbums
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(refreshed);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.albums).toHaveLength(20));

    mockMediaService.getAlbums.mockResolvedValue(refreshed);

    await act(async () => {
      result.current.refreshAlbums();
    });

    await waitFor(() => expect(result.current.albums).toHaveLength(1));
    expect(result.current.albums[0].id).toBe('new-1');
    expect(result.current.refreshing).toBe(false);
  });

  it('deduplicates albums by id', async () => {
    const firstBatch = makeFullBatch(1, 20);
    const secondBatch = [makeAlbum('a1'), makeAlbum('a21')];

    mockMediaService.getAlbums
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce(secondBatch);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.albums).toHaveLength(20));

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.albums).toHaveLength(21));
    const ids = result.current.albums.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not eagerly cache thumbnails (delegated to useAlbumThumbnail)', async () => {
    mockMediaService.getAlbums.mockResolvedValue([
      makeAlbum('a1'),
      makeAlbum('a2'),
    ]);

    const { result: _result } = renderHook(() => useAlbums());
    await waitFor(() => expect(mockMediaService.getAlbums).toHaveBeenCalled());

    expect(mockCacheThumbnails).not.toHaveBeenCalled();
  });

  it('getAlbumThumbnail returns cached thumbnail', async () => {
    mockMediaService.getAlbums.mockResolvedValue([]);
    mockLoadCachedThumbnails.mockReturnValue(['file://cached-thumb.jpg']);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thumb: string | null | undefined;
    await act(async () => {
      thumb = await result.current.getAlbumThumbnail('album-1');
    });
    expect(thumb).toBe('file://cached-thumb.jpg');
    expect(mockLoadCachedThumbnails).toHaveBeenCalledWith('album-1');
  });

  it('getAlbumThumbnail returns null when no cache', async () => {
    mockMediaService.getAlbums.mockResolvedValue([]);
    mockLoadCachedThumbnails.mockReturnValue(null);

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thumb: string | null | undefined;
    await act(async () => {
      thumb = await result.current.getAlbumThumbnail('album-1');
    });
    expect(thumb).toBeNull();
  });

  it('getAlbumThumbnail returns null on error', async () => {
    mockMediaService.getAlbums.mockResolvedValue([]);
    mockLoadCachedThumbnails.mockImplementation(() => { throw new Error('cache read failed'); });

    const { result } = renderHook(() => useAlbums());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thumb: string | null | undefined;
    await act(async () => {
      thumb = await result.current.getAlbumThumbnail('album-1');
    });
    expect(thumb).toBeNull();
  });
});

describe('useAlbums retry behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetMediaService.mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockCacheThumbnails.mockResolvedValue(undefined);
    mockLoadCachedThumbnails.mockReturnValue(null);
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
