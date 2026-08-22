import { renderHook, act, waitFor } from '@testing-library/react-native';
import { getMediaService } from '../services/media.service';
import { cacheThumbnails } from '../services/storage.service';
import { useAlbumThumbnail } from './useAlbumThumbnail';

jest.mock('../services/media.service');
jest.mock('../services/storage.service');

const mockGetMediaService = getMediaService as jest.MockedFunction<typeof getMediaService>;

describe('useAlbumThumbnail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cacheThumbnails as jest.MockedFunction<typeof cacheThumbnails>).mockResolvedValue(undefined);
  });

  it('returns initialUri when provided', () => {
    const { result } = renderHook(() => useAlbumThumbnail('album-1', 'file://initial.jpg'));
    expect(result.current).toBe('file://initial.jpg');
  });

  it('returns undefined when no initialUri and no thumbnail found', async () => {
    mockGetMediaService.mockReturnValue({
      getAlbumThumbnail: jest.fn().mockResolvedValue(undefined),
    } as any);

    const { result } = renderHook(() => useAlbumThumbnail('album-1'));
    await waitFor(() => expect(result.current).toBeUndefined());
  });

  it('fetches and caches thumbnail when no initialUri', async () => {
    const mockGetThumbnail = jest.fn().mockResolvedValue('file://thumb.jpg');
    mockGetMediaService.mockReturnValue({
      getAlbumThumbnail: mockGetThumbnail,
    } as any);

    const { result } = renderHook(() => useAlbumThumbnail('album-1'));
    await waitFor(() => expect(result.current).toBe('file://thumb.jpg'));
    expect(mockGetThumbnail).toHaveBeenCalledWith('album-1');
    expect(cacheThumbnails).toHaveBeenCalledWith('album-1', ['file://thumb.jpg']);
  });

  it('ignores stale response when component unmounts', async () => {
    let resolveThumbnail!: (value: string | undefined) => void;
    const thumbPromise = new Promise<string | undefined>((resolve) => {
      resolveThumbnail = resolve;
    });

    mockGetMediaService.mockReturnValue({
      getAlbumThumbnail: jest.fn().mockReturnValue(thumbPromise),
    } as any);

    const { result, unmount } = renderHook(() => useAlbumThumbnail('album-1'));
    expect(result.current).toBeUndefined();

    // Resolve after unmount - the cancelled flag must prevent the state update.
    unmount();
    await act(async () => {
      resolveThumbnail('file://late.jpg');
      await thumbPromise;
    });

    expect(result.current).toBeUndefined();
    expect(cacheThumbnails).not.toHaveBeenCalled();
  });
});
