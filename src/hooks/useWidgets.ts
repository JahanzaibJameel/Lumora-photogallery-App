import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useWidgetConfig } from './useWidgetConfig';
import { useWidgetData } from './useWidgetData';

export type { WidgetType } from '../services/widget.service';

const REFRESH_INTERVAL = 60 * 60 * 1000;

export const useWidgets = () => {
  const { widgets, loading: configLoading, toggleWidget, updateWidgetConfig, addWidget, removeWidget } = useWidgetConfig();
  const { widgetData, loading: dataLoading, refreshWidget, refreshAllWidgets } = useWidgetData();
  const appState = useRef(AppState.currentState);
  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;

  const refreshAll = useCallback(async () => {
    await refreshAllWidgets(widgetsRef.current);
  }, [refreshAllWidgets]);

  useEffect(() => {
    if (widgets.length === 0) return;

    refreshAll();

    const interval = setInterval(() => {
      if (appState.current === 'active') {
        refreshAll().catch(() => {
          // Suppress unhandled rejection; widget refresh failures are non-critical
        });
      }
    }, REFRESH_INTERVAL);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [widgets.length, refreshAll]);

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
