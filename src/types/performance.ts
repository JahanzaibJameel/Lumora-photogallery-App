export type MetricCategory =
  | 'app_lifecycle'
  | 'navigation'
  | 'api_call'
  | 'image_load'
  | 'list_render'
  | 'memory'
  | 'cache';

export type MetricUnit = 'ms' | 'bytes' | 'count' | 'fps' | 'percent';

export interface PerformanceMetric {
  id: string;
  name: string;
  category: MetricCategory;
  value: number;
  unit: MetricUnit;
  timestamp: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface NavigationMetric {
  screenName: string;
  durationMs: number;
  timestamp: number;
  coldStart: boolean;
}

export interface ApiCallMetric {
  method: string;
  durationMs: number;
  success: boolean;
  cached: boolean;
  timestamp: number;
  errorCode?: string;
}

export interface ImageLoadMetric {
  uri: string;
  durationMs: number;
  fromCache: boolean;
  timestamp: number;
}

export interface ListRenderMetric {
  listId: string;
  itemCount: number;
  renderDurationMs: number;
  timestamp: number;
}

export interface MemoryMetric {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  timestamp: number;
}

export interface CacheMetric {
  cacheType: 'albums' | 'photos' | 'thumbnails' | 'widgets';
  hitRate: number;
  size: number;
  timestamp: number;
}

export interface PerformanceSession {
  id: string;
  startTime: number;
  endTime?: number;
  metrics: PerformanceMetric[];
}

export interface PerformanceStats {
  avg: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  count: number;
}

export interface AggregatedMetrics {
  period: 'hour' | 'day' | 'week';
  startTime: number;
  endTime: number;
  navigation: Record<string, PerformanceStats>;
  apiCalls: Record<string, PerformanceStats>;
  imageLoads: PerformanceStats;
  listRenders: Record<string, PerformanceStats>;
  memory: PerformanceStats;
  cacheHitRates: Record<string, number>;
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number;
  maxStoredMetrics: number;
  aggregationIntervalMs: number;
  flushIntervalMs: number;
  trackMemory: boolean;
  trackImages: boolean;
  trackApiCalls: boolean;
  trackNavigation: boolean;
  trackListRenders: boolean;
  trackCacheHitRates: boolean;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0,
  maxStoredMetrics: 10000,
  aggregationIntervalMs: 5 * 60 * 1000,
  flushIntervalMs: 30 * 1000,
  trackMemory: true,
  trackImages: true,
  trackApiCalls: true,
  trackNavigation: true,
  trackListRenders: true,
  trackCacheHitRates: true,
};
