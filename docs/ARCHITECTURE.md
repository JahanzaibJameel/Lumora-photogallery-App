# Architecture

> Source of truth: `src/`. All descriptions below reflect the implemented code as of v1.0.0.

Lumora uses a **layered architecture** with clear separation of concerns. Data flows downward through screens, hooks, and services into native modules, while cross-cutting concerns (theme, reduced motion, grid density) are supplied through React contexts.

```text
Screens ──▶ Hooks ──▶ Services ──▶ Native modules (expo-media-library, MMKV)
                    ▲
        Contexts (Theme, ReducedMotion, GridSize)
        Components (shared UI)
```

---

## Layer 1 — Entry point

| File | Responsibility |
| :--- | :--- |
| `src/index.js` | `registerRootComponent(App)` (Expo entry) |
| `src/app.tsx` | Composes providers, then `MainApp` |

`App` wraps the tree in four nested providers (outer → inner):

1. **ThemeProvider** — light/dark/system colors, persisted to MMKV (`StorageKeys.THEMES`)
2. **ReducedMotionProvider** — motion preference, persisted (`StorageKeys.REDUCED_MOTION`); mounts Reanimated's `ReducedMotionConfig` except when the mode is `system`
3. **GridSizeProvider** — in-memory grid density (`small`/`medium`/`large`)
4. **GestureHandlerRootView** — required root for Gesture Handler

`MainApp` renders `SafeAreaProvider` → `StatusBar` (tint follows theme) → `ErrorBoundary` → `RootNavigator`.

> `GestureHandlerRootView` receives `accessible={true}` for screen-reader traversal; the status bar is restored on viewer dismiss.

---

## Layer 2 — Navigation (`navigation/RootNavigator.tsx`)

A single **stack navigator** (`@react-navigation/stack`, v7) with typed params (`RootStackParamList` in `types/navigation.ts`):

| Route | Screen | Header | Presentation | Motion-aware? |
| :--- | :--- | :--- | :--- | :--- |
| `Albums` (initial) | `AlbumsScreen` | `BlurHeader` with search + widgets buttons | default | yes — scroll-linked opacity |
| `Photos` | `PhotosScreen` | hidden | default | n/a |
| `PhotoViewer` | `PhotoViewer` | hidden | `modal` (`ModalSlideFromBottomIOS`) | transitions bypassed when reduced motion is on |
| `Widgets` | `WidgetsScreen` | `BlurHeader` with back button | default | n/a |

When `useReducedMotion()` is true, the navigator applies a zero-duration `transitionSpec` / `forNoAnimation` interpolator so no screen transition animates.

> `RootStackParamList` also declares a `Settings` route with **no registered screen** — it is dead config and should be wired up or removed (see [docs/PROJECT_STATUS.md](./PROJECT_STATUS.md)).

---

## Layer 3 — Screens

| Screen | Key behaviors |
| :--- | :--- |
| `AlbumsScreen` | Permission gating, `FlashList` of `AlbumCard`, pull-to-refresh, skeleton placeholders, error/empty states |
| `PhotosScreen` | `AnimatedFlashList` with scroll-linked header opacity, debounced search (filename/album-ID), density cycling FAB + refresh FAB, `numColumns` 4/3/2, `estimatedItemSize` derived from window width, long-press delete via confirm dialog |
| `PhotoViewer` (+ `PhotoViewer/`) | `expo-image` full-bleed with pinch/pan/swipe gestures, neighbour prefetch, status-bar hide/restore, Android hardware-back handling, overlay (`BackArrow`, `NavArrow`, `PhotoInfoBadge`) |
| `WidgetsScreen` | Toggle switches + live previews for the four widget kinds; hourly auto-refresh |

---

## Layer 4 — Hooks (`hooks/`)

Hooks own all data-fetching, pagination, retry, and mutation state.

| Hook | Responsibility |
| :--- | :--- |
| `useAlbums` | Fetches all albums at once (`getAlbums(0, 200)`), `refreshAlbums`, `retryLoad` (linear backoff `1000ms × retryCount`, capped at `MAX_RETRIES = 2` → `MAX_RETRIES_EXCEEDED`); `loadMore` is a no-op retained for API compatibility |
| `usePhotos(albumId)` | Batch size 30 cursor pagination, `deletePhoto`, refresh clears `MediaService` cache; same retry shape as `useAlbums` |
| `usePermission` | `undetermined` / `granted` / `denied` / `blocked`; re-checks on `AppState` resume; `openSettings` via `Linking` |
| `useSearch` | `useSearchHistory` (record/clear against MMKV, capped at 20, deduplicated) + `useDebouncedValue` (default 300 ms) |
| `useAlbumThumbnail` | Bridges `MediaService.getAlbumThumbnail` into component state with a cancellation guard |
| `useTheme` / `useReducedMotion`(+`useReduceMotionMode`) | Context accessors with safe fallbacks |
| `useAccessibility` | `getButtonProps`/`getInputProps`/`enforceTouchTarget` (48 pt) + shared hint map |
| `useWidgetConfig` | Default three-widget config (daily memory / random photo / favorites); `toggle`/`update`/`add`/`remove` — **persisted to MMKV** via `StorageKeys.WIDGET_CONFIGS` |
| `useWidgetData` | Per-type fetch switch, `refreshAllWidgets` parallelizes enabled widgets via `Promise.all` |
| `useWidgets` | Composes config + data; hourly `REFRESH_INTERVAL` while mounted |

