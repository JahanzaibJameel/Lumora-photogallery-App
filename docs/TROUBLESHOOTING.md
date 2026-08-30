# Troubleshooting

Practical fixes for issues encountered while building or running Lumora.

## Environment

### `npm install` peer-dependency errors

The repo pins `.npmrc` with `legacy-peer-deps=true` because React 19 / RN 0.79 / Expo SDK 53 produce transitive peer warnings. **Keep `.npmrc` as-is**; do not switch to `npm install --legacy-peer-deps` ad hoc and then commit lockfile churn.

### Node version

CI uses Node 20.x. Local Node 22+ works for dev, but if you see Metro/transform quirks, match CI (Node 20 LTS).

### Windows paths/casing

Use one shell consistently (PowerShell or WSL). The New Architecture + native modules build fine on Windows; mixed shells can cause case-sensitivity or symlink confusion in `node_modules`.

## Expo / Metro

### Stale bundle or "white screen"

```bash
npx expo start -c   # clears the Metro bundler cache
```

### `expo start` opens but platform doesn't launch

Press `i` / `a` / `w` in the terminal dev menu, or run `npm run ios` / `android` / `web` directly.

### Web shows an empty gallery

**Expected.** `expo-media-library` album/asset APIs are native-only; on web `MediaService` returns empty results and screens render their natural empty states. The web export is a working shell, not a functional gallery on browsers.

## Permissions

### "No Albums Found" / permission denied

`usePermission` gates the Albums screen. If denied, tap **Open Settings** (calls `Linking.openSettings()`) and re-grant media access. The hook also re-checks when the app returns to the foreground.

## Testing

### Suite is slow

The integration test (`__tests__/App.test.tsx`) mounts the full tree. Component/hook tests are fast; run `npm run test:coverage` to get a single number. Typical full run ≈ 40–45 s.

### Retry tests need fake timers

`useAlbums` / `usePhotos` retry paths use `setTimeout` backoff. Cover them with `jest.useFakeTimers()` + `jest.advanceTimersByTime(...)` (see `*.test.ts` retry blocks).

### A native module is "undefined" in a test

`jest.setup.js` mocks Reanimated, MMKV, expo-media-library, FlashList, Gesture Handler, Safe Area, and Navigation. If you add a new native dependency, add its mock there (or in the test file) — otherwise the import resolves to the real (unavailable-on-Jest) module.

## Lint / type errors

### `npm run lint` reports 41 warnings

These are mostly in `*.test.*` files (`no-explicit-any`, unused directives/aliases), plus a few in source files (`usePhotos.ts` unused `signal` parameter, `di.tsx` unused `useRef`, `media.service.performance.test.ts` import order). They are **warnings, not errors** — `expo lint` passes. Address them incrementally; see tech debt in [docs/PROJECT_STATUS.md](./PROJECT_STATUS.md).

### `type-check` fails only in tests

`tsc` includes `*.test.tsx?`. The source tree itself is strict-clean; test-only typing issues should be fixed rather than widened with `any`.

## Build / export

### `expo export` fails on missing or mismatched plugins

`expo export` fails when an `app.json` config plugin references a package that isn't installed. This project's only remaining plugin is `expo-splash-screen` (provided by `expo-splash-screen`, which is installed). If an export complains about a missing or mismatched plugin, run `npx expo-doctor` to reconcile `app.json` plugins with installed packages and the SDK version. See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

### Coverage threshold failure

`jest.config.js` enforces 70% floors. If you add code, add tests. Run `npm run test:coverage` and inspect the uncovered-line report.

## Still stuck

Run `npx expo-doctor` to validate the environment against the Expo SDK, and check [docs/PROJECT_STATUS.md](./PROJECT_STATUS.md) for known limitations.
