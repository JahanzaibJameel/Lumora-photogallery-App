import { useEffect, useState } from 'react';
import { getMediaService } from '../services/media.service';
import { cacheThumbnails } from '../services/storage.service';

export const useAlbumThumbnail = (albumId: string, initialUri?: string) => {
  const [uri, setUri] = useState(initialUri);

  useEffect(() => {
    if (initialUri) return;

    let cancelled = false;
    getMediaService().getAlbumThumbnail(albumId).then(result => {
      if (!cancelled && result) {
        setUri(result);
        cacheThumbnails(albumId, [result]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [albumId, initialUri]);

  return uri;
};
