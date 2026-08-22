<p align="center">
  <img src="./assets/images/icon.png" width="140" height="140" alt="Lumora Logo" />
</p>

<h1 align="center">Lumora</h1>

<p align="center">
  <strong>The photo gallery, reimagined for 2026.</strong><br>
  <em>Intelligent albums, fluid interactions, and a design that breathes.</em>
</p>

<p align="center">
   <a href="https://github.com/JahanzaibJameel/lumora/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square" alt="Platforms">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Expo-SDK%2053-000020?style=flat-square&logo=expo" alt="Expo SDK 53">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/React%20Native-0.79.6-61dafb?style=flat-square&logo=react" alt="React Native">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript Strict">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/tests-333%20passing-brightgreen?style=flat-square" alt="Tests passing">
  </a>
</p>

---

# ✨ Why Lumora?

Your memories deserve more than a grid.

**Lumora** combines **smooth performance**, **privacy-first design**, and a **thoughtful user experience** to create a gallery that feels alive. Smart album organization, a full-screen immersive viewer, and in-app home-screen widgets deliver a polished photo browsing experience across iOS, Android, and Web.

---

# 🚀 Feature Highlights

<table>
  <tr>
    <td width="50%">
      <h3>🖼️ Adaptive Photo Grid</h3>
      <p>A responsive grid with three density presets (small / medium / large), powered by FlashList for native-speed recycling while keeping every cell pixel-crisp.</p>
    </td>
    <td width="50%">
      <h3>🔍 Immersive Viewer</h3>
      <p>Pinch-to-zoom, swipe, and pan through full-resolution images with buttery-smooth animations and haptic feedback.</p>
    </td>
  </tr>

  <tr>
    <td>
      <h3>🧩 In-App Widgets</h3>
      <p>Configure daily memory, random photo, album preview, and favorites widgets with real-time previews and hourly auto-refresh.</p>
    </td>
    <td>
      <h3>🎨 Adaptive Themes</h3>
      <p>Automatic light, dark, and system theme modes with full color-token support for every surface.</p>
    </td>
  </tr>

  <tr>
    <td>
      <h3>♿ Accessibility</h3>
      <p>Reduced motion support (system + manual override), semantic roles and labels, live regions, and thoughtful touch targets throughout.</p>
    </td>
    <td>
      <h3>🛡️ Resilient by Design</h3>
      <p>Typed error taxonomy (<code>AppError</code>), categorized failures, retry with backoff caps, error boundaries, and graceful empty/error states on every screen.</p>
    </td>
  </tr>
</table>

---

# 🧰 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React Native 0.79.6 + Expo SDK 53 + React 19 | Cross-platform foundation |
| **Navigation** | React Navigation v7 (Stack) | Screen navigation & deep linking |
| **Animations** | React Native Reanimated 3.17 | Native 60 FPS animations |
| **Gestures** | React Native Gesture Handler v2 | Composable touch interactions |
| **Lists** | @shopify/flash-list 1.7.6 | Performant virtualized rendering |
| **Styling** | React Native StyleSheet + design tokens | Zero-runtime styling |
| **Storage** | react-native-mmkv 3.2 | Ultra-fast native key-value storage |
| **Media** | expo-media-library 17.1 | Device photo & album access |
| **Image Loading** | expo-image 2.4 | Cached image loading |
| **Icons** | @expo/vector-icons 14.1 | Modern iconography |
| **Effects** | expo-blur 14.1 · expo-linear-gradient · expo-haptics | Blur, gradients, tactility |
| **Testing** | Jest 29 + jest-expo + @testing-library/react-native | Unit, component & screen testing |

---

# 📦 Installation

## ✅ Prerequisites

- Node.js **20+**
- macOS + **Xcode 15+** (iOS builds)
- Android Studio with **SDK 34+**
- Expo CLI *(included via `npx expo`)*

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/JahanzaibJameel/lumora-photogallery-App.git

# Navigate into the project
cd lumora-photogallery-app

# Install dependencies
npm install

# Start Expo
npx expo start
```

### Run on your preferred platform

```text
i → iOS Simulator

a → Android Emulator

