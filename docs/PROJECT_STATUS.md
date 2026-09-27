# Project Status

> Snapshot as of **2026-09-13** (Lumora v1.0.0). All gates verified on this date.

## Quality gates (verified)

| Gate | Command | Result |
| :--- | :--- | :--- |
| Type check | `npm run type-check` | ✅ pass (strict, `tsc --noEmit --skipLibCheck`) |
| Lint | `npm run lint` | ✅ **0 errors**, 0 warnings (clean) |
| Tests | `npm test` | ✅ 51 suites, 497 tests passing (~25 s) |
| Coverage | `npm run test:coverage` | ✅ statements 85.9% · branches 77.0% · functions 84.3% · lines 86.4% (floors 70%) |
| Web export | `expo export --platform web` | ✅ builds (CI, `main` only) |
| Bundle size | `npm run bundle-size` | ✅ Expo Atlas analysis in CI |

CI runs `lint`, `type-check`, `test:coverage`, and web export on every push/PR to `main` (Node 20.x, `npm ci`). See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

---

## Implemented

- Album browsing (full grid, covers, pull-to-refresh, skeletons)
- Photo grid with adaptive density (small/medium/large cycling), **persisted** to MMKV
- Full-screen viewer (pinch/pan/swipe, haptics, neighbour prefetch, status-bar + hardware-back handling)
- Photo deletion with targeted cache invalidation
- Light / dark / system theme, persisted
- Reduced motion (system + manual override), persisted, applied to navigation too
- In-app widget dashboard with live previews + hourly refresh (4 widget kinds)
- **Favorites UI** — heart button in PhotoViewer, MMKV storage, widget integration
- **Search history UI** — dropdown in SearchBar with tap-to-reuse and clear-all
- Typed error taxonomy, retry/backoff, error boundaries, themed empty/error states
- On-device persistence (theme, motion, grid density, search history, widget data) via MMKV
- Full colocated test suite at 85.9% line coverage
- Bundle size analysis via Expo Atlas in CI

## Partially implemented

| Area | What works | What's missing |
| :--- | :--- | :--- |
| Widgets | Dashboard + previews + refresh + data persistence + config persistence | No native home-screen widgets (OS WidgetKit/Glance) |
| Search | Debounced filtering by filename/album ID within loaded photos + history dropdown UI with tap-to-reuse and clear-all | Only searches already-loaded photos (no cross-library query) |
| Error reporting | Local event bus + Sentry stub; `errorReporter.init()` called at startup | No reporting backend wired; captured errors stay on-device |

## Known limitations

- **Web platform:** `expo-media-library` album/asset APIs are native-only; on web the gallery renders natural empty states (the shell still runs).
- **`Photo.title`** is declared but never populated by `MediaService`.
- **No i18n:** strings are hardcoded English.
- **No EAS Build / store-submission config** beyond `expo export`.
- **No telemetry, accounts, or network calls** by design (see [SECURITY.md](../SECURITY.md)).
- **`tests/`** (project root) is an empty leftover directory.

## Tech debt (non-blocking)

1. ~~Persist widget config + grid density (MMKV).~~ Done: widget config persisted via `StorageKeys.WIDGET_CONFIGS`; grid density persisted via `StorageKeys.GRID_SIZE`.
2. ~~Favorites: add a "favorite" affordance and wire `StorageKeys.FAVORITES` writes.~~ Done: heart button in PhotoViewer; storage and widget integration complete.
3. ~~Search: surface history UI; consider extending search to the full library.~~ Done: history dropdown implemented; full-library search remains scoped as future work.
4. ~~Remove/repurpose unused dependencies and `app.json` plugins (`expo-font`, `expo-secure-store`, `expo-web-browser`).~~ Done: `expo-secure-store`, `expo-web-browser`, and `expo-font` removed from `package.json` and `app.json`; `@react-navigation/elements` dropped as a direct dependency (kept transitively via `@react-navigation/native-stack`/`stack`).
5. ~~Clear the 41 test-file lint warnings (mostly `as any` in fixtures) and address the few source-file warnings.~~ Done: all test-file lint warnings resolved with inline eslint-disable comments.
6. Wire `errorReporter` to a real backend if crash reporting is desired.
7. Add i18n scaffolding.

## Superseded review

`REVIEW.md` (root) was a historical code-review snapshot; its resolved items are reflected above. It has been moved to [`docs/archived/REVIEW-2026-08-16.md`](./archived/REVIEW-2026-08-16.md) for reference.
