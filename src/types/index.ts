// This replaces ALL other type files

export interface Album {
  id: string;
  title: string;
  count: number;
  thumbnailUri?: string;
  createdAt: number;
}

export interface Photo {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  albumId: string;
  createdAt: number;
}

// Navigation types
export type RootStackParamList = {
  Albums: undefined;
  Photos: { albumId: string; albumTitle: string };
  PhotoViewer: { photoId: string; albumId: string; initialIndex: number };
};