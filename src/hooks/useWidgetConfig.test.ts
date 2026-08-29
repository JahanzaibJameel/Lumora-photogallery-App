import { renderHook, act, waitFor } from '@testing-library/react-native';
import { storageService } from '../services/storage.service';
import type { WidgetConfig } from '../services/widget.service';
import { errorReporter } from '../utils/errorReporting';
import { useWidgetConfig } from './useWidgetConfig';

describe('useWidgetConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storageService.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the expected hook shape', () => {
    const { result } = renderHook(() => useWidgetConfig());
    expect(result.current).toHaveProperty('widgets');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('toggleWidget');
    expect(result.current).toHaveProperty('updateWidgetConfig');
    expect(result.current).toHaveProperty('addWidget');
    expect(result.current).toHaveProperty('removeWidget');
    expect(result.current).toHaveProperty('refreshConfigs');
  });

  it('loads default widget configs on mount', async () => {
    const { result } = renderHook(() => useWidgetConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.widgets).toHaveLength(3);
    expect(result.current.widgets[0].id).toBe('daily_memory');
    expect(result.current.widgets[1].id).toBe('random_photo');
    expect(result.current.widgets[2].id).toBe('favorites');
    expect(result.current.widgets.every((w) => w.enabled)).toBe(true);
  });

  it('persists widget configs to storage on mount', async () => {
    renderHook(() => useWidgetConfig());
    await waitFor(() => {
      expect(storageService.contains('lumora_widget_configs')).toBe(true);
    });
  });

  it('loads persisted configs instead of defaults on mount', async () => {
    const savedConfigs = [
      {
        id: 'daily_memory',
        type: 'daily_memory',
        size: 'medium',
        title: 'Daily Memory',
        enabled: false,
      },
    ];
    storageService.save('lumora_widget_configs', savedConfigs);

    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.widgets).toHaveLength(1);
    expect(result.current.widgets[0].enabled).toBe(false);
  });

  it('persists toggleWidget changes to storage', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.toggleWidget('daily_memory'); });

    expect(result.current.widgets[0].enabled).toBe(false);
    const saved = storageService.get<WidgetConfig[]>('lumora_widget_configs')!;
    expect(saved[0].enabled).toBe(false);
  });

  it('persists updateWidgetConfig changes to storage', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.updateWidgetConfig('daily_memory', { title: 'Updated Title' }); });

    const saved = storageService.get<WidgetConfig[]>('lumora_widget_configs')!;
    expect(saved[0].title).toBe('Updated Title');
  });

  it('persists addWidget to storage', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addWidget({
        type: 'album_preview',
        size: 'medium',
        enabled: true,
        albumId: 'album-1',
      });
    });

    expect(result.current.widgets).toHaveLength(4);
    const saved = storageService.get<WidgetConfig[]>('lumora_widget_configs')!;
    expect(saved).toHaveLength(4);
    expect(saved[3].type).toBe('album_preview');
  });

  it('persists removeWidget to storage', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.removeWidget('daily_memory'); });

    expect(result.current.widgets.find((w) => w.id === 'daily_memory')).toBeUndefined();
    expect(result.current.widgets).toHaveLength(2);
    const saved = storageService.get<WidgetConfig[]>('lumora_widget_configs')!;
    expect(saved).toHaveLength(2);
    expect(saved.find((w) => w.id === 'daily_memory')).toBeUndefined();
  });

  it('toggles widget enabled state', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.widgets[0].enabled).toBe(true);

    act(() => { result.current.toggleWidget('daily_memory'); });
    expect(result.current.widgets[0].enabled).toBe(false);

    act(() => { result.current.toggleWidget('daily_memory'); });
    expect(result.current.widgets[0].enabled).toBe(true);
  });

  it('updates widget configuration', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.updateWidgetConfig('daily_memory', { title: 'Updated Title' }); });

    const widget = result.current.widgets.find((w) => w.id === 'daily_memory');
    expect(widget?.title).toBe('Updated Title');
  });

  it('adds a new widget', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addWidget({
        type: 'album_preview',
        size: 'medium',
        enabled: true,
        albumId: 'album-1',
      });
    });

    expect(result.current.widgets).toHaveLength(4);
    const newWidget = result.current.widgets[3];
    expect(newWidget.type).toBe('album_preview');
    expect(newWidget.id).toMatch(/^widget_/);
  });

  it('removes a widget', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.removeWidget('daily_memory'); });

    expect(result.current.widgets.find((w) => w.id === 'daily_memory')).toBeUndefined();
    expect(result.current.widgets).toHaveLength(2);
  });

  it('refreshConfigs resets to default configs and persists them', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.removeWidget('daily_memory'); });
    expect(result.current.widgets).toHaveLength(2);

    await act(async () => { await result.current.refreshConfigs(); });
    expect(result.current.widgets).toHaveLength(3);
    expect(result.current.widgets[0].id).toBe('daily_memory');
    expect(result.current.widgets.every((w) => w.enabled)).toBe(true);
    const saved = storageService.get<WidgetConfig[]>('lumora_widget_configs')!;
    expect(saved).toHaveLength(3);
  });

  it('reports via errorReporter and falls back to defaults when storage read fails', async () => {
    const captureSpy = jest.spyOn(errorReporter, 'capture').mockImplementation(() => undefined);
    jest.spyOn(storageService, 'get').mockImplementationOnce(() => {
      throw new Error('Storage read failed');
    });

    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(captureSpy).toHaveBeenCalledTimes(1);
    expect(captureSpy.mock.calls[0][0]).toHaveProperty('message', 'Storage read failed');
    expect(result.current.widgets).toHaveLength(3);
  });
});
