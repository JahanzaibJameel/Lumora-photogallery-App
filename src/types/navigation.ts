export type RootStackParamList = {
  Albums: undefined;
  Photos: { albumId: string; albumTitle: string };
  PhotoViewer: { photoId: string; albumId: string; initialIndex: number };
  Widgets: undefined;
};

