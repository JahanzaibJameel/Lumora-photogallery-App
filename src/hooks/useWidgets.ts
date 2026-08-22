import { useCallback, useEffect } from 'react';
import { useWidgetConfig } from './useWidgetConfig';
import { useWidgetData } from './useWidgetData';

export type { WidgetType } from '../services/widget.service';

const REFRESH_INTERVAL = 60 * 60 * 1000;

export const useWidgets = () => {
  const { widgets, loading: configLoading, toggleWidget, updateWidgetConfig, addWidget, removeWidget } = useWidgetConfig();
  const { widgetData, loading: dataLoading, refreshWidget, refreshAllWidgets } = useWidgetData();

  const refreshAll = useCallback(async () => {
    await refreshAllWidgets(widgets);
  }, [refreshAllWidgets, widgets]);

  useEffect(() => {
    if (widgets.length === 0) return;

    refreshAll();

    const interval = setInterval(() => {
      refreshAll();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [widgets, refreshAll]);

  const refreshSingle = useCallback(async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    await refreshWidget(widget);
  }, [widgets, refreshWidget]);

  return {
    widgets,
    widgetData,
    loading: configLoading || dataLoading,
    refreshWidget: refreshSingle,
    refreshAllWidgets: refreshAll,
    toggleWidget,
    updateWidgetConfig,
    addWidget,
    removeWidget,
  };
};
