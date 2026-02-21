import { useCallback, useEffect, useState } from 'react';
import WidgetService, { WidgetData } from '../services/widget.service';

export type WidgetType = 'daily_memory' | 'random_photo' | 'album_preview' | 'favorites';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  albumId?: string;
  title?: string;
  enabled: boolean;
}

export const useWidgets = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, WidgetData>>({});
  const [loading, setLoading] = useState(true);

  // Load widget configurations
  const loadWidgetConfigs = useCallback(async () => {
    try {
      setLoading(true);
      // Default widgets configuration
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
      
      // Load data for each widget
      const data: Record<string, WidgetData> = {};
      for (const widget of defaultConfigs) {
        if (widget.enabled) {
          const widgetData = await WidgetService.getWidgetData(widget.id);
          if (widgetData) {
            data[widget.id] = widgetData;
          }
        }
      }
      setWidgetData(data);
    } catch (error) {
      console.error('Error loading widget configs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh widget data
  const refreshWidget = useCallback(async (widgetId: string) => {
    try {
      const widget = widgets.find(w => w.id === widgetId);
      if (!widget || !widget.enabled) return;

      let data: WidgetData;
      
      switch (widget.type) {
        case 'daily_memory':
          data = await WidgetService.getDailyMemory();
          break;
        case 'random_photo':
          data = await WidgetService.getRandomPhotos(1);
          break;
        case 'album_preview':
          if (widget.albumId) {
            data = await WidgetService.getAlbumPreview(widget.albumId);
          } else {
            throw new Error('Album ID not specified');
          }
          break;
        case 'favorites':
          data = await WidgetService.getFavorites();
          break;
        default:
          throw new Error('Unknown widget type');
      }

      setWidgetData(prev => ({
        ...prev,
        [widgetId]: data,
      }));

      // Notify native widgets to update (iOS/Android)
      // Note: Native widget integration requires platform-specific setup
      // For now, widget data is managed within the app
    } catch (error) {
      console.error('Error refreshing widget:', error);
    }
  }, [widgets]);

  // Refresh all widgets
  const refreshAllWidgets = useCallback(async () => {
    for (const widget of widgets) {
      if (widget.enabled) {
        await refreshWidget(widget.id);
      }
    }
  }, [widgets, refreshWidget]);

  // Toggle widget enabled state
  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      )
    );
  }, []);

  // Update widget configuration
  const updateWidgetConfig = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      )
    );
  }, []);

  // Add a new widget
  const addWidget = useCallback((config: Omit<WidgetConfig, 'id'>) => {
    const newWidget: WidgetConfig = {
      ...config,
      id: `widget_${Date.now()}`,
    };
    setWidgets(prev => [...prev, newWidget]);
  }, []);

  // Remove a widget
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setWidgetData(prev => {
      const updated = { ...prev };
      delete updated[widgetId];
      return updated;
    });
  }, []);

  // Initialize widgets on mount
  useEffect(() => {
    loadWidgetConfigs();
  }, [loadWidgetConfigs]);

  // Schedule periodic updates
  useEffect(() => {
    if (widgets.length === 0) return;

    // Update every hour
    const interval = setInterval(() => {
      refreshAllWidgets();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [widgets, refreshAllWidgets]);

  return {
    widgets,
    widgetData,
    loading,
    refreshWidget,
    refreshAllWidgets,
    toggleWidget,
    updateWidgetConfig,
    addWidget,
    removeWidget,
  };
};

export default useWidgets;
