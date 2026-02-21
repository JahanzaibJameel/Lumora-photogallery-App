import * as MediaLibrary from 'expo-media-library';
import { Album } from '../types/album';
import { Photo } from '../types/photo';

export class MediaService {
  private static instance: MediaService;
  private albumsCache: Map<string, Album> = new Map();
  private photosCache: Map<string, Photo[]> = new Map();

  private constructor() {}

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  async getAlbums(offset: number, limit: number): Promise<Album[]> {
    try {
      const albums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      const formattedAlbums: Album[] = await Promise.all(
        albums.slice(offset, offset + limit).map(async (album) => {
          // Get the first photo for thumbnail
          const assets = await MediaLibrary.getAssetsAsync({
            album: album,
            first: 1,
            mediaType: MediaLibrary.MediaType.photo,
          });

          return {
            id: album.id,
            title: album.title || 'Untitled Album',
            count: album.assetCount || 0,
            thumbnailUri: assets.assets[0]?.uri,
            createdAt: (album as any).createdTime || Date.now(),
            updatedAt: (album as any).modificationTime || Date.now(),
          };
        })
      );

      // Cache albums
      formattedAlbums.forEach(album => {
        this.albumsCache.set(album.id, album);
      });

      return formattedAlbums;
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }
  }

  async getPhotosFromAlbum(
    albumId: string,
    offset: number,
    limit: number
  ): Promise<Photo[]> {
    try {
      const cacheKey = `${albumId}_${offset}_${limit}`;
      const cached = this.photosCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const album = await MediaLibrary.getAlbumAsync(albumId);
      if (!album) {
        throw new Error('Album not found');
      }

      const assets = await MediaLibrary.getAssetsAsync({
        album: album,
        first: limit,
        after: offset > 0 ? String(offset) : undefined,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const photos: Photo[] = assets.assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename || 'Unknown',
        width: asset.width,
        height: asset.height,
        size: (asset as any).fileSize || 0,
        albumId,
        createdAt: asset.creationTime || Date.now(),
        modifiedAt: asset.modificationTime || Date.now(),
        location: (asset as any).location
          ? {
              latitude: (asset as any).location.latitude,
              longitude: (asset as any).location.longitude,
            }
          : undefined,
        metadata: (asset as any).exif || {}
      }));

      // Cache photos
      this.photosCache.set(cacheKey, photos);

      return photos;
    } catch (error) {
      console.error('Error fetching photos:', error);
      throw error;
    }
  }

  async getPhotoById(photoId: string): Promise<Photo | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(photoId);
      if (!asset) return null;

      return {
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename || 'Unknown',
        width: asset.width,
        height: asset.height,
        size: (asset as any).fileSize || 0,
        albumId: asset.albumId || '',
        createdAt: asset.creationTime || Date.now(),
        modifiedAt: asset.modificationTime || Date.now(),
        location: (asset as any).location
          ? {
              latitude: (asset as any).location.latitude,
              longitude: (asset as any).location.longitude,
            }
          : undefined,
        metadata: (asset as any).exif || {}
      };
    } catch (error) {
      console.error('Error fetching photo:', error);
      return null;
    }
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      await MediaLibrary.deleteAssetsAsync([photoId]);
      
      // Clear relevant caches
      this.photosCache.clear();
      this.albumsCache.clear();
      
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  async getAssetInfo(photoId: string) {
    return MediaLibrary.getAssetInfoAsync(photoId);
  }

  clearCache() {
    this.albumsCache.clear();
    this.photosCache.clear();
  }
}

export const getMediaService = () => MediaService.getInstance();