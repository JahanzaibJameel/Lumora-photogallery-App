# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **WidgetService caching layer** — 5-minute in-memory cache with TTL prevents redundant native media-library queries during periodic widget refreshes
- **`MediaService.getPhotosByIds(photoIds)`** — batch-fetches multiple photos by ID using `Promise.all`, eliminating N sequential queries
- **`MediaService.getAlbumById(albumId)`** — cache-aware single-album lookup that reuses the existing `albumsCache` instead of fetching all albums
- **`WidgetService.clearCache(prefix?)`** — explicit cache invalidation API for fine-grained cache control after data mutations
- Full color palette with elevation tiers and semantic tokens (light and dark modes)
- `ReducedMotionProvider` and `useReducedMotion` hook with system/always/never modes persisted via MMKV
- `useSearch` hook with `useDebouncedValue` and search history persistence
- Comprehensive Jest test setup (`jest.setup.js`) with mocks for Reanimated, MMKV, MediaLibrary, FlashList, GestureHandler, SafeArea, and Navigation
- GitHub Actions CI pipeline (`.github/workflows/ci.yml`) for lint, type-check, test, and web build
- Dark/light/system theme support with MMKV persistence
- Accessibility features: reduced motion, dynamic type, screen reader support, proper semantic labels
- Performance optimizations: FlashList, memoization, stable props, batched media queries
- `storage.service.ts` with `cacheThumbnails`, `loadCachedThumbnails`, `addSearchHistory`, `getSearchHistory` utilities
- `widgets.service.ts` for daily memory, random photo, album preview, and favorites widget data
- Complete albums, photos, photo viewer, and widgets features
- Error boundary component with themed fallback

### Changed
- **`WidgetService.getFavorites()`** — replaced sequential `getPhotoById` loop with single batched `getPhotosByIds` call
- **`WidgetService.getDailyMemory()`** — replaced sequential album photo fetches with parallelized `Promise.all` queries
- **`WidgetService.getRandomPhotos()`** — replaced sequential album photo fetches with parallelized `Promise.all` queries
- **`WidgetService.getAlbumPreview()`** — replaced `getAlbums(0, 100).find()` with targeted `getAlbumById` cache lookup
- Consolidated on a single root `src/` architecture and removed the duplicate `src/features/` module tree
- Components (SegmentedControl, Toggle) now use the shared primitives instead of importing from removed feature modules
- `MediaService.deletePhoto` — cache invalidation now scoped to the affected media service caches

### Fixed
- Dependency conflicts: React Native 0.79.6 and React 19.0.0
- TypeScript configuration issues — `tsconfig.json` includes `"types": ["jest"]` to resolve Jest globals in test files
- ESLint configuration with React plugins and global declarations
- `app.json` lists `expo-secure-store` plugin but the package is not installed — documented as a known configuration gap; remove the plugin entry or install the package

### Known Issues
- `app.json` plugin `expo-secure-store` is not installed in `package.json` — either install the package or remove the plugin entry
- CI uses Node.js 18.x; recommend upgrading to Node.js 20+ to match local development requirements

## [1.0.0] - 2026-08-13

### Added
- Initial release of Lumora Photo Gallery application
- Core functionality: photo browsing, album management, photo viewer, settings, widgets
- React Navigation v7 stack navigator with typed routes
- React Native Reanimated 3 for animations
- MMKV storage for settings and preferences persistence
- ThemeContext with light/dark/system modes
- FlashList for performant photo grid rendering

### Versions
- Expo SDK: 53.0.27
- React Native: 0.79.6
- React: 19.0.0
- React Native Reanimated: 3.17.4
