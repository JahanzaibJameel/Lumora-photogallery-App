# Architecture

## Overview

Lumora follows a **layered architecture** with clear separation of concerns. The codebase is organized from the screen layer down to the utility layer, with services acting as singletons for data access.

```
Screens → Hooks → Services → Native Modules (expo-media-library, MMKV)
                       ↖ Contexts (Theme, ReducedMotion)
                       ↖ Components (shared UI)
```

## Directory Structure

```text
src/
├── app.tsx              # Root app component: providers, status bar, error boundary
├── index.js             # React Native entry point
│
├── components/          # Shared, reusable UI components
│   ├── AlbumCard.tsx        — Album grid tile with press animations
│   ├── BlurHashImage.tsx    — Image component with fade-in, blurhash, and expo-image caching
│   ├── BlurHeader.tsx       — Blurred top header with search toggle and widgets button
│   ├── EmptyState.tsx       — Permission / empty / error / no-internet states
│   ├── ErrorBoundary.tsx    — Root error boundary with fallback UI
│   ├── PhotoGridItem.tsx    — Photo grid tile with enter animation and press feedback
│   ├── Skeleton.tsx         — Album and photo skeleton placeholders
│   └── primitives/          # Stateless base components
│       ├── IconButton.tsx   — Accessible icon button (48×48 minimum touch target)
│       ├── SearchBar.tsx    — Styled search input with clear button
│       └── Text.tsx         — Typography primitive with variant support
│
├── contexts/            # Cross-cutting React Context providers
│   ├── ReducedMotionContext.tsx  — System/manual reduced motion with MMKV persistence
│   └── ThemeContext.tsx         — Light/dark/system theme with MMKV persistence
│
├── hooks/               # Custom React hooks (data fetching + UI logic)
│   ├── useAlbums.ts         # Album list fetching, pagination, deduplication, thumbnail caching
│   ├── usePermission.tsx    # Media library permission check/request flow
│   ├── usePhotos.ts         # Photo list fetching, pagination, deletion, thumbnail caching
│   ├── useReducedMotion.ts  # Convenience hook for reduced motion state
│   ├── useSearch.ts         # Search history persistence + debounced value
│   ├── useTheme.tsx         # Convenience hook re-exporting ThemeContext + ThemeProvider
│   └── useWidgets.ts        # Widget configuration management + periodic refresh
│
├── navigation/          # Navigation configuration
│   └── RootNavigator.tsx  # Stack navigator (React Navigation v7)
│
├── screens/             # Top-level screen components
│   ├── AlbumsScreen.tsx     # Album grid with FlashList, pull-to-refresh, FAB
│   ├── PhotosScreen.tsx     # Photo grid per album, search integration, multi-select
│   ├── PhotoViewer.tsx      # Full-screen viewer with pinch/zoom, swipe navigation
│   └── WidgetsScreen.tsx    # Widget configuration UI with previews
│
├── services/            # Business logic and data access singletons
│   ├── media.service.ts     # MediaService: MediaLibrary singleton with in-memory caching
│   ├── storage.service.ts   # StorageService: MMKV wrapper + thumbnail/search utilities
│   └── widget.service.ts    # Widget data: daily memory, random, favorites, album preview
│
├── theme/               # Design tokens
│   ├── colors.ts        # Light/dark color palettes (as const) + ColorTokens type
│   └── tokens.ts        # Token re-exports
│
├── types/               # Shared TypeScript interfaces
│   ├── index.ts         # Album, Photo interfaces
│   └── navigation.ts    # RootStackParamList for typed navigation
│
└── utils/               # Utility functions
    └── helpers.ts        # hexToRgba converter
```

## Layer Descriptions

### 1. App Entry (`app.tsx`, `index.js`)

The root `App` component wraps the application in four providers before rendering `MainApp`:

1. **ThemeProvider** — Provides light/dark/system theme colors and persistence
2. **ReducedMotionProvider** — Provides reduced-motion state and configures Reanimated's `ReducedMotionConfig`
3. **GestureHandlerRootView** — Required root view for `react-native-gesture-handler`
4. **SafeAreaProvider** — Provides safe area insets

`MainApp` renders a `StatusBar` (with dynamic `barStyle` based on theme) and an `ErrorBoundary` wrapping the `RootNavigator`.

### 2. Navigation (`navigation/RootNavigator.tsx`)

A single **Stack navigator** (React Navigation v7, `@react-navigation/stack`) with four routes:

| Route | Screen | Header | Presentation |
|-------|--------|--------|--------------|
| `Albums` (initial) | `AlbumsScreen` | `BlurHeader` with search + widgets buttons | default |
| `Photos` | `PhotosScreen` | Hidden (`headerShown: false`) | default |
| `PhotoViewer` | `PhotoViewer` | Hidden (`headerShown: false`) | `modal` |
| `Widgets` | `WidgetsScreen` | `BlurHeader` with back button | default |

Navigation transitions respect the `useReducedMotion` setting — when enabled, all transitions use zero-duration animations.

