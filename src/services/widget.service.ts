import { Photo } from '../types/photo';
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

export const WidgetService = {
  /**
   * Get daily memory - photos from this day in previous years
   */
  async getDailyMemory(): Promise<WidgetData> {
    const mediaService = getMediaService();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Get all albums
    const albums = await mediaService.getAlbums(0, 100);
    const memories: Photo[] = [];
    
    // Search through albums for photos from this day in history
    for (const album of albums.slice(0, 5)) {
      try {
        const photos = await mediaService.getPhotosFromAlbum(album.id, 0, 50);
        const historicalPhotos = photos.filter(photo => {
          const photoDate = new Date(photo.createdAt);
          return (
            photoDate.getMonth() === currentMonth &&
            photoDate.getDate() === currentDay &&
            photoDate.getFullYear() < today.getFullYear()
          );
        });
        memories.push(...historicalPhotos);
      } catch (error) {
        console.error('Error fetching photos for daily memory:', error);
      }
    }
    
    // Sort by year (most recent first) and limit to 5
    const sortedMemories = memories
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
    
    // Cache the widget data
    await this.saveWidgetData('daily_memory', widgetData);
    
    return widgetData;
  },

  /**
   * Get random photos for widget
   */
  async getRandomPhotos(count: number = 1): Promise<WidgetData> {
    const mediaService = getMediaService();
    const albums = await mediaService.getAlbums(0, 20);
    
    const allPhotos: Photo[] = [];
    
    // Collect photos from random albums
    for (const album of albums.slice(0, 3)) {
      try {
        const photos = await mediaService.getPhotosFromAlbum(album.id, 0, 20);
        allPhotos.push(...photos);
      } catch (error) {
        console.error('Error fetching random photos:', error);
      }
    }
    
    // Shuffle and pick random photos
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
    
    await this.saveWidgetData('random_photo', widgetData);
    
    return widgetData;
  },

  /**
   * Get album preview for widget
   */
  async getAlbumPreview(albumId: string): Promise<WidgetData> {
    const mediaService = getMediaService();
    const album = await mediaService.getAlbums(0, 100).then(albums => 
      albums.find(a => a.id === albumId)
    );
    
    if (!album) {
      throw new Error('Album not found');
    }
    
    const photos = await mediaService.getPhotosFromAlbum(albumId, 0, 4);
    
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
    
    await this.saveWidgetData(`album_${albumId}`, widgetData);
    
    return widgetData;
  },

  /**
   * Get favorite photos for widget
   */
  async getFavorites(): Promise<WidgetData> {
    const favoriteIds = storageService.get<string[]>(StorageKeys.FAVORITES) || [];
    const mediaService = getMediaService();
    
    const favoritePhotos: Photo[] = [];
    
    for (const photoId of favoriteIds.slice(0, 4)) {
      try {
        const photo = await mediaService.getPhotoById(photoId);
        if (photo) {
          favoritePhotos.push(photo);
        }
      } catch (error) {
        console.error('Error fetching favorite photo:', error);
      }
    }
    
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
    
    await this.saveWidgetData('favorites', widgetData);
    
    return widgetData;
  },

  /**
   * Save widget data to storage
   */
  async saveWidgetData(widgetId: string, data: WidgetData): Promise<void> {
    storageService.set(`${StorageKeys.WIDGET_PREFIX || 'lumora_widget_'}${widgetId}`, data);
  },

  /**
   * Get widget data from storage
   */
  async getWidgetData(widgetId: string): Promise<WidgetData | null> {
    return storageService.get<WidgetData>(`${StorageKeys.WIDGET_PREFIX || 'lumora_widget_'}${widgetId}`);
  },

  /**
   * Update all widgets (call this periodically)
   */
  async updateAllWidgets(): Promise<void> {
    try {
      // Update daily memory
      await this.getDailyMemory();
      
      // Update random photo
      await this.getRandomPhotos(1);
      
      // Update favorites
      await this.getFavorites();
      
      console.log('All widgets updated successfully');
    } catch (error) {
      console.error('Error updating widgets:', error);
    }
  },

  /**
   * Schedule widget updates
   */
  scheduleWidgetUpdates(intervalMinutes: number = 60): void {
    // Update immediately
    this.updateAllWidgets();
    
    // Schedule periodic updates
    setInterval(() => {
      this.updateAllWidgets();
    }, intervalMinutes * 60 * 1000);
  },
};

export default WidgetService;
