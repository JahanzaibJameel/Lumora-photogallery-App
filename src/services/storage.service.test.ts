import {
  clearSearchHistory,
  getSearchHistory,
  addSearchHistory,
  storageService,
  StorageKeys,
} from './storage.service';

describe('StorageKeys', () => {
  it('exports only keys with live readers or writers', () => {
    expect(StorageKeys.THEMES).toBe('lumora_themes');
    expect(StorageKeys.FAVORITES).toBe('lumora_favorites');
    expect(StorageKeys.SEARCH_HISTORY).toBe('lumora_search_history');
    expect(StorageKeys.REDUCED_MOTION).toBe('lumora_reduced_motion');
    expect(StorageKeys.WIDGET_PREFIX).toBe('lumora_widget_');
    expect(StorageKeys.WIDGET_CONFIGS).toBe('lumora_widget_configs');
  });
});

describe('StorageService (singleton)', () => {
  beforeEach(() => {
    storageService.clear();
  });

  describe('save / get', () => {
    it('saves and retrieves a JSON-serializable object synchronously', () => {
      const data = { name: 'test', items: [1, 2, 3] };
      storageService.save('key', data);
      expect(storageService.get<typeof data>('key')).toEqual(data);
    });

    it('returns null for a missing key', () => {
      expect(storageService.get('nonexistent')).toBeNull();
    });

    it('returns null when stored value is invalid JSON', () => {
      (storageService as any).mmkv.set('badKey', 'not-json'); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(storageService.get('badKey')).toBeNull();
    });

    it('overwrites an existing value', () => {
      storageService.save('key', 'first');
      storageService.save('key', 'second');
      expect(storageService.get<string>('key')).toBe('second');
    });
  });

  describe('delete', () => {
    it('removes the stored value', () => {
      storageService.save('delKey', { a: 1 });
      storageService.delete('delKey');
      expect(storageService.get('delKey')).toBeNull();
    });
  });

  describe('clear', () => {
    it('removes all stored values', () => {
      storageService.save('key1', 'a');
      storageService.save('key2', 'b');
      storageService.clear();
      expect(storageService.get('key1')).toBeNull();
      expect(storageService.get('key2')).toBeNull();
    });
  });

  describe('contains', () => {
    it('returns true for a stored key', () => {
      storageService.save('hasKey', 'value');
      expect(storageService.contains('hasKey')).toBe(true);
    });

    it('returns false for a missing key', () => {
      expect(storageService.contains('absent')).toBe(false);
    });
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
