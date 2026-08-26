import {
  makeMockMediaService,
  makeMockWidgetService,
  mockMediaServiceDefaults,
  mockWidgetServiceDefaults,
} from './mocks';

describe('mock builders', () => {
  it('exposes every media service method as a jest mock', () => {
    const mock = makeMockMediaService();

    for (const key of [
      'getAlbums',
      'getPhotosFromAlbum',
      'getAlbumById',
      'getPhotosByIds',
      'getAssetInfo',
      'deletePhoto',
      'clearCache',
      'getAlbumThumbnail',
    ] as const) {
      expect(jest.isMockFunction(mock[key])).toBe(true);
    }
  });

  it('exposes every widget service method as a jest mock', () => {
    const mock = makeMockWidgetService();

    for (const key of [
      'getDailyMemory',
      'getRandomPhotos',
      'getAlbumPreview',
      'getFavorites',
      'saveWidgetData',
      'getWidgetData',
      'clearCache',
    ] as const) {
      expect(jest.isMockFunction(mock[key])).toBe(true);
    }
  });

  it('applies safe empty-state defaults to the media service mock', async () => {
    const mock = makeMockMediaService();
    mockMediaServiceDefaults(mock);

    await expect(mock.getAlbums()).resolves.toEqual([]);
    await expect(mock.getPhotosFromAlbum()).resolves.toEqual({
      photos: [],
      endCursor: null,
      hasNextPage: false,
    });
    await expect(mock.getAlbumById()).resolves.toBeNull();
    await expect(mock.getPhotosByIds()).resolves.toEqual([]);
    await expect(mock.getAssetInfo()).resolves.toBeNull();
    await expect(mock.deletePhoto()).resolves.toBe(true);
    await expect(mock.getAlbumThumbnail()).resolves.toBeUndefined();
  });

  it('applies safe empty-state defaults to the widget service mock', async () => {
    const mock = makeMockWidgetService();
    mockWidgetServiceDefaults(mock);

    await expect(mock.getWidgetData()).resolves.toBeNull();
    await expect(mock.getDailyMemory()).resolves.toMatchObject({ type: 'daily_memory' });
    await expect(mock.getRandomPhotos()).resolves.toMatchObject({ type: 'random_photo' });
    await expect(mock.getAlbumPreview()).resolves.toMatchObject({ type: 'album_preview' });
    await expect(mock.getFavorites()).resolves.toMatchObject({ type: 'favorites' });
    await expect(mock.saveWidgetData()).resolves.toBeUndefined();
    await expect(mock.clearCache()).resolves.toBeUndefined();
  });

  it('builds independent instances per call', () => {
    const a = makeMockMediaService();
    const b = makeMockMediaService();

    expect(a.getAlbums).not.toBe(b.getAlbums);
  });
});
