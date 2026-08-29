import { useCallback, useState } from 'react';
import type { WidgetConfig, WidgetData } from '../services/widget.service';
import { WidgetService } from '../services/widget.service';
import { errorReporter } from '../utils/errorReporting';
import { categorizeError } from '../utils/errors';

const widgetService = WidgetService;

export interface UseWidgetDataReturn {
  widgetData: Record<string, WidgetData>;
  loading: boolean;
  refreshWidget: (widget: WidgetConfig) => Promise<void>;
  refreshAllWidgets: (widgets: WidgetConfig[]) => Promise<void>;
}

export const useWidgetData = (): UseWidgetDataReturn => {
  const [widgetData, setWidgetData] = useState<Record<string, WidgetData>>({});
  const [loading, setLoading] = useState(true);

  const fetchWidgetData = useCallback(async (widget: WidgetConfig) => {
    if (!widget.enabled) return;

    try {
      let data: WidgetData;

      switch (widget.type) {
        case 'daily_memory':
          data = await widgetService.getDailyMemory();
          break;
        case 'random_photo':
          data = await widgetService.getRandomPhotos(1);
          break;
        case 'album_preview':
          if (widget.albumId) {
            data = await widgetService.getAlbumPreview(widget.albumId);
          } else {
            throw new Error('Album ID not specified');
          }
          break;
        case 'favorites':
          data = await widgetService.getFavorites();
          break;
        default:
          throw new Error('Unknown widget type');
      }

      setWidgetData(prev => ({ ...prev, [widget.id]: data }));
    } catch (error) {
      errorReporter.capture(categorizeError(error), {
        hook: 'useWidgetData',
        action: 'fetchWidgetData',
        widgetId: widget.id,
      });
    }
  }, []);

  const refreshWidget = useCallback(async (widget: WidgetConfig) => {
    await fetchWidgetData(widget);
  }, [fetchWidgetData]);

  const refreshAllWidgets = useCallback(async (widgets: WidgetConfig[]) => {
    setLoading(true);
    try {
      await Promise.all(
        widgets
          .filter(w => w.enabled)
          .map(w => fetchWidgetData(w))
      );
    } finally {
      setLoading(false);
    }
  }, [fetchWidgetData]);

  return {
    widgetData,
    loading,
    refreshWidget,
    refreshAllWidgets,
  };
};
