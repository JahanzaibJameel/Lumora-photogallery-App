import { useCallback, useEffect, useState } from 'react';
import { getStorageService, StorageKeys } from '../services/storage.service';

/**
 * Hook for managing photo favorites stored in MMKV.
 * Returns current favorites state and functions to toggle/check favorites.
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from storage on mount
  useEffect(() => {
    const loadFavorites = () => {
      const stored = getStorageService().get<string[]>(StorageKeys.FAVORITES);
      setFavorites(stored || []);
    };
    loadFavorites();
  }, []);

  const isFavorite = useCallback(
    (photoId: string): boolean => {
      return favorites.includes(photoId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (photoId: string) => {
      setFavorites((prev) => {
        const newFavorites = prev.includes(photoId)
          ? prev.filter((id) => id !== photoId)
          : [...prev, photoId];
        
        getStorageService().save(StorageKeys.FAVORITES, newFavorites);
        return newFavorites;
      });
    },
    []
  );

  const addFavorite = useCallback(
    (photoId: string) => {
      setFavorites(currentFavorites => {
        if (currentFavorites.includes(photoId)) {
          return currentFavorites;
        }
        const newFavorites = [...currentFavorites, photoId];
        getStorageService().save(StorageKeys.FAVORITES, newFavorites);
        return newFavorites;
      });
    },
    []
  );

  const removeFavorite = useCallback(
    (photoId: string) => {
      setFavorites(currentFavorites => {
        if (!currentFavorites.includes(photoId)) {
          return currentFavorites;
        }
        const newFavorites = currentFavorites.filter((id) => id !== photoId);
        getStorageService().save(StorageKeys.FAVORITES, newFavorites);
        return newFavorites;
      });
    },
    []
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
};
