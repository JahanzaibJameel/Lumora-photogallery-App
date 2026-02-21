import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';

const CACHE_PREFIX = 'lumora_cache_';

export const useCache = () => {
  const [cacheSize, setCacheSize] = useState(0);

  const setItem = useCallback(async <T>(key: string, value: T, ttl?: number) => {
    try {
      const cacheItem = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Error setting cache item:', error);
    }
  }, []);

  const getItem = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      const item = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!item) return null;

      const cacheItem = JSON.parse(item);
      
      // Check if item has expired
      if (cacheItem.ttl && Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return cacheItem.value;
    } catch (error) {
      console.error('Error getting cache item:', error);
      return null;
    }
  }, []);

  const removeItem = useCallback(async (key: string) => {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing cache item:', error);
    }
  }, []);

  const clearExpired = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIX));
      
      const now = Date.now();
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const cacheItem = JSON.parse(item);
          if (cacheItem.ttl && now - cacheItem.timestamp > cacheItem.ttl) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }, []);

  const calculateCacheSize = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      }
      
      setCacheSize(totalSize);
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }, []);

  const clearAllCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      setCacheSize(0);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }, []);

  return {
    setItem,
    getItem,
    removeItem,
    clearExpired,
    calculateCacheSize,
    clearAllCache,
    cacheSize,
  };
};