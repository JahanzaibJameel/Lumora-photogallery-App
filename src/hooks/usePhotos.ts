import { useCallback, useRef, useState } from 'react';
import { getMediaService } from '../services/media.service';
import { cacheThumbnails } from '../services/storage.service';
import { Photo } from '../types/photo';

const PHOTOS_BATCH_SIZE = 30;

export const usePhotos = (albumId: string) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const lastFetchedIndex = useRef(0);
  const hasMore = useRef(true);

  const loadPhotos = useCallback(async (refresh = false) => {
    if (!albumId) return;

    try {
      if (refresh) {
        setRefreshing(true);
        lastFetchedIndex.current = 0;
        hasMore.current = true;
      } else {
        setLoading(true);
      }

      const mediaService = getMediaService();
      const fetchedPhotos = await mediaService.getPhotosFromAlbum(
        albumId,
        lastFetchedIndex.current,
        PHOTOS_BATCH_SIZE
      );

      if (fetchedPhotos.length < PHOTOS_BATCH_SIZE) {
        hasMore.current = false;
      }

      setPhotos(prev => {
        if (refresh) return fetchedPhotos;
        return [...prev, ...fetchedPhotos];
      });

      lastFetchedIndex.current += fetchedPhotos.length;

      // Cache thumbnails
      const thumbnailUris = fetchedPhotos.map(photo => photo.uri);
      await cacheThumbnails(albumId, thumbnailUris.slice(0, 4));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [albumId]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore.current) {
      loadPhotos(false);
    }
  }, [loading, loadPhotos]);

  const refreshPhotos = useCallback(() => {
    loadPhotos(true);
  }, [loadPhotos]);

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      const mediaService = getMediaService();
      await mediaService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }, []);

  return {
    photos,
    loading,
    error,
    refreshing,
    loadMore,
    refreshPhotos,
    deletePhoto,
  };
};