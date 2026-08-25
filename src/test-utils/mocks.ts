export interface MockMediaService {
  getAlbums: jest.Mock;
  getPhotosFromAlbum: jest.Mock;
  getAlbumById: jest.Mock;
  getPhotosByIds: jest.Mock;
  getAssetInfo: jest.Mock;
  deletePhoto: jest.Mock;
  clearCache: jest.Mock;
  getAlbumThumbnail: jest.Mock;
}

export const makeMockMediaService = (): MockMediaService => ({
  getAlbums: jest.fn(),
  getPhotosFromAlbum: jest.fn(),
  getAlbumById: jest.fn(),
  getPhotosByIds: jest.fn(),
  getAssetInfo: jest.fn(),
  deletePhoto: jest.fn(),
  clearCache: jest.fn(),
  getAlbumThumbnail: jest.fn(),
});

export interface MockWidgetService {
  getDailyMemory: jest.Mock;
  getRandomPhotos: jest.Mock;
  getAlbumPreview: jest.Mock;
  getFavorites: jest.Mock;
  saveWidgetData: jest.Mock;
  getWidgetData: jest.Mock;
  clearCache: jest.Mock;
}

export const makeMockWidgetService = (): MockWidgetService => ({
  getDailyMemory: jest.fn(),
  getRandomPhotos: jest.fn(),
  getAlbumPreview: jest.fn(),
  getFavorites: jest.fn(),
  saveWidgetData: jest.fn(),
  getWidgetData: jest.fn(),
  clearCache: jest.fn(),
});

export const mockMediaServiceDefaults = (mock: MockMediaService): void => {
  mock.getAlbums.mockResolvedValue([]);
  mock.getPhotosFromAlbum.mockResolvedValue({ photos: [], endCursor: null, hasNextPage: false });
  mock.getAlbumById.mockResolvedValue(null);
  mock.getPhotosByIds.mockResolvedValue([]);
  mock.getAssetInfo.mockResolvedValue(null);
  mock.deletePhoto.mockResolvedValue(true);
  mock.clearCache.mockResolvedValue(undefined);
  mock.getAlbumThumbnail.mockResolvedValue(undefined);
};

export const mockWidgetServiceDefaults = (mock: MockWidgetService): void => {
  mock.getWidgetData.mockResolvedValue(null);
  mock.getDailyMemory.mockResolvedValue({
    type: 'daily_memory',
    photos: [],
    title: 'Daily Memory',
    subtitle: 'No memories today',
    updatedAt: Date.now(),
  });
  mock.getRandomPhotos.mockResolvedValue({
    type: 'random_photo',
    photos: [],
    title: 'Featured Photo',
    subtitle: 'No photos available',
    updatedAt: Date.now(),
  });
  mock.getAlbumPreview.mockResolvedValue({
    type: 'album_preview',
    photos: [],
    title: 'Album Preview',
    subtitle: '0 photos',
    updatedAt: Date.now(),
  });
  mock.getFavorites.mockResolvedValue({
    type: 'favorites',
    photos: [],
    title: 'Favorites',
    subtitle: 'No favorites yet',
    updatedAt: Date.now(),
  });
  mock.saveWidgetData.mockResolvedValue(undefined);
  mock.clearCache.mockResolvedValue(undefined);
};
