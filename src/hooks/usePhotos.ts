import { useCallback, useEffect, useRef, useState } from 'react';
import { getMediaService } from '../services/media.service';
import { cacheThumbnails } from '../services/storage.service';
import { Photo } from '../types';
import { errorReporter } from '../utils/errorReporting';
import { AppError, ErrorCategory, ErrorSeverity, categorizeError } from '../utils/errors';

const PHOTOS_BATCH_SIZE = 30;
const MAX_RETRIES = 2;

interface PhotosState {
  photos: Photo[];
  loading: boolean;
  error: AppError | null;
  refreshing: boolean;
  retryCount: number;
}

export const usePhotos = (albumId: string) => {
  const [state, setState] = useState<PhotosState>({
    photos: [],
    loading: true,
    error: null,
    refreshing: false,
    retryCount: 0,
  });

  const endCursor = useRef<string | undefined>(undefined);
  const hasMore = useRef(true);
  // Mirrors state.retryCount so loadPhotos only depends on albumId
  // (adding reactive retryCount would re-trigger the mount effect after
  // every failure and cause an automatic retry loop).
  const retryCountRef = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadPhotos = useCallback(async (refresh = false) => {
    try {
      if (!albumId) return;

      if (refresh) {
        setState(s => ({ ...s, refreshing: true, error: null, retryCount: 0 }));
        retryCountRef.current = 0;
        endCursor.current = undefined;
        hasMore.current = true;
        getMediaService().clearCache();
      } else {
        if (!hasMore.current) return;
        setState(s => ({ ...s, loading: true, error: null }));
      }

      const mediaService = getMediaService();
      const result = await mediaService.getPhotosFromAlbum(
        albumId,
        endCursor.current,
        PHOTOS_BATCH_SIZE
      );

      hasMore.current = result.hasNextPage;

      setState(s => ({
        ...s,
        photos: refresh ? result.photos : [...s.photos, ...result.photos],
      }));

      endCursor.current = result.endCursor ?? undefined;

      const thumbnailUris = result.photos.map(photo => photo.uri);
      await cacheThumbnails(albumId, thumbnailUris.slice(0, 4));

    } catch (err) {
      const appError = categorizeError(err);
      retryCountRef.current += 1;
      appError.context = { ...appError.context, albumId, retryCount: retryCountRef.current };
      errorReporter.capture(appError, { hook: 'usePhotos', action: 'loadPhotos' });

      setState(s => ({
        ...s,
        error: appError,
        retryCount: s.retryCount + 1,
      }));
    } finally {
      setState(s => ({ ...s, loading: false, refreshing: false }));
    }
  }, [albumId]);

  useEffect(() => {
    loadPhotos();
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [loadPhotos]);

  const retryLoad = useCallback(() => {
    if (state.retryCount >= MAX_RETRIES) {
      setState(s => ({ ...s, error: new AppError({
        message: 'Unable to load photos after multiple attempts. Please check your connection.',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        code: 'MAX_RETRIES_EXCEEDED',
        context: { albumId, retryCount: state.retryCount },
      }) }));
      return;
    }

    retryTimeout.current = setTimeout(() => {
      loadPhotos(false);
    }, 1000 * state.retryCount);
  }, [state.retryCount, loadPhotos, albumId]);

  const loadMore = useCallback(() => {
    if (!state.loading && hasMore.current) {
      loadPhotos(false);
    }
  }, [state.loading, loadPhotos]);

  const refreshPhotos = useCallback(() => {
    loadPhotos(true);
  }, [loadPhotos]);

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      const mediaService = getMediaService();
      await mediaService.deletePhoto(photoId);
      setState(s => ({
        ...s,
        photos: s.photos.filter(photo => photo.id !== photoId),
      }));
    } catch (error) {
      const appError = categorizeError(error);
      appError.context = { ...appError.context, albumId, photoId };
      errorReporter.capture(appError, { hook: 'usePhotos', action: 'deletePhoto' });
      throw appError;
    }
  }, [albumId]);

  return {
    photos: state.photos,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    retryCount: state.retryCount,
    loadMore,
    refreshPhotos,
    retryLoad,
    deletePhoto,
  };
};
