# Roadmap

> Intentions, not commitments. Items below are **planned / future** and may change. Tracked gaps in the current build are in [docs/PROJECT_STATUS.md](./PROJECT_STATUS.md).

## Near term

- ~~**Persist widget configuration** (which widgets are enabled) and **grid density** to MMKV so they survive relaunch.~~ Completed: widget config persisted via `useWidgetConfig` → `StorageKeys.WIDGET_CONFIGS`; grid density still session-only.
- **Favorites UX** — add a favorite affordance and wire `StorageKeys.FAVORITES` writes so the favorites widget is useful.
- **Search history UI** — surface the MMKV-backed history (currently recorded but not shown).
- **Settings screen** — implement or remove the unused `RootStackParamList.Settings` route.
- ~~**Clean up unused dependencies** — `expo-secure-store`, `expo-web-browser`, `expo-font`, `@react-navigation/elements` (remove or adopt).~~ Completed: removed from `package.json` and `app.json` (elements retained transitively via `@react-navigation/native-stack`/`stack`).

## Mid term

- **Native home-screen widgets** — investigate iOS WidgetKit and Android Glance that surface the existing `WidgetService` data (today widgets are in-app only).
- **Cross-library search** — extend search beyond already-loaded pages (index on first load / background scan).
- **i18n** — string extraction and locale support (currently English-only).
- **Crash reporting** — optionally wire `errorReporter` to Sentry (`@sentry/react-native`) behind a flag.
- **Accessibility pass** — dynamic type scaling, `accessibilityHint` coverage, remove the unconditional `usePermission()` / `Vibration.vibrate` in `EmptyState`.

## Long term

- **EAS Build + Submit** pipelines and store metadata (none configured today; builds are source + `expo export`).
- **Cloud sync / backup** options (out of scope for the local-first design; would require a privacy review).
- **Editorial features** — albums-by-location/date clustering, basic edits.

## Explicitly out of scope (for now)

- Accounts, servers, and telemetry (local-first by design).
- Biometric/PIN app lock (would require adding `expo-secure-store` as a dependency).
