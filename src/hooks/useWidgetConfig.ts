import { useCallback, useEffect, useState } from 'react';
import type { WidgetConfig } from '../services/widget.service';

export interface UseWidgetConfigReturn {
  widgets: WidgetConfig[];
  loading: boolean;
  toggleWidget: (widgetId: string) => void;
  updateWidgetConfig: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  addWidget: (config: Omit<WidgetConfig, 'id'>) => void;
  removeWidget: (widgetId: string) => void;
  refreshConfigs: () => Promise<void>;
}

export const useWidgetConfig = (): UseWidgetConfigReturn => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWidgetConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const defaultConfigs: WidgetConfig[] = [
        {
          id: 'daily_memory',
          type: 'daily_memory',
          size: 'medium',
          title: 'Daily Memory',
          enabled: true,
        },
        {
          id: 'random_photo',
          type: 'random_photo',
          size: 'small',
          title: 'Random Photo',
          enabled: true,
        },
        {
          id: 'favorites',
          type: 'favorites',
          size: 'medium',
          title: 'Favorites',
          enabled: true,
        },
      ];

      setWidgets(defaultConfigs);
    } catch (error) {
      console.error('Error loading widget configs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgetConfigs();
  }, [loadWidgetConfigs]);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      )
    );
  }, []);

  const updateWidgetConfig = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      )
    );
  }, []);

  const addWidget = useCallback((config: Omit<WidgetConfig, 'id'>) => {
    const newWidget: WidgetConfig = {
      ...config,
      id: `widget_${Date.now()}`,
    };
    setWidgets(prev => [...prev, newWidget]);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  const refreshConfigs = useCallback(async () => {
    await loadWidgetConfigs();
  }, [loadWidgetConfigs]);

  return {
    widgets,
    loading,
    toggleWidget,
    updateWidgetConfig,
    addWidget,
    removeWidget,
    refreshConfigs,
  };
};
