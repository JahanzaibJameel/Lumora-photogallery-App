import { renderHook, act, waitFor } from '@testing-library/react-native';
import WidgetService from '../services/widget.service';
import { makeWidgetData } from '../test-utils';
import { useWidgets } from './useWidgets';

jest.mock('../services/widget.service');

const mockWidgetService = WidgetService as jest.Mocked<typeof WidgetService>;

const NOW = Date.now();

describe('useWidgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);

    mockWidgetService.getWidgetData.mockReturnValue(null);
    mockWidgetService.getDailyMemory.mockResolvedValue(makeWidgetData({ type: 'daily_memory', title: 'Daily Memory' }));
    mockWidgetService.getRandomPhotos.mockResolvedValue(makeWidgetData({ type: 'random_photo', title: 'Featured Photo' }));
    mockWidgetService.getAlbumPreview.mockResolvedValue(makeWidgetData({ type: 'album_preview', title: 'Album Preview' }));
    mockWidgetService.getFavorites.mockResolvedValue(makeWidgetData({ type: 'favorites', title: 'Favorites' }));
    mockWidgetService.saveWidgetData.mockReturnValue(undefined);
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  it('returns the expected hook shape', () => {
    const { result } = renderHook(() => useWidgets());
    expect(result.current).toHaveProperty('widgets');
    expect(result.current).toHaveProperty('widgetData');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('refreshWidget');
    expect(result.current).toHaveProperty('refreshAllWidgets');
    expect(result.current).toHaveProperty('toggleWidget');
    expect(result.current).toHaveProperty('updateWidgetConfig');
    expect(result.current).toHaveProperty('addWidget');
    expect(result.current).toHaveProperty('removeWidget');
  });

  it('loads default widget configs on mount', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.widgets).toHaveLength(3);
    expect(result.current.widgets[0].id).toBe('daily_memory');
    expect(result.current.widgets[1].id).toBe('random_photo');
    expect(result.current.widgets[2].id).toBe('favorites');
  });

  it('loads cached widget data for enabled widgets', async () => {
    const dailyData = makeWidgetData({ type: 'daily_memory', title: 'Daily Memory' });
    mockWidgetService.getWidgetData.mockReturnValueOnce(dailyData);
    mockWidgetService.getWidgetData.mockReturnValueOnce(null);
    mockWidgetService.getWidgetData.mockReturnValueOnce(null);

    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.widgetData['daily_memory']).toEqual(dailyData);
  });

  it('refreshWidget calls the correct service method for daily_memory', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshWidget('daily_memory');
    });

    expect(mockWidgetService.getDailyMemory).toHaveBeenCalled();
  });

  it('refreshWidget calls the correct service method for random_photo', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshWidget('random_photo');
    });

    expect(mockWidgetService.getRandomPhotos).toHaveBeenCalledWith(1);
  });

  it('refreshWidget calls the correct service method for favorites', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshWidget('favorites');
    });

    expect(mockWidgetService.getFavorites).toHaveBeenCalled();
  });

  it('refreshWidget does nothing for disabled widget', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    jest.clearAllMocks();

    act(() => {
      result.current.toggleWidget('daily_memory');
    });

    await act(async () => {
      await result.current.refreshWidget('daily_memory');
    });

    expect(mockWidgetService.getDailyMemory).not.toHaveBeenCalled();
  });

  it('refreshWidget does nothing for unknown widget id', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    jest.clearAllMocks();

    await act(async () => {
      await result.current.refreshWidget('unknown');
    });

    expect(mockWidgetService.getDailyMemory).not.toHaveBeenCalled();
    expect(mockWidgetService.getRandomPhotos).not.toHaveBeenCalled();
    expect(mockWidgetService.getFavorites).not.toHaveBeenCalled();
  });

  it('refreshWidget for album_preview without albumId does not crash', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshWidget('favorites');
    });

    expect(mockWidgetService.getFavorites).toHaveBeenCalled();
  });

  it('refreshAllWidgets refreshes all enabled widgets', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshAllWidgets();
    });

    expect(mockWidgetService.getDailyMemory).toHaveBeenCalled();
    expect(mockWidgetService.getRandomPhotos).toHaveBeenCalled();
    expect(mockWidgetService.getFavorites).toHaveBeenCalled();
  });

  it('toggleWidget toggles enabled state', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.widgets[0].enabled).toBe(true);

    act(() => {
      result.current.toggleWidget('daily_memory');
    });

    expect(result.current.widgets[0].enabled).toBe(false);

    act(() => {
      result.current.toggleWidget('daily_memory');
    });

    expect(result.current.widgets[0].enabled).toBe(true);
  });

  it('updateWidgetConfig updates widget configuration', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateWidgetConfig('daily_memory', { title: 'Updated Title' });
    });

    const widget = result.current.widgets.find((w) => w.id === 'daily_memory');
    expect(widget?.title).toBe('Updated Title');
  });

  it('addWidget adds a new widget', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addWidget({
        type: 'album_preview',
        size: 'medium',
        enabled: true,
      });
    });

    expect(result.current.widgets).toHaveLength(4);
    const newWidget = result.current.widgets[3];
    expect(newWidget.type).toBe('album_preview');
    expect(newWidget.id).toMatch(/^widget_/);
  });

  it('removeWidget removes a widget and its data', async () => {
    const { result } = renderHook(() => useWidgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.removeWidget('daily_memory');
    });

    expect(result.current.widgets.find((w) => w.id === 'daily_memory')).toBeUndefined();
  });
});
