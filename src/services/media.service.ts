import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { Album, Photo } from '../types';

// expo-media-library's album/asset APIs are native-only; calling them on web
// throws UnavailabilityError. Callers degrade to natural empty states instead.
const isWebPlatform = (): boolean => Platform.OS === 'web';

interface PhotoPage {
  photos: Photo[];
  endCursor: string | null;
  hasNextPage: boolean;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface InFlightRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

const ALBUMS_CACHE_TTL = 5 * 60 * 1000;
const PHOTOS_CACHE_TTL = 2 * 60 * 1000;
const ALBUMS_CACHE_MAX = 200;
const PHOTOS_CACHE_MAX = 500;
const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

// expo-media-library omits several native-only fields from its public types
// (fileSize/location/exif on assets, createdTime/modificationTime on albums).
// They are accessed through these single audited intersections instead of
// scattered `as any` casts, so typos and wrong shapes become compile errors.
interface AssetRuntimeFields {
  fileSize?: number;
  location?: { latitude?: number; longitude?: number } | null;
  exif?: Record<string, unknown> | null;
}

interface AlbumRuntimeFields {
  createdTime?: number;
  modificationTime?: number;
}

type NativeAsset = MediaLibrary.Asset & AssetRuntimeFields;
type NativeAlbum = MediaLibrary.Album & AlbumRuntimeFields;

function assetToPhoto(asset: MediaLibrary.Asset, albumId: string): Photo {
  const raw = asset as NativeAsset;
  const latitude = raw.location?.latitude;
  const longitude = raw.location?.longitude;
  const location =
    typeof latitude === 'number' && Number.isFinite(latitude) &&
    typeof longitude === 'number' && Number.isFinite(longitude)
      ? { latitude, longitude }
      : undefined;

  return {
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename || 'Unknown',
    width: asset.width,
    height: asset.height,
    size: raw.fileSize || 0,
    albumId,
    createdAt: asset.creationTime || Date.now(),
    modifiedAt: asset.modificationTime || Date.now(),
    location,
    metadata: raw.exif || {},
  };
}

function formatAlbum(album: MediaLibrary.Album): Album {
  const raw = album as NativeAlbum;
  return {
    id: album.id,
    title: album.title || 'Untitled Album',
    count: album.assetCount || 0,
    createdAt: raw.createdTime || Date.now(),
    updatedAt: raw.modificationTime || Date.now(),
  };
}

function lruEvict<K, V>(cache: Map<K, CacheEntry<V>>, maxSize: number): void {
  if (cache.size <= maxSize) return;
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  const toRemove = entries.slice(0, cache.size - maxSize);
  for (const [key] of toRemove) {
    cache.delete(key);
  }
}

export class MediaService {
  private static instance: MediaService;
  private albumsCache: Map<string, CacheEntry<Album>> = new Map();
  private photosCache: Map<string, CacheEntry<PhotoPage>> = new Map();
  private inFlight: Map<string, InFlightRequest<unknown>> = new Map();

  private constructor() {}

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isTransientError(error)) {
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        return this.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  private isTransientError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('network') || msg.includes('timeout') || msg.includes('fetch failed');
  }

  private getCachedAlbums(): Album[] {
    const now = Date.now();
    const entries = Array.from(this.albumsCache.entries());
    const valid = entries.filter(([, entry]) => now - entry.timestamp < ALBUMS_CACHE_TTL);
    this.albumsCache = new Map(valid);
    return valid.map(([, entry]) => entry.value);
  }

  async getAlbums(offset: number, limit: number): Promise<Album[]> {
    if (isWebPlatform()) return [];

    const cached = this.getCachedAlbums();
    if (cached.length > 0 && offset < cached.length) {
      return cached.slice(offset, offset + limit);
    }

    try {
      const albums = await this.withRetry(() =>
        MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true })
      );

      const formatted = albums.map(formatAlbum);
      const now = Date.now();
      for (const album of formatted) {
        this.albumsCache.set(album.id, { value: album, timestamp: now });
      }
      lruEvict(this.albumsCache, ALBUMS_CACHE_MAX);

