import { MMKV } from 'react-native-mmkv';

// Keys only for data that is actually read or written somewhere in the app.
export const StorageKeys = {
  THEMES: 'lumora_themes',
  FAVORITES: 'lumora_favorites',
  WIDGET_PREFIX: 'lumora_widget_',
  SEARCH_HISTORY: 'lumora_search_history',
  REDUCED_MOTION: 'lumora_reduced_motion',
} as const;

interface IStorageService {
  save(key: string, value: unknown): void;
  get<T>(key: string): T | null;
  delete(key: string): void;
  clear(): void;
  contains(key: string): boolean;
}

// MMKV is synchronous; wrapping it in Promises would only lie about yielding.
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

export const storageService = new StorageService();

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