### 3. Screens → Hooks → Services Data Flow

```
Screen (presentational)
  ↓ uses
Hook (data fetching, state, side effects)
  ↓ calls
Service (singleton, caching, native module access)
  ↓ wraps
Native Module (expo-media-library, MMKV)
```

**Example: AlbumsScreen**
```
AlbumsScreen → useAlbums() → MediaService.getAlbums() → MediaLibrary.getAlbumsAsync()
                              MediaService.getAlbums() → MediaLibrary.getAssetsAsync() (for thumbnails)
```

### 4. Services

#### MediaService (`services/media.service.ts`)

- **Singleton** pattern via `getInstance()`
- Two in-memory caches:
  - `albumsCache: Map<string, Album>` — populated by `getAlbums()` and `getAlbumById()`
  - `photosCache: Map<string, PhotoPage>` — keyed by `albumId_after_limit`, populated by `getPhotosFromAlbum()`
- `getAlbums(offset, limit)` — fetches all albums via `MediaLibrary.getAlbumsAsync`, then fetches a thumbnail for each via `getAssetsAsync`. Caches results.
- `getPhotosFromAlbum(albumId, after, limit)` — cursor-based pagination. Returns `{ photos, endCursor, hasNextPage }`. Caches result by key.
- `getPhotosByIds(photoIds)` — **batched** photo lookup using `Promise.all` (eliminates N+1 sequential queries).
- `getAlbumById(albumId)` — cache-aware single album lookup (avoids fetching all albums).
- `getPhotoById(photoId)` — single photo info via `MediaLibrary.getAssetInfoAsync`.
- `deletePhoto(photoId)` — deletes via `MediaLibrary.deleteAssetsAsync` and clears caches.
- `clearCache()` — clears all caches (used on refresh).

#### StorageService (`services/storage.service.ts`)

- Wraps `react-native-mmkv` with `JSON.stringify`/`JSON.parse`
- Type-safe generic `get<T>(key): T | null` that returns `null` on parse failure (not a raw string)
- Additional utilities:
  - `cacheThumbnails(albumId, uri[])` — stores first 4 thumbnail URIs per album
  - `loadCachedThumbnails(albumId): string[] | null` — reads cached thumbnails
  - `addSearchHistory(query)`, `getSearchHistory()`, `clearSearchHistory()` — MMKV-backed search history
- `StorageKeys` — central registry of all storage keys

#### WidgetService (`services/widget.service.ts`)

- Manages widget data: daily memory, random photo, album preview, favorites
- **5-minute in-memory cache with TTL** prevents redundant native media-library queries during periodic refreshes
- `getDailyMemory()` — parallelizes album photo fetches with `Promise.all` across 5 albums
- `getRandomPhotos(count)` — parallelizes album photo fetches with `Promise.all` across 3 albums
- `getFavorites()` — uses batched `getPhotosByIds` instead of sequential `getPhotoById` calls
- `getAlbumPreview(albumId)` — uses targeted `getAlbumById` instead of fetching all albums
- `saveWidgetData()` / `getWidgetData()` — persists widget data to MMKV
- `clearCache(prefix?)` — explicit cache invalidation

### 5. Contexts

#### ThemeContext
- Manages `themeMode` (`'light' | 'dark' | 'system'`) persisted to MMKV
- Derives effective theme from system color scheme + manual override
- Provides typed `ColorTokens` colors to the entire component tree
- `useTheme()` hook provides a safe fallback when used outside provider

#### ReducedMotionContext
- Manages `reduceMotionMode` (`'system' | 'always' | 'never'`) persisted to MMKV
- Integrates with Reanimated's `ReducedMotionConfig`
- `useReducedMotion()` returns a boolean — true when motion should be reduced

### 6. Types (`types/`)

- `Album` — id, title, count, thumbnailUri, createdAt, updatedAt
- `Photo` — id, uri, filename, width, height, size, albumId, createdAt, modifiedAt, location?, metadata?, title?
- `RootStackParamList` — typed navigation params for Stack navigator

## Performance Characteristics

| Concern | Approach |
|---------|----------|
| List rendering | FlashList with `estimatedItemSize`, `removeClippedSubviews`, `onEndReachedThreshold` |
| Image loading | `expo-image` with `cachePolicy="memory-disk"` |
| Scroll animations | `Animated.createAnimatedComponent(FlashList)` with Reanimated shared values |
| Media queries | In-memory caching in MediaService; batched `getPhotosByIds` for favorites |
| Widget data | 5-minute TTL in-memory cache; parallel `Promise.all` for album queries |
| Permission | Single `usePermission` hook checks once on mount, requests on demand |

## Testing

Tests use Jest with the `jest-expo` preset. The `jest.setup.js` file at the project root provides comprehensive mocks for all native modules and libraries (Reanimated, MMKV, MediaLibrary, FlashList, GestureHandler, SafeArea, Navigation). The single test in `__tests__/App.test.tsx` renders the full app shell and verifies the Albums screen renders correctly with an empty media library mock.
