# Search Feature

Lumora includes a search feature with history tracking for quick access to frequently searched terms.

## Overview

Search is available on the Photos screen, accessible via the search icon in the header. It provides:

- **Real-time filtering** — Searches photos by filename as you type
- **Debounced input** — 300ms delay to avoid excessive re-renders
- **Search history** — Recent searches stored locally (max 20)
- **History dropdown** — Tap to reuse previous queries
- **Clear functionality** — Clear current search or entire history

## User Experience

### Opening Search

1. Navigate to any album (Photos screen)
2. Tap the **search icon** in the header
3. The search bar appears, replacing the album title

### Using Search History

When the search bar is focused and empty, a dropdown appears showing your recent searches:

- **Recent Searches header** — Shows the dropdown purpose
- **Search history items** — Tap any item to instantly search for it again
- **Time icon** — Indicates this is a historical search
- **Arrow icon** — Visual cue to populate the search field
- **Clear All button** — Removes all search history

### Searching

1. Type your query in the search bar
2. Results filter automatically as you type (300ms debounce)
3. The history dropdown hides when text is present
4. Tap the **×** icon to clear the current search
5. When cleared and still focused, history dropdown reappears

### Search Behavior

- **Case-insensitive** — "beach" matches "Beach", "BEACH", etc.
- **Substring matching** — Searches within filenames
- **Local scope** — Only searches photos already loaded in current album
- **Empty results** — Shows "No Results" message with option to refresh

## Technical Details

### Components

**SearchBar** (`src/components/primitives/SearchBar.tsx`)
- Controlled text input with focus management
- Dropdown rendering with FlatList
- History item selection and clearing
- Accessibility labels and hints

**BlurHeader** (`src/components/BlurHeader.tsx`)
- Integrates SearchBar into header
- Manages search visibility toggle
- Passes search history and callbacks

### Hooks

**useSearchHistory** (`src/hooks/useSearch.ts`)
```typescript
const { history, recordQuery, clearHistory } = useSearchHistory();
```

- `history: string[]` — Array of recent searches (max 20)
- `recordQuery(query: string)` — Adds query to history
- `clearHistory()` — Removes all history

**useDebouncedValue** (`src/hooks/useSearch.ts`)
```typescript
const debouncedQuery = useDebouncedValue(searchQuery, 300);
```

Debounces input to reduce filter operations.

### Storage

Search history is persisted using MMKV:
- **Key**: `StorageKeys.SEARCH_HISTORY`
- **Format**: JSON array of strings
- **Max size**: 20 items (oldest removed first)
- **Deduplication**: Existing items moved to front

See `src/services/storage.service.ts` for implementation.

### Integration

**PhotosScreen** (`src/screens/PhotosScreen.tsx`)
```typescript
const { history, recordQuery, clearHistory } = useSearchHistory();
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebouncedValue(searchQuery, 300);

const filteredPhotos = useMemo(() => {
  const q = debouncedQuery.trim().toLowerCase();
  if (!q) return photos;
  return photos.filter(p => p.filename?.toLowerCase().includes(q));
}, [photos, debouncedQuery]);
```

The screen filters photos client-side and records queries as they're typed.

## Accessibility

- **Screen reader support** — All interactive elements properly labeled
- **Keyboard navigation** — Return key submits search
- **Focus management** — Dropdown shows/hides based on focus state
- **Live regions** — Search results announced as "polite"
- **Touch targets** — All buttons meet 48pt minimum

## Limitations

### Current Scope

- **Album-scoped** — Searches only photos in the current album
- **Loaded photos only** — Doesn't search photos not yet loaded via pagination
- **Filename only** — Doesn't search metadata, tags, or album names
- **No fuzzy matching** — Exact substring matching only

### Future Enhancements

See [`ROADMAP.md`](ROADMAP.md) for planned improvements:

- Cross-album search
- Full-library search with SQLite FTS
- Metadata search (date, location, dimensions)
- Search suggestions and autocomplete
- Advanced filters (date range, file type)

## Testing

Search functionality has comprehensive test coverage:

**SearchBar Tests** (`src/components/primitives/SearchBar.test.tsx`)
- History dropdown visibility
- History item selection
- Clear all functionality
- Keyboard interaction
- Accessibility

**useSearchHistory Tests** (`src/hooks/useSearch.test.ts`)
- History loading and persistence
- Recording queries
- Clearing history
- Deduplication

**useDebouncedValue Tests** (`src/hooks/useSearch.test.ts`)
- Debounce timing
- Rapid value changes
- Cleanup on unmount

**PhotosScreen Integration** (`src/screens/PhotosScreen.test.tsx`)
- Search state management
- Filtered results
- Empty states

## Privacy

- **Local storage only** — Search history never leaves the device
- **No telemetry** — Searches are not tracked or logged
- **User control** — Clear history at any time
- **No accounts** — No sync across devices

See [`SECURITY.md`](../SECURITY.md) for Lumora's privacy approach.
