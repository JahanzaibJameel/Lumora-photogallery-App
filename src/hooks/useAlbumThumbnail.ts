import { useEffect, useState } from 'react';
import { getMediaService } from '../services/media.service';
import { errorReporter } from '../utils/errorReporting';
import { categorizeError } from '../utils/errors';

// MediaService owns thumbnail caching and deduplication; this hook only
// bridges a resolved cover URI into component state.
export const useAlbumThumbnail = (albumId: string, initialUri?: string): string | undefined => {
  const [uri, setUri] = useState(initialUri);

  useEffect(() => {
    if (initialUri) return;

    let cancelled = false;
    const fetchThumbnail = async () => {
      try {
        const result = await getMediaService().getAlbumThumbnail(albumId);
        if (!cancelled && result) {
          setUri(result);
        }
      } catch (error) {
        errorReporter.capture(categorizeError(error), {
          hook: 'useAlbumThumbnail',
          action: 'fetchThumbnail',
          albumId,
        });
      }
    };
    fetchThumbnail();

    return () => {
      cancelled = true;
    };
  }, [albumId, initialUri]);

  return uri;
};
