import { useCallback, useEffect, useState } from 'react';
import { getStorageService, StorageKeys } from '../services/storage.service';
import type { WidgetConfig } from '../services/widget.service';
import { errorReporter } from '../utils/errorReporting';
import { categorizeError } from '../utils/errors';

let widgetIdCounter = 0;
function generateWidgetId(): string {
  widgetIdCounter += 1;
  return `widget_${widgetIdCounter}`;
}

export interface UseWidgetConfigReturn {
  widgets: WidgetConfig[];
  loading: boolean;
  toggleWidget: (widgetId: string) => void;
  updateWidgetConfig: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  addWidget: (config: Omit<WidgetConfig, 'id'>) => void;
  removeWidget: (widgetId: string) => void;
  refreshConfigs: () => Promise<void>;
}

const DEFAULT_CONFIGS: WidgetConfig[] = [
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

const saveConfigs = (configs: WidgetConfig[]) => {
  getStorageService().save(StorageKeys.WIDGET_CONFIGS, configs);
};

export const useWidgetConfig = (): UseWidgetConfigReturn => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWidgetConfigs = useCallback(() => {
    try {
      const saved = getStorageService().get<WidgetConfig[]>(StorageKeys.WIDGET_CONFIGS);
      if (saved && saved.length > 0) {
        setWidgets(saved);
      } else {
        setWidgets(DEFAULT_CONFIGS);
        saveConfigs(DEFAULT_CONFIGS);
      }
    } catch (error) {
      errorReporter.capture(categorizeError(error), { hook: 'useWidgetConfig', action: 'loadWidgetConfigs' });
      setWidgets(DEFAULT_CONFIGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgetConfigs();
  }, [loadWidgetConfigs]);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const next = prev.map(w =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      );
      saveConfigs(next);
      return next;
    });
  }, []);

  const updateWidgetConfig = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => {
      const next = prev.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      );
      saveConfigs(next);
      return next;
    });
  }, []);

  const addWidget = useCallback((config: Omit<WidgetConfig, 'id'>) => {
    const newWidget: WidgetConfig = {
      ...config,
      id: generateWidgetId(),
    };
    setWidgets(prev => {
      const next = [...prev, newWidget];
      saveConfigs(next);
      return next;
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const next = prev.filter(w => w.id !== widgetId);
      saveConfigs(next);
      return next;
    });
  }, []);

  const refreshConfigs = useCallback(async () => {
    setWidgets(DEFAULT_CONFIGS);
    saveConfigs(DEFAULT_CONFIGS);
    setLoading(false);
  }, []);

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
