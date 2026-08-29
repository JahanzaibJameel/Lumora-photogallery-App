import { Platform } from 'react-native';
import {
  PerformanceMetric,
  PerformanceConfig,
  PerformanceStats,
  AggregatedMetrics,
  NavigationMetric,
  ApiCallMetric,
  ImageLoadMetric,
  ListRenderMetric,
  MemoryMetric,
  CacheMetric,
  MetricCategory,
} from '../types/performance';
import { DEFAULT_PERFORMANCE_CONFIG } from '../types/performance';
import { IStorageService } from './storage.service';

const STORAGE_KEY_PERFORMANCE_CONFIG = 'lumora_performance_config';
const STORAGE_KEY_PERFORMANCE_METRICS = 'lumora_performance_metrics';
const STORAGE_KEY_PERFORMANCE_AGGREGATED = 'lumora_performance_aggregated';

interface ActiveTimer {
  name: string;
  category: MetricCategory;
  startTime: number;
  metadata?: Record<string, string | number | boolean>;
}

interface PendingAggregation {
  navigation: NavigationMetric[];
  apiCalls: ApiCallMetric[];
  imageLoads: ImageLoadMetric[];
  listRenders: ListRenderMetric[];
  memory: MemoryMetric[];
  cache: CacheMetric[];
}

