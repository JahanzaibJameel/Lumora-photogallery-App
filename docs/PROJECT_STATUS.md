# Project Status

> Snapshot as of **2026-08-26** (Lumora v1.0.0). All gates verified on this date.

## Quality gates (verified)

| Gate | Command | Result |
| :--- | :--- | :--- |
| Type check | `npm run type-check` | ✅ pass (strict, `tsc --noEmit --skipLibCheck`) |
| Lint | `npm run lint` | ✅ **0 errors**, 41 warnings (mostly in `*.test.*` files — `no-explicit-any`, unused aliases/directives; plus a few in source files) |
| Tests | `npm test` | ✅ 41 suites, 409 tests passing (~44 s) |
| Coverage | `npm run test:coverage` | ✅ statements 93.6% · branches 83.3% · functions 90.8% · lines 94.1% (floors 70%) |
| Web export | `expo export --platform web` | ✅ builds (CI, `main` only) |

CI runs `lint`, `type-check`, `test:coverage`, and web export on every push/PR to `main` (Node 20.x, `npm ci`). See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

---

## Implemented

- Album browsing (full grid, covers, pull-to-refresh, skeletons)
- Photo grid with adaptive density (small/medium/large cycling)
- Full-screen viewer (pinch/pan/swipe, haptics, neighbour prefetch, status-bar + hardware-back handling)
- Photo deletion with targeted cache invalidation
- Light / dark / system theme, persisted
- Reduced motion (system + manual override), persisted, applied to navigation too
- In-app widget dashboard with live previews + hourly refresh (4 widget kinds)
- Typed error taxonomy, retry/backoff, error boundaries, themed empty/error states
- On-device persistence (theme, motion, search history, widget data) via MMKV
- Full colocated test suite at 93%+ line coverage

## Partially implemented

| Area | What works | What's missing |
| :--- | :--- | :--- |
| Widgets | Dashboard + previews + refresh + data persistence + config persistence | No native home-screen widgets (OS WidgetKit/Glance) |
| Favorites | Storage key + favorites widget reader | No UI to mark a photo as favorite → widget always shows "No favorites yet" |
| Search | Debounced filtering by filename/album ID within loaded photos | History is persisted but has **no UI**; only searches already-loaded photos (no cross-library query) |
| Grid density | Cycle works | Not persisted (resets on relaunch) |
| Error reporting | Local event bus + Sentry stub | No reporting backend wired; `errorReporter.init()` is never called |

## Known limitations

- **Web platform:** `expo-media-library` album/asset APIs are native-only; on web the gallery renders natural empty states (the shell still runs).
- **Dead navigation route:** `RootStackParamList.Settings` has no screen.
- **`Photo.title`** is declared but never populated by `MediaService`.
- **No i18n:** strings are hardcoded English.
- **No EAS Build / store-submission config** beyond `expo export`.
- **No telemetry, accounts, or network calls** by design (see [SECURITY.md](../SECURITY.md)).
- **Lint warnings:** 41 in test files and a few in source files (`no-explicit-any`, unused directives/aliases, import order) — tracked, non-blocking.
- **`EmptyState`** calls `usePermission()` unconditionally (an extra native read on mount for non-permission states), and triggers `Vibration.vibrate` unconditionally on action — minor a11y/perf debt.
- **`tests/`** (project root) is an empty leftover directory.

## Tech debt (non-blocking)

1. ~~Persist widget config + grid density (MMKV).~~ Done: widget config persisted via `StorageKeys.WIDGET_CONFIGS`; grid density still session-only.
2. Favorites: add a "favorite" affordance and wire `StorageKeys.FAVORITES` writes.
3. Search: surface history UI; consider extending search to the full library.
4. Remove dead `Settings` route or implement a Settings screen.
5. ~~Remove/repurpose unused dependencies and `app.json` plugins (`expo-font`, `expo-secure-store`, `expo-web-browser`).~~ Done: `expo-secure-store`, `expo-web-browser`, and `expo-font` removed from `package.json` and `app.json`; `@react-navigation/elements` dropped as a direct dependency (kept transitively via `@react-navigation/native-stack`/`stack`).
6. Clear the 41 test-file lint warnings (mostly `as any` in fixtures) and address the few source-file warnings.
7. Wire `errorReporter` to a real backend if crash reporting is desired.
8. Add i18n scaffolding.

## Superseded review

`REVIEW.md` (root) was a historical code-review snapshot; its resolved items are reflected above. It has been moved to [`docs/archived/REVIEW-2026-08-16.md`](./archived/REVIEW-2026-08-16.md) for reference.
