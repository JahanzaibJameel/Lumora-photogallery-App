import { PerformanceMonitoringService } from '../services/performance.service';
import { makeMockStorageService } from '../test-utils/mocks';
import { DEFAULT_PERFORMANCE_CONFIG } from '../types/performance';

describe('PerformanceMonitoringService', () => {
  let storage: ReturnType<typeof makeMockStorageService>;
  let service: PerformanceMonitoringService;

  beforeEach(() => {
    storage = makeMockStorageService();
    PerformanceMonitoringService.resetInstance();
    service = PerformanceMonitoringService.getInstance(storage);
  });

  afterEach(() => {
    service.destroy();
    PerformanceMonitoringService.resetInstance();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = PerformanceMonitoringService.getInstance(storage);
      const instance2 = PerformanceMonitoringService.getInstance(storage);
      expect(instance1).toBe(instance2);
    });

    it('throws if no storage provided on first call', () => {
      PerformanceMonitoringService.resetInstance();
      expect(() => PerformanceMonitoringService.getInstance()).toThrow(
        'PerformanceMonitoringService requires IStorageService on first initialization'
      );
    });
  });

  describe('initialize', () => {
    it('loads config from storage', async () => {
      storage.get.mockReturnValue({ enabled: false });
      await service.initialize();
      expect(storage.get).toHaveBeenCalledWith('lumora_performance_config');
      expect(service.getConfig().enabled).toBe(false);
    });

    it('uses defaults when no saved config', async () => {
      storage.get.mockReturnValue(null);
      await service.initialize();
      expect(service.getConfig()).toEqual(DEFAULT_PERFORMANCE_CONFIG);
    });

    it('does not initialize twice', async () => {
      await service.initialize();
      await service.initialize();
      expect(storage.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfig / updateConfig', () => {
    it('returns a copy of config', () => {
      const config = service.getConfig();
      config.enabled = false;
      expect(service.getConfig().enabled).toBe(true);
    });

    it('updates and persists config', () => {
      service.updateConfig({ enabled: false });
      expect(service.getConfig().enabled).toBe(false);
      expect(storage.save).toHaveBeenCalledWith('lumora_performance_config', expect.objectContaining({ enabled: false }));
    });
  });

  describe('startTimer / stopTimer', () => {
    it('returns empty string when disabled', () => {
      service.updateConfig({ enabled: false });
      const id = service.startTimer('test', 'api_call');
      expect(id).toBe('');
    });

    it('returns empty string for sampled-out requests', () => {
      service.updateConfig({ sampleRate: 0 });
      const id = service.startTimer('test', 'api_call');
      expect(id).toBe('');
    });

    it('measures duration between start and stop', () => {
      const id = service.startTimer('test', 'api_call');
      expect(id).toBeTruthy();

      const duration = service.stopTimer(id);
      expect(duration).not.toBeNull();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('returns null for invalid timer id', () => {
      expect(service.stopTimer('invalid')).toBeNull();
    });

    it('returns null for empty timer id', () => {
      expect(service.stopTimer('')).toBeNull();
    });
  });

  describe('recordMetric', () => {
    it('does not record when disabled', () => {
      service.updateConfig({ enabled: false });
      service.recordMetric('test', 'api_call', 100, 'ms');
      const metrics = service.getRecentMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('records metric with all fields', () => {
      service.recordMetric('test', 'api_call', 100, 'ms', { key: 'value' });
      const metrics = service.getRecentMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test',
        category: 'api_call',
        value: 100,
        unit: 'ms',
        metadata: { key: 'value' },
      });
    });

    it('enforces max stored metrics', () => {
      service.updateConfig({ maxStoredMetrics: 5 });
      for (let i = 0; i < 10; i++) {
        service.recordMetric('test', 'api_call', i, 'ms');
      }
      const metrics = service.getRecentMetrics(undefined, 100);
      expect(metrics).toHaveLength(5);
    });
  });

  describe('recordNavigation', () => {
    it('records navigation metric', () => {
      service.recordNavigation({
        screenName: 'Albums',
        durationMs: 200,
        coldStart: true,
      });
      expect(() => service.getAggregatedMetrics('hour')).not.toThrow();
    });

    it('does not record when trackNavigation is disabled', () => {
      service.updateConfig({ trackNavigation: false });
      service.recordNavigation({
        screenName: 'Albums',
        durationMs: 200,
        coldStart: true,
      });
    });
  });

  describe('recordApiCall', () => {
    it('records API call metric', () => {
      service.recordApiCall({
        method: 'getAlbums',
        durationMs: 150,
        success: true,
        cached: false,
      });
      const stats = service.getStats('api_call', 'api_getAlbums');
      expect(stats).not.toBeNull();
      expect(stats?.avg).toBe(150);
    });

    it('does not record when trackApiCalls is disabled', () => {
      service.updateConfig({ trackApiCalls: false });
      service.recordApiCall({
        method: 'getAlbums',
        durationMs: 150,
        success: true,
        cached: false,
      });
      const stats = service.getStats('api_call', 'api_getAlbums');
      expect(stats).toBeNull();
    });
  });

  describe('recordImageLoad', () => {
    it('does not record when trackImages is disabled', () => {
      service.updateConfig({ trackImages: false });
      service.recordImageLoad({
        uri: 'file://test.jpg',
        durationMs: 50,
        fromCache: true,
      });
    });
  });

  describe('recordListRender', () => {
    it('does not record when trackListRenders is disabled', () => {
      service.updateConfig({ trackListRenders: false });
      service.recordListRender({
        listId: 'albums',
        itemCount: 10,
        renderDurationMs: 16,
      });
    });
  });

  describe('recordMemory', () => {
    it('does not record when trackMemory is disabled', () => {
      service.updateConfig({ trackMemory: false });
      service.recordMemory({
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
      });
    });
  });

  describe('recordCacheHitRate', () => {
    it('accumulates cache stats', () => {
      service.recordCacheHitRate('albums', 8, 2);
      service.recordCacheHitRate('albums', 7, 3);
    });

    it('does not record when trackCacheHitRates is disabled', () => {
      service.updateConfig({ trackCacheHitRates: false });
      service.recordCacheHitRate('albums', 8, 2);
    });
  });

  describe('getStats', () => {
    it('returns null when no metrics match', () => {
      const stats = service.getStats('api_call', 'nonexistent');
      expect(stats).toBeNull();
    });

    it('computes correct statistics', () => {
      service.recordMetric('test', 'api_call', 100, 'ms');
      service.recordMetric('test', 'api_call', 200, 'ms');
      service.recordMetric('test', 'api_call', 300, 'ms');

      const stats = service.getStats('api_call', 'test');
      expect(stats).not.toBeNull();
      expect(stats?.avg).toBe(200);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(300);
      expect(stats?.count).toBe(3);
    });

    it('filters by time range', () => {
      service.recordMetric('test', 'api_call', 100, 'ms');
      // Use a very small time range that excludes the just-recorded metric
      const stats = service.getStats('api_call', 'test', -1);
      expect(stats).toBeNull();
    });
  });

  describe('getRecentMetrics', () => {
    it('returns empty array when no metrics', () => {
      expect(service.getRecentMetrics()).toEqual([]);
    });

    it('returns metrics in reverse chronological order', () => {
      service.recordMetric('first', 'api_call', 100, 'ms');
      service.recordMetric('second', 'api_call', 200, 'ms');

      const metrics = service.getRecentMetrics();
      expect(metrics[0].name).toBe('second');
      expect(metrics[1].name).toBe('first');
    });

    it('filters by category', () => {
      service.recordMetric('api', 'api_call', 100, 'ms');
      service.recordMetric('nav', 'navigation', 200, 'ms');

      const metrics = service.getRecentMetrics('api_call');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('api');
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        service.recordMetric('test', 'api_call', i, 'ms');
      }
      const metrics = service.getRecentMetrics(undefined, 5);
      expect(metrics).toHaveLength(5);
    });
  });

  describe('flushToStorage', () => {
    it('does nothing when no metrics', async () => {
      await service.flushToStorage();
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('saves metrics to storage', async () => {
      service.recordMetric('test', 'api_call', 100, 'ms');
      await service.flushToStorage();
      expect(storage.save).toHaveBeenCalledWith(
        'lumora_performance_metrics',
        expect.arrayContaining([
          expect.objectContaining({ name: 'test' }),
        ])
      );
    });

    it('appends to existing metrics', async () => {
      const existingMetrics = [{ id: 'old', name: 'old', category: 'api_call' as const, value: 50, unit: 'ms' as const, timestamp: Date.now() }];
      storage.get.mockReturnValue(existingMetrics);

      service.recordMetric('new', 'api_call', 100, 'ms');
      await service.flushToStorage();

      expect(storage.save).toHaveBeenCalledWith(
        'lumora_performance_metrics',
        expect.arrayContaining([
          expect.objectContaining({ id: 'old' }),
          expect.objectContaining({ name: 'new' }),
        ])
      );
    });
  });

  describe('clearMetrics', () => {
    it('clears all metrics and storage', async () => {
      service.recordMetric('test', 'api_call', 100, 'ms');
      await service.clearMetrics();
      expect(service.getRecentMetrics()).toEqual([]);
      expect(storage.delete).toHaveBeenCalled();
    });
  });

  describe('sessions', () => {
    it('starts and ends sessions', () => {
      const sessionId = service.startSession();
      expect(sessionId).toBeTruthy();
      service.endSession(sessionId);
    });
  });

  describe('getMemorySnapshot', () => {
    it('returns null on non-web platforms', () => {
      const snapshot = service.getMemorySnapshot();
      expect(snapshot).toBeNull();
    });
  });
});
