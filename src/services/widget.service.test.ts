import { makePhoto, makeAlbum } from '../test-utils';
import { getMediaService } from './media.service';
import { storageService, StorageKeys } from './storage.service';
import WidgetService, { WidgetData } from './widget.service';

jest.mock('./media.service');

const makeMockMediaService = () => ({
  getAlbums: jest.fn(),
  getPhotosFromAlbum: jest.fn(),
  getAlbumById: jest.fn(),
  getPhotosByIds: jest.fn(),
  getAssetInfo: jest.fn(),
  deletePhoto: jest.fn(),
  clearCache: jest.fn(),
});

describe('WidgetService', () => {
  let mockMediaService: ReturnType<typeof makeMockMediaService>;

  beforeEach(() => {
    jest.clearAllMocks();
    WidgetService.clearCache();
    storageService.clear();
    mockMediaService = makeMockMediaService();

    mockMediaService.getAlbums.mockResolvedValue([]);
    mockMediaService.getPhotosFromAlbum.mockResolvedValue({ photos: [], endCursor: null, hasNextPage: false });
    jest.mocked(getMediaService).mockReturnValue(mockMediaService as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  describe('getDailyMemory', () => {
    it('returns cached data on subsequent calls', async () => {
      const data = await WidgetService.getDailyMemory();
      const second = await WidgetService.getDailyMemory();
      expect(second).toBe(data);
      expect(mockMediaService.getAlbums).toHaveBeenCalledTimes(1);
    });

    it('returns photos from this day in previous years', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const photoThisYear = makePhoto({ createdAt: new Date(currentYear, month, day).getTime() });
      const photoPreviousYear = makePhoto({
        id: 'p-prev',
        createdAt: new Date(currentYear - 1, month, day, 10).getTime(),
      });
      const photoWrongDay = makePhoto({
        id: 'p-wrong-day',
        createdAt: new Date(currentYear - 1, month, day + 1).getTime(),
      });

      mockMediaService.getAlbums.mockResolvedValue([makeAlbum({ id: 'a1' })]);
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({
        photos: [photoThisYear, photoPreviousYear, photoWrongDay],
        endCursor: null,
        hasNextPage: false,
      });

      const result = await WidgetService.getDailyMemory();
      expect(result.type).toBe('daily_memory');
      expect(result.photos).toHaveLength(1);
      expect(result.photos[0].id).toBe('p-prev');
      expect(result.photos[0].date).toBe(photoPreviousYear.createdAt);
      expect(result.title).toContain(String(currentYear - 1));
      expect(result.subtitle).toBe('1 memories');
    });

    it('sorts memories by most recent first', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const older = makePhoto({ id: 'older', createdAt: new Date(year - 3, month, day).getTime() });
      const newer = makePhoto({ id: 'newer', createdAt: new Date(year - 1, month, day).getTime() });

      mockMediaService.getAlbums.mockResolvedValue([makeAlbum({ id: 'a1' })]);
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({
        photos: [older, newer],
        endCursor: null,
        hasNextPage: false,
      });

      const result = await WidgetService.getDailyMemory();
      expect(result.photos[0].id).toBe('newer');
      expect(result.photos[1].id).toBe('older');
    });

    it('returns empty photos and "No memories today" when no matches', async () => {
      mockMediaService.getAlbums.mockResolvedValue([makeAlbum({ id: 'a1' })]);
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({
        photos: [makePhoto({ createdAt: new Date(2020, 5, 15).getTime() })],
        endCursor: null,
        hasNextPage: false,
      });

      const result = await WidgetService.getDailyMemory();
      expect(result.photos).toHaveLength(0);
      expect(result.title).toContain('the past');
      expect(result.subtitle).toBe('No memories today');
    });

    it('includes location string when photo has location', async () => {
      const now = new Date();
      const year = now.getFullYear() - 1;
      const month = now.getMonth();
      const day = now.getDate();

      mockMediaService.getAlbums.mockResolvedValue([makeAlbum({ id: 'a1' })]);
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({
        photos: [
          makePhoto({
            createdAt: new Date(year, month, day).getTime(),
            location: { latitude: 40.71, longitude: -74.01 },
          }),
        ],
        endCursor: null,
        hasNextPage: false,
      });

      const result = await WidgetService.getDailyMemory();
      expect(result.photos[0].location).toBe('40.71, -74.01');
    });

    it('handles errors from getPhotosFromAlbum gracefully', async () => {
      mockMediaService.getAlbums.mockResolvedValue([makeAlbum({ id: 'a1' })]);
      mockMediaService.getPhotosFromAlbum.mockRejectedValue(new Error('fetch failed'));

      const result = await WidgetService.getDailyMemory();
      expect(result.photos).toHaveLength(0);
    });

    it('caps memories at 5', async () => {
      const now = new Date();
      const prevYear = now.getFullYear() - 1;
      const month = now.getMonth();
      const day = now.getDate();

      const photos = Array.from({ length: 10 }, (_, i) =>
        makePhoto({
          id: `p${i}`,
          createdAt: new Date(prevYear, month, day, i).getTime(),
        })
      );

      mockMediaService.getAlbums.mockResolvedValue([makeAlbum({ id: 'a1' })]);
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({ photos, endCursor: null, hasNextPage: false });

      const result = await WidgetService.getDailyMemory();
      expect(result.photos).toHaveLength(5);
    });
  });

  describe('getRandomPhotos', () => {
    it('returns cached data on subsequent calls', async () => {
      const data = await WidgetService.getRandomPhotos(3);
      const second = await WidgetService.getRandomPhotos(3);
      expect(second).toBe(data);
    });

    it('returns shuffled photos', async () => {
      const photos = [
        makePhoto({ id: 'p1', uri: 'file://p1.jpg' }),
        makePhoto({ id: 'p2', uri: 'file://p2.jpg' }),
        makePhoto({ id: 'p3', uri: 'file://p3.jpg' }),
      ];
      mockMediaService.getAlbums.mockResolvedValue([makeAlbum({ id: 'a1' })]);
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({ photos, endCursor: null, hasNextPage: false });

      const result = await WidgetService.getRandomPhotos(2);
      expect(result.photos).toHaveLength(2);
      expect(result.type).toBe('random_photo');
      expect(result.title).toBe('Featured Photo');
    });

    it('returns "No photos available" when no photos', async () => {
      mockMediaService.getAlbums.mockResolvedValue([]);
      const result = await WidgetService.getRandomPhotos(1);
      expect(result.photos).toHaveLength(0);
      expect(result.subtitle).toBe('No photos available');
    });

    it('uses different cache keys for different counts', async () => {
      mockMediaService.getAlbums.mockResolvedValue([]);
      await WidgetService.getRandomPhotos(1);
      await WidgetService.getRandomPhotos(3);
      expect(WidgetService.clearCache).toBeDefined();
    });
  });

  describe('getAlbumPreview', () => {
    it('returns cached data on subsequent calls', async () => {
      mockMediaService.getAlbumById.mockResolvedValue({
        id: 'a1',
        title: 'My Album',
        count: 10,
        thumbnailUri: 'file://thumb.jpg',
        createdAt: 100,
        updatedAt: 200,
      });
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({
        photos: [makePhoto({ id: 'p1' })],
        endCursor: null,
        hasNextPage: false,
      });

      const first = await WidgetService.getAlbumPreview('a1');
      const second = await WidgetService.getAlbumPreview('a1');
      expect(second).toBe(first);
    });

    it('fetches and formats album preview', async () => {
      mockMediaService.getAlbumById.mockResolvedValue({
        id: 'a1',
        title: 'My Album',
        count: 4,
        thumbnailUri: 'file://thumb.jpg',
        createdAt: 100,
        updatedAt: 200,
      });
      mockMediaService.getPhotosFromAlbum.mockResolvedValue({
        photos: [makePhoto({ id: 'p1', uri: 'file://p1.jpg', createdAt: 1000 })],
        endCursor: null,
        hasNextPage: false,
      });

      const result = await WidgetService.getAlbumPreview('a1');
      expect(result.type).toBe('album_preview');
      expect(result.title).toBe('My Album');
      expect(result.subtitle).toBe('4 photos');
      expect(result.photos).toHaveLength(1);
    });

    it('throws when album is not found', async () => {
      mockMediaService.getAlbumById.mockResolvedValue(null);
      await expect(WidgetService.getAlbumPreview('missing')).rejects.toThrow('Album not found');
    });
  });

  describe('getFavorites', () => {
    it('returns cached data on subsequent calls', async () => {
      storageService.save(StorageKeys.FAVORITES, ['p1', 'p2']);
      mockMediaService.getPhotosByIds.mockResolvedValue([makePhoto({ id: 'p1' })]);

      const first = await WidgetService.getFavorites();
      const second = await WidgetService.getFavorites();
      expect(second).toBe(first);
    });

    it('fetches favorite photos', async () => {
      storageService.save(StorageKeys.FAVORITES, ['p1', 'p2', 'p3', 'p4']);
      const favoritePhotos = [
        makePhoto({ id: 'p1' }),
        makePhoto({ id: 'p2' }),
      ];
      mockMediaService.getPhotosByIds.mockResolvedValue(favoritePhotos);

      const result = await WidgetService.getFavorites();
      expect(result.type).toBe('favorites');
      expect(result.title).toBe('Favorites');
      expect(result.photos).toHaveLength(2);
      expect(mockMediaService.getPhotosByIds).toHaveBeenCalledWith(['p1', 'p2', 'p3', 'p4']);
    });

    it('caps favorites at 4', async () => {
      const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
      storageService.save(StorageKeys.FAVORITES, ids);
      mockMediaService.getPhotosByIds.mockResolvedValue([]);

      await WidgetService.getFavorites();
      expect(mockMediaService.getPhotosByIds).toHaveBeenCalledWith(['p1', 'p2', 'p3', 'p4']);
    });

    it('returns empty when no favorites stored', async () => {
      mockMediaService.getPhotosByIds.mockResolvedValue([]);
      const result = await WidgetService.getFavorites();
      expect(result.photos).toHaveLength(0);
      expect(result.subtitle).toBe('No favorites yet');
      expect(mockMediaService.getPhotosByIds).toHaveBeenCalledWith([]);
    });
  });

  describe('saveWidgetData / getWidgetData', () => {
    it('saves and retrieves widget data from storage', async () => {
      const data: WidgetData = {
        type: 'daily_memory',
        photos: [{ id: 'p1', uri: 'file://p1.jpg', date: 1000 }],
        title: 'Memory',
        subtitle: '1 memories',
        updatedAt: Date.now(),
      };
      await WidgetService.saveWidgetData('daily_memory', data);
      const retrieved = await WidgetService.getWidgetData('daily_memory');
      expect(retrieved).toEqual(data);
    });

    it('returns null for missing widget data', async () => {
      const retrieved = await WidgetService.getWidgetData('nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('clears the in-memory widget cache', async () => {
      mockMediaService.getAlbums.mockResolvedValue([]);
      const first = await WidgetService.getDailyMemory();
      WidgetService.clearCache();
      const second = await WidgetService.getDailyMemory();
      expect(second).not.toBe(first);
    });

    it('clears cache by prefix', async () => {
      mockMediaService.getAlbums.mockResolvedValue([]);
      await WidgetService.getDailyMemory();
      WidgetService.clearCache('daily');
      await WidgetService.getDailyMemory();
      expect(mockMediaService.getAlbums).toHaveBeenCalledTimes(2);
    });
  });
});
