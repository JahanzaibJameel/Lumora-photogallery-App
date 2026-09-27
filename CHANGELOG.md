# Changelog

All notable changes are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **Favorites UI** — Heart button in PhotoViewer overlay; tapping toggles favorite state; icons (outline/filled red) reflect state; persists to `StorageKeys.FAVORITES` in MMKV; `useFavorites` hook provides `isFavorite`/`toggleFavorite`/`addFavorite`/`removeFavorite`; integrated with existing widget system.
- **Search history UI** — SearchBar component now surfaces recent searches in a dropdown when focused; users can tap to reuse queries or clear all history; integrated into PhotosScreen via BlurHeader.
- **Bundle size analysis** — Expo Atlas integration in CI with `npm run bundle-size`; artifacts uploaded to GitHub Actions for 30 days; documentation at `docs/BUNDLE_SIZE.md`.
- **Layered architecture documentation set** (`README.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md`, `docs/TESTING.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/SECURITY.md`, `docs/TROUBLESHOOTING.md`, `docs/DEPLOYMENT.md`, `LICENSE`).
- **`GridSizeContext`** — small/medium/large density (cycled from the Photos screen), persisted to MMKV (`StorageKeys.GRID_SIZE`).
- **`ReducedMotionContext` + `useReducedMotion`** — system/always/never modes, persisted; wired into all animated components and navigation transitions.
- **`useAccessibility` helper** + `MIN_TOUCH_TARGET` (48 pt), `ACCESSIBILITY_HINTS`.
- **Typed error taxonomy** — `AppError` (`category`/`severity`/`code`/`context`) + `categorizeError`; injectable `errorReporter` (Sentry stub).
- **`MediaService` caching** — TTL caches (albums 5 min / photos 2 min / thumbnails 10 min) with LRU eviction, in-flight request deduplication, transient-error retry (2×), and **targeted cache invalidation on delete**.
- **`WidgetService`** — `getDailyMemory` / `getRandomPhotos` (Fisher–Yates) / `getAlbumPreview` / `getFavorites` with a 5-minute TTL cache; batched `getPhotosByIds`; parallel `Promise.all` album scans.
- **`useSearch`** — debounced search value + MMKV-backed search history (capped at 20).
- **`usePermission`** — `undetermined/granted/denied/blocked`, re-checks on `AppState` resume.
- **Theme tokens** — `lightColors`/`darkColors` (~37 tokens) + `spacing`/`typography`/`borderRadius`/`elevation`/`opacity`; `ColorTokens = typeof lightColors`.
- **CI** — `.github/workflows/ci.yml` runs lint, type-check, coverage, and web export on `main`.

### Changed

- `StorageService` is now **synchronous**; `get<T>` returns `null` (not a raw string) on parse failure.
- `PhotoViewer` gestures now settle in spring-completion callbacks (no `setTimeout` race).
- `WidgetService.getFavorites/getDailyMemory/getRandomPhotos` parallelized; `getAlbumById` used for single-album lookups.
- `usePhotos` no longer caches thumbnails — thumbnail caching is owned by `MediaService.getAlbumThumbnail` + `useAlbumThumbnail`.

### Fixed

- Duplicate `BlurHeader` on `AlbumsScreen` (header is provided solely by `RootNavigator`).
- Removed unused dependencies (`expo-secure-store`, `expo-web-browser`, `expo-font`, `@react-navigation/elements`) and their `app.json` plugins; `@react-navigation/elements` is retained only as a transitive dependency of `@react-navigation/native-stack`/`stack`.
- Native-only fields read through audited intersection types instead of scattered `as any` casts.

### Known gaps (see `docs/PROJECT_STATUS.md`)

- ~~Widget configuration and grid density are not persisted.~~ Done: both now persisted via MMKV (`StorageKeys.WIDGET_CONFIGS` and `StorageKeys.GRID_SIZE`).
- ~~Favorites have no UI; the favorites widget always shows "No favorites yet".~~ Done: heart button in PhotoViewer allows marking/unmarking favorites; storage and widget integration complete.
- ~~Search history is persisted but has no UI.~~ Done: history dropdown implemented in SearchBar.
- No crash-reporting backend wired to `errorReporter`.

## [1.0.0] - 2026-08-13

### Added

- Initial release: albums, photos grid, immersive photo viewer, themes, in-app widgets, error boundaries.
- React Navigation v7 stack navigator with typed routes.
- React Native Reanimated 3 animations; MMKV persistence; FlashList rendering.
- Expo SDK 53.0.27 · React Native 0.79.6 · React 19.0.0 · Reanimated 3.17.4.
