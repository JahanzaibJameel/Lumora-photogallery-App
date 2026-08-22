import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWidgetConfig } from './useWidgetConfig';

describe('useWidgetConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('refreshConfigs reloads default configs', async () => {
    const { result } = renderHook(() => useWidgetConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.removeWidget('daily_memory'); });
    expect(result.current.widgets).toHaveLength(2);

    await act(async () => { await result.current.refreshConfigs(); });
    expect(result.current.widgets).toHaveLength(3);
    expect(result.current.widgets[0].id).toBe('daily_memory');
  });
});
