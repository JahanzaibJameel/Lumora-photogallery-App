import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { makeMediaLibraryAlbum, makeMediaLibraryAsset, makeAlbumResult, makePhoto } from '../test-utils';
import { Album } from '../types';
import { ServiceTokens, registerService, clearServices } from './di';
import { MediaService, getMediaService } from './media.service';

jest.mock('expo-media-library');

const mockMediaLibrary = MediaLibrary as jest.Mocked<typeof MediaLibrary>;

const mockMediaLibraryAlbum = makeMediaLibraryAlbum;
const mockMediaLibraryAsset = makeMediaLibraryAsset;
const mockAlbumResult = makeAlbumResult;

// getAssetInfoAsync resolves AssetInfo, whose optional location/exif fields
// disallow null; the shared fixture intentionally allows them, so narrow the
// type at this single boundary instead of weakening the factory for Asset use.
const asAssetInfo = (asset: ReturnType<typeof makeMediaLibraryAsset>) =>
  asset as unknown as MediaLibrary.AssetInfo;

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    jest.clearAllMocks();
    clearServices();
    service = MediaService.getInstance();
    registerService(ServiceTokens.MediaService, service);
    service.clearCache();
  });

  describe('getInstance (singleton)', () => {
    it('returns the same instance', () => {
      const a = MediaService.getInstance();
      const b = MediaService.getInstance();
      expect(a).toBe(b);
    });

    it('getMediaService returns the singleton', () => {
      expect(getMediaService()).toBe(MediaService.getInstance());
    });
  });

  describe('getAlbums', () => {
    it('fetches and formats albums', async () => {
      const rawAlbums = [
        mockMediaLibraryAlbum({ id: 'a1', title: 'Album 1', assetCount: 5 }),
        mockMediaLibraryAlbum({ id: 'a2', title: 'Album 2', assetCount: 3 }),
      ];
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue(rawAlbums);

      const result = await service.getAlbums(0, 20);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'a1',
        title: 'Album 1',
        count: 5,
      });
      expect(mockMediaLibrary.getAlbumsAsync).toHaveBeenCalledWith({ includeSmartAlbums: true });
    });

    it('applies offset and limit', async () => {
      const rawAlbums = [
        mockMediaLibraryAlbum({ id: 'a1', title: 'Album 1', assetCount: 5 }),
        mockMediaLibraryAlbum({ id: 'a2', title: 'Album 2', assetCount: 3 }),
        mockMediaLibraryAlbum({ id: 'a3', title: 'Album 3', assetCount: 2 }),
      ];
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue(rawAlbums);

      const result = await service.getAlbums(1, 2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a2');
      expect(result[1].id).toBe('a3');
    });

    it('uses "Untitled Album" when title is falsy', async () => {
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue([mockMediaLibraryAlbum({ title: '', assetCount: 0 })]);
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });

      const result = await service.getAlbums(0, 20);
      expect(result[0].title).toBe('Untitled Album');
      expect(result[0].count).toBe(0);
      expect(result[0].thumbnailUri).toBeUndefined();
    });

    it('uses Date.now() when createdTime/modificationTime are missing', async () => {
      const album = mockMediaLibraryAlbum({ id: 'a1' });
      delete (album as any).createdTime; // eslint-disable-line @typescript-eslint/no-explicit-any
      delete (album as any).modificationTime; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue([album]);
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });

      const result = await service.getAlbums(0, 20);
      expect(result[0].createdAt).toBeGreaterThan(0);
      expect(result[0].updatedAt).toBeGreaterThan(0);
    });

    it('caches formatted albums', async () => {
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue([mockMediaLibraryAlbum({ id: 'a1', title: 'Cached', assetCount: 3 })]);
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });

      await service.getAlbums(0, 20);
      const cached = service.__test__().albumsCache.get('a1'); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(cached?.value?.title).toBe('Cached');
    });

    it('rethrows errors from getAlbumsAsync', async () => {
      mockMediaLibrary.getAlbumsAsync.mockRejectedValue(new Error('Media library error'));
      await expect(service.getAlbums(0, 20)).rejects.toThrow('Media library error');
    });
  });

  describe('getPhotosFromAlbum', () => {
    it('fetches and formats photos', async () => {
      const assets = [
        mockMediaLibraryAsset({ id: 'p1', uri: 'file://p1.jpg', width: 800, height: 600, creationTime: 100, modificationTime: 200, fileSize: 1000 }),
        mockMediaLibraryAsset({ id: 'p2', uri: 'file://p2.jpg', width: 1200, height: 800, creationTime: 150, modificationTime: 250, fileSize: 2000 }),
      ];
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({
        assets,
        endCursor: 'cursor-1',
        hasNextPage: true,
        totalCount: assets.length,
      });

      const result = await service.getPhotosFromAlbum('album-1', undefined, 30);
      expect(result.photos).toHaveLength(2);
      expect(result.endCursor).toBe('cursor-1');
      expect(result.hasNextPage).toBe(true);
      expect(result.photos[0]).toMatchObject({
        id: 'p1',
        uri: 'file://p1.jpg',
        filename: 'photo1.jpg',
        width: 800,
        height: 600,
        size: 1000,
        albumId: 'album-1',
        createdAt: 100,
        modifiedAt: 200,
      });
    });

    it('returns cached result when available', async () => {
      mockMediaLibrary.getAssetsAsync.mockResolvedValueOnce({
        assets: [mockMediaLibraryAsset({ id: 'p1' })],
        endCursor: '',
        hasNextPage: false,
        totalCount: 1,
      });

      const first = await service.getPhotosFromAlbum('album-1', undefined, 30);
      const second = await service.getPhotosFromAlbum('album-1', undefined, 30);
      expect(first).toBe(second);
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(1);
    });

    it('includes location data when available', async () => {
      const asset = mockMediaLibraryAsset({
        location: { latitude: 40.7128, longitude: -74.006 },
      });
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({
        assets: [asset],
        endCursor: '',
        hasNextPage: false,
        totalCount: 1,
      });

      const result = await service.getPhotosFromAlbum('album-1', undefined, 30);
      expect(result.photos[0].location).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('includes exif metadata when available', async () => {
      const asset = mockMediaLibraryAsset({ exif: { ISO: 100, fNumber: 2.8 } });
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({
        assets: [asset],
        endCursor: '',
        hasNextPage: false,
        totalCount: 1,
      });

      const result = await service.getPhotosFromAlbum('album-1', undefined, 30);
      expect(result.photos[0].metadata).toEqual({ ISO: 100, fNumber: 2.8 });
    });

    it('uses 0 for size when fileSize is undefined', async () => {
      const asset = { ...mockMediaLibraryAsset({ id: 'p1', uri: 'file://p1.jpg' }), fileSize: undefined as unknown as number };
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({
        assets: [asset],
        endCursor: '',
        hasNextPage: false,
        totalCount: 1,
      });

      const result = await service.getPhotosFromAlbum('album-1', undefined, 30);
      expect(result.photos[0].size).toBe(0);
    });

    it('uses "Unknown" for filename when missing', async () => {
      const asset = { ...mockMediaLibraryAsset({ id: 'p1', uri: 'file://p1.jpg' }), filename: undefined as unknown as string };
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({
        assets: [asset],
        endCursor: '',
        hasNextPage: false,
        totalCount: 1,
      });

      const result = await service.getPhotosFromAlbum('album-1', undefined, 30);
      expect(result.photos[0].filename).toBe('Unknown');
    });

    it('throws on error', async () => {
      mockMediaLibrary.getAssetsAsync.mockRejectedValue(new Error('Fetch failed'));
      await expect(service.getPhotosFromAlbum('album-1', undefined, 30)).rejects.toThrow('Fetch failed');
    });
  });

  describe('getPhotoById', () => {
    it('fetches and formats a single photo', async () => {
      mockMediaLibrary.getAssetInfoAsync.mockResolvedValue(asAssetInfo(mockMediaLibraryAsset({ id: 'p1', uri: 'file://p1.jpg' })));
      const result = await service.getPhotoById('p1');
      expect(result).toMatchObject({ id: 'p1', uri: 'file://p1.jpg' });
    });

    it('returns null when asset is not found', async () => {
      mockMediaLibrary.getAssetInfoAsync.mockResolvedValue(null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await service.getPhotoById('missing');
      expect(result).toBeNull();
    });

    it('includes location and metadata when available', async () => {
      mockMediaLibrary.getAssetInfoAsync.mockResolvedValue(
        asAssetInfo(mockMediaLibraryAsset({ location: { latitude: 1, longitude: 2 }, exif: { foo: 'bar' } }))
      );
      const result = await service.getPhotoById('p1');
      expect(result?.location).toEqual({ latitude: 1, longitude: 2 });
      expect(result?.metadata).toEqual({ foo: 'bar' });
    });

    it('returns null on error', async () => {
      mockMediaLibrary.getAssetInfoAsync.mockRejectedValue(new Error('Info failed'));
      const result = await service.getPhotoById('p1');
      expect(result).toBeNull();
    });
  });

  describe('getPhotosByIds', () => {
    it('returns empty array for empty input', async () => {
      const result = await service.getPhotosByIds([]);
      expect(result).toEqual([]);
    });

    it('fetches multiple photos and filters nulls', async () => {
      mockMediaLibrary.getAssetInfoAsync
        .mockResolvedValueOnce(asAssetInfo(mockMediaLibraryAsset({ id: 'p1' })))
        .mockResolvedValueOnce(null as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .mockResolvedValueOnce(asAssetInfo(mockMediaLibraryAsset({ id: 'p3' })));

      const result = await service.getPhotosByIds(['p1', 'missing', 'p3']);
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(['p1', 'p3']);
    });

    it('returns empty array on error', async () => {
      mockMediaLibrary.getAssetInfoAsync.mockRejectedValue(new Error('Batch failed'));
      const result = await service.getPhotosByIds(['p1']);
      expect(result).toEqual([]);
    });
  });

  describe('getAlbumById', () => {
    it('returns cached album if available', async () => {
      const cached: Album = mockAlbumResult({ id: 'a1', title: 'Cached Album' });
      service.__test__().albumsCache.set('a1', { value: cached, timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await service.getAlbumById('a1');
      expect(result).toBe(cached);
      expect(mockMediaLibrary.getAlbumsAsync).not.toHaveBeenCalled();
    });

    it('fetches album when not cached', async () => {
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue([mockMediaLibraryAlbum({ id: 'a1', title: 'New Album', assetCount: 5 })]);
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({
        assets: [{ ...mockMediaLibraryAsset(), uri: 'file://thumb.jpg' }],
        endCursor: '',
        hasNextPage: false,
        totalCount: 1,
      });

      const result = await service.getAlbumById('a1');
      expect(result).toMatchObject({ id: 'a1', title: 'New Album', count: 5 });
    });

    it('returns null when album is not found', async () => {
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue([]);
      const result = await service.getAlbumById('nonexistent');
      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockMediaLibrary.getAlbumsAsync.mockRejectedValue(new Error('Failed'));
      const result = await service.getAlbumById('a1');
      expect(result).toBeNull();
    });

    it('caches fetched album', async () => {
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue([mockMediaLibraryAlbum({ id: 'a1' })]);
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });

      await service.getAlbumById('a1');
      expect(service.__test__().albumsCache.has('a1')).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });

  describe('deletePhoto', () => {
    it('deletes photo and invalidates only pages containing it', async () => {
      const album = mockAlbumResult({ id: 'a1', count: 5 });
      const otherAlbum = mockAlbumResult({ id: 'a2', count: 7 });
      service.__test__().albumsCache.set('a1', { value: album, timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.__test__().albumsCache.set('a2', { value: otherAlbum, timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.__test__().photosCache.set( // eslint-disable-line @typescript-eslint/no-explicit-any
        'a1||start||30',
        { value: { photos: [makePhoto({ id: 'p1', albumId: 'a1' })], endCursor: '', hasNextPage: true }, timestamp: Date.now() }
      );
      service.__test__().photosCache.set( // eslint-disable-line @typescript-eslint/no-explicit-any
        'a1||next||30',
        { value: { photos: [makePhoto({ id: 'p9', albumId: 'a1' })], endCursor: '', hasNextPage: false }, timestamp: Date.now() }
      );
      service.__test__().photosCache.set( // eslint-disable-line @typescript-eslint/no-explicit-any
        'a2||start||30',
        { value: { photos: [makePhoto({ id: 'p2', albumId: 'a2' })], endCursor: '', hasNextPage: false }, timestamp: Date.now() }
      );

      await service.deletePhoto('p1');
      expect(mockMediaLibrary.deleteAssetsAsync).toHaveBeenCalledWith(['p1']);
      expect(service.__test__().photosCache.has('a1||start||30')).toBe(false);
      expect(service.__test__().photosCache.has('a1||next||30')).toBe(true);
      expect(service.__test__().photosCache.has('a2||start||30')).toBe(true);
      expect(service.__test__().albumsCache.get('a1')?.value?.count).toBe(4);
      expect(service.__test__().albumsCache.get('a2')?.value?.count).toBe(7);
    });

    it('leaves caches untouched when no cached page contains the photo', async () => {
      const album = mockAlbumResult({ id: 'a1', count: 5 });
      service.__test__().albumsCache.set('a1', { value: album, timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.__test__().photosCache.set( // eslint-disable-line @typescript-eslint/no-explicit-any
        'a1||start||30',
        { value: { photos: [makePhoto({ id: 'p9', albumId: 'a1' })], endCursor: '', hasNextPage: true }, timestamp: Date.now() }
      );

      await service.deletePhoto('unknown-id');
      expect(mockMediaLibrary.deleteAssetsAsync).toHaveBeenCalledWith(['unknown-id']);
      expect(service.__test__().albumsCache.get('a1')?.value?.count).toBe(5);
      expect(service.__test__().photosCache.has('a1||start||30')).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('throws on error', async () => {
      mockMediaLibrary.deleteAssetsAsync.mockRejectedValue(new Error('Delete failed'));
      await expect(service.deletePhoto('p1')).rejects.toThrow('Delete failed');
    });

    it('drops affected albums from the thumbnail cache', async () => {
      mockMediaLibrary.deleteAssetsAsync.mockResolvedValue(true);
      const album = mockAlbumResult({ id: 'a1', count: 5 });
      service.__test__().albumsCache.set('a1', { value: album, timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.__test__().photosCache.set( // eslint-disable-line @typescript-eslint/no-explicit-any
        'a1||start||30',
        { value: { photos: [makePhoto({ id: 'p1', albumId: 'a1' })], endCursor: '', hasNextPage: false }, timestamp: Date.now() }
      );
      service.__test__().thumbnailsCache.set('a1', { value: 'file://cover.jpg', timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.__test__().thumbnailsCache.set('a2', { value: 'file://other.jpg', timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any

      await service.deletePhoto('p1');
      expect(service.__test__().thumbnailsCache.has('a1')).toBe(false); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(service.__test__().thumbnailsCache.has('a2')).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });

  describe('in-flight coalescing', () => {
    it('shares a single native request between concurrent callers', async () => {
      let release!: () => void;
      mockMediaLibrary.getAssetsAsync.mockImplementation(
        () => new Promise(resolve => { release = () => resolve({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 }); })
      );

      const first = service.getPhotosFromAlbum('a1', undefined, 30);
      const second = service.getPhotosFromAlbum('a1', undefined, 30);
      release();
      const [firstPage, secondPage] = await Promise.all([first, second]);

      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(1);
      expect(firstPage).toBe(secondPage);
    });

    it('releases the in-flight slot when a request fails so later calls can retry', async () => {
      mockMediaLibrary.getAssetsAsync
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });

      await expect(service.getPhotosFromAlbum('a1', undefined, 30)).rejects.toThrow('boom');
      await expect(service.getPhotosFromAlbum('a1', undefined, 30)).resolves.toEqual({
        photos: [],
        endCursor: '',
        hasNextPage: false,
      });
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(2);
    });

    it('evicts the oldest pages beyond the cache limit', async () => {
      const old = Date.now() - 10_000;
      for (let i = 0; i < 499; i++) {
        service.__test__().photosCache.set(`a_${i}||start||30`, { value: { photos: [], endCursor: '', hasNextPage: false }, timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      // Oldest entry sits mid-map so eviction must find it, not just drop head.
      service.__test__().photosCache.set('a_old||start||30', { value: { photos: [], endCursor: '', hasNextPage: false }, timestamp: old }); // eslint-disable-line @typescript-eslint/no-explicit-any

      mockMediaLibrary.getAssetsAsync.mockResolvedValue({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });
      await service.getPhotosFromAlbum('a_new', undefined, 30);

      const cache = service.__test__().photosCache as Map<string, unknown>; // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(cache.size).toBeLessThanOrEqual(500);
      expect(cache.has('a_old||start||30')).toBe(false);
      expect(cache.has('a_new||start||30')).toBe(true);
    });
  });

  describe('cache expiry', () => {
    it('refetches albums once cached entries pass their TTL', async () => {
      mockMediaLibrary.getAlbumsAsync.mockResolvedValue([mockMediaLibraryAlbum({ id: 'a1' })]);

      await service.getAlbums(0, 20);
      expect(mockMediaLibrary.getAlbumsAsync).toHaveBeenCalledTimes(1);

      // Age every entry past the albums TTL (5 minutes).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [, entry] of service.__test__().albumsCache) {
        entry.timestamp = Date.now() - 6 * 60 * 1000;
      }

      await service.getAlbums(0, 20);
      expect(mockMediaLibrary.getAlbumsAsync).toHaveBeenCalledTimes(2);
    });

    it('refetches photo pages past their TTL instead of serving stale data', async () => {
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });

      await service.getPhotosFromAlbum('a1', undefined, 30);
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(1);

      const page = service.__test__().photosCache.get('a1||start||30'); // eslint-disable-line @typescript-eslint/no-explicit-any
      page!.timestamp = Date.now() - 3 * 60 * 1000;

      await service.getPhotosFromAlbum('a1', undefined, 30);
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(2);
    });

    it('retries transient native failures before giving up', async () => {
      mockMediaLibrary.getAssetsAsync
        .mockRejectedValueOnce(new Error('network unreachable'))
        .mockResolvedValueOnce({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });

      const page = await service.getPhotosFromAlbum('a1', undefined, 30);

      expect(page.photos).toEqual([]);
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAlbumThumbnail', () => {
    it('serves repeat requests from the cache', async () => {
      mockMediaLibrary.getAssetsAsync.mockResolvedValue({
        assets: [{ ...mockMediaLibraryAsset(), uri: 'file://thumb.jpg' }],
        endCursor: '',
        hasNextPage: false,
        totalCount: 1,
      });

      const first = await service.getAlbumThumbnail('a1');
      const second = await service.getAlbumThumbnail('a1');

      expect(first).toBe('file://thumb.jpg');
      expect(second).toBe('file://thumb.jpg');
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(1);
    });

    it('coalesces concurrent requests into one native call', async () => {
      let release!: () => void;
      mockMediaLibrary.getAssetsAsync.mockImplementation(
        () => new Promise(resolve => {
          release = () => resolve({ assets: [{ ...mockMediaLibraryAsset(), uri: 'file://thumb.jpg' }], endCursor: '', hasNextPage: false, totalCount: 1 });
        })
      );

      const first = service.getAlbumThumbnail('a1');
      const second = service.getAlbumThumbnail('a1');
      release();

      expect(await first).toBe(await second);
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(1);
    });

    it('does not cache failures', async () => {
      mockMediaLibrary.getAssetsAsync
        .mockRejectedValueOnce(new Error('thumbnail boom'))
        .mockResolvedValueOnce({
          assets: [{ ...mockMediaLibraryAsset(), uri: 'file://recovered.jpg' }],
          endCursor: '',
          hasNextPage: false,
          totalCount: 1,
        });

      await expect(service.getAlbumThumbnail('a1')).resolves.toBeUndefined();
      await expect(service.getAlbumThumbnail('a1')).resolves.toBe('file://recovered.jpg');
      expect(mockMediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAssetInfo', () => {
    it('delegates to MediaLibrary.getAssetInfoAsync', async () => {
      const assetInfo = { id: 'p1', filename: 'photo.jpg', uri: 'file://p1.jpg', mediaType: 'photo' as MediaLibrary.MediaTypeValue, width: 800, height: 600, creationTime: 1000, modificationTime: 2000, duration: 0 };
      mockMediaLibrary.getAssetInfoAsync.mockResolvedValue(assetInfo);
      const result = await service.getAssetInfo('p1');
      expect(result).toEqual(assetInfo);
      expect(mockMediaLibrary.getAssetInfoAsync).toHaveBeenCalledWith('p1');
    });
  });

  describe('clearCache', () => {
    it('clears all caches', async () => {
      service.__test__().albumsCache.set('a1', { value: mockAlbumResult({ id: 'a1' }), timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.__test__().photosCache.set('k1', { value: { photos: [], endCursor: '', hasNextPage: false }, timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.__test__().thumbnailsCache.set('a1', { value: 'file://thumb.jpg', timestamp: Date.now() }); // eslint-disable-line @typescript-eslint/no-explicit-any

      service.clearCache();
      expect(service.__test__().albumsCache.size).toBe(0); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(service.__test__().photosCache.size).toBe(0); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(service.__test__().thumbnailsCache.size).toBe(0); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });
});

describe('MediaService web platform fallbacks', () => {
  let service: MediaService;
  let originalOS: string;

  const setPlatformOS = (os: string) => {
    (Platform as any).OS = os; // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  beforeAll(() => {
    originalOS = Platform.OS;
  });

  beforeEach(() => {
    setPlatformOS('web');
    jest.clearAllMocks();
    clearServices();
    service = MediaService.getInstance();
    registerService(ServiceTokens.MediaService, service);
    service.clearCache();
  });

  afterAll(() => {
    setPlatformOS(originalOS);
  });

  it('returns empty albums without calling native APIs', async () => {
    const result = await service.getAlbums(0, 20);

    expect(result).toEqual([]);
    expect(mockMediaLibrary.getAlbumsAsync).not.toHaveBeenCalled();
  });

  it('returns an empty photo page without calling native APIs', async () => {
    const result = await service.getPhotosFromAlbum('a1', undefined, 30);

    expect(result).toEqual({ photos: [], endCursor: null, hasNextPage: false });
    expect(mockMediaLibrary.getAssetsAsync).not.toHaveBeenCalled();
  });

  it('returns null album lookups and thumbnails without calling native APIs', async () => {
    await expect(service.getAlbumById('a1')).resolves.toBeNull();
    await expect(service.getAlbumThumbnail('a1')).resolves.toBeUndefined();
    expect(mockMediaLibrary.getAlbumsAsync).not.toHaveBeenCalled();
    expect(mockMediaLibrary.getAssetsAsync).not.toHaveBeenCalled();
  });

  it('reports photo deletion as unsupported without throwing', async () => {
    await expect(service.deletePhoto('p1')).resolves.toBe(false);
    expect(mockMediaLibrary.deleteAssetsAsync).not.toHaveBeenCalled();
  });
});
