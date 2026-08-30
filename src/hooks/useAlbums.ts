import { useCallback, useEffect, useRef, useState } from 'react';
import { getMediaService } from '../services/media.service';
import { Album } from '../types';
import { errorReporter } from '../utils/errorReporting';
import { AppError, ErrorCategory, ErrorSeverity, categorizeError } from '../utils/errors';

const MAX_RETRIES = 2;

interface AlbumsState {
  albums: Album[];
  loading: boolean;
  error: AppError | null;
  refreshing: boolean;
  retryCount: number;
}

export interface UseAlbumsReturn {
  albums: Album[];
  loading: boolean;
  error: AppError | null;
  refreshing: boolean;
  retryCount: number;
  refreshAlbums: () => void;
  retryLoad: () => void;
}

export const useAlbums = (): UseAlbumsReturn => {
  const [state, setState] = useState<AlbumsState>({
    albums: [],
    loading: true,
    error: null,
    refreshing: false,
    retryCount: 0,
  });

  const abortController = useRef<AbortController | null>(null);
  // Mirrors state.retryCount so loadAlbums can stay dependency-free
  // (adding reactive retryCount to its deps would re-trigger the mount
  // effect after every failure and cause an automatic retry loop).
  const retryCountRef = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAlbums = useCallback(async (refresh = false) => {
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    try {
      if (refresh) {
        setState(s => ({ ...s, refreshing: true, error: null, retryCount: 0 }));
        retryCountRef.current = 0;
      } else {
        setState(s => ({ ...s, loading: true, error: null }));
      }

      if (controller.signal.aborted) return;

      const mediaService = getMediaService();
      const fetchedAlbums = await mediaService.getAlbums(0, 200);

      if (controller.signal.aborted) return;

      setState(s => ({
        ...s,
        albums: fetchedAlbums,
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      const appError = categorizeError(err);
      retryCountRef.current += 1;
      appError.context = { ...appError.context, retryCount: retryCountRef.current };
      errorReporter.capture(appError, { hook: 'useAlbums', action: 'loadAlbums' });

      setState(s => ({
        ...s,
        error: appError,
        retryCount: s.retryCount + 1,
      }));
    } finally {
      if (!controller.signal.aborted && mountedRef.current) {
        setState(s => ({ ...s, loading: false, refreshing: false }));
      }
    }
  }, []);

  useEffect(() => {
    loadAlbums();
    return () => {
      abortController.current?.abort();
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
      if (mountedRef.current) {
        loadAlbums(false);
      }
    }, 1000 * state.retryCount);
  }, [state.retryCount, loadAlbums]);

  const refreshAlbums = useCallback(() => {
    loadAlbums(true);
  }, [loadAlbums]);

  return {
    albums: state.albums,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    retryCount: state.retryCount,
    refreshAlbums,
    retryLoad,
  };
};
