<p align="center">
  <img src="./assets/images/icon.png" width="140" height="140" alt="Lumora icon" />
</p>

<h1 align="center">Lumora</h1>

<p align="center">
  <strong>A cross-platform photo gallery built with React Native and Expo.</strong><br>
  Album browsing, an immersive full-screen viewer, in-app widgets, and a token-based theme system.
</p>

<p align="center">
  <a href="https://github.com/JahanzaibJameel/Lumora-photogallery-App/actions/workflows/ci.yml">
    <img src="https://github.com/JahanzaibJameel/Lumora-photogallery-App/actions/workflows/ci.yml/badge.svg" alt="CI status">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License: MIT">
  </a>
  <img src="https://img.shields.io/badge/Expo%20SDK-53.0-000020?style=flat-square&logo=expo" alt="Expo SDK 53">
  <img src="https://img.shields.io/badge/React%20Native-0.79.6-61dafb?style=flat-square&logo=react" alt="React Native 0.79.6">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/tests-357%20passing-brightgreen?style=flat-square" alt="357 tests passing">
</p>

---

## Status

**v1.0.0 — active development.** The core gallery experience (albums, photo grid, viewer, themes, widgets dashboard, error handling, test suite at 93%+ line coverage) is implemented and covered by CI. Several secondary features are partially implemented — see [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for the precise implemented / partial / planned breakdown.

## Key Features

| Feature | State | Notes |
| :--- | :--- | :--- |
| Album browsing with covers | Implemented | Paginated `FlashList` grid, pull-to-refresh, skeleton loading states |
| Photo grid with adaptive density | Implemented | Small (4 col) / medium (3 col) / large (2 col) cycling; density is not persisted |
| Full-screen photo viewer | Implemented | Pinch-to-zoom, pan, swipe navigation, haptics, neighbour image prefetch |
| Photo deletion | Implemented | Long-press → confirm dialog → targeted cache invalidation |
| Light / dark / system themes | Implemented | Persisted via MMKV; typed `ColorTokens` derived from the palettes |
| Reduced motion support | Implemented | System detection + manual override (`system` / `always` / `never`), persisted |
| In-app widget dashboard | Partially implemented | Daily-memory / random-photo / favorites / album-preview cards with live previews and hourly refresh; **configuration toggles are session-only**, and **widgets are in-app only — there are no native home-screen widgets** |
| Favorites | Partially implemented | Storage key and favorites widget exist; no UI to mark a photo as favorite yet |
| Search | Partially implemented | Debounced filename/album-ID filter within loaded photos; history is persisted but has no UI |
| Typed error taxonomy + reporting seam | Implemented | `AppError` categories/severities, retry with backoff, error boundaries; reporter has listeners but **no crash-reporting backend wired** |

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| Framework | [React Native](https://reactnative.dev) 0.79.6 · [Expo SDK](https://expo.dev) 53 · React 19 (New Architecture enabled) |
| Language | TypeScript 5.8 (strict mode) |
| Navigation | React Navigation v7 — `@react-navigation/stack` navigator |
| Lists | [@shopify/flash-list](https://shopify.github.io/flash-list/) 1.7.6 |
| Animations | React Native Reanimated ~3.17.4 (+ React Compiler experiment enabled) |
| Gestures | React Native Gesture Handler ~2.24 |
| Media access | expo-media-library ~17.1 (native-only APIs; web degrades to empty states) |
| Images | expo-image ~2.4 with memory+disk caching |
| Storage | react-native-mmkv ^3.2 (synchronous on-device key-value store) |
| Effects | expo-blur, expo-linear-gradient, expo-haptics, @expo/vector-icons |
| Testing | Jest 29 + jest-expo + @testing-library/react-native 12 |

## Architecture Overview

Lumora follows a layered architecture:

```text
Screens → Hooks → Services → Native modules (expo-media-library, MMKV)
                    ↑
        Contexts (Theme, ReducedMotion, GridSize)
```

- **Screens** compose UI and consume hooks.
- **Hooks** own data fetching, pagination, retry/backoff, and mutation state.
- **Services** are singletons wrapping native modules, with TTL caches, in-flight request deduplication, and targeted cache invalidation.
- **Contexts** provide theme, reduced-motion, and grid-density state.
- All failures flow through a typed `AppError` taxonomy into an injectable error reporter.

Full details: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Project Structure

```text
src/
├── app.tsx                  # Provider composition + status bar + error boundary
├── index.js                 # RN entry point (registerRootComponent)
├── components/              # Shared UI (+ components/primitives)
├── contexts/                # Theme, ReducedMotion, GridSize providers
├── hooks/                   # Data fetching + UI logic hooks
├── navigation/              # RootNavigator (typed stack)
├── screens/                 # Albums, Photos, PhotoViewer (+ internals), Widgets
├── services/                # media / storage / widget singletons
├── test-utils/              # Factories, mock builders, renderWithProviders
├── theme/                   # Design tokens (colors, spacing, typography, …)
├── types/                   # Domain models + RootStackParamList
└── utils/                   # Error taxonomy, reporting, a11y helpers
```

## Prerequisites

- **Node.js 20+** (CI runs on Node 20.x)
- **npm 10+**
- iOS builds: macOS with Xcode (for the simulator)
- Android builds: Android Studio with an emulator
- Web: any modern browser

## Installation

```bash
git clone https://github.com/JahanzaibJameel/Lumora-photogallery-App.git
cd Lumora-photogallery-App
npm install
npx expo start
```

In the Expo dev menu press `i` (iOS simulator), `a` (Android emulator), or `w` (web browser).

> The repo pins `.npmrc` to `legacy-peer-deps=true`; keep it in place so dependency resolution matches CI.

## Environment Configuration

There are **no environment variables** to configure. Runtime configuration lives in:

- [`app.json`](./app.json) — app identity, icons/splash, platform options, Expo plugins, experiments (`typedRoutes`, `reactCompiler`)
- [`tsconfig.json`](./tsconfig.json) — strict TypeScript, `@/*` path alias
- [`eslint.config.mjs`](./eslint.config.mjs), [`jest.config.js`](./jest.config.js), [`babel.config.js`](./babel.config.js)

## Development Commands

| Command | Description |
| :--- | :--- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `ios` / `web` | Start on a specific platform |
| `npm run lint` | ESLint (flat config via `expo lint`) |
| `npm run type-check` | Strict TypeScript check (`tsc --noEmit --skipLibCheck`) |
| `npm test` | Run the Jest suite (39 suites / 357 tests) |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage report; 70% floors enforced |
| `npm run build` | Static web export (`expo export --platform web`) |
| `npm run build:android` / `build:ios` | Platform exports |
| `npm run reset-project` | Reset scaffolding script from the Expo template |

## Testing

The colocated suite (`src/**/*.test.tsx?` plus `__tests__/App.test.tsx`) covers every hook, service, context, screen, component primitive, and utility. Current global coverage: **93.6% statements / 83.3% branches / 90.8% functions / 94.1% lines**, against enforced 70% floors.

See [docs/TESTING.md](./docs/TESTING.md) for conventions, fixtures (`makePhoto`, `makeAlbum`, …), and mock infrastructure.

## Linting and Formatting

- ESLint flat config ([`eslint.config.mjs`](./eslint.config.mjs)): **0 errors expected**; a small set of warnings remains in test files and is tracked in [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md).
- No Prettier config yet — follow the prevailing style (2-space indent, single quotes, trailing commas).

## Build Instructions

```bash
npm run build            # web → dist/
npm run build:android    # Android export
npm run build:ios        # iOS export
```

These produce static export bundles via `expo export`. There is **no EAS Build / store-submission configuration yet** — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Deployment

CI performs a web export on pushes to `main`. Deployment targets are not configured; the repo currently ships source + exports only. Details and constraints: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Security Considerations

- The app requests **read/write media library permissions only**, on demand, through `usePermission`.
- All persistence is **local on-device** (MMKV). No accounts, no network calls, no analytics/telemetry.
- `errorReporter` is a local event bus with a commented Sentry integration point — nothing leaves the device today.

Details and reporting policy: [SECURITY.md](./SECURITY.md).

## Performance Considerations

- FlashList with measured `estimatedItemSize`, `removeClippedSubviews`, and proactive pagination (`onEndReachedThreshold={0.5}`)
- TTL + LRU caches in `MediaService` (albums 5 min / photos 2 min / thumbnails 10 min) with in-flight request coalescing
- Batched photo lookups (`getPhotosByIds`) and parallelized album scans (`Promise.all`) instead of sequential N+1 queries
- Targeted cache invalidation after deletions (only affected pages/albums/thumbnails are dropped)
- Neighbour-image prefetch in the viewer; memoized providers/components; worklet-driven gestures

## Accessibility Considerations

- Semantic roles, labels, and hints on interactive elements; live regions on empty/error states
- 48pt minimum touch targets (`MIN_TOUCH_TARGET`)
- Reduced motion honored system-wide with a manual override; all animations have a zero-motion path (including navigation transitions)

## Platform Support

| Platform | State |
| :--- | :--- |
| Android | Supported (adaptive icon, edge-to-edge, hardware back handling) |
| iOS | Supported (tablet-capable, modal viewer presentation) |
| Web | Runs, but the gallery shows natural empty states — `expo-media-library` album/asset APIs are native-only by design |

## Known Limitations

See [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for the full list, including: non-persisted widget/grid preferences, favorites without a favoriting UI, search limited to filename/album ID within loaded pages, English-only strings, and lint warnings in test files.

## Roadmap

[docs/ROADMAP.md](./docs/ROADMAP.md).

## Contributing

Contributions welcome — read [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for the workflow (Conventional Commits, required gates: `lint`, `type-check`, `test`).

## License

Distributed under the [MIT License](./LICENSE).

---

<p align="center">
  <sub>Built with Expo and React Native.</sub>
</p>