w → Web Browser
```

---

# 🔨 Development

## Scripts

| Command | Description |
| :--- | :--- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start the web dev server |
| `npm run lint` | Run ESLint (flat config, `eslint.config.mjs`) |
| `npm run type-check` | Run strict TypeScript checking (`tsc --noEmit`) |
| `npm test` | Run the Jest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report (thresholds enforced) |
| `npm run build` | Production web export (`expo export`) |
| `npm run build:android` / `build:ios` | Platform exports |

## Quality Standards

- **TypeScript** — strict mode across all source files; `npm run type-check` must stay green
- **ESLint** — flat config with **zero errors** enforced
- **Tests** — every PR keeps the suite green; coverage floors (**70%** branches/functions/lines/statements) are enforced by `jest.config.js`
- Components are `memo`-wrapped with explicit `displayName`
- Interactive elements ship `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint`

---

# 🏗️ Project Architecture

```text
src/
├── app.tsx                  # Root app component (providers + error boundary)
├── index.js                 # React Native entry point
│
├── components/              # Shared UI components
│   ├── AlbumCard.tsx        #   Album tile with thumbnail caching
│   ├── BlurHashImage.tsx    #   Cached image wrapper (expo-image)
│   ├── BlurHeader.tsx       #   Translucent header with search toggle
│   ├── EmptyState.tsx       #   Permission / empty / error states
│   ├── ErrorBoundary.tsx    #   Render-error recovery shell
│   ├── PhotoGridItem.tsx    #   Animated grid cell
│   ├── Skeleton.tsx         #   Loading placeholders
│   └── primitives/          #   IconButton · SearchBar · Text
│
├── contexts/                # Cross-cutting providers
│   ├── GridSizeContext.tsx  #   Grid density (small/medium/large)
│   ├── ReducedMotionContext.tsx # Motion preference (system + override)
│   └── ThemeContext.tsx     #   Theme mode + color tokens
│
├── hooks/                   # Custom React hooks
│   ├── useAlbums.ts         # Album pagination + retry
│   ├── useAlbumThumbnail.ts # Lazy album cover resolution
│   ├── usePermission.tsx    # Media library permission flow
│   ├── usePhotos.ts         # Photo pagination + delete + retry
│   ├── useReducedMotion.ts  # Reduced motion accessor
│   ├── useSearch.ts         # Search history + debounced value
│   ├── useTheme.ts          # Theme accessor
│   ├── useWidgetConfig.ts   # Widget configuration CRUD
│   ├── useWidgetData.ts     # Widget data loading per type
│   └── useWidgets.ts        # Widget orchestration hook
│
├── navigation/
│   └── RootNavigator.tsx    # Stack navigator, motion-aware transitions
│
├── screens/
│   ├── AlbumsScreen.tsx     # Album list + pull-to-refresh
│   ├── PhotosScreen.tsx     # Photo grid + search + grid-size cycling
│   ├── WidgetsScreen.tsx    # Widget configuration + previews
│   ├── PhotoViewer.tsx      # Full-screen viewer (zoom/swipe/haptics)
│   └── PhotoViewer/         #   Viewer internals
│       ├── PhotoViewerGestures.tsx
│       └── PhotoViewerOverlay.tsx
│
├── services/                # Singleton business logic
│   ├── media.service.ts     # MediaLibrary facade + TTL caches + retry
│   ├── storage.service.ts   # MMKV persistence + thumbnail cache
│   └── widget.service.ts    # Widget data builders + cache
│
├── test-utils/              # Shared test infrastructure
│   ├── factories.ts         # makePhoto / makeAlbum / makeWidget* fixtures
│   ├── mocks.ts             # Typed mock service builders
│   └── index.tsx            # renderWithProviders + RTL re-exports
│
├── theme/                   # Design tokens
│   ├── colors.ts            # Light/dark palettes + ColorTokens type
│   ├── spacing.ts · borderRadius.ts · typography.ts
│   ├── opacity.ts · elevation.ts
│   └── tokens.ts            # Token re-exports
│
├── types/
│   ├── index.ts             # Album, Photo domain types
│   └── navigation.ts        # RootStackParamList
│
└── utils/
    ├── errors.ts            # AppError + categorizeError taxonomy
    ├── errorReporting.ts    # Pluggable reporter (Sentry-ready)
    ├── accessibility.ts     # A11y label helpers
    └── helpers.ts           # hexToRgba
