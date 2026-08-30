export interface MockMediaService {
  getAlbums: jest.Mock;
  getPhotosFromAlbum: jest.Mock;
  getAlbumById: jest.Mock;
  getPhotosByIds: jest.Mock;
  getAssetInfo: jest.Mock;
  deletePhoto: jest.Mock;
  clearCache: jest.Mock;
  invalidateAlbum: jest.Mock;
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
  invalidateAlbum: jest.fn(),
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

export interface MockStorageService {
  save: jest.Mock;
  get: jest.Mock;
  delete: jest.Mock;
  clear: jest.Mock;
  contains: jest.Mock;
}

export const makeMockStorageService = (): MockStorageService => ({
  save: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  contains: jest.fn(),
});

export interface MockPerformanceMonitoringService {
  initialize: jest.Mock;
  getConfig: jest.Mock;
  updateConfig: jest.Mock;
  startTimer: jest.Mock;
  stopTimer: jest.Mock;
  recordMetric: jest.Mock;
  recordNavigation: jest.Mock;
  recordApiCall: jest.Mock;
  recordImageLoad: jest.Mock;
  recordListRender: jest.Mock;
  recordMemory: jest.Mock;
  recordCacheHitRate: jest.Mock;
  getStats: jest.Mock;
  getAggregatedMetrics: jest.Mock;
  getRecentMetrics: jest.Mock;
  flushToStorage: jest.Mock;
  clearMetrics: jest.Mock;
  startSession: jest.Mock;
  endSession: jest.Mock;
  getMemorySnapshot: jest.Mock;
  destroy: jest.Mock;
}

export const makeMockPerformanceMonitoringService = (): MockPerformanceMonitoringService => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  getConfig: jest.fn().mockReturnValue({
    enabled: true,
    sampleRate: 1.0,
    maxStoredMetrics: 10000,
    aggregationIntervalMs: 300000,
    flushIntervalMs: 30000,
    trackMemory: true,
    trackImages: true,
    trackApiCalls: true,
    trackNavigation: true,
    trackListRenders: true,
    trackCacheHitRates: true,
  }),
  updateConfig: jest.fn(),
  startTimer: jest.fn().mockReturnValue('timer-id'),
  stopTimer: jest.fn().mockReturnValue(100),
  recordMetric: jest.fn(),
  recordNavigation: jest.fn(),
  recordApiCall: jest.fn(),
  recordImageLoad: jest.fn(),
  recordListRender: jest.fn(),
  recordMemory: jest.fn(),
  recordCacheHitRate: jest.fn(),
  getStats: jest.fn().mockReturnValue(null),
  getAggregatedMetrics: jest.fn().mockReturnValue(null),
  getRecentMetrics: jest.fn().mockReturnValue([]),
  flushToStorage: jest.fn().mockResolvedValue(undefined),
  clearMetrics: jest.fn().mockResolvedValue(undefined),
  startSession: jest.fn().mockReturnValue('session-id'),
  endSession: jest.fn(),
  getMemorySnapshot: jest.fn().mockReturnValue(null),
  destroy: jest.fn(),
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

export const mockStorageServiceDefaults = (mock: MockStorageService): void => {
  mock.get.mockReturnValue(null);
  mock.contains.mockReturnValue(false);
  mock.clear.mockImplementation(() => {});
  mock.save.mockImplementation(() => {});
  mock.delete.mockImplementation(() => {});
};
