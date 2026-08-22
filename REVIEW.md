# Lumora — Senior Frontend Engineer Code Review

> **Post-Review Status** (updated 2026-08-17)
>
> The following items from this review have been **resolved** since publication:
>
> | # | Issue | Status | Details |
> |---|---|---|---|
> | 5.1 | Sequential N+1 media queries in WidgetService | **Fixed** | `getFavorites` now uses batched `getPhotosByIds`; `getDailyMemory` and `getRandomPhotos` use `Promise.all`; `getAlbumPreview` uses `getAlbumById`. Added 5-minute in-memory cache with TTL. |
> | — | `useReducedMotion` hook missing | **Already implemented** | The REVIEW's claim that this was missing was incorrect — `ReducedMotionContext.tsx` + `useReducedMotion.ts` exist and are wired into all animated components. |
> | — | Duplicate BlurHeader on AlbumsScreen | **Already fixed** | No inline `BlurHeader` in `AlbumsScreen.tsx`; the header is provided solely via `RootNavigator.tsx` options. |
> | — | Storage service `get<T>` silent corruption | **Already fixed** | `storage.service.ts:49-57` returns `null` on `JSON.parse` failure instead of returning a raw string. |
> | — | `ColorTokens` type is `[key: string]: string` | **Already correct** | `theme/colors.ts:73` uses `typeof lightColors` — the REVIEW's claim was inaccurate. |
> | — | Gesture mock missing in jest.setup.js | **Already comprehensive** | The REVIEW's claim was inaccurate — `Gesture` with `Pinch`, `Pan`, `Tap`, etc. is fully mocked at `jest.setup.js:258-270`. |
> | — | `expo-av` dependency | **Already removed** | Not in `package.json`; confirmed. |
>
> **Still open** (unchanged):
> - 15 `any` casts in `media.service.ts` (Expo MediaLibrary types not properly typed)
> - `'100vh' as any` in `AlbumsScreen.tsx:119` and `PhotosScreen.tsx:185`
> - `keyExtractor={(item: any)}` in `PhotosScreen.tsx:189`
> - `setTimeout` race in `PhotoViewer.tsx:118`
> - Full cache clear on delete in `media.service.ts:151-152`
> - No coverage config in `jest.config.js`
> - `expo-secure-store` plugin in `app.json:42` but package not installed
> - `tsconfig.json:8` — `"types": ["jest"]` pollutes non-test builds

---

**Date:** 2026-08-16  
**Reviewer:** Staff Frontend Engineer  
**Status:** ✅ tsc clean | ✅ eslint clean (0 warnings) | ⚠️ 1 test / 75s runtime | ❌ ~20% coverage

---

