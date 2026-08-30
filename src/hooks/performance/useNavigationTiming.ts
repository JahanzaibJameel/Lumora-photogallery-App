import { useEffect, useRef } from 'react';
import { usePerformanceMonitoring } from './index';

export function useNavigationTiming(screenName: string, coldStart = false) {
  const perfService = usePerformanceMonitoring();
  const startTimeRef = useRef<number>(performance.now());
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = performance.now();
    hasRecordedRef.current = false;
  }, [screenName]);

  useEffect(() => {
    if (hasRecordedRef.current || !perfService) return;

    const handle = setTimeout(() => {
      const duration = performance.now() - startTimeRef.current;
      perfService.recordNavigation({
        screenName,
        durationMs: duration,
        coldStart,
      });
      hasRecordedRef.current = true;
    }, 0);

    return () => clearTimeout(handle);
  }, [screenName, coldStart, perfService]);

  return {
    screenName,
    startTime: startTimeRef.current,
  };
}
