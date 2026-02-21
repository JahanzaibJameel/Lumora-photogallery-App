import { Photo } from './photo';

export interface Album {
  id: string;
  title: string;
  count: number;
  thumbnailUri?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AlbumWithPhotos extends Album {
  photos: Photo[];
}

export type AlbumSortOption = 'name' | 'count' | 'recent';