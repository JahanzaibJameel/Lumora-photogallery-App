import { renderHook, act } from '@testing-library/react-native';
import WidgetService from '../services/widget.service';
import { useWidgetData } from './useWidgetData';

jest.mock('../services/widget.service');

const mockWidgetService = WidgetService as jest.Mocked<typeof WidgetService>;

const makeWidget = (overrides: Partial<import('../services/widget.service').WidgetConfig> = {}): import('../services/widget.service').WidgetConfig => ({
  id: overrides.id ?? 'widget-1',
  type: overrides.type ?? 'daily_memory',
  size: overrides.size ?? 'medium',
  albumId: overrides.albumId,
  title: overrides.title ?? 'Test Widget',
  enabled: overrides.enabled ?? true,
});

describe('useWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWidgetService.getWidgetData.mockResolvedValue(null);
    mockWidgetService.getDailyMemory.mockResolvedValue({
      type: 'daily_memory',
      photos: [],
      title: 'Daily Memory',
      subtitle: 'No memories today',
      updatedAt: Date.now(),
    });
    mockWidgetService.getRandomPhotos.mockResolvedValue({
      type: 'random_photo',
      photos: [],
      title: 'Featured Photo',
      subtitle: 'No photos available',
      updatedAt: Date.now(),
    });
    mockWidgetService.getAlbumPreview.mockResolvedValue({
      type: 'album_preview',
      photos: [],
      title: 'Album Preview',
      subtitle: '0 photos',
      updatedAt: Date.now(),
    });
    mockWidgetService.getFavorites.mockResolvedValue({
      type: 'favorites',
      photos: [],
      title: 'Favorites',
      subtitle: 'No favorites yet',
      updatedAt: Date.now(),
    });
    mockWidgetService.saveWidgetData.mockResolvedValue(undefined);
    (mockWidgetService.clearCache as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns the expected hook shape', () => {
    const { result } = renderHook(() => useWidgetData());
    expect(result.current).toHaveProperty('widgetData');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('refreshWidget');
    expect(result.current).toHaveProperty('refreshAllWidgets');
  });

  it('starts with empty widgetData', () => {
    const { result } = renderHook(() => useWidgetData());
    expect(result.current.widgetData).toEqual({});
  });

  it('refreshWidget fetches data for the correct widget type', async () => {
    const { result } = renderHook(() => useWidgetData());

    await act(async () => {
      await result.current.refreshWidget(makeWidget({ id: 'daily', type: 'daily_memory' }));
    });

    expect(mockWidgetService.getDailyMemory).toHaveBeenCalled();
    expect(result.current.widgetData['daily']).toBeDefined();
  });

  it('refreshWidget does nothing for disabled widget', async () => {
    const { result } = renderHook(() => useWidgetData());
    jest.clearAllMocks();

    await act(async () => {
      await result.current.refreshWidget(makeWidget({ id: 'w1', enabled: false }));
    });

    expect(mockWidgetService.getDailyMemory).not.toHaveBeenCalled();
    expect(mockWidgetService.getRandomPhotos).not.toHaveBeenCalled();
  });

  it('refreshWidget logs but does not throw for unknown widget type', async () => {
    mockWidgetService.getDailyMemory.mockRejectedValue(new Error('Unknown widget type'));

    const { result } = renderHook(() => useWidgetData());

    await act(async () => {
      await result.current.refreshWidget(makeWidget({ id: 'w1', type: 'unknown' as any }));
    });

    expect(result.current.widgetData).toEqual({});
  });

  it('refreshAllWidgets loads all enabled widgets', async () => {
    const widgets = [
      makeWidget({ id: 'daily', type: 'daily_memory' }),
      makeWidget({ id: 'random', type: 'random_photo' }),
      makeWidget({ id: 'fav', type: 'favorites', enabled: false }),
    ];

    const { result } = renderHook(() => useWidgetData());

    await act(async () => {
      await result.current.refreshAllWidgets(widgets);
    });

    expect(mockWidgetService.getDailyMemory).toHaveBeenCalled();
    expect(mockWidgetService.getRandomPhotos).toHaveBeenCalled();
    expect(mockWidgetService.getFavorites).not.toHaveBeenCalled();
    expect(result.current.widgetData['daily']).toBeDefined();
    expect(result.current.widgetData['random']).toBeDefined();
  });
});
