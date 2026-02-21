import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';

// MMKV is not fully supported on Web, use memory fallback
const isWeb = Platform.OS === 'web';

// Memory storage fallback for web
const memoryStorage = new Map<string, string>();

const mmkvStorage = isWeb 
  ? null 
  : new MMKV({
      id: 'lumora-storage',
      encryptionKey: 'lumora-secure-storage-key-2026',
    });

export const StorageKeys = {
  THEME: 'lumora_theme',
  LAST_ALBUM: 'lumora_last_album',
  THUMBNAILS_PREFIX: 'lumora_thumb_',
  SETTINGS: 'lumora_settings',
  RECENT_PHOTOS: 'lumora_recent_photos',
  HIDDEN_ALBUMS: 'lumora_hidden_albums',
  FAVORITES: 'lumora_favorites',
  SEARCH_HISTORY: 'lumora_search_history',
  WIDGET_PREFIX: 'lumora_widget_',
  BIOMETRIC_CONFIG: 'lumora_biometric_config',
  SCREENSHOT_CONFIG: 'lumora_screenshot_config',
} as const;

export const storageService = {
  set: (key: string, value: unknown): void => {
    try {
      const jsonValue = JSON.stringify(value);
      if (isWeb) {
        memoryStorage.set(key, jsonValue);
      } else {
        mmkvStorage?.set(key, jsonValue);
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const value = isWeb 
        ? memoryStorage.get(key) 
        : mmkvStorage?.getString(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  delete: (key: string): void => {
    try {
      if (isWeb) {
        memoryStorage.delete(key);
      } else {
        mmkvStorage?.delete(key);
      }
    } catch (error) {
      console.error('Error deleting from storage:', error);
    }
  },

  getAllKeys: (): string[] => {
    if (isWeb) {
      return Array.from(memoryStorage.keys());
    }
    return mmkvStorage?.getAllKeys() || [];
  },

  clearAll: (): void => {
    if (isWeb) {
      memoryStorage.clear();
    } else {
      mmkvStorage?.clearAll();
    }
  },

  contains: (key: string): boolean => {
    if (isWeb) {
      return memoryStorage.has(key);
    }
    return mmkvStorage?.contains(key) || false;
  },
};

export const cacheThumbnails = async (albumId: string, thumbnails: string[]): Promise<void> => {
  storageService.set(`${StorageKeys.THUMBNAILS_PREFIX}${albumId}`, {
    thumbnails,
    timestamp: Date.now(),
  });
};

export const loadCachedThumbnails = async (albumId: string): Promise<string[] | null> => {
  const data = storageService.get<{ thumbnails: string[]; timestamp: number }>(
    `${StorageKeys.THUMBNAILS_PREFIX}${albumId}`
  );
  
  if (!data) return null;
  
  // Check if cache is older than 1 hour
  if (Date.now() - data.timestamp > 60 * 60 * 1000) {
    storageService.delete(`${StorageKeys.THUMBNAILS_PREFIX}${albumId}`);
    return null;
  }
  
  return data.thumbnails;
};

export const saveLastOpenedAlbum = async (albumId: string): Promise<void> => {
  storageService.set(StorageKeys.LAST_ALBUM, albumId);
};

export const getLastOpenedAlbum = async (): Promise<string | null> => {
  return storageService.get<string>(StorageKeys.LAST_ALBUM);
};

export const clearAlbumCache = async (albumId: string): Promise<void> => {
  storageService.delete(`${StorageKeys.THUMBNAILS_PREFIX}${albumId}`);
};

export const clearAllCache = async (): Promise<void> => {
  const keys = storageService.getAllKeys();
  const cacheKeys = keys.filter((key: string) => key.startsWith('lumora_'));
  cacheKeys.forEach((key: string) => storageService.delete(key));
};
