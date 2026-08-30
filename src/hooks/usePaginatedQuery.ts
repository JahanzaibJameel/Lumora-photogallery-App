import { useCallback, useEffect, useRef, useState } from 'react';
import { errorReporter } from '../utils/errorReporting';
import { AppError, ErrorCategory, ErrorSeverity, categorizeError } from '../utils/errors';

const MAX_RETRIES = 2;

export interface PaginatedQueryState<T> {
  data: T[];
  loading: boolean;
  error: AppError | null;
  refreshing: boolean;
  retryCount: number;
  hasMore: boolean;
}

export interface PaginatedQueryReturn<T> extends PaginatedQueryState<T> {
  loadMore: () => void;
  refresh: () => void;
  retry: () => void;
}

export interface PaginatedQueryOptions<T> {
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<{
    items: T[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }>;
  invalidateCache?: () => void;
  pageSize?: number;
}

export function usePaginatedQuery<T>(options: PaginatedQueryOptions<T>): PaginatedQueryReturn<T> {
  const { fetchPage, invalidateCache } = options;

  const [state, setState] = useState<PaginatedQueryState<T>>({
    data: [],
    loading: true,
    error: null,
    refreshing: false,
    retryCount: 0,
    hasMore: true,
  });

  const cursor = useRef<string | undefined>(undefined);
  const abortController = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (refresh = false) => {
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    try {
      if (refresh) {
        setState(s => ({ ...s, refreshing: true, error: null, retryCount: 0 }));
        retryCountRef.current = 0;
        cursor.current = undefined;
        invalidateCache?.();
      } else {
        setState(s => ({ ...s, loading: true, error: null }));
      }

      if (controller.signal.aborted) return;

      const result = await fetchPage(cursor.current, controller.signal);

      if (controller.signal.aborted) return;

      setState(s => ({
        ...s,
        data: refresh ? result.items : [...s.data, ...result.items],
        hasMore: result.hasNextPage,
      }));

      cursor.current = result.nextCursor ?? undefined;

    } catch (err) {
      if (controller.signal.aborted) return;
      const appError = categorizeError(err);
      retryCountRef.current += 1;
      appError.context = { ...appError.context, retryCount: retryCountRef.current };
      errorReporter.capture(appError, { hook: 'usePaginatedQuery', action: 'load' });

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
  }, [fetchPage, invalidateCache]);

  useEffect(() => {
    load();
    return () => {
      abortController.current?.abort();
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [load]);

  const retry = useCallback(() => {
    if (state.retryCount >= MAX_RETRIES) {
      setState(s => ({ ...s, error: new AppError({
        message: 'Unable to load after multiple attempts. Please check your connection.',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        code: 'MAX_RETRIES_EXCEEDED',
        context: { retryCount: state.retryCount },
      }) }));
      return;
    }

    retryTimeout.current = setTimeout(() => {
      if (mountedRef.current) {
        load(false);
      }
    }, 1000 * state.retryCount);
  }, [state.retryCount, load]);

  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      load(false);
    }
  }, [state.loading, state.hasMore, load]);

  const refresh = useCallback(() => {
    load(true);
  }, [load]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    retryCount: state.retryCount,
    hasMore: state.hasMore,
    loadMore,
    refresh,
    retry,
  };
}
