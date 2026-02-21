export interface Photo {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  size: number;
  albumId: string;
  createdAt: number;
  modifiedAt: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

export interface PhotoWithAlbum extends Photo {
  albumTitle: string;
}

export type PhotoGridSize = 'small' | 'medium' | 'large';