---

## Layer 5 — Services (`services/`)

All services are singletons wrapping native modules.

### MediaService (`media.service.ts`)

Singleton accessed via `getMediaService()` / `MediaService.getInstance()`. **Web guard:** every read returns an empty result on `Platform.OS === 'web'` (the native module is unavailable), so screens fall back to natural empty states.

**Caches**

| Cache | TTL | Max entries | Notes |
| :--- | :--- | :--- | :--- |
| albums | 5 min | 200 | `Map<albumId, CacheEntry<Album>>` |
| photos pages | 2 min | 500 | key `albumId_after_limit` |
| thumbnails | 10 min | 300 | `albumId → cover uri` |

- **LRU eviction** — single-pass oldest-timestamp sweep when over max.
- **In-flight deduplication** — concurrent callers for the same key share one promise; on rejection the slot is released by identity check so later callers don't coalesce onto a rejected promise.
- **Retry** — `withRetry` retries up to `MAX_RETRIES = 2` after `RETRY_DELAY = 500ms` for transient errors (network/timeout/fetch-failed), then rethrows.
- **Error seam** — transient failures are categorized via `categorizeError` and dispatched to `errorReporter` before rethrowing.

| Method | Return | Notes |
| :--- | :--- | :--- |
| `getAlbums(offset, limit)` | `Album[]` | `includeSmartAlbums`, cached |
| `getPhotosFromAlbum(albumId, after, limit)` | `{ photos, endCursor, hasNextPage }` | cursor pagination |
| `getPhotoById(id)` | `Photo \| null` | returns null on failure (reports error) |
| `getPhotosByIds(ids)` | `Photo[]` | batched `Promise.all` (`getPhotoById`) |
| `getAlbumThumbnail(albumId)` | `string \| undefined` | deduped + cached cover |
| `getAlbumById(albumId)` | `Album \| null` | cache-aware single lookup |
| `deletePhoto(id)` | `boolean` | **targeted invalidation** — drops only pages containing the photo, decrements affected album counts, drops those albums' thumbnails |
| `getAssetInfo(id)` | asset \| null | thin passthrough (kept for completeness) |
| `clearCache()` | void | wipes all caches + in-flight map |

> Native-only fields (`fileSize`, `location`, `exif`, `createdTime`, `modificationTime`) are read through audited intersection types (`AssetRuntimeFields` / `AlbumRuntimeFields`) rather than scattered `as any` casts.

### StorageService (`storage.service.ts`)

Synchronous MMKV wrapper (instance id `lumora-storage`). `get<T>` returns `null` on missing key **and** on `JSON.parse` failure (no silent corruption). `save` is synchronous — wrapping it in a promise would be misleading.

`StorageKeys` registry: `THEMES`, `FAVORITES`, `WIDGET_PREFIX`, `WIDGET_CONFIGS`, `SEARCH_HISTORY`, `REDUCED_MOTION`, `GRID_SIZE`, `PERFORMANCE_CONFIG`, `PERFORMANCE_METRICS`, `PERFORMANCE_AGGREGATED`. Search-history helpers (`add`/`clear`/`get`) live here.

### WidgetService (`widget.service.ts`)

Object-literal singleton. A 5-minute TTL `widgetCache` avoids redundant native scans during the hourly refresh.

| Builder | Behavior |
| :--- | :--- |
| `getDailyMemory()` | scans first 5 albums (50 photos each) in parallel, filters to same month/day in prior years, keeps 5 |
| `getRandomPhotos(count)` | parallel album scan, **Fisher–Yates** shuffle (not sort-by-random) |
| `getAlbumPreview(albumId)` | `getAlbumById` + first 4 photos |
| `getFavorites()` | reads `StorageKeys.FAVORITES`, batched `getPhotosByIds` (slice 4) |

`saveWidgetData(key, data)` / `getWidgetData(key)` persist to MMKV under `WIDGET_PREFIX`. `clearCache(prefix?)` invalidates by prefix.

---

## Layer 6 — Contexts (`contexts/`)

| Context | State | Persistence |
| :--- | :--- | :--- |
| `ThemeContext` | `themeMode` (`light`/`dark`/`system`), derived `isDark`, typed `ColorTokens` | MMKV `THEMES` |
| `ReducedMotionContext` | `reduceMotion` boolean, `reduceMotionMode` (`system`/`always`/`never`) | MMKV `REDUCED_MOTION` |
| `GridSizeContext` | `gridSize` (`small`/`medium`/`large`), `cycleGridSize` | **none** (resets on relaunch) |

