import { useCallback, useEffect, useRef, useState } from 'react';
import { getMediaService } from '../services/media.service';
import { cacheThumbnails, loadCachedThumbnails } from '../services/storage.service';
import { Album } from '../types';
import { errorReporter } from '../utils/errorReporting';
import { AppError, ErrorCategory, ErrorSeverity, categorizeError } from '../utils/errors';

const BATCH_SIZE = 20;
const MAX_RETRIES = 2;

interface AlbumsState {
  albums: Album[];
  loading: boolean;
  error: AppError | null;
  refreshing: boolean;
  retryCount: number;
}

export const useAlbums = () => {
  const [state, setState] = useState<AlbumsState>({
    albums: [],
    loading: true,
    error: null,
    refreshing: false,
    retryCount: 0,
  });

  const lastFetchedIndex = useRef(0);
  const hasMore = useRef(true);
  // Mirrors state.retryCount so loadAlbums can stay dependency-free
  // (adding reactive retryCount to its deps would re-trigger the mount
  // effect after every failure and cause an automatic retry loop).
  const retryCountRef = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadAlbums = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setState(s => ({ ...s, refreshing: true, error: null, retryCount: 0 }));
        retryCountRef.current = 0;
        lastFetchedIndex.current = 0;
        hasMore.current = true;
      } else {
        setState(s => ({ ...s, loading: true, error: null }));
      }

      const mediaService = getMediaService();
      const fetchedAlbums = await mediaService.getAlbums(
        lastFetchedIndex.current,
        BATCH_SIZE
      );

      if (fetchedAlbums.length < BATCH_SIZE) {
        hasMore.current = false;
      }

      setState(s => ({
        ...s,
        albums: refresh
          ? fetchedAlbums
          : Array.from(new Map([...s.albums, ...fetchedAlbums].map(a => [a.id, a])).values()),
      }));

      lastFetchedIndex.current += fetchedAlbums.length;
    } catch (err) {
      const appError = categorizeError(err);
      retryCountRef.current += 1;
      appError.context = { ...appError.context, offset: lastFetchedIndex.current, retryCount: retryCountRef.current };
      errorReporter.capture(appError, { hook: 'useAlbums', action: 'loadAlbums' });

      setState(s => ({
        ...s,
        error: appError,
        retryCount: s.retryCount + 1,
      }));
    } finally {
      setState(s => ({ ...s, loading: false, refreshing: false }));
    }
  }, []);

  useEffect(() => {
    loadAlbums();
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [loadAlbums]);

  const retryLoad = useCallback(() => {
    if (state.retryCount >= MAX_RETRIES) {
      setState(s => ({ ...s, error: new AppError({
        message: 'Unable to load albums after multiple attempts. Please check your connection.',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        code: 'MAX_RETRIES_EXCEEDED',
        context: { retryCount: state.retryCount },
      })}));
      return;
    }

    retryTimeout.current = setTimeout(() => {
      loadAlbums(false);
    }, 1000 * state.retryCount);
  }, [state.retryCount, loadAlbums]);

  const loadMore = useCallback(() => {
    if (!state.loading && hasMore.current) {
      loadAlbums(false);
    }
  }, [state.loading, loadAlbums]);

  const refreshAlbums = useCallback(() => {
    loadAlbums(true);
  }, [loadAlbums]);

  const getAlbumThumbnail = useCallback(async (albumId: string) => {
    try {
      const cached = await loadCachedThumbnails(albumId);
      if (cached && cached.length > 0) {
        return cached[0];
      }
      const mediaService = getMediaService();
      const thumbnail = await mediaService.getAlbumThumbnail(albumId);
      if (thumbnail) {
        await cacheThumbnails(albumId, [thumbnail]);
      }
      return thumbnail;
    } catch (error) {
      errorReporter.capture(error, { hook: 'useAlbums', action: 'getAlbumThumbnail', albumId });
      return null;
    }
  }, []);

  return {
    albums: state.albums,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    retryCount: state.retryCount,
    loadMore,
    refreshAlbums,
    retryLoad,
    getAlbumThumbnail,
  };
};