## 0. Validation Results

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit --skipLibCheck` | ✅ Pass |
| ESLint | `npx eslint src --max-warnings 0` | ✅ Pass |
| Tests | `npx jest --forceExit` | ✅ 1 pass (75s) |

---

## 1. Executive Summary

Lumora has a solid foundation: clean layered architecture, proper TypeScript strict mode, FlashList for performant lists, Reanimated for native animations, and comprehensive Jest mocks. The code is readable and well-structured.

**However**, the README significantly overstates the shipped product (claims Expo SDK 54, RN 0.81.5, Reanimated 4, biometric auth, smart albums, native widgets — none are true or implemented). The test suite is critically thin (1 test, 75s). There are 14+ `any` type escapes, a broken duplicate header rendering, sequential N+1 media queries, and zero accessibility beyond basic labels. Tooling is half-configured (Prettier, Husky, and lint-staged are installed but never set up).

### Version Mismatch (README vs package.json)

| Package | README Claims | Actual Installed |
|---|---|---|
| Expo SDK | 54 | **53.0.27** |
| React Native | 0.81.5 | **0.79.6** |
| React | 18.2.0 (downgrade needed) | **19.0.0** |
| Reanimated | 4 | **3.17.4** |
| expo-secure-store | Listed as plugin | **Not installed** |

---

## 2. Architecture & Structure

### What's Good
- Layered separation (`components` → `hooks` → `services` → `screens` → `theme` → `types` → `utils`) is clean and navigable.
- `MediaService` singleton pattern (`media.service.ts:10-22`) with in-memory `Map` caching is well-designed.
- `index.js` → `app.tsx` → `ErrorBoundary` → `RootNavigator` → screens follows a textbook Expo entry point.

### What's Broken
1. **Duplicate BlurHeader on AlbumsScreen** — The header is rendered TWICE:
   - Once via `options.header` in `RootNavigator.tsx:32` (receives `scrollY` from the screen).
   - Again inline at `AlbumsScreen.tsx:130` (does NOT receive `scrollY`, so scroll animation doesn't work).
   
   This is a **visual duplication bug**. The inline copy at line 130 also has no `scrollY` prop, so the scroll-based opacity/translate animation is silently broken on this screen.

2. **Stale planning docs** — `.kilo/plan/lumora-redesign-2026.md` and `REDESIGN_BLUEPRINT.md` describe a codebase state that does not exist (NativeWind `className` strings, `tw()` parser, `VideoPlayer.tsx`, `MasonryGrid.tsx`, root-level `components/` and `hooks/`). These were likely cleaned up already but the docs weren't updated. **Misleading for future work.**

3. **README overpromises** — Advertises features that don't ship:
   - "Biometric Privacy" / "Face ID, Touch ID" — `expo-secure-store` plugin in `app.json:37` but **not installed** as a dependency.
   - "Smart Album Management" — just raw `MediaLibrary.getAlbumsAsync` with no clustering.
   - "Home Screen Widgets" — widgets are in-app only; the 1-hour `setInterval` in `useWidgets.ts:167` is a JS timer, not a native widget.
   - "Bottom Tabs" navigation — only a stack navigator exists.

### Recommendations
- **Fix the duplicate header** immediately — keep only the navigator-level one, pass `scrollY` from the screen.
- Delete or archive the stale planning docs, or update them to match reality.
- Align the README claims with actual shipped features.

---

## 3. Type Safety — 14 `any` Escapes Found

| # | File:Line | Code | Severity |
|---|---|---|---|
| 1 | `media.service.ts:44` | `(album as any).createdTime` | High |
| 2 | `media.service.ts:45` | `(album as any).modificationTime` | High |
| 3 | `media.service.ts:88` | `(asset as any).fileSize` | High |
| 4 | `media.service.ts:92` | `(asset as any).location` | High |
| 5 | `media.service.ts:93-96` | Double-cast `(asset as any).location` → `.latitude` | High |
| 6 | `media.service.ts:98` | `(asset as any).exif` | High |
| 7 | `media.service.ts:128` | `(asset as any).fileSize` | High |
| 8 | `media.service.ts:132` | `(asset as any).location` | High |
| 9 | `media.service.ts:138` | `(asset as any).exif` | High |
| 10 | `PhotosScreen.tsx:189` | `keyExtractor={(item: any) => item.id}` | Medium |
| 11 | `PhotoViewer.tsx:54` | `onUpdate((event: any)` | Medium |
| 12 | `PhotoViewer.tsx:71` | `onUpdate((event: any)` | Medium |
| 13 | `PhotoViewer.tsx:85` | `onUpdate((event: any)` | Medium |
| 14 | `PhotoViewer.tsx:96` | `onEnd((event: any)` | Medium |
| 15 | `BlurHeader.tsx:67` | `'Widgets' as never` | Medium |
| 16 | `theme/colors.ts:73` | `ColorTokens = {[key: string]: string}` | High |

### Issues
- **`ColorTokens` type** (`theme/colors.ts:73-75`) is `[key: string]: string`, which means `colors.accen` (typo) compiles fine. The `lightColors`/`darkColors` are `as const` but the consuming type erases all specificity. This is the most dangerous type escape — it affects every component that reads theme colors.
- **`Photo.metadata`** (`types/index.ts:24`) is `Record<string, any>` — should be `Record<string, unknown>`.
- **`WidgetData.photos`** (`widget.service.ts:7-12`) defines its own inline photo shape instead of reusing `Photo`.
- **`Photo.title`** (`types/index.ts:25`) is declared but never populated in `media.service.ts`'s mapping.

### Recommendations
1. Generate `ColorTokens` as a proper interface from the color objects (use `typeof lightColors`).
2. Use `Gesture.GestureHandlerGestureEvent` types from `react-native-gesture-handler` instead of `event: any`.
3. Fix `keyExtractor` to use `Photo` type.
4. Remove the `as never` cast — use `NativeStackNavigationProp<RootStackParamList>` typing in `BlurHeader`.
5. Remove unused `title` field from `Photo` or populate it.

---

## 4. Theme & Design System

### What's Good
- Dark/light/system modes with MMKV persistence (`ThemeContext.tsx:21-45`).
- ThemeContext provides safe fallback values when used outside provider (`ThemeContext.tsx:54-65`).
- Color palette has full semantic tokens for both light and dark modes.

### What's Missing
1. **No `useReducedMotion` hook** — `withSpring`, `withTiming`, `withRepeat` animations run unconditionally. This is flagged in both `REDESIGN_BLUEPRINT.md:145` and `.kilo/plan/lumora-redesign-2026.md:9` but never implemented. On iOS, `Accessibility > Motion > Reduce Motion` will be ignored, causing potentially nauseating animations for users who need them disabled.
2. **`src/theme/tokens.ts` is a 5-line re-export file** — it re-exports from `colors.ts` but provides no actual tokens (spacing, typography, elevation, motion config). All components hardcode values like `paddingVertical: 12`, `borderRadius: 16`, `fontSize: 14`.
3. **Spring configs duplicated 5 times** across the codebase with slight variations:
   - `AlbumCard.tsx:35-38, 44-47` (press in/out)
   - `PhotoGridItem.tsx:46-49, 54-57` (press in/out)
   - `PhotoViewer.tsx:106, 107, 114, 115, 124, 125, 178` (transition springs)
4. **No spacing scale** — values like `8`, `12`, `16`, `24`, `32` are sprinkled throughout instead of using a `spacing.sm`, `spacing.md`, `spacing.lg` abstraction.
5. **No typography scale** — `Text.tsx:9-16` defines variants but with hardcoded `fontSize`/`fontWeight`. No Dynamic Type / font scaling for accessibility.
6. **Redundant hook layer** — `useTheme.tsx` (10 lines) just re-exports from `ThemeContext.tsx`. Two files for 74 lines of logic.

### Recommendations
1. Create proper design tokens in `src/theme/tokens.ts`: `spacing`, `typography`, `elevation`, `motion` (spring configs).
2. Implement `useReducedMotion()` and wire it into all animated components.
3. Extract spring configs into named constants in tokens.
4. Consolidate `useTheme.tsx` + `ThemeContext.tsx` into a single file.
5. Replace hardcoded font sizes with `PixelRatio`-scaled values.

---

## 5. Performance Deep-Dive

### Critical Issues

#### 5.1 — Sequential N+1 Media Queries in WidgetService
```ts
// widget.service.ts:33-48 — getDailyMemory
for (const album of albums.slice(0, 5)) {
  const { photos } = await mediaService.getPhotosFromAlbum(album.id, undefined, 50);
}
```
This fetches 5 albums → 5 photo queries **sequentially**. Each `getPhotosFromAlbum` call to `MediaLibrary.getAssetsAsync` is a native bridge call. On iOS with a large library, this can take 2–5 seconds. The `useWidgets` hook calls these on mount and every hour (the interval).

**The same pattern** exists in `getRandomPhotos` (line 90-96) and `getFavorites` (line 161-169, fetching 4 photos one at a time).

**Fix:** Use `Promise.all` for independent queries. For `getFavorites`, batch all 4 IDs into a single `getAssetsAsync` call.

#### 5.2 — Cache Key Bug in `usePhotos`
```ts
// usePhotos.ts:48-49
const thumbnailUris = result.photos.map(photo => photo.uri);
await cacheThumbnails(albumId, thumbnailUris.slice(0, 4));
```
- Only caches first 4 thumbnails per batch.
- Cache key is `lumora_cache_thumbnails_${albumId}` — **overwrites on every batch**, so page-1 thumbnails are lost when page-2 loads.
- `cacheThumbnails` is async but called **without `await`** in the try block (line 49 — it IS awaited, I was wrong; the `await` is there). However, the result is never used — thumbnails are cached but `loadCachedThumbnails` is only called in `useAlbums.getAlbumThumbnail`, never in `usePhotos`. **The photo thumbnail cache is written but never read.**

#### 5.3 — Full Cache Clear on Delete
```ts
// media.service.ts:150-153
this.photosCache.clear();
this.albumsCache.clear();
```
Deleting one photo clears **all** caches for all albums. On a large library, the next view navigates a full refetch cascade.

**Fix:** Delete only `photosCache` entries for the affected album ID.

#### 5.4 — `for...of` Sequential Refresh in `useWidgets`
```ts
// useWidgets.ts:112-117
for (const widget of widgets) {
  if (widget.enabled) {
    await refreshWidget(widget.id);
  }
}
```
Refresh All should parallelize with `Promise.all`.

#### 5.5 — Widget Interval Fires When Not Mounted
```ts
// useWidgets.ts:163-171
useEffect(() => {
  const interval = setInterval(() => {
    refreshAllWidgets();
  }, 60 * 60 * 1000);
}, [widgets, refreshAllWidgets]);
```
This interval runs regardless of whether the Widgets screen is visible. Over application lifecycle, this leaks intervals on navigation.

### Performance Positives
- ✅ FlashList with `estimatedItemSize` and `removeClippedSubviews`
- ✅ `expo-image` with `cachePolicy="memory-disk"`
- ✅ `Animated.createAnimatedComponent(FlashList)` for scroll-linked animations
- ✅ `onEndReachedThreshold={0.5}` for proactive pagination

### Recommendations (Priority)
1. **Fix duplicate BlurHeader** — visual bug, wastes a render.
2. **Parallelize widget data fetching** — `Promise.all` in `getDailyMemory`, `getRandomPhotos`, `refreshAllWidgets`.
3. **Targeted cache invalidation** on photo delete — don't clear all caches.
4. **Remove dead thumbnail cache** — either use it in `PhotoGridItem` or remove it entirely.
5. **Guard widget interval** with screen focus or visibility.
6. **Replace `setTimeout` in PhotoViewer** (line 109-112) with `withTiming` completion callbacks.

---

## 6. Accessibility Audit

### What's Present
- `accessibilityRole`, `accessibilityLabel` on AlbumCard, PhotoGridItem, IconButton, EmptyState, ErrorBoundary, BlurHeader.
- `accessibilityLiveRegion` on EmptyState and ErrorBoundary.
- `SafeAreaView` for top-level layout.

### What's Missing

| Issue | Severity | Location |
|---|---|---|
| **No `useReducedMotion`** — all animations run unconditionally | High | Throughout |
| **Font sizes hardcoded** — no Dynamic Type scaling | High | `Text.tsx`, all screens |
| **PhotoViewer nav arrows 40×40** — below 48×48 minimum | Medium | `PhotoViewer.tsx:312-318` |
| **No `accessibilityHint`** on any interactive element | Medium | Throughout |
| **Grid-size FAB has no `accessibilityRole="button"`** | Low | `PhotosScreen.tsx:238` |
| **No `accessibilityRole` on PhotoViewer image container** | Low | `PhotoViewer.tsx:200` |
| **No `accessibilityRole="progressbar"` on ActivityIndicator** | Low | `AlbumsScreen.tsx:72` |
| **Search input has no `accessibilityRole="search"`** | Low | `SearchBar.tsx:43` |
| **EmptyState calls `usePermission()` as side effect** | Medium | `EmptyState.tsx:27` |

### Issues
- `EmptyState.tsx:27` calls `usePermission()` on **every render** regardless of `type` prop. If `EmptyState` renders for an error state, it still mounts `usePermission`, which fires `MediaLibrary.getPermissionsAsync()` on mount — an unnecessary native bridge call.
- `Vibration.vibrate(50)` is called in EmptyState button handlers (lines 39, 50, 62, 86) unconditionally — should respect user haptics settings or at minimum not interfere with screen readers.

---

## 7. Testing

### Current State
- **1 test** (`__tests__/App.test.tsx`, 16 lines): Full app render + asserts "Albums" text and empty state.
- **Runtime**: 75 seconds (2.6s test + 58s setup/teardown).
- **Jest setup** (`jest.setup.js`, 431 lines): Comprehensive mocks for reanimated, mmkv, media-library, flash-list, gesture-handler, navigation.
- **No coverage config** — `collectCoverage` not set, `collectCoverageFrom` not configured, no thresholds.
- **`tests/` directory is empty.**

### Coverage Gap — Critical Logic Untested

| Module | Test Status | Risk |
|---|---|---|
| `usePhotos` (pagination, refresh, delete) | ❌ Untested | High |
| `useAlbums` (pagination, dedup, refresh) | ❌ Untested | High |
| `useSearchHistory` (record, clear, load) | ❌ Untested | Medium |
| `useDebouncedValue` (debounce timing) | ❌ Untested | Medium |
| `usePermission` (status mapping) | ❌ Untested | High |
| `useTheme` / `ThemeContext` (persistence) | ❌ Untested | Medium |
| `MediaService` (cache, pagination, delete) | ❌ Untested | High |
| `StorageService` (save/get/delete) | ❌ Untested | High |
| `WidgetService` (daily memory, random, favorites) | ❌ Untested | Medium |
| `hexToRgba` | ❌ Untested | Low |
| `PhotoViewer` (swipe, pinch, back handler) | ❌ Untested | High |
| `BlurHeader` (search toggle, nav) | ❌ Untested | Medium |

### Issues
- **75-second test runtime** — unacceptable for CI. The single App test loads the entire component tree including all services, hooks, and mocks. The setup file is 431 lines of mocks that all load upfront.
- **`jest.mock('react-native-gesture-handler')` doesn't export `Gesture`** — `Gesture.Pinch()` and `Gesture.Pan()` used in PhotoViewer would crash if that screen were rendered in a test. The current test only renders AlbumsScreen, so this bug is latent.
- **`useDebouncedValue`** uses `setTimeout`/`clearTimeout` — untested timing logic.

### Recommendations
1. **Add unit tests** for all hooks and services (see table above).
2. **Configure coverage**:
   ```js
   // jest.config.js
   collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.js'],
   coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } }
   ```
3. **Split the App test** — extract it into a screen-level test + component-level tests.
4. **Fix the `Gesture` mock** — add `Gesture: { Race: jest.fn(), Simultaneous: jest.fn(), Pinch: () => ({ onUpdate: jest.fn(), onEnd: jest.fn() }), Pan: () => ({ onUpdate: jest.fn(), onEnd: jest.fn() }) }`.
5. **Optimize setup** — consider lazy-loading mocks or moving heavy mocks to individual test files.

---

## 8. Data Layer & Services

### `media.service.ts`
- ✅ Singleton pattern with in-memory caching.
- ✅ Cursor-based pagination for photos (`endCursor`/`hasNextPage`).
- ✅ Cache cleared on delete.
- ⚠️ `getPhotoById` never uses cache — always hits native. Called in a sequential loop in `WidgetService.getFavorites`.
- ⚠️ `getAssetInfo` (line 161) is a passthrough that's never called.

### `storage.service.ts`
- ✅ MMKV with JSON serialization.
- ❌ **Silent data corruption bug** (lines 48-56): If `JSON.parse` fails, `get<T>` returns `strValue as T` — returning a raw string when the caller expects an object. E.g., `getFavorites` calls `storageService.get<string[]>(StorageKeys.FAVORITES)` — if corrupted, returns a string, and `.slice(0, 4)` iterates characters.
- ❌ **`save` returns `Promise<void>` but MMKV's `set()` is synchronous** — unnecessary async overhead. Worse, callers sometimes `await` and sometimes don't:
  - `await`ed: `ThemeContext.tsx:39`, `storage.service.ts:91, 103, 107`
  - Not `await`ed: `usePhotos.ts:49` (actually is awaited), `useAlbums.ts:49` (actually is awaited), `WidgetService.saveWidgetData:75` (actually is awaited)

  Wait — let me re-check. Actually most are awaited. The `addSearchHistory` (line 102) is called without `await` in `useSearchHistory.recordQuery` (line 17 of useSearch.ts) — fire-and-forget. This is acceptable for a cache write.

- ❌ **`init()` is a no-op** (line 35-37) — exposed but does nothing.

### `widget.service.ts`
- ⚠️ **N+1 queries**: `getDailyMemory` fetches all albums + 50 photos from 5 albums. `getRandomPhotos` same pattern.
- ⚠️ **`sort(() => Math.random() - 0.5)`** (line 100) — suboptimal shuffle (biased), but acceptable for small arrays.
- ⚠️ **Type mismatch**: `WidgetData.photos` has its own shape instead of reusing `Photo`.

---

## 9. Code Quality

### What's Good
- All components are `memo`-wrapped with `displayName`.
- `useCallback` used consistently for handlers.
- `StyleSheet.create` used (not inline styles for static styles).
- Consistent import ordering.
- Error boundaries present.

### Code Smells

| Issue | Severity | Location |
|---|---|---|
| **`'100vh' as any`** — web viewport height hack | Medium | `AlbumsScreen.tsx:131, PhotosScreen.tsx:185` |
| **Inline style objects in render** — `contentContainerStyle`, FAB styles | Low | `PhotosScreen.tsx:185-189, 217-261` |
| **`Vibration.vibrate(50)`** on every button press | Low | `EmptyState.tsx:39,50,62,86` |
| **`useColorScheme()` called in ThemeContext** but `useColorScheme` from RN may need permission on some Android versions | Low | `ThemeContext.tsx:20` |
| **`PhotosScreen` search filters by `filename` and `albumId` only** | UX | `PhotosScreen.tsx:66-70` |
| **`keyExtractor` uses `item: any`** | Medium | `PhotosScreen.tsx:189` |
| **`PhotoViewer` uses `Animated.Image` instead of `expo-image`** | Perf | `PhotoViewer.tsx:203` — inconsistent with `BlurHashImage` component |
| **`useAlbums` passes `album` object as `album` param** to `getAssetsAsync` | Risk | `media.service.ts:34` — `album` is a full `Album`-like object, but `getAssetsAsync` expects an album object from `getAlbumsAsync`. This works but is undocumented. |
| **`album.title || 'Untitled Album'`** — album titles can be empty string | Low | `media.service.ts:41` — actually `||` handles empty string correctly here |
| **No `useMemo` on `getNumColumns`** | Trivial | `PhotosScreen.tsx:166-172` — pure function, but recomputed every render |
| **`PhotoViewer` doesn't handle empty `photos` array** gracefully in swipe | Bug risk | `PhotoViewer.tsx:104` — `photos.length` could be 0 after filter |

### Dead Code

| File:Line | Dead Code | Action |
|---|---|---|
| `types/navigation.ts:5` | `Settings` route — no screen | Remove or implement |
| `EmptyState.tsx:14` | `'no-internet'` type — never used | Remove |
| `media.service.ts:161` | `getAssetInfo` method — never called | Remove |
| `types/index.ts:25` | `Photo.title` — never populated | Remove or populate |
| `usePhotos.ts:85-93` | `refreshing` state — used but could be consolidated | Keep |
| `widget.service.ts:198` | `getWidgetData` — called in `useWidgets.ts:55` but the returned data is overwritten by `refreshWidget` calls | Actually used — keeps |
| `useWidgets.ts:149-155` | `removeWidget` — not wired to any UI | Remove or wire |
| `useWidgets.ts:139-145` | `addWidget` — not wired to any UI | Remove or wire |
| `useWidgets.ts:130-136` | `updateWidgetConfig` — not wired to any UI | Remove or wire |

---

## 10. Tooling & Configuration

### Installed but Unconfigured

| Package | Status | Fix |
|---|---|---|
| `prettier` (devDep) | ⚠️ Installed, no config file | Create `.prettierrc.json` |
| `husky` (devDep) | ⚠️ Installed, no `.husky/` dir | Run `npx husky init` |
| `lint-staged` (devDep) | ⚠️ Installed, no config in package.json | Add `lint-staged` key |
| `eslint-config-prettier` | ⚠️ Installed, not referenced in eslint config | Add to extends |
| `eslint-plugin-react-hooks` | ✅ Installed | Add rules to eslint.config.js |

### Configuration Mismatches

| Issue | Severity | Location |
|---|---|---|
| `app.json:37` lists `expo-secure-store` plugin but it's not installed | High | app.json vs package.json |
| `tsconfig.json:8` — `"types": ["jest"]` pollutes non-test builds | Medium | tsconfig.json |
| `babel.config.js:8` — `react-native-reanimated/plugin` (correct for Reanimated 3, but `app.json:47` enables `reactCompiler` experimental flag which may conflict with babel transforms) | Low | babel.config.js:8, app.json:47 |
| No `lint-staged` config despite being installed | Medium | package.json |
| No `.prettierrc` despite Prettier being installed | Medium | Root |
| No git hooks (`.husky/`) configured | Medium | Root |

### Environment

- **Platform:** Windows (win32) — some developers may need Windows-specific setup notes.
- **No `lint` script** in package.json runs `eslint` — `expo lint` is the script (`package.json:13`), which uses the old `eslint-config-expo` wrapper.

---

## 11. Priority Action List

### P0 — Critical (Fix Before Any Feature Work)

1. **Fix duplicate BlurHeader** on AlbumsScreen — `AlbumsScreen.tsx:130` renders a header that's already provided by the navigator at `RootNavigator.tsx:32`.
2. **Fix `Storage Service.get<T>` silent corruption** — return `null` instead of `strValue as T` when JSON.parse fails (`storage.service.ts:54`).
3. **Fix `app.json` secure-store plugin mismatch** — either install `expo-secure-store` or remove the plugin entry.
4. **Add `Gesture` mock** to `jest.setup.js` — currently PhotoViewer tests would crash (`Gesture.Pinch()` undefined).

### P1 — High Priority (Next Sprint)

5. **Parallelize widget data fetching** — replace `for...of` sequential calls with `Promise.all` in `widget.service.ts` (getDailyMemory, getRandomPhotos) and `useWidgets.ts` (refreshAllWidgets).
6. **Targeted cache invalidation** on photo delete — only clear the affected album's cache, not all caches (`media.service.ts:150-153`).
7. **Add `useReducedMotion()`** and wire into all animated components.
8. **Fix `ColorTokens` type** — replace `[key: string]: string` with a proper typed interface.
9. **Set up coverage thresholds** in jest.config.js (80% global minimum).

### P2 — Medium Priority (Technical Debt)

10. **Consolidate `useTheme.tsx` + `ThemeContext.tsx`** — eliminate the 5-line re-export wrapper.
11. **Create proper design tokens** — spacing, typography, elevation, motion config in `src/theme/tokens.ts`.
12. **Remove `any` casts** — at least the 9 in `media.service.ts` by typing the Expo MediaLibrary return properly.
13. **Fix `PhotoViewer` `setTimeout` race** — use `withTiming` completion callbacks instead of `setTimeout`.
14. **Fix `'100vh' as any`** web height hacks — use `useWindowDimensions` or `StatusBar` height API.
15. **Archive stale planning docs** (`.kilo/plan/lumora-redesign-2026.md`, `REDESIGN_BLUEPRINT.md`).
16. **Type `useNavigation()` in PhotoViewer** — currently untyped.
17. **Remove unused `Settings` navigation route** or implement SettingsScreen.
18. **Enlarge PhotoViewer nav arrows** to 48×48 minimum, or add adequate `hitSlop`.

### P3 — Low Priority (Polish & Future)

19. **Set up Prettier config** + husky pre-commit hook + lint-staged.
20. **Add `accessibilityHint`** to all interactive elements.
21. **Wire `addWidget`/`removeWidget`/`updateWidgetConfig`** to UI or remove dead methods.
22. **Replace `Animated.Image` with `expo-image`** in PhotoViewer for cache consistency.
23. **Implement `expo-secure-store`** if biometric auth is intended, or remove from app.json.
24. **Add unit tests** for all hooks and services (target: 80%+ coverage).
25. **Fix `PhotosScreen` search** — currently only filters by `filename` and `albumId`; add date, location, metadata.
26. **Update README** to match actual shipped features and versions.

---

## 12. Risk Assessment

| Area | Risk | Mitigation |
|---|---|---|
| **Silent data corruption** | High | Storage `get<T>` returns raw string on parse failure | Fix error recovery (P0) |
| **Layout shift / visual bug** | High | Duplicate BlurHeader renders twice | Remove duplicate (P0) |
| **Performance on large libraries** | Medium | Sequential N+1 media queries in widgets | Parallelize + batch (P1) |
| **Accessibility compliance** | Medium | No reduced motion, small touch targets, hardcoded fonts | Add hooks + resize targets (P1/P2) |
| **Test fragility** | Medium | 75s runtime, Gesture mock incomplete | Fix mocks + split tests (P0/P2) |
| **TypeScript type safety** | Medium | 14 `any` escapes, loose `ColorTokens` type | Tighten types (P1) |
| **Data consistency** | Low | Cache cleared wholesale on delete | Targeted invalidation (P1) |
| **Config drift** | Low | README versions wrong, missing Prettier/Husky | Align docs + set up (P2) |

---

*End of review. Focus areas for immediate attention: the duplicate header, storage service type-safety bug, and the missing `Gesture` mock in the test setup.*