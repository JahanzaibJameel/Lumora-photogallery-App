export interface Album {
  id: string;
  title: string;
  count: number;
  thumbnailUri?: string;
  createdAt: number;
  updatedAt: number;
}

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
  metadata?: Record<string, unknown>;
  title?: string;
}
