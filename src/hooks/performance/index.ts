import { useContext, useEffect, useRef } from 'react';
import { ServiceContext } from '../../services/di';
import {
  IPerformanceMonitoringService,
  PerformanceMonitoringService,
} from '../../services/performance.service';
import { useNavigationTiming } from './useNavigationTiming';

export { useNavigationTiming };

export function usePerformanceMonitoring(): IPerformanceMonitoringService | null {
  const container = useContext(ServiceContext);

  if (!container) {
    return null;
  }

  const service = container.get('PerformanceService');
  if (service instanceof PerformanceMonitoringService) {
    return service;
  }

  return null;
}

export function usePerformanceTimer(
  name: string,
  category: 'app_lifecycle' | 'navigation' | 'api_call' | 'image_load' | 'list_render' | 'memory' | 'cache',
  metadata?: Record<string, string | number | boolean>
) {
  const service = usePerformanceMonitoring();
  const timerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!service) return;

    timerIdRef.current = service.startTimer(name, category, metadata);

    return () => {
      if (timerIdRef.current) {
        service.stopTimer(timerIdRef.current);
      }
    };
  }, [service, name, category, metadata]);

  const stop = () => {
    if (service && timerIdRef.current) {
      const duration = service.stopTimer(timerIdRef.current);
      timerIdRef.current = null;
      return duration;
    }
    return null;
  };

  return { stop };
}

export function useRenderMetrics(componentName: string) {
  const service = usePerformanceMonitoring();
  const renderCountRef = useRef(0);
  const totalRenderTimeRef = useRef(0);

  useEffect(() => {
    if (!service) return;

    const startTime = performance.now();
    renderCountRef.current += 1;

    return () => {
      const renderTime = performance.now() - startTime;
      totalRenderTimeRef.current += renderTime;

      service.recordMetric(
        `render_${componentName}`,
        'list_render',
        renderTime,
        'ms',
        {
          renderCount: renderCountRef.current,
          totalRenderTime: totalRenderTimeRef.current,
        }
      );
    };
  });

  return {
    renderCount: renderCountRef.current,
    totalRenderTime: totalRenderTimeRef.current,
  };
}
