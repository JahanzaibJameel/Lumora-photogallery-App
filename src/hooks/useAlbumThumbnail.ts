import { useEffect, useState } from 'react';
import { getMediaService } from '../services/media.service';

// MediaService owns thumbnail caching and deduplication; this hook only
// bridges a resolved cover URI into component state.
export const useAlbumThumbnail = (albumId: string, initialUri?: string) => {
  const [uri, setUri] = useState(initialUri);

  useEffect(() => {
    if (initialUri) return;

    let cancelled = false;
    getMediaService().getAlbumThumbnail(albumId).then(result => {
      if (!cancelled && result) {
        setUri(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [albumId, initialUri]);

  return uri;
};