All three expose a safe fallback when consumed outside the provider, and memoize their value object to avoid re-rendering the whole tree.

---

## Layer 7 — Components (`components/`)

Shared UI. Composite components are `memo`-wrapped and use `useCallback` handlers.

| Component | Notes |
| :--- | :--- |
| `AlbumCard` | `LinearGradient` cover + haptic press feedback + spring scale |
| `BlurHashImage` | `expo-image` wrapper, `memory-disk` cache, fade-in |
| `BlurHeader` | `expo-blur` `BlurView`, platform-aware tint, search toggle, back/widgets buttons, scroll-linked animated opacity/translate, 48 pt targets |
| `EmptyState` | variants `permission` / `empty` / `error` / `no-internet`; accepts `AppError` or string message; `accessibilityLiveRegion` |
| `ErrorBoundary` | class component, themed fallback, optional custom fallback, reports `componentStack` to `errorReporter` |
| `PhotoGridItem` | animated enter, haptic, press feedback |
| `Skeleton` | `AlbumSkeleton` / `PhotoGridSkeleton` pulse; static opacity when reduced motion |
| `primitives/` | `IconButton` (48 pt, `forwardRef`), `SearchBar` (clear button, `forwardRef`), `Text` (variants + color tokens) |

---

## Layer 8 — Theme tokens (`theme/`)

| Token file | Exports |
| :--- | :--- |
| `colors.ts` | `lightColors` / `darkColors` (`as const`, ~37 tokens each incl. semantic containers) + `ColorTokens = typeof lightColors` |
| `spacing.ts` | `xs 4` / `sm 8` / `md 16` / `lg 24` / `xl 32` / `xxl 48` |
| `typography.ts` | `h1`–`h3`, `title`, `body`, `bodySmall`, `caption`, `overline` |
| `borderRadius.ts` / `elevation.ts` / `opacity.ts` | scale constants |
| `tokens.ts` | re-export aggregator (`theme` const) |

Styling is **plain `StyleSheet.create`** (zero-runtime, first-class web support) — see decisions below.

---

## Layer 9 — Types (`types/`)

- `Album` — `id, title, count, thumbnailUri?, createdAt, updatedAt`
- `Photo` — `id, uri, filename, width, height, size, albumId, createdAt, modifiedAt, location?, metadata?, title?` (`title` is declared but never populated — known gap)
- `RootStackParamList` — typed navigation params (see Layer 2)

---

## Error pipeline

```text
throw / native failure
   │
   ▼
categorizeError(...) ──▶ AppError { category, severity, code, context }
   │                          │
   │                          ▼
   │                    errorReporter.capture()  ──▶ listeners (Sentry = commented stub)
   ▼
hook setState(error)  ──▶ EmptyState / ErrorBoundary (data-driven messaging, retry)
```

`errorReporter` is a local event bus; there is **no crash-reporting backend wired** (the Sentry integration point is documented but commented out).

---

## Performance characteristics

| Concern | Approach |
| :--- | :--- |
| List rendering | FlashList, `estimatedItemSize` from window width, `removeClippedSubviews`, `onEndReachedThreshold={0.5}` |
| Image loading | expo-image `cachePolicy="memory-disk"`; neighbour prefetch in viewer |
| Scroll animation | `Animated.createAnimatedComponent(FlashList)` + shared values; reduced-motion bypass |
| Media queries | TTL + LRU caches, in-flight dedup, batched `getPhotosByIds`, parallel `Promise.all` album scans |
| Deletion | targeted cache invalidation (no full purge) |
| Permission | single `usePermission` check, re-query on app resume |

---

## Key design decisions

- **StyleSheet over NativeWind / CSS-in-JS.** Zero runtime, strong TS support, web-compatible, no extra dependency.
- **MMKV (synchronous).** Synchronous `save`/`get` — no fake promises. Favorites, theme, reduced-motion, search history, and widget data persist here.
- **Singleton services with TTL + LRU + in-flight dedup.** Avoids redundant native bridge calls and thundering-herd refetch on FlashList cell recycling.
- **Typed error taxonomy.** Data-driven retry and messaging instead of string matching at the view layer.
- **Targeted cache invalidation on delete.** Only affected pages/albums/thumbnails are dropped, so a delete doesn't cascade into a full refetch.
- **Fisher–Yates shuffle** for the random-photo widget (unbiased vs. `sort(() => Math.random())`).
- **Worklet-driven gestures + reduced-motion bypass.** True native feel; every animation has a zero-motion path.

---

## Testing surface

Tests are colocated (`src/**/*.test.tsx?`) plus one integration test (`__tests__/App.test.tsx`). `jest.setup.js` mocks Reanimated, MMKV, expo-media-library, FlashList, Gesture Handler, Safe Area, and Navigation so the suite exercises real app code against deterministic platform fakes. See [docs/TESTING.md](./TESTING.md).
