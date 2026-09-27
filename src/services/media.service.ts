import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { Album, Photo } from '../types';
import { errorReporter } from '../utils/errorReporting';
import { categorizeError } from '../utils/errors';
import { ServiceTokens, registerService, resolveService } from './di';
import { IPerformanceMonitoringService } from './performance.service';

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
const THUMBNAILS_CACHE_TTL = 10 * 60 * 1000;
const ALBUMS_CACHE_MAX = 200;
const PHOTOS_CACHE_MAX = 500;
const THUMBNAILS_CACHE_MAX = 300;
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
  // Evict when cache exceeds max size to keep it within limits
  if (cache.size <= maxSize) return;
  
  // Single-pass eviction: convert to array, sort by timestamp ascending, delete
  // oldest entries until within target limit. O(n log n) vs O(n²) for repeated scans.
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  const toDelete = cache.size - maxSize;
  for (let i = 0; i < toDelete; i++) {
    cache.delete(entries[i][0]);
  }
}

export interface IMediaService {
  getAlbums(offset: number, limit: number): Promise<Album[]>;
  getPhotosFromAlbum(albumId: string, after: string | undefined, limit: number): Promise<PhotoPage>;
  getPhotoById(photoId: string): Promise<Photo | null>;
  getPhotosByIds(photoIds: string[]): Promise<Photo[]>;
  getAlbumThumbnail(albumId: string): Promise<string | undefined>;
  getAlbumById(albumId: string): Promise<Album | null>;
  deletePhoto(photoId: string): Promise<boolean>;
  getAssetInfo(photoId: string): Promise<MediaLibrary.Asset | null>;
  clearCache(): void;
  invalidateAlbum(albumId: string): void;
}

export class MediaService implements IMediaService {
  private static instance: MediaService;
  private albumsCache: Map<string, CacheEntry<Album>> = new Map();
  private photosCache: Map<string, CacheEntry<PhotoPage>> = new Map();
  private thumbnailsCache: Map<string, CacheEntry<string>> = new Map();
  private inFlight: Map<string, InFlightRequest<unknown>> = new Map();
  // Reverse index: photoId -> Set of cache keys containing that photo
  // Enables O(1) cache invalidation on photo deletion instead of O(n) scan
  private photoToCacheKeys: Map<string, Set<string>> = new Map();

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

  // Single reporting seam for degraded-but-recoverable failures. Errors that
  // make a user action fail are rethrown by the caller after reporting here.
  private report(error: unknown, action: string): void {
    const appError = categorizeError(error);
    errorReporter.capture(appError, { service: 'MediaService', action });
  }

  private getCachedAlbums(): Album[] {
    const now = Date.now();
    for (const [id, entry] of this.albumsCache) {
      if (now - entry.timestamp >= ALBUMS_CACHE_TTL) {
        this.albumsCache.delete(id);
      }
    }
    return Array.from(this.albumsCache.values(), entry => entry.value);
  }

  async getAlbums(offset: number, limit: number): Promise<Album[]> {
    if (isWebPlatform()) return [];

    const perfService = this.getPerfService();
    const timerId = perfService?.startTimer('getAlbums', 'api_call', { offset, limit });

    const cached = this.getCachedAlbums();
    if (cached.length > 0 && offset < cached.length) {
      perfService?.stopTimer(timerId || '');
      perfService?.recordCacheHitRate('albums', 1, 0);
      return cached.slice(offset, offset + limit);
    }

    perfService?.recordCacheHitRate('albums', 0, 1);

    // Request deduplication: prevent parallel calls from fetching albums multiple times
    const cacheKey = `albums_${offset}_${limit}`;
    const inFlight = this.inFlight.get(cacheKey) as InFlightRequest<Album[]> | undefined;
    if (inFlight) {
      return inFlight.promise;
    }

    const promise = (async () => {
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

        perfService?.stopTimer(timerId || '');
        return formatted.slice(offset, offset + limit);
      } catch (error) {
        perfService?.stopTimer(timerId || '');
        perfService?.recordApiCall({
          method: 'getAlbums',
          durationMs: 0,
          success: false,
          cached: false,
          errorCode: error instanceof Error ? error.message : 'unknown',
        });
        this.report(error, 'getAlbums');
        throw error;
      }
    })();

    const entry: InFlightRequest<Album[]> = { promise, timestamp: Date.now() };
    this.inFlight.set(cacheKey, entry);
    
