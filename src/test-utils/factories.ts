import * as MediaLibrary from 'expo-media-library';
import { WidgetData, WidgetConfig } from '../services/widget.service';
import { Photo, Album } from '../types';

export const makePhoto = (overrides: Partial<Photo> = {}): Photo => {
  const id = overrides.id ?? 'p1';
  return {
    id,
    uri: overrides.uri ?? `file://${id}.jpg`,
    filename: overrides.filename ?? `${id}.jpg`,
    width: overrides.width ?? 800,
    height: overrides.height ?? 600,
    size: overrides.size ?? 1000,
    albumId: overrides.albumId ?? 'album-1',
    createdAt: overrides.createdAt ?? 1000,
    modifiedAt: overrides.modifiedAt ?? 2000,
    location: overrides.location,
    metadata: overrides.metadata,
    title: overrides.title,
  };
};

export const makeAlbum = (idOrOverrides: string | Partial<Album> = {}): Album => {
  const overrides: Partial<Album> =
    typeof idOrOverrides === 'string' ? { id: idOrOverrides } : idOrOverrides;
  return {
    id: overrides.id ?? 'a1',
    title: overrides.title ?? 'Test Album',
    count: overrides.count ?? 10,
    thumbnailUri: overrides.thumbnailUri ?? 'file://thumb.jpg',
    createdAt: overrides.createdAt ?? 1000,
    updatedAt: overrides.updatedAt ?? 2000,
  };
};

export const makeAlbumResult = (overrides: Partial<Album> = {}): Album => ({
  id: overrides.id ?? 'album-1',
  title: overrides.title ?? 'Test Album',
  count: overrides.count ?? 10,
  thumbnailUri: overrides.thumbnailUri ?? 'file://thumb.jpg',
  createdAt: overrides.createdAt ?? 1000,
  updatedAt: overrides.updatedAt ?? 2000,
});

export const makeFullBatch = (startId: number, count: number = 20): Album[] =>
  Array.from({ length: count }, (_, i) => makeAlbum(`a${startId + i}`));

export const makeWidgetData = (overrides: Partial<WidgetData> = {}): WidgetData => ({
  type: overrides.type ?? 'daily_memory',
  photos: overrides.photos ?? [],
  title: overrides.title ?? 'Test Widget',
  subtitle: overrides.subtitle ?? 'subtitle',
  updatedAt: overrides.updatedAt ?? Date.now(),
});

export const makeWidgetConfig = (overrides: Partial<WidgetConfig> = {}): WidgetConfig => ({
  id: overrides.id ?? 'widget-1',
  type: overrides.type ?? 'daily_memory',
  size: overrides.size ?? 'medium',
  albumId: overrides.albumId,
  title: overrides.title ?? 'Test Widget',
  enabled: overrides.enabled ?? true,
});

type MockMediaLibraryAlbum = MediaLibrary.Album & {
  createdTime?: number;
  modificationTime?: number;
};

export const makeMediaLibraryAlbum = (overrides: Partial<{
  id: string;
  title: string;
  assetCount: number;
  startTime: number;
  endTime: number;
  createdTime: number;
  modificationTime: number;
}> = {}): MockMediaLibraryAlbum => ({
  id: overrides.id ?? 'album-1',
  title: overrides.title ?? 'Test Album',
  assetCount: overrides.assetCount ?? 10,
  startTime: overrides.startTime ?? 0,
  endTime: overrides.endTime ?? 0,
  createdTime: overrides.createdTime,
  modificationTime: overrides.modificationTime,
});

type MockMediaLibraryAsset = MediaLibrary.Asset & {
  fileSize?: number;
  location?: { latitude?: number; longitude?: number } | null;
  exif?: Record<string, unknown> | null;
};

export const makeMediaLibraryAsset = (overrides: Partial<{
  id: string;
  uri: string;
  filename: string;
  mediaType: MediaLibrary.MediaTypeValue;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  duration: number;
  fileSize: number;
  location: { latitude: number; longitude: number } | null;
  exif: Record<string, unknown> | null;
}> = {}): MockMediaLibraryAsset => ({
  id: overrides.id ?? 'asset-1',
  uri: overrides.uri ?? 'file://photo1.jpg',
  filename: overrides.filename ?? 'photo1.jpg',
  mediaType: overrides.mediaType ?? MediaLibrary.MediaType.photo,
  width: overrides.width ?? 1080,
  height: overrides.height ?? 720,
  creationTime: overrides.creationTime ?? 3000,
  modificationTime: overrides.modificationTime ?? 4000,
  duration: overrides.duration ?? 0,
  fileSize: overrides.fileSize,
  location: overrides.location,
  exif: overrides.exif,
});