```

### Layered Architecture

The project follows a clean layered architecture:

1. **Screens** — Top-level views that compose components, hooks, and services
2. **Hooks** — Encapsulate data fetching, state management, and side effects
3. **Services** — Singleton data services (MediaService, StorageService, WidgetService)
4. **Contexts** — Cross-cutting concerns (Theme, ReducedMotion, GridSize)
5. **Components** — Reusable UI primitives and composite components
6. **Theme** — Design tokens (colors, spacing, typography, radius, elevation)
7. **Types** — Shared TypeScript interfaces

### Data Flow

```
Screens → Hooks (useAlbums, usePhotos, useWidgets) → Services (MediaService, StorageService, WidgetService) → expo-media-library / MMKV
```

---

# 🧠 Key Design Decisions

### StyleSheet over NativeWind

Zero runtime overhead, excellent TypeScript support, predictable styling, and first-class web compatibility. No external CSS-in-JS runtime.

### MMKV Storage

Native key-value storage via `react-native-mmkv` for ultra-fast synchronous persistence of favorites, settings, search history, thumbnails, and widget data.

### Gesture Handler v2 + Reanimated Worklets

Composable gestures and worklet-driven animations provide a true native experience for pinch-to-zoom and swipe navigation — with a full reduced-motion bypass path.

### MediaService Singleton

A singleton `MediaService` with in-memory `Map`-based TTL caches for albums and photo pages, batched pagination, transient-failure retry, and selective invalidation on photo deletion.

### Typed Error Taxonomy

All failures flow through `categorizeError` into a typed `AppError` (category, severity, code, context), consumed by `errorReporter` (pluggable Sentry integration point), error boundaries, and user-facing `EmptyState` variants — so retry logic and UI messaging stay data-driven instead of string-matched at the view layer.

### WidgetService Caching

A 5-minute TTL cache avoids redundant native media-library queries during periodic refreshes. Batched `getPhotosByIds` and parallelized `Promise.all` album queries eliminate N+1 patterns.

---

# 🧪 Testing

The suite runs **36 test suites / 333 tests** with enforced coverage floors:

```bash
npm test                 # full suite
npm run test:watch       # watch mode
npm run test:coverage    # coverage report (70% floors enforced)
```

## Current Coverage

| Metric | Global |
| :--- | :--- |
| Statements | **86%** |
| Branches | **78%** |
| Functions | **84%** |
| Lines | **86%** |

Coverage spans services, every custom hook, all four screens plus the photo viewer internals, contexts, navigation, root provider composition, primitives, and utility modules.

## Test Infrastructure (`src/test-utils/`)

Shared helpers keep tests DRY and behavior-focused:

- **`factories.ts`** — `makePhoto`, `makeAlbum`, `makeWidgetData`, `makeWidgetConfig`, and raw MediaLibrary fixture builders. Every factory accepts partial overrides and derives sensible defaults from IDs:

```ts
import { makePhoto, makeAlbum } from '../test-utils';

const photo = makePhoto({ id: 'p2' });                    // uri/filename derived: file://p2.jpg
const beach = makeAlbum({ id: 'a1', title: 'Beach' });    // overrides object…
const quick  = makeAlbum('a2');                           // …or plain-id shorthand
```

- **`mocks.ts`** — typed mock service builders (`makeMockMediaService`, `makeMockWidgetService`) so hook tests don't hand-roll mock objects.
- **`index.tsx`** — `renderWithProviders` wraps components in `ThemeProvider` + `ReducedMotionProvider`, mirroring production composition, plus RTL re-exports (`renderHook`, `waitFor`, `fireEvent`).

```tsx
import { renderWithProviders, makeAlbum } from '../test-utils';

it('renders an album card', () => {
  const { getByText } = renderWithProviders(
    <AlbumCard album={makeAlbum({ title: 'Beach' })} onPress={jest.fn()} />
  );
  expect(getByText('Beach')).toBeTruthy();
});
```

## Native Module Mocks

`jest.setup.js` provides comprehensive mocks for Reanimated, MMKV, expo-media-library, FlashList, Gesture Handler, Safe Area, and React Navigation — so tests exercise real app code against deterministic platform fakes. Retry paths are covered with Jest fake timers.

Prefer asserting on `accessibilityLabel` over visible copy — it keeps tests resilient to wording changes and reinforces the a11y contract.

---

# 📚 Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — full layered architecture reference
- [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) — development workflow & conventions

---

# 📄 License

This project is distributed under the **MIT License**.

See the **LICENSE** file for more information.

---

<p align="center">
  <sub>Built with ❤️ and plenty of ☕ using Expo & React Native.</sub><br>
  <sub>© 2026 Lumora. All rights reserved.</sub>
</p>
