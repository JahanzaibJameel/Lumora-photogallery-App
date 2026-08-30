import { MMKV } from 'react-native-mmkv';
import { ServiceTokens, registerService, resolveService } from './di';
import { PerformanceMonitoringService } from './performance.service';

// Keys only for data that is actually read or written somewhere in the app.
export const StorageKeys = {
  THEMES: 'lumora_themes',
  FAVORITES: 'lumora_favorites',
  WIDGET_PREFIX: 'lumora_widget_',
  WIDGET_CONFIGS: 'lumora_widget_configs',
  SEARCH_HISTORY: 'lumora_search_history',
  REDUCED_MOTION: 'lumora_reduced_motion',
  GRID_SIZE: 'lumora_grid_size',
  PERFORMANCE_CONFIG: 'lumora_performance_config',
  PERFORMANCE_METRICS: 'lumora_performance_metrics',
  PERFORMANCE_AGGREGATED: 'lumora_performance_aggregated',
} as const;

export interface IStorageService {
  save(key: string, value: unknown): void;
  get<T>(key: string): T | null;
  delete(key: string): void;
  clear(): void;
  contains(key: string): boolean;
}

class StorageService implements IStorageService {
  private mmkv: MMKV;

  constructor(id: string = 'lumora-storage') {
    this.mmkv = new MMKV({ id });
  }

  save(key: string, value: unknown): void {
    this.mmkv.set(key, JSON.stringify(value));
  }

  get<T>(key: string): T | null {
    const strValue = this.mmkv.getString(key);
    if (strValue === undefined) return null;
    try {
      return JSON.parse(strValue) as T;
    } catch {
      return null;
    }
  }

  delete(key: string): void {
    this.mmkv.delete(key);
  }

  clear(): void {
    this.mmkv.clearAll();
  }

  contains(key: string): boolean {
    return this.mmkv.contains(key);
  }
}

const storageService = new StorageService();

registerService(ServiceTokens.StorageService, storageService);

let performanceService: PerformanceMonitoringService | null = null;

function getPerformanceService(): PerformanceMonitoringService {
  if (!performanceService) {
    performanceService = PerformanceMonitoringService.getInstance(storageService);
    registerService(ServiceTokens.PerformanceService, performanceService);
  }
  return performanceService;
}

// Eagerly initialize the performance service so it's available for resolveService.
getPerformanceService();

export { storageService };

export const getStorageService = (): IStorageService => resolveService<IStorageService>(ServiceTokens.StorageService);

export const addSearchHistory = (query: string): void => {
  const history = getSearchHistory();
  if (!history.includes(query)) {
    const newHistory = [query, ...history].slice(0, 20);
    getStorageService().save(StorageKeys.SEARCH_HISTORY, newHistory);
  }
};

export const clearSearchHistory = (): void => {
  getStorageService().save(StorageKeys.SEARCH_HISTORY, []);
};

export const getSearchHistory = (): string[] => {
  const history = getStorageService().get<string[]>(StorageKeys.SEARCH_HISTORY);
  return history || [];
};