export interface IPerformanceMonitoringService {
  initialize(): Promise<void>;
  getConfig(): PerformanceConfig;
  updateConfig(partial: Partial<PerformanceConfig>): void;
  startTimer(
    name: string,
    category: MetricCategory,
    metadata?: Record<string, string | number | boolean>
  ): string;
  stopTimer(timerId: string): number | null;
  recordMetric(
    name: string,
    category: MetricCategory,
    value: number,
    unit: PerformanceMetric['unit'],
    metadata?: Record<string, string | number | boolean>
  ): void;
  recordNavigation(metric: Omit<NavigationMetric, 'timestamp'>): void;
  recordApiCall(metric: Omit<ApiCallMetric, 'timestamp'>): void;
  recordImageLoad(metric: Omit<ImageLoadMetric, 'timestamp'>): void;
  recordListRender(metric: Omit<ListRenderMetric, 'timestamp'>): void;
  recordMemory(metric: Omit<MemoryMetric, 'timestamp'>): void;
  recordCacheHitRate(
    cacheType: CacheMetric['cacheType'],
    hits: number,
    misses: number
  ): void;
  getStats(
    category: MetricCategory,
    name: string,
    timeRangeMs?: number
  ): PerformanceStats | null;
  getAggregatedMetrics(period: AggregatedMetrics['period']): AggregatedMetrics | null;
  getRecentMetrics(
    category?: MetricCategory,
    limit?: number
  ): PerformanceMetric[];
  flushToStorage(): Promise<void>;
  clearMetrics(): Promise<void>;
  startSession(): string;
  endSession(sessionId: string): void;
  getMemorySnapshot(): MemoryMetric | null;
}

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class PerformanceMonitoringService implements IPerformanceMonitoringService {
  private static instance: PerformanceMonitoringService | null = null;

  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, ActiveTimer> = new Map();
  private pendingAggregation: PendingAggregation = {
    navigation: [],
    apiCalls: [],
    imageLoads: [],
    listRenders: [],
    memory: [],
    cache: [],
  };
  private sessions: Map<string, { startTime: number; endTime?: number }> = new Map();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private aggregationTimer: ReturnType<typeof setInterval> | null = null;
  private memoryTimer: ReturnType<typeof setInterval> | null = null;
  private cacheStats: Map<string, { hits: number; misses: number }> = new Map();
  private isInitialized = false;

  private constructor(private storage: IStorageService) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG };
  }

  static getInstance(storage?: IStorageService): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      if (!storage) {
        throw new Error('PerformanceMonitoringService requires IStorageService on first initialization');
      }
      PerformanceMonitoringService.instance = new PerformanceMonitoringService(storage);
    }
    return PerformanceMonitoringService.instance;
  }

  static resetInstance(): void {
    PerformanceMonitoringService.instance = null;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const savedConfig = this.storage.get<Partial<PerformanceConfig>>(STORAGE_KEY_PERFORMANCE_CONFIG);
    if (savedConfig) {
      this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...savedConfig };
    }

    if (this.config.enabled) {
      this.startBackgroundTasks();
    }

    this.isInitialized = true;
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<PerformanceConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...partial };
    this.storage.save(STORAGE_KEY_PERFORMANCE_CONFIG, this.config);

    if (!wasEnabled && this.config.enabled) {
      this.startBackgroundTasks();
    } else if (wasEnabled && !this.config.enabled) {
      this.stopBackgroundTasks();
    }
  }

  startTimer(
    name: string,
    category: MetricCategory,
    metadata?: Record<string, string | number | boolean>
  ): string {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return '';
    }

    const id = generateId();
    this.activeTimers.set(id, {
      name,
      category,
      startTime: this.now(),
      metadata,
    });
    return id;
  }

  stopTimer(timerId: string): number | null {
    if (!timerId) return null;

    const timer = this.activeTimers.get(timerId);
    if (!timer) return null;

    const duration = this.now() - timer.startTime;
    this.activeTimers.delete(timerId);

    this.recordMetric(timer.name, timer.category, duration, 'ms', timer.metadata);
    return duration;
  }

  recordMetric(
    name: string,
    category: MetricCategory,
    value: number,
    unit: PerformanceMetric['unit'],
    metadata?: Record<string, string | number | boolean>
  ): void {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return;
    }

    const metric: PerformanceMetric = {
      id: generateId(),
      name,
      category,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.enforceMaxMetrics();
  }

  recordNavigation(metric: Omit<NavigationMetric, 'timestamp'>): void {
    if (!this.config.enabled || !this.config.trackNavigation) return;

    this.pendingAggregation.navigation.push({
      ...metric,
      timestamp: Date.now(),
    });
  }

  recordApiCall(metric: Omit<ApiCallMetric, 'timestamp'>): void {
    if (!this.config.enabled || !this.config.trackApiCalls) return;

    this.pendingAggregation.apiCalls.push({
      ...metric,
      timestamp: Date.now(),
    });

    this.recordMetric(
      `api_${metric.method}`,
      'api_call',
      metric.durationMs,
      'ms',
      {
        success: metric.success,
        cached: metric.cached,
        ...(metric.errorCode ? { errorCode: metric.errorCode } : {}),
      }
    );
  }

  recordImageLoad(metric: Omit<ImageLoadMetric, 'timestamp'>): void {
    if (!this.config.enabled || !this.config.trackImages) return;

    this.pendingAggregation.imageLoads.push({
      ...metric,
      timestamp: Date.now(),
    });
  }

  recordListRender(metric: Omit<ListRenderMetric, 'timestamp'>): void {
    if (!this.config.enabled || !this.config.trackListRenders) return;

    this.pendingAggregation.listRenders.push({
      ...metric,
      timestamp: Date.now(),
    });
  }

  recordMemory(metric: Omit<MemoryMetric, 'timestamp'>): void {
    if (!this.config.enabled || !this.config.trackMemory) return;

    this.pendingAggregation.memory.push({
      ...metric,
      timestamp: Date.now(),
    });
  }

  recordCacheHitRate(
    cacheType: CacheMetric['cacheType'],
    hits: number,
    misses: number
  ): void {
    if (!this.config.enabled || !this.config.trackCacheHitRates) return;

    const existing = this.cacheStats.get(cacheType) || { hits: 0, misses: 0 };
    this.cacheStats.set(cacheType, {
      hits: existing.hits + hits,
      misses: existing.misses + misses,
    });
  }

  getStats(
    category: MetricCategory,
    name: string,
    timeRangeMs: number = 24 * 60 * 60 * 1000
  ): PerformanceStats | null {
    const cutoff = Date.now() - timeRangeMs;
    const values = this.metrics
      .filter(
        (m) => m.category === category && m.name === name && m.timestamp >= cutoff
      )
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    return this.computeStats(values);
  }

  getAggregatedMetrics(period: AggregatedMetrics['period']): AggregatedMetrics | null {
    return this.storage.get<AggregatedMetrics>(
      `${STORAGE_KEY_PERFORMANCE_AGGREGATED}_${period}`
    ) || null;
  }

  getRecentMetrics(
    category?: MetricCategory,
    limit: number = 100
  ): PerformanceMetric[] {
    let filtered = category
      ? this.metrics.filter((m) => m.category === category)
      : this.metrics;

    return filtered.slice(-limit).reverse();
  }

  async flushToStorage(): Promise<void> {
    if (this.metrics.length === 0) return;

    const existingMetrics = this.storage.get<PerformanceMetric[]>(
      STORAGE_KEY_PERFORMANCE_METRICS
    ) || [];

    const combined = [...existingMetrics, ...this.metrics];
    const trimmed = combined.slice(-this.config.maxStoredMetrics);

    this.storage.save(STORAGE_KEY_PERFORMANCE_METRICS, trimmed);
    this.metrics = [];
  }

  async clearMetrics(): Promise<void> {
    this.metrics = [];
    this.pendingAggregation = {
      navigation: [],
      apiCalls: [],
      imageLoads: [],
      listRenders: [],
      memory: [],
      cache: [],
    };
    this.cacheStats.clear();
    this.storage.delete(STORAGE_KEY_PERFORMANCE_METRICS);
    this.storage.delete(`${STORAGE_KEY_PERFORMANCE_AGGREGATED}_hour`);
    this.storage.delete(`${STORAGE_KEY_PERFORMANCE_AGGREGATED}_day`);
    this.storage.delete(`${STORAGE_KEY_PERFORMANCE_AGGREGATED}_week`);
  }

  startSession(): string {
    const id = generateId();
    this.sessions.set(id, { startTime: Date.now() });
    return id;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = Date.now();
    }
  }

  getMemorySnapshot(): MemoryMetric | null {
    if (Platform.OS === 'web') {
      const perf = performance as unknown as {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
        };
      };
      if (perf.memory) {
        return {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          timestamp: Date.now(),
        };
      }
      return null;
    }

    return null;
  }

  private startBackgroundTasks(): void {
    this.stopBackgroundTasks();

    if (this.config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        this.flushToStorage();
      }, this.config.flushIntervalMs);
    }

    if (this.config.aggregationIntervalMs > 0) {
      this.aggregationTimer = setInterval(() => {
        this.runAggregation();
      }, this.config.aggregationIntervalMs);
    }

    if (this.config.trackMemory) {
      this.memoryTimer = setInterval(() => {
        const snapshot = this.getMemorySnapshot();
        if (snapshot) {
          this.recordMemory(snapshot);
        }
      }, 60 * 1000);
    }
  }

  private stopBackgroundTasks(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
  }

  private runAggregation(): void {
    const now = Date.now();
    const periodStart = now - this.config.aggregationIntervalMs;

    const navigation: Record<string, number[]> = {};
    for (const m of this.pendingAggregation.navigation) {
      if (m.timestamp >= periodStart) {
        if (!navigation[m.screenName]) navigation[m.screenName] = [];
        navigation[m.screenName].push(m.durationMs);
      }
    }

    const apiCalls: Record<string, number[]> = {};
    for (const m of this.pendingAggregation.apiCalls) {
      if (m.timestamp >= periodStart) {
        if (!apiCalls[m.method]) apiCalls[m.method] = [];
        apiCalls[m.method].push(m.durationMs);
      }
    }

    const imageLoadValues = this.pendingAggregation.imageLoads
      .filter((m) => m.timestamp >= periodStart)
      .map((m) => m.durationMs);

    const listRenders: Record<string, number[]> = {};
    for (const m of this.pendingAggregation.listRenders) {
      if (m.timestamp >= periodStart) {
        if (!listRenders[m.listId]) listRenders[m.listId] = [];
        listRenders[m.listId].push(m.renderDurationMs);
      }
    }

    const memoryValues = this.pendingAggregation.memory
      .filter((m) => m.timestamp >= periodStart)
      .map((m) => m.usedJSHeapSize);

    const cacheHitRates: Record<string, number> = {};
    for (const [cacheType, stats] of this.cacheStats.entries()) {
      const total = stats.hits + stats.misses;
      cacheHitRates[cacheType] = total > 0 ? stats.hits / total : 0;
    }

    const emptyStats: PerformanceStats = { avg: 0, min: 0, max: 0, p50: 0, p90: 0, p95: 0, p99: 0, count: 0 };

    const aggregated: AggregatedMetrics = {
      period: 'hour',
      startTime: periodStart,
      endTime: now,
      navigation: {},
      apiCalls: {},
      imageLoads: imageLoadValues.length > 0 ? this.computeStats(imageLoadValues) || emptyStats : emptyStats,
      listRenders: {},
      memory: memoryValues.length > 0 ? this.computeStats(memoryValues) || emptyStats : emptyStats,
      cacheHitRates,
    };

    for (const [name, values] of Object.entries(navigation)) {
      const stats = this.computeStats(values);
      if (stats) aggregated.navigation[name] = stats;
    }
    for (const [name, values] of Object.entries(apiCalls)) {
      const stats = this.computeStats(values);
      if (stats) aggregated.apiCalls[name] = stats;
    }
    for (const [name, values] of Object.entries(listRenders)) {
      const stats = this.computeStats(values);
      if (stats) aggregated.listRenders[name] = stats;
    }

    this.storage.save(`${STORAGE_KEY_PERFORMANCE_AGGREGATED}_hour`, aggregated);

    this.pendingAggregation = {
      navigation: [],
      apiCalls: [],
      imageLoads: [],
      listRenders: [],
      memory: [],
      cache: [],
    };
  }

  private computeStats(sortedValues: number[]): PerformanceStats | null {
    if (sortedValues.length === 0) return null;

    const sorted = [...sortedValues].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p50: this.percentile(sorted, 0.5),
      p90: this.percentile(sorted, 0.9),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
      count,
    };
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private enforceMaxMetrics(): void {
    if (this.metrics.length > this.config.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxStoredMetrics);
    }
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  destroy(): void {
    this.stopBackgroundTasks();
    this.activeTimers.clear();
    this.sessions.clear();
  }
}
