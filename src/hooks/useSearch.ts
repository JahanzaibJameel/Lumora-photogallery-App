import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
} from '../services/storage.service';

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const recordQuery = useCallback((query: string) => {
    addSearchHistory(query);
    setHistory(getSearchHistory());
  }, []);

  const clear = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  return { history, recordQuery, clear };
};

export const useDebouncedValue = <T>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer.current);
  }, [value, delay]);

  return debounced;
};
