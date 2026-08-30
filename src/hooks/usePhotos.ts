import { useCallback, useRef } from 'react';
import { getMediaService } from '../services/media.service';
import { Photo } from '../types';
import { errorReporter } from '../utils/errorReporting';
import { AppError, categorizeError } from '../utils/errors';
import { usePaginatedQuery } from './usePaginatedQuery';

const PHOTOS_BATCH_SIZE = 30;

export interface UsePhotosReturn {
  photos: Photo[];
  loading: boolean;
  error: AppError | null;
  refreshing: boolean;
  retryCount: number;
  loadMore: () => void;
  refreshPhotos: () => void;
  retryLoad: () => void;
  deletePhoto: (photoId: string) => Promise<void>;
}

export const usePhotos = (albumId: string): UsePhotosReturn => {
  const deletedIdsRef = useRef<Set<string>>(new Set());

  const fetchPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const mediaService = getMediaService();
    const result = await mediaService.getPhotosFromAlbum(albumId, cursor, PHOTOS_BATCH_SIZE);
    return {
      items: result.photos.filter(p => !deletedIdsRef.current.has(p.id)),
      nextCursor: result.endCursor,
      hasNextPage: result.hasNextPage,
    };
  }, [albumId]);

  const invalidateCache = useCallback(() => {
    getMediaService().invalidateAlbum(albumId);
  }, [albumId]);

  const query = usePaginatedQuery<Photo>({
    fetchPage,
    invalidateCache,
  });

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      const mediaService = getMediaService();
      await mediaService.deletePhoto(photoId);
      deletedIdsRef.current.add(photoId);
      query.refresh();
    } catch (error) {
      const appError = categorizeError(error);
      appError.context = { ...appError.context, albumId, photoId };
      errorReporter.capture(appError, { hook: 'usePhotos', action: 'deletePhoto' });
      throw appError;
    }
  }, [albumId, query]);

  return {
    photos: query.data,
    loading: query.loading,
    error: query.error,
    refreshing: query.refreshing,
    retryCount: query.retryCount,
    loadMore: query.loadMore,
    refreshPhotos: query.refresh,
    retryLoad: query.retry,
    deletePhoto,
  };
};