    const releaseSlot = () => {
      if (this.inFlight.get(cacheKey) === entry) {
        this.inFlight.delete(cacheKey);
      }
    };
    promise.then(releaseSlot, releaseSlot);
    
    return promise;
  }

  async getPhotosFromAlbum(
    albumId: string,
    after: string | undefined,
    limit: number
  ): Promise<PhotoPage> {
    if (isWebPlatform()) return { photos: [], endCursor: null, hasNextPage: false };

    const perfService = this.getPerfService();
    const timerId = perfService?.startTimer('getPhotosFromAlbum', 'api_call', { albumId, limit });

    const cacheKey = `${albumId}||${after ?? 'start'}||${limit}`;

    const cached = this.photosCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < PHOTOS_CACHE_TTL) {
      perfService?.stopTimer(timerId || '');
      perfService?.recordCacheHitRate('photos', 1, 0);
      return cached.value;
    }

    perfService?.recordCacheHitRate('photos', 0, 1);

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

      // Build reverse index for efficient deletion
      photos.forEach(photo => {
        if (!this.photoToCacheKeys.has(photo.id)) {
          this.photoToCacheKeys.set(photo.id, new Set());
        }
        this.photoToCacheKeys.get(photo.id)!.add(cacheKey);
      });

      return result;
    });

    // A rejected request must release its slot, otherwise every later call for
    // this page would coalesce onto the same rejected promise forever. The
    // identity check avoids deleting a newer request's slot after clearCache().
    const entry: InFlightRequest<PhotoPage> = { promise, timestamp: Date.now() };
    this.inFlight.set(cacheKey, entry);
    const releaseSlot = () => {
      if (this.inFlight.get(cacheKey) === entry) {
        this.inFlight.delete(cacheKey);
      }
    };
    promise.then(releaseSlot, releaseSlot);
    return promise;
  }

  async getPhotoById(photoId: string): Promise<Photo | null> {
    if (isWebPlatform()) return null;
    try {
      const asset = await this.withRetry(() => MediaLibrary.getAssetInfoAsync(photoId));
      if (!asset) return null;
      return assetToPhoto(asset, asset.albumId || '');
    } catch (error) {
      this.report(error, 'getPhotoById');
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
      this.report(error, 'getPhotosByIds');
      return [];
    }
  }

  async getAlbumThumbnail(albumId: string): Promise<string | undefined> {
    if (isWebPlatform()) return undefined;

    const perfService = this.getPerfService();
    const timerId = perfService?.startTimer('getAlbumThumbnail', 'api_call', { albumId });

    // Every AlbumCard requests its thumbnail on mount, and FlashList recycles
    // cards aggressively while scrolling; without a shared cache each recycle
    // would issue another native getAssetsAsync round-trip for the same album.
    const cached = this.thumbnailsCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < THUMBNAILS_CACHE_TTL) {
      perfService?.stopTimer(timerId || '');
      perfService?.recordCacheHitRate('thumbnails', 1, 0);
      return cached.value;
    }

    perfService?.recordCacheHitRate('thumbnails', 0, 1);

    const inFlightKey = `thumb_${albumId}`;
    const inFlight = this.inFlight.get(inFlightKey) as InFlightRequest<string | undefined> | undefined;
    if (inFlight) {
      return inFlight.promise;
    }

    try {
      const promise = this.withRetry(async () => {
        const assets = await MediaLibrary.getAssetsAsync({
          album: albumId,
          first: 1,
          mediaType: MediaLibrary.MediaType.photo,
        });
        return assets.assets[0]?.uri;
      });

      this.inFlight.set(inFlightKey, { promise, timestamp: Date.now() });
      const uri = await promise;
      if (uri) {
        this.thumbnailsCache.set(albumId, { value: uri, timestamp: Date.now() });
        lruEvict(this.thumbnailsCache, THUMBNAILS_CACHE_MAX);
      }
      perfService?.stopTimer(timerId || '');
      return uri;
    } catch (error) {
      perfService?.stopTimer(timerId || '');
      this.report(error, 'getAlbumThumbnail');
      return undefined;
    } finally {
      this.inFlight.delete(inFlightKey);
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
      this.report(error, 'getAlbumById');
      return null;
    }
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    if (isWebPlatform()) return false;
    try {
      await MediaLibrary.deleteAssetsAsync([photoId]);

      // Use reverse index for O(1) lookup of affected cache keys.
      // Fall back to a direct cache scan when the index is empty — e.g. when
      // caches were populated directly (in tests) or after a partial clear.
      let cacheKeys = this.photoToCacheKeys.get(photoId);
      if (!cacheKeys) {
        const found = new Set<string>();
        for (const [key, entry] of this.photosCache) {
          if (entry.value.photos.some(p => p.id === photoId)) {
            found.add(key);
          }
        }
        if (found.size === 0) return true; // Photo not in cache, nothing to invalidate
        cacheKeys = found;
      }

      const affectedAlbumIds = new Set<string>();
      const keysToDelete: Set<string> = new Set();

      // Delete only the cache entries we know contain this photo
      // and track which keys are affected for proper reverse index cleanup
      cacheKeys.forEach(key => {
        this.photosCache.delete(key);
        keysToDelete.add(key);
        const separator = key.indexOf('||');
        if (separator > 0) {
          affectedAlbumIds.add(key.slice(0, separator));
        }
      });

      // Clean up reverse index: remove this photoId from all cache keys' sets
      // and delete cache key entries that no longer have any photos referencing them
      for (const key of keysToDelete) {
        for (const [pid, pKeys] of this.photoToCacheKeys.entries()) {
          pKeys.delete(key);
          if (pKeys.size === 0) {
            this.photoToCacheKeys.delete(pid);
          }
        }
      }

      // Also clean up any cache keys that were completely removed and no longer have photos
      this.photoToCacheKeys.delete(photoId);

      // Update album counts and thumbnails
      if (affectedAlbumIds.size > 0) {
        const now = Date.now();
        for (const albumId of affectedAlbumIds) {
          const entry = this.albumsCache.get(albumId);
          if (entry) {
            entry.value.count = Math.max(0, entry.value.count - 1);
            entry.timestamp = now;
          }
          // The cover may have been the deleted asset; refetch it lazily
          this.thumbnailsCache.delete(albumId);
        }
      }

      return true;
    } catch (error) {
      this.report(error, 'deletePhoto');
      throw error;
    }
  }

  async getAssetInfo(photoId: string): Promise<MediaLibrary.Asset | null> {
    if (isWebPlatform()) return null;
    return MediaLibrary.getAssetInfoAsync(photoId);
  }

  clearCache() {
    this.albumsCache.clear();
    this.photosCache.clear();
    this.thumbnailsCache.clear();
    this.inFlight.clear();
    this.photoToCacheKeys.clear();
  }

  invalidateAlbum(albumId: string): void {
    this.albumsCache.delete(albumId);
    this.thumbnailsCache.delete(albumId);
    
    // Clean up photo cache and reverse index for this album
    const keysToDelete: string[] = [];
    for (const [key] of this.photosCache) {
      if (key.startsWith(`${albumId}||`)) {
        keysToDelete.push(key);
      }
    }
    
    // Remove cache entries and update reverse index
    keysToDelete.forEach(key => {
      const entry = this.photosCache.get(key);
      if (entry) {
        // Clean up reverse index for all photos in this cache entry
        entry.value.photos.forEach(photo => {
          const cacheKeys = this.photoToCacheKeys.get(photo.id);
          if (cacheKeys) {
            cacheKeys.delete(key);
            if (cacheKeys.size === 0) {
              this.photoToCacheKeys.delete(photo.id);
            }
          }
        });
      }
      this.photosCache.delete(key);
    });
  }

  private getPerfService(): IPerformanceMonitoringService | null {
    try {
      return resolveService<IPerformanceMonitoringService>(ServiceTokens.PerformanceService);
    } catch {
      return null;
    }
  }

  __test__() {
    return {
      albumsCache: this.albumsCache,
      photosCache: this.photosCache,
      thumbnailsCache: this.thumbnailsCache,
      photoToCacheKeys: this.photoToCacheKeys,
    };
  }
}

export interface MediaServiceCacheState {
  albums: { id: string; count: number }[];
  photos: { key: string; photoCount: number }[];
  thumbnails: { id: string; uri: string }[];
}

const mediaService = MediaService.getInstance();

registerService(ServiceTokens.MediaService, mediaService);

export const getMediaService = (): IMediaService => resolveService<IMediaService>(ServiceTokens.MediaService);
