import { MMKV } from 'react-native-mmkv';

export const StorageKeys = {
  ALBUMS: 'lumora_albums',
  PHOTOS: 'lumora_photos',
  SETTINGS: 'lumora_settings',
  THEMES: 'lumora_themes',
  CACHE: 'lumora_cache',
  BIOMETRIC_CONFIG: 'lumora_biometric_config',
  SCREENSHOT_CONFIG: 'lumora_screenshot_config',
  FAVORITES: 'lumora_favorites',
  WIDGET_PREFIX: 'lumora_widget_',
  SEARCH_HISTORY: 'lumora_search_history',
  REDUCED_MOTION: 'lumora_reduced_motion',
} as const;

interface IStorageService {
  init(): Promise<void>;
  save(key: string, value: unknown): Promise<void>;
  set(key: string, value: unknown): Promise<void>;
  get<T>(key: string): T | null;
  getString(key: string): string | null;
  getNumber(key: string): number | null;
  getBoolean(key: string): boolean | null;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class StorageService implements IStorageService {
  private mmkv: MMKV;

  constructor(id: string = 'lumora-storage') {
    this.mmkv = new MMKV({ id });
  }

  async init(): Promise<void> {
    // MMKV initialization is handled on instance creation
  }

  async save(key: string, value: unknown): Promise<void> {
    const strValue = JSON.stringify(value);
    this.mmkv.set(key, strValue);
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.save(key, value);
  }

  get<T>(key: string): T | null {
    const strValue = this.mmkv.getString(key);
    if (strValue === undefined || strValue === null) return null;
    try {
      return JSON.parse(strValue) as T;
    } catch {
      return null;
    }
  }

  getString(key: string): string | null {
    const value = this.mmkv.getString(key);
    if (value === undefined || value === null) return null;
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string') return parsed;
    } catch {
      // not JSON, return raw string
    }
    return value;
  }

  getNumber(key: string): number | null {
    const value = this.mmkv.getNumber(key);
    return value ?? null;
  }

  getBoolean(key: string): boolean | null {
    const value = this.mmkv.getBoolean(key);
    return value ?? null;
  }

  async delete(key: string): Promise<void> {
    this.mmkv.delete(key);
  }

  async clear(): Promise<void> {
    this.mmkv.clearAll();
  }

  contains(key: string): boolean {
    return this.mmkv.contains(key);
  }
}

export const storageService = new StorageService();

export const cacheThumbnails = async (albumId: string, thumbnailUris: string[]): Promise<void> => {
  const key = `${StorageKeys.CACHE}_thumbnails_${albumId}`;
  await storageService.save(key, thumbnailUris);
};

export const loadCachedThumbnails = (albumId: string): string[] | null => {
  const key = `${StorageKeys.CACHE}_thumbnails_${albumId}`;
  const cached = storageService.get<unknown>(key);
  if (!Array.isArray(cached)) return null;
  const thumbnails = cached.filter(
    (item): item is string => typeof item === 'string'
  );
  return thumbnails.length > 0 ? thumbnails : null;
};

export const addSearchHistory = (query: string): void => {
  const history = getSearchHistory();
  if (!history.includes(query)) {
    const newHistory = [query, ...history].slice(0, 20);
    storageService.save(StorageKeys.SEARCH_HISTORY, newHistory);
  }
};

export const clearSearchHistory = (): void => {
  storageService.save(StorageKeys.SEARCH_HISTORY, []);
};

export const getSearchHistory = (): string[] => {
  const history = storageService.get<string[]>(StorageKeys.SEARCH_HISTORY);
  return history || [];
};
