import { MediaService } from './media.service';
import { makeMockPerformanceMonitoringService } from '../test-utils/mocks';
import { ServiceTokens, registerService, clearServices } from './di';
import { IPerformanceMonitoringService } from './performance.service';

describe('MediaService performance integration', () => {
  let mediaService: MediaService;
  let perfService: ReturnType<typeof makeMockPerformanceMonitoringService>;

  beforeEach(() => {
    clearServices();
    perfService = makeMockPerformanceMonitoringService();
    registerService(ServiceTokens.PerformanceService, perfService as unknown as IPerformanceMonitoringService);
    mediaService = MediaService.getInstance();
  });

  afterEach(() => {
    mediaService.clearCache();
  });

  it('calls startTimer and stopTimer for getAlbums', async () => {
    const result = await mediaService.getAlbums(0, 20);
    expect(result).toEqual([]);
    expect(perfService.startTimer).toHaveBeenCalledWith('getAlbums', 'api_call', expect.any(Object));
  });

  it('records cache hit rate on cache hit', async () => {
    await mediaService.getAlbums(0, 20);
    expect(perfService.recordCacheHitRate).toHaveBeenCalledWith('albums', expect.any(Number), expect.any(Number));
  });

  it('calls startTimer for getPhotosFromAlbum', async () => {
    const result = await mediaService.getPhotosFromAlbum('album1', undefined, 20);
    expect(result).toEqual({ photos: [], endCursor: null, hasNextPage: false });
    expect(perfService.startTimer).toHaveBeenCalledWith('getPhotosFromAlbum', 'api_call', expect.any(Object));
  });

  it('calls startTimer for getAlbumThumbnail', async () => {
    const result = await mediaService.getAlbumThumbnail('album1');
    expect(result).toBeUndefined();
    expect(perfService.startTimer).toHaveBeenCalledWith('getAlbumThumbnail', 'api_call', expect.any(Object));
  });
});
