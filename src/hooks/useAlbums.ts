import { useCallback, useRef, useState } from 'react';
import { getMediaService } from '../services/media.service';
import { cacheThumbnails, loadCachedThumbnails } from '../services/storage.service';
import { Album } from '../types/album';

const BATCH_SIZE = 20;

export const useAlbums = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const lastFetchedIndex = useRef(0);
  const hasMore = useRef(true);

  const loadAlbums = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        lastFetchedIndex.current = 0;
        hasMore.current = true;
      } else {
        setLoading(true);
      }

      const mediaService = getMediaService();
      const fetchedAlbums = await mediaService.getAlbums(
        lastFetchedIndex.current,
        BATCH_SIZE
      );

      if (fetchedAlbums.length < BATCH_SIZE) {
        hasMore.current = false;
      }

      setAlbums(prev => {
        const updated = refresh ? fetchedAlbums : [...prev, ...fetchedAlbums];
        return Array.from(new Map(updated.map(a => [a.id, a])).values());
      });

      lastFetchedIndex.current += fetchedAlbums.length;

      // Cache thumbnails for each album
      await Promise.all(
        fetchedAlbums.map(async album => {
          if (album.thumbnailUri) {
            await cacheThumbnails(album.id, [album.thumbnailUri]);
          }
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load albums');
      console.error('Error loading albums:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore.current) {
      loadAlbums(false);
    }
  }, [loading, loadAlbums]);

  const refreshAlbums = useCallback(() => {
    loadAlbums(true);
  }, [loadAlbums]);

  const getAlbumThumbnail = useCallback(async (albumId: string) => {
    try {
      const cached = await loadCachedThumbnails(albumId);
      if (cached && cached.length > 0) {
        return cached[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting album thumbnail:', error);
      return null;
    }
  }, []);

  return {
    albums,
    loading,
    error,
    refreshing,
    loadMore,
    refreshAlbums,
    getAlbumThumbnail,
  };
};