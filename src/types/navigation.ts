
export type RootStackParamList = {
  Albums: undefined;
  Photos: { albumId: string; albumTitle: string };
  PhotoViewer: { photoId: string; albumId: string; initialIndex: number };
  Settings: undefined;
  Widgets: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}