      return formatted.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }
  }

  async getPhotosFromAlbum(
    albumId: string,
    after: string | undefined,
    limit: number
  ): Promise<PhotoPage> {
    if (isWebPlatform()) return { photos: [], endCursor: null, hasNextPage: false };

    const cacheKey = `${albumId}_${after ?? 'start'}_${limit}`;

    const cached = this.photosCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < PHOTOS_CACHE_TTL) {
      return cached.value;
    }

    const inFlight = this.inFlight.get(cacheKey) as InFlightRequest<PhotoPage> | undefined;
    if (inFlight) {
      return inFlight.promise;
    }

    const promise = this.withRetry(async () => {
      const assets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        first: limit,
        after,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const photos = assets.assets.map(asset => assetToPhoto(asset, albumId));
      const result: PhotoPage = {
        photos,
        endCursor: assets.endCursor ?? null,
        hasNextPage: assets.hasNextPage ?? false,
      };

      const now = Date.now();
      this.photosCache.set(cacheKey, { value: result, timestamp: now });
      lruEvict(this.photosCache, PHOTOS_CACHE_MAX);
      this.inFlight.delete(cacheKey);

      return result;
    });

    this.inFlight.set(cacheKey, { promise, timestamp: Date.now() });
    return promise;
  }

  async getPhotoById(photoId: string): Promise<Photo | null> {
    if (isWebPlatform()) return null;
    try {
      const asset = await this.withRetry(() => MediaLibrary.getAssetInfoAsync(photoId));
      if (!asset) return null;
      return assetToPhoto(asset, asset.albumId || '');
    } catch (error) {
      console.error('Error fetching photo:', error);
      return null;
    }
  }

  async getPhotosByIds(photoIds: string[]): Promise<Photo[]> {
    if (photoIds.length === 0 || isWebPlatform()) return [];
    try {
      const photos = await Promise.all(
        photoIds.map(id => this.getPhotoById(id))
      );
      return photos.filter((photo): photo is Photo => photo !== null);
    } catch (error) {
      console.error('Error fetching photos by IDs:', error);
      return [];
    }
  }

  async getAlbumThumbnail(albumId: string): Promise<string | undefined> {
    if (isWebPlatform()) return undefined;
    try {
      const assets = await this.withRetry(() =>
        MediaLibrary.getAssetsAsync({
          album: albumId,
          first: 1,
          mediaType: MediaLibrary.MediaType.photo,
        })
      );
      return assets.assets[0]?.uri;
    } catch (error) {
      console.error('Error fetching album thumbnail:', error);
      return undefined;
    }
  }

  async getAlbumById(albumId: string): Promise<Album | null> {
    if (isWebPlatform()) return null;

    const cached = this.albumsCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < ALBUMS_CACHE_TTL) {
      return cached.value;
    }

    try {
      const albums = await this.withRetry(() =>
        MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true })
      );

      const album = albums.find(a => a.id === albumId);
      if (!album) return null;

      const formatted = formatAlbum(album);
      this.albumsCache.set(formatted.id, { value: formatted, timestamp: Date.now() });
      lruEvict(this.albumsCache, ALBUMS_CACHE_MAX);

      return formatted;
    } catch (error) {
      console.error('Error fetching album:', error);
      return null;
    }
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    if (isWebPlatform()) return false;
    try {
    await MediaLibrary.deleteAssetsAsync([photoId]);

    // Targeted invalidation: drop only the cached pages that actually contain
    // the deleted photo (cache keys are `${albumId}_${after}_${limit}`, so key
    // matching alone never hits), and decrement counts solely for albums those
    // pages belong to instead of every cached album.
    const affectedAlbumIds = new Set<string>();
    for (const [key, entry] of this.photosCache) {
      if (!entry.value.photos.some(photo => photo.id === photoId)) continue;
      this.photosCache.delete(key);
      const separator = key.indexOf('_');
      if (separator > 0) affectedAlbumIds.add(key.slice(0, separator));
    }

    if (affectedAlbumIds.size > 0) {
      const now = Date.now();
      for (const [albumId, entry] of this.albumsCache) {
        if (!affectedAlbumIds.has(albumId)) continue;
        entry.value.count = Math.max(0, entry.value.count - 1);
        entry.timestamp = now;
      }
    }

      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  async getAssetInfo(photoId: string) {
    if (isWebPlatform()) return null;
    return MediaLibrary.getAssetInfoAsync(photoId);
  }

  clearCache() {
    this.albumsCache.clear();
    this.photosCache.clear();
    this.inFlight.clear();
  }
}

export const getMediaService = () => MediaService.getInstance();
