import { Photo } from '../types';
import { getMediaService } from './media.service';
import { StorageKeys, storageService } from './storage.service';

export interface WidgetData {
  type: 'daily_memory' | 'random_photo' | 'album_preview' | 'favorites';
  photos: {
    id: string;
    uri: string;
    date: number;
    location?: string;
  }[];
  title: string;
  subtitle?: string;
  updatedAt: number;
}

export type WidgetType = WidgetData['type'];

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  albumId?: string;
  title?: string;
  enabled: boolean;
}

interface CachedWidgetData {
  data: WidgetData;
  timestamp: number;
}

const WIDGET_CACHE_TTL = 5 * 60 * 1000;

const widgetCache = new Map<string, CachedWidgetData>();

function getCachedWidget(key: string): WidgetData | null {
  const cached = widgetCache.get(key);
  if (cached && Date.now() - cached.timestamp < WIDGET_CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    widgetCache.delete(key);
  }
  return null;
}

function setCachedWidget(key: string, data: WidgetData): void {
  widgetCache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(prefix?: string): void {
  if (prefix) {
    const keysToDelete: string[] = [];
    widgetCache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => widgetCache.delete(key));
  } else {
    widgetCache.clear();
  }
}

export const WidgetService = {
  /**
   * Get daily memory - photos from this day in previous years
   */
  async getDailyMemory(): Promise<WidgetData> {
    const cacheKey = 'daily_memory';
    const cached = getCachedWidget(cacheKey);
    if (cached) return cached;

    const mediaService = getMediaService();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const albums = await mediaService.getAlbums(0, 100);

    const results = await Promise.all(
      albums.slice(0, 5).map(album =>
        mediaService
          .getPhotosFromAlbum(album.id, undefined, 50)
          .catch(error => {
            console.error('Error fetching photos for daily memory:', error);
            return { photos: [] as Photo[] };
          })
      )
    );

    const memories: Photo[] = results.flatMap(result => result.photos);

    const historicalPhotos = memories.filter(photo => {
      const photoDate = new Date(photo.createdAt);
      return (
        photoDate.getMonth() === currentMonth &&
        photoDate.getDate() === currentDay &&
        photoDate.getFullYear() < today.getFullYear()
      );
    });

    const sortedMemories = historicalPhotos
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const widgetData: WidgetData = {
      type: 'daily_memory',
      photos: sortedMemories.map(photo => ({
        id: photo.id,
        uri: photo.uri,
        date: photo.createdAt,
        location: photo.location
          ? `${photo.location.latitude.toFixed(2)}, ${photo.location.longitude.toFixed(2)}`
          : undefined,
      })),
      title: `On this day in ${sortedMemories[0]
        ? new Date(sortedMemories[0].createdAt).getFullYear()
        : 'the past'}`,
      subtitle: sortedMemories.length > 0
        ? `${sortedMemories.length} memories`
        : 'No memories today',
      updatedAt: Date.now(),
    };

    setCachedWidget(cacheKey, widgetData);
    await this.saveWidgetData('daily_memory', widgetData);

    return widgetData;
  },

  /**
   * Get random photos for widget
   */
  async getRandomPhotos(count: number = 1): Promise<WidgetData> {
    const cacheKey = `random_photo_${count}`;
    const cached = getCachedWidget(cacheKey);
    if (cached) return cached;

    const mediaService = getMediaService();
    const albums = await mediaService.getAlbums(0, 20);

    const results = await Promise.all(
      albums.slice(0, 3).map(album =>
        mediaService
          .getPhotosFromAlbum(album.id, undefined, 20)
          .catch(error => {
            console.error('Error fetching random photos:', error);
            return { photos: [] as Photo[] };
          })
      )
    );

    const allPhotos: Photo[] = results.flatMap(result => result.photos);

    const shuffled = allPhotos.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const widgetData: WidgetData = {
      type: 'random_photo',
      photos: selected.map(photo => ({
        id: photo.id,
        uri: photo.uri,
        date: photo.createdAt,
      })),
      title: 'Featured Photo',
      subtitle: selected.length > 0 ? 'Tap to view' : 'No photos available',
      updatedAt: Date.now(),
    };

    setCachedWidget(cacheKey, widgetData);
    await this.saveWidgetData('random_photo', widgetData);

    return widgetData;
  },

  /**
   * Get album preview for widget
   */
  async getAlbumPreview(albumId: string): Promise<WidgetData> {
    const cacheKey = `album_${albumId}`;
    const cached = getCachedWidget(cacheKey);
    if (cached) return cached;

    const mediaService = getMediaService();
    const album = await mediaService.getAlbumById(albumId);

    if (!album) {
      throw new Error('Album not found');
    }

    const { photos } = await mediaService.getPhotosFromAlbum(albumId, undefined, 4);

    const widgetData: WidgetData = {
      type: 'album_preview',
      photos: photos.map(photo => ({
        id: photo.id,
        uri: photo.uri,
        date: photo.createdAt,
      })),
      title: album.title,
      subtitle: `${album.count} photos`,
      updatedAt: Date.now(),
    };

    setCachedWidget(cacheKey, widgetData);
    await this.saveWidgetData(cacheKey, widgetData);

    return widgetData;
  },

  /**
   * Get favorite photos for widget
   */
  async getFavorites(): Promise<WidgetData> {
    const cacheKey = 'favorites';
    const cached = getCachedWidget(cacheKey);
    if (cached) return cached;

    const favoriteIds = storageService.get<string[]>(StorageKeys.FAVORITES) || [];
    const mediaService = getMediaService();

    const favoritePhotos = await mediaService.getPhotosByIds(favoriteIds.slice(0, 4));

    const widgetData: WidgetData = {
      type: 'favorites',
      photos: favoritePhotos.map(photo => ({
        id: photo.id,
        uri: photo.uri,
        date: photo.createdAt,
      })),
      title: 'Favorites',
      subtitle: favoritePhotos.length > 0
        ? `${favoritePhotos.length} photos`
        : 'No favorites yet',
      updatedAt: Date.now(),
    };

    setCachedWidget(cacheKey, widgetData);
    await this.saveWidgetData('favorites', widgetData);

    return widgetData;
  },

  /**
   * Save widget data to storage
   */
  async saveWidgetData(widgetId: string, data: WidgetData): Promise<void> {
    await storageService.save(`${StorageKeys.WIDGET_PREFIX}${widgetId}`, data);
  },

  async getWidgetData(widgetId: string): Promise<WidgetData | null> {
    return storageService.get<WidgetData>(`${StorageKeys.WIDGET_PREFIX}${widgetId}`);
  },

  /**
   * Invalidate cached widget data so the next call refetches from media library
   */
  clearCache(prefix?: string): void {
    invalidateCache(prefix);
  },
};

export default WidgetService;
