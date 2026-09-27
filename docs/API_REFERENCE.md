# API Reference

> Comprehensive reference for Lumora's internal APIs, hooks, services, and utilities.

## Table of Contents

- [Hooks](#hooks)
- [Services](#services)
- [Contexts](#contexts)
- [Components](#components)
- [Utilities](#utilities)
- [Types](#types)

---

## Hooks

### useAlbums

Fetches and manages album data from the media library.

```typescript
const {
  albums,
  loading,
  error,
  refreshAlbums,
  loadMore,
  retryLoad,
  hasMore
} = useAlbums();
```

**Returns:**
- `albums: Album[]` — Array of album objects
- `loading: boolean` — Loading state
- `error: AppError | null` — Error object if fetch failed
- `refreshAlbums: () => Promise<void>` — Refresh album list
- `loadMore: () => Promise<void>` — No-op (kept for API compatibility)
- `retryLoad: () => void` — Retry failed load with backoff
- `hasMore: boolean` — Always false (single batch)

**Behavior:**
- Loads all albums in a single batch (0–200)
- Retries up to `MAX_RETRIES = 2` with linear backoff (1s × retryCount)
- Clears error on successful retry

---

### usePhotos

Fetches photos from a specific album with cursor pagination.

```typescript
const {
  photos,
  loading,
  error,
  refreshPhotos,
  loadMore,
  deletePhoto,
  retryLoad,
  hasMore
} = usePhotos(albumId);
```

**Parameters:**
- `albumId: string` — Album ID to fetch photos from

**Returns:**
- `photos: Photo[]` — Array of photo objects
- `loading: boolean` — Initial load state
- `error: AppError | null` — Error if fetch failed
- `refreshPhotos: () => Promise<void>` — Clear and reload
- `loadMore: () => Promise<void>` — Load next page
- `deletePhoto: (id: string) => Promise<boolean>` — Delete photo and update state
- `retryLoad: () => void` — Retry with backoff
- `hasMore: boolean` — Whether more pages exist

**Behavior:**
- Batch size: 30 photos per page
- Automatic deduplication by photo ID
- Refresh clears `MediaService` cache for the album
- Delete updates local state and invalidates cache

---

### usePermission

Manages media library permissions with automatic resume checks.

```typescript
const { permission, checkPermission, requestPermission, openSettings } = usePermission();
```

**Returns:**
- `permission: PermissionStatus` — `undetermined` | `granted` | `denied` | `blocked`
- `checkPermission: () => Promise<void>` — Re-check current permission
- `requestPermission: () => Promise<void>` — Request permission from user
- `openSettings: () => void` — Opens system settings via Linking

**Behavior:**
- Checks permission on mount
- Re-checks on `AppState` change to "active"
- `blocked` state when user permanently denies

---

### useTheme

Access the current theme and color tokens.

```typescript
const { themeMode, isDark, colors, setThemeMode } = useTheme();
```

**Returns:**
- `themeMode: ThemeMode` — `light` | `dark` | `system`
- `isDark: boolean` — Computed dark mode state
- `colors: ColorTokens` — Current color palette
- `setThemeMode: (mode: ThemeMode) => void` — Update theme

**Behavior:**
- Persisted to MMKV under `StorageKeys.THEMES`
- `system` mode follows `Appearance.getColorScheme()`

---

### useReducedMotion

Access reduced motion preference.

```typescript
const reduceMotion = useReducedMotion();
const { reduceMotionMode, setReduceMotionMode } = useReduceMotionMode();
```

**Returns:**
- `reduceMotion: boolean` — Whether to reduce motion
- `reduceMotionMode: ReducedMotionMode` — `system` | `always` | `never`
- `setReduceMotionMode: (mode: ReducedMotionMode) => void` — Update preference

**Behavior:**
- Persisted to MMKV
- `system` reads from `AccessibilityInfo.isReduceMotionEnabled()`
- Applied to navigation transitions and animations

---

### useFavorites

Manage favorited photos.

```typescript
const {
  favorites,
  isFavorite,
  toggleFavorite,
  addFavorite,
  removeFavorite
} = useFavorites();
```

**Returns:**
- `favorites: string[]` — Array of favorited photo IDs
- `isFavorite: (id: string) => boolean` — Check if photo is favorited
- `toggleFavorite: (id: string) => void` — Toggle favorite state
- `addFavorite: (id: string) => void` — Add to favorites
- `removeFavorite: (id: string) => void` — Remove from favorites

**Behavior:**
- Persisted to MMKV under `StorageKeys.FAVORITES`
- Prevents duplicate entries
- All operations sync immediately

---

### useSearchHistory

Track and manage search queries.

```typescript
const { history, recordQuery, clearHistory } = useSearchHistory();
```

**Returns:**
- `history: string[]` — Recent search queries (max 20)
- `recordQuery: (query: string) => void` — Add query to history
- `clearHistory: () => void` — Clear all history

**Behavior:**
- Deduplicates queries (moves existing to front)
- Capped at 20 entries (FIFO)
- Persisted to MMKV under `StorageKeys.SEARCH_HISTORY`

---

### useWidgets

Compose widget configuration and data.

```typescript
const { widgets, refreshAllWidgets, loading } = useWidgets();
```

**Returns:**
- `widgets: WidgetData[]` — Array of widget data objects
- `refreshAllWidgets: () => Promise<void>` — Refresh all enabled widgets
- `loading: boolean` — Whether any widget is loading

**Behavior:**
- Hourly auto-refresh (`REFRESH_INTERVAL = 3600000`)
- Only fetches enabled widgets
- Clears refresh timer on unmount

---

### useAccessibility

Accessibility helpers for interactive elements.

```typescript
const { getButtonProps, getInputProps, enforceTouchTarget } = useAccessibility();
```

**Returns:**
- `getButtonProps: (label, role, hint?) => object` — Button a11y props
- `getInputProps: (label, placeholder, hint?) => object` — Input a11y props
- `enforceTouchTarget: (style) => StyleProp<ViewStyle>` — Ensure 48pt minimum

---

## Services

### MediaService

Singleton for media library access with caching and retry.

```typescript
import { getMediaService } from '@/services/media.service';
const mediaService = getMediaService();
```

**Methods:**

#### getAlbums(offset: number, limit: number): Promise<Album[]>
Fetch albums with pagination.

**Caching:**
- TTL: 5 minutes
- Max entries: 200
- LRU eviction when over capacity

---

#### getPhotosFromAlbum(albumId, after, limit): Promise<PhotoPage>
Fetch photos with cursor pagination.

**Returns:**
```typescript
{
  photos: Photo[];
  endCursor: string;
  hasNextPage: boolean;
}
```

**Caching:**
- TTL: 2 minutes
- Max entries: 500
- Key: `${albumId}_${after}_${limit}`

---

#### getPhotosByIds(ids: string[]): Promise<Photo[]>
Batch fetch photos by ID.

**Behavior:**
- Uses `Promise.all` with `getPhotoById`
- Returns only successful fetches (nulls filtered)

---

#### deletePhoto(id: string): Promise<boolean>
Delete photo with targeted cache invalidation.

**Invalidation:**
- Drops pages containing the photo
- Decrements affected album counts
- Clears affected album thumbnails

---

#### clearCache(): void
Wipe all caches and in-flight requests.

---

### StorageService

Synchronous MMKV wrapper.

```typescript
import { getStorageService, StorageKeys } from '@/services/storage.service';
const storage = getStorageService();
```

**Methods:**

#### save<T>(key: string, value: T): void
Save value to storage (synchronous).

#### get<T>(key: string): T | null
Retrieve value from storage. Returns `null` on missing key or parse error.

#### delete(key: string): void
Remove key from storage.

#### clearAll(): void
Wipe entire storage.

**Storage Keys:**
```typescript
enum StorageKeys {
  THEMES = 'lumora_themes',
  FAVORITES = 'lumora_favorites',
  WIDGET_PREFIX = 'lumora_widget_',
  WIDGET_CONFIGS = 'lumora_widget_configs',
  SEARCH_HISTORY = 'lumora_search_history',
  REDUCED_MOTION = 'lumora_reduced_motion',
  GRID_SIZE = 'lumora_grid_size',
  // ... more keys
}
```

---

### WidgetService

Generate widget data from media library.

```typescript
import WidgetService from '@/services/widget.service';
```

**Methods:**

#### getDailyMemory(): Promise<Photo[]>
Returns up to 5 photos from same month/day in prior years.

#### getRandomPhotos(count: number): Promise<Photo[]>
Returns random photos using Fisher-Yates shuffle.

#### getAlbumPreview(albumId: string): Promise<WidgetData>
Returns album with first 4 photos.

#### getFavorites(): Promise<Photo[]>
Returns up to 4 favorited photos.

**Caching:**
- TTL: 5 minutes
- Cache key per widget type

---

## Contexts

### ThemeContext

Provides theme state and color tokens.

```typescript
<ThemeProvider>
  {children}
</ThemeProvider>
```

**Value:**
```typescript
{
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ColorTokens;
  setThemeMode: (mode: ThemeMode) => void;
}
```

---

### ReducedMotionContext

Provides motion preference.

```typescript
<ReducedMotionProvider>
  {children}
</ReducedMotionProvider>
```

**Value:**
```typescript
{
  reduceMotion: boolean;
  reduceMotionMode: ReducedMotionMode;
  setReduceMotionMode: (mode: ReducedMotionMode) => void;
}
```

---

### GridSizeContext

Provides grid density state.

```typescript
<GridSizeProvider>
  {children}
</GridSizeProvider>
```

**Value:**
```typescript
{
  gridSize: GridSize; // 'small' | 'medium' | 'large'
  cycleGridSize: () => void;
}
```

---

## Components

### AlbumCard

Display album with cover and metadata.

```typescript
<AlbumCard
  album={album}
  onPress={handlePress}
/>
```

**Props:**
- `album: Album` — Album object
- `onPress: () => void` — Press handler

**Features:**
- Linear gradient overlay
- Haptic feedback
- Spring scale animation
- Cover thumbnail loading

---

### PhotoGridItem

Grid item for photo display.

```typescript
<PhotoGridItem
  item={photo}
  index={index}
  onPress={handlePress}
  onLongPress={handleLongPress}
  gridSize={gridSize}
/>
```

**Props:**
- `item: Photo` — Photo object
- `index: number` — Grid index
- `onPress: () => void` — Press handler
- `onLongPress?: () => void` — Long press handler
- `gridSize: GridSize` — Current grid density

---

### EmptyState

Display empty, error, or permission states.

```typescript
<EmptyState
  variant="empty"
  message="No photos found"
  onRetry={handleRetry}
/>
```

**Props:**
- `variant: 'empty' | 'error' | 'permission' | 'no-internet'`
- `message?: string | AppError`
- `onRetry?: () => void`

---

### ErrorBoundary

Catch and display React errors.

```typescript
<ErrorBoundary
  FallbackComponent={CustomFallback}
>
  {children}
</ErrorBoundary>
```

**Props:**
- `children: ReactNode`
- `FallbackComponent?: ComponentType<FallbackProps>`

---

## Utilities

### Error Taxonomy

```typescript
import { categorizeError, AppError } from '@/utils/errors';

const appError = categorizeError(error, 'Albums');
// AppError { category, severity, code, message, context }
```

**Categories:**
- `NETWORK`
- `PERMISSION`
- `STORAGE`
- `MEDIA_LIBRARY`
- `UNKNOWN`

**Severities:**
- `LOW` — Non-critical, auto-recoverable
- `MEDIUM` — User action recommended
- `HIGH` — Blocks core functionality

---

### Error Reporter

```typescript
import { errorReporter } from '@/utils/errorReporting';

errorReporter.capture(error, { extra: 'context' });
```

**Methods:**
- `capture(error, metadata?)` — Report error
- `addListener(callback)` — Subscribe to errors
- `removeListener(callback)` — Unsubscribe

---

## Types

### Album

```typescript
interface Album {
  id: string;
  title: string;
  count: number;
  thumbnailUri?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### Photo

```typescript
interface Photo {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  size: number;
  albumId: string;
  createdAt: Date;
  modifiedAt: Date;
  location?: Location;
  metadata?: PhotoMetadata;
  title?: string; // Declared but not populated
}
```

---

### WidgetData

```typescript
interface WidgetData {
  id: string;
  type: 'daily-memory' | 'random' | 'album-preview' | 'favorites';
  title: string;
  photos: Photo[];
  timestamp: Date;
  albumId?: string;
}
```

---

### AppError

```typescript
interface AppError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  originalError?: Error;
  context?: string;
  retryable: boolean;
}
```

---

## Platform Behavior

### Web Limitations

On `Platform.OS === 'web'`, `MediaService` methods return empty results because `expo-media-library` is native-only:

- `getAlbums()` → `[]`
- `getPhotosFromAlbum()` → `{ photos: [], endCursor: '', hasNextPage: false }`
- `getAlbumThumbnail()` → `undefined`

Screens render natural empty states without crashing.

---

## Performance Notes

### Caching Strategy

All caches use:
- **TTL** — Time-to-live per cache type
- **LRU** — Least-recently-used eviction
- **In-flight dedup** — Concurrent requests share promise

### Batch Operations

Use batch methods when fetching multiple items:

```typescript
// ✅ Good
const photos = await mediaService.getPhotosByIds(ids);

// ❌ Avoid
const photos = await Promise.all(ids.map(id => mediaService.getPhotoById(id)));
```

---

## Testing Utilities

See `src/test-utils/` for:

- **makePhoto / makeAlbum** — Domain fixtures
- **makeMockMediaService** — Typed service mock
- **renderWithProviders** — Component testing helper

Example:

```typescript
import { renderWithProviders, makePhoto } from '@/test-utils';

it('renders a photo', () => {
  const photo = makePhoto({ filename: 'beach.jpg' });
  const { getByText } = renderWithProviders(<PhotoCard photo={photo} />);
  expect(getByText('beach.jpg')).toBeTruthy();
});
```

---

## See Also

- [Architecture](./ARCHITECTURE.md) — System design and data flow
- [Testing](./TESTING.md) — Test conventions and utilities
- [Contributing](./CONTRIBUTING.md) — Development workflow
