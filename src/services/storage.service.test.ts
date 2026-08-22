import {
  cacheThumbnails,
  clearSearchHistory,
  getSearchHistory,
  addSearchHistory,
  loadCachedThumbnails,
  storageService,
  StorageKeys,
} from './storage.service';

describe('StorageKeys', () => {
  it('exports all expected keys', () => {
    expect(StorageKeys.ALBUMS).toBe('lumora_albums');
    expect(StorageKeys.PHOTOS).toBe('lumora_photos');
    expect(StorageKeys.SETTINGS).toBe('lumora_settings');
    expect(StorageKeys.THEMES).toBe('lumora_themes');
    expect(StorageKeys.FAVORITES).toBe('lumora_favorites');
    expect(StorageKeys.SEARCH_HISTORY).toBe('lumora_search_history');
    expect(StorageKeys.REDUCED_MOTION).toBe('lumora_reduced_motion');
    expect(StorageKeys.WIDGET_PREFIX).toBe('lumora_widget_');
    expect(StorageKeys.CACHE).toBe('lumora_cache');
    expect(StorageKeys.BIOMETRIC_CONFIG).toBe('lumora_biometric_config');
    expect(StorageKeys.SCREENSHOT_CONFIG).toBe('lumora_screenshot_config');
  });
});

describe('StorageService (singleton)', () => {
  beforeEach(() => {
    storageService.clear();
  });

  describe('init', () => {
    it('resolves immediately without error', async () => {
      await expect(storageService.init()).resolves.toBeUndefined();
    });
  });

  describe('save / get', () => {
    it('saves and retrieves a JSON-serializable object', async () => {
      const data = { name: 'test', items: [1, 2, 3] };
      await storageService.save('key', data);
      expect(storageService.get<typeof data>('key')).toEqual(data);
    });

    it('returns null for a missing key', () => {
      expect(storageService.get('nonexistent')).toBeNull();
    });

    it('returns null when stored value is invalid JSON', async () => {
      (storageService as any).mmkv.set('badKey', 'not-json'); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(storageService.get('badKey')).toBeNull();
    });

    it('overwrites an existing value', async () => {
      await storageService.save('key', 'first');
      await storageService.save('key', 'second');
      expect(storageService.get('key')).toBe('second');
    });
  });

  describe('set (alias)', () => {
    it('delegates to save', async () => {
      await storageService.set('aliasKey', { foo: 'bar' });
      expect(storageService.get('aliasKey')).toEqual({ foo: 'bar' });
    });
  });

  describe('getString', () => {
    it('returns a stored string value', async () => {
      await storageService.save('strKey', 'hello');
      expect(storageService.getString('strKey')).toBe('hello');
    });

    it('returns null for a missing key', () => {
      expect(storageService.getString('missing')).toBeNull();
    });
  });

  describe('getNumber', () => {
    it('returns a stored number', () => {
      (storageService as any).mmkv.set('numKey', 42); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(storageService.getNumber('numKey')).toBe(42);
    });

    it('returns null for a missing key', () => {
      expect(storageService.getNumber('missing')).toBeNull();
    });
  });

  describe('getBoolean', () => {
    it('returns a stored boolean', () => {
      (storageService as any).mmkv.set('boolKey', true); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(storageService.getBoolean('boolKey')).toBe(true);
    });

    it('returns null for a missing key', () => {
      expect(storageService.getBoolean('missing')).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes the stored value', async () => {
      await storageService.save('delKey', 'value');
      await storageService.delete('delKey');
      expect(storageService.getString('delKey')).toBeNull();
    });
  });

  describe('clear', () => {
    it('removes all stored values', async () => {
      await storageService.save('key1', 'a');
      await storageService.save('key2', 'b');
      await storageService.clear();
      expect(storageService.getString('key1')).toBeNull();
      expect(storageService.getString('key2')).toBeNull();
    });
  });

  describe('contains', () => {
    it('returns true for a stored key', async () => {
      await storageService.save('hasKey', 'value');
      expect(storageService.contains('hasKey')).toBe(true);
    });

    it('returns false for a missing key', () => {
      expect(storageService.contains('absent')).toBe(false);
    });
  });
});

describe('cacheThumbnails', () => {
  beforeEach(() => storageService.clear());

  it('saves thumbnail URIs under the album cache key', async () => {
    await cacheThumbnails('album-1', ['uri1', 'uri2']);
    const cached = loadCachedThumbnails('album-1');
    expect(cached).toEqual(['uri1', 'uri2']);
  });

  it('overwrites previously cached thumbnails', async () => {
    await cacheThumbnails('album-1', ['uri1']);
    await cacheThumbnails('album-1', ['uri2', 'uri3']);
    expect(loadCachedThumbnails('album-1')).toEqual(['uri2', 'uri3']);
  });
});

describe('loadCachedThumbnails', () => {
  beforeEach(() => storageService.clear());

  it('returns null when no cache exists', () => {
    expect(loadCachedThumbnails('no-cache-album')).toBeNull();
  });

  it('returns null when cached value is not an array', async () => {
    await storageService.save(`${StorageKeys.CACHE}_thumbnails_bad`, 'not-an-array');
    expect(loadCachedThumbnails('bad')).toBeNull();
  });

  it('filters out non-string entries', async () => {
    const key = `${StorageKeys.CACHE}_thumbnails_mixed`;
    await storageService.save(key, ['valid', 42, null, 'also-valid', undefined]);
    const result = loadCachedThumbnails('mixed');
    expect(result).toEqual(['valid', 'also-valid']);
  });

  it('returns null when all entries are non-strings', async () => {
    const key = `${StorageKeys.CACHE}_thumbnails_onlynonstrings`;
    await storageService.save(key, [42, null, undefined]);
    expect(loadCachedThumbnails('onlynonstrings')).toBeNull();
  });
});

describe('search history helpers', () => {
  beforeEach(() => storageService.clear());

  describe('addSearchHistory', () => {
    it('adds a query to an empty history', () => {
      addSearchHistory('cats');
      expect(getSearchHistory()).toEqual(['cats']);
    });

    it('prepends new queries (most recent first)', () => {
      addSearchHistory('cats');
      addSearchHistory('dogs');
      expect(getSearchHistory()).toEqual(['dogs', 'cats']);
    });

    it('does not add duplicate queries', () => {
      addSearchHistory('cats');
      addSearchHistory('cats');
      expect(getSearchHistory()).toEqual(['cats']);
    });

    it('caps history at 20 entries', () => {
      for (let i = 0; i < 25; i++) {
        addSearchHistory(`query-${i}`);
      }
      const history = getSearchHistory();
      expect(history).toHaveLength(20);
      expect(history[0]).toBe('query-24');
      expect(history[19]).toBe('query-5');
    });
  });

  describe('clearSearchHistory', () => {
    it('empties the search history', () => {
      addSearchHistory('cats');
      addSearchHistory('dogs');
      clearSearchHistory();
      expect(getSearchHistory()).toEqual([]);
    });
  });

  describe('getSearchHistory', () => {
    it('returns an empty array when no history is stored', () => {
      expect(getSearchHistory()).toEqual([]);
    });
  });
});
