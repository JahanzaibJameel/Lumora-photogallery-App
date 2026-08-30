
<p align="center">
  <img src="./assets/images/icon.png" width="130" height="130" alt="Lumora icon" style="border-radius: 24px;" />
</p>

<h1 align="center">
  <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
    Lumora
  </span>
</h1>

<p align="center">
  <em>A modern cross-platform photo gallery for the mobile-first era.</em><br>
  Album browsing · Immersive viewer · Widget dashboard · Token-based theming
</p>

<br>

<p align="center">
  <a href="https://github.com/JahanzaibJameel/Lumora-photogallery-App/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/JahanzaibJameel/Lumora-photogallery-App/ci.yml?style=for-the-badge&logo=githubactions&logoColor=white&label=CI%2FCD" alt="CI status">
  </a>
  <a href="https://github.com/JahanzaibJameel/Lumora-photogallery-App/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/JahanzaibJameel/Lumora-photogallery-App?style=for-the-badge&logo=opensourceinitiative&logoColor=white&color=blue" alt="License">
  </a>
  <a href="https://github.com/JahanzaibJameel/Lumora-photogallery-App/stargazers">
    <img src="https://img.shields.io/github/stars/JahanzaibJameel/Lumora-photogallery-App?style=for-the-badge&logo=github&logoColor=white&color=yellow" alt="Stars">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo%20SDK-53-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 53">
  <img src="https://img.shields.io/badge/React%20Native-0.79-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React Native">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/tests-409%20passing-4c1?style=for-the-badge&logo=jest&logoColor=white" alt="Tests">
  <img src="https://img.shields.io/badge/coverage-93.6%25-brightgreen?style=for-the-badge&logo=codecov&logoColor=white" alt="Coverage">
  <img src="https://img.shields.io/badge/New%20Architecture-enabled-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="New Architecture">
  <img src="https://img.shields.io/badge/React%20Compiler-experimental-764ba2?style=for-the-badge&logo=react&logoColor=white" alt="React Compiler">
</p>

<br>

---

## 📋 Overview

**Lumora** is a production-grade photo gallery application built with React Native and Expo, designed for the modern mobile landscape of 2026. It leverages the New Architecture, React 19 concurrent features, and a token-based design system to deliver a seamless, performant experience across iOS, Android, and web.

> **Status: v1.0.0** — Core experience complete and battle-tested with **93%+ test coverage**. Secondary features under active development.  
> See [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for the precise feature matrix.

---

## ✨ Feature Matrix

| Feature | Status | Details |
|:---|:---:|:---|
| 📁 **Album browsing** | ✅ | FlashList, pull-to-refresh, skeleton states |
| 🖼️ **Photo grid** | ✅ | Adaptive 2/3/4-column density cycling |
| 🔍 **Full-screen viewer** | ✅ | Pinch-zoom, pan, swipe, haptics, smart prefetch |
| 🗑️ **Photo deletion** | ✅ | Long-press → confirm → targeted cache invalidation |
| 🌗 **Theme system** | ✅ | Light/dark/system with MMKV persistence |
| ♿ **Reduced motion** | ✅ | System detection + manual override |
| 🧩 **Widget dashboard** | ⚠️ | Live previews, hourly refresh; config persisted |
| ⭐ **Favorites** | ⚠️ | Storage + widget exist; no marking UI yet |
| 🔎 **Search** | ⚠️ | Debounced filename/album filter within loaded pages |
| 🛡️ **Error taxonomy** | ✅ | Typed AppError, retry with backoff, reporting seam |

> ✅ Implemented · ⚠️ Partial · 🔜 Planned

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph "UI Layer"
        A[Screens] --> B[Hooks]
        C[Components] --> B
    end

    subgraph "State Layer"
        B --> D[Contexts]
        D --> D1[Theme]
        D --> D2[ReducedMotion]
        D --> D3[GridSize]
    end

    subgraph "Service Layer"
        B --> E[Services]
        E --> E1[MediaService]
        E --> E2[StorageService]
        E --> E3[WidgetService]
    end

    subgraph "Native Layer"
        E1 --> F[expo-media-library]
        E2 --> G[MMKV]
        E3 --> H[expo-image]
    end

    subgraph "Cross-cutting"
        I[AppError Taxonomy] --> B
        I --> E
        J[ErrorReporter] --> I
    end

    style A fill:#667eea,color:#fff,stroke:none
    style C fill:#667eea,color:#fff,stroke:none
    style B fill:#764ba2,color:#fff,stroke:none
    style D fill:#764ba2,color:#fff,stroke:none
    style E fill:#f093fb,color:#fff,stroke:none
    style I fill:#f5576c,color:#fff,stroke:none
    style J fill:#f5576c,color:#fff,stroke:none
````

Full details: [`docs/ARCHITECTURE.md`](https://docs/ARCHITECTURE.md)

---

## 🧰 Tech Stack

| **LayerTechnologyVersion** |                                                                                          |                       |
| -------------------------- | ---------------------------------------------------------------------------------------- | --------------------- |
| **Framework**              | [React Native](https://reactnative.dev/)                                                 | 0.79.6                |
| **Tooling**                | [Expo SDK](https://expo.dev/)                                                            | 53                    |
| **UI Library**             | [React](https://react.dev/)                                                              | 19 (New Architecture) |
| **Language**               | [TypeScript](https://www.typescriptlang.org/)                                            | 5.8 (strict)          |
| **Navigation**             | [React Navigation](https://reactnavigation.org/)                                         | v7 (Stack)            |
| **Lists**                  | [@shopify/flash-list](https://shopify.github.io/flash-list/)                             | 1.7.6                 |
| **Animations**             | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)           | ~3.17                 |
| **Gestures**               | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | ~2.24                 |
| **Media**                  | [expo-media-library](https://docs.expo.dev/versions/latest/sdk/media-library/)           | ~17.1                 |
| **Images**                 | [expo-image](https://docs.expo.dev/versions/latest/sdk/image/)                           | ~2.4                  |
| **Storage**                | [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)                       | ^3.2                  |
| **Effects**                | expo-blur · expo-linear-gradient · expo-haptics                                          | —                     |
| **Testing**                | Jest 29 · @testing-library/react-native 12                                               | —                     |

---

## 📂 Project Structure

text

```
src/
├── app.tsx                  # Provider composition + error boundary
├── index.js                 # RN entry (registerRootComponent)
├── components/              # Shared UI + primitive components
├── contexts/                # Theme · ReducedMotion · GridSize providers
├── hooks/                   # Data fetching + UI logic hooks
├── navigation/              # RootNavigator (typed stack)
├── screens/                 # Albums · Photos · PhotoViewer · Widgets
├── services/                # media · storage · widget singletons
├── test-utils/              # Factories · mock builders · renderWithProviders
├── theme/                   # Design tokens (colors, spacing, typography)
├── types/                   # Domain models + RootStackParamList
└── utils/                   # Error taxonomy · reporting · a11y helpers
```

---

## 🚀 Getting Started

### Prerequisites

| **ToolMinimum Version**      |        |
| ---------------------------- | ------ |
| **Node.js**                  | 20+    |
| **npm**                      | 10+    |
| **Xcode** (iOS)              | Latest |
| **Android Studio** (Android) | Latest |

### Installation

bash

```
# Clone the repository
git clone https://github.com/JahanzaibJameel/Lumora-photogallery-App.git
cd Lumora-photogallery-App

# Install dependencies
npm install

# Start the dev server
npx expo start
```

Then press `i` for iOS, `a` for Android, or `w` for web in the Expo dev menu.

> 💡 **Note:** The repo pins `.npmrc` to `legacy-peer-deps=true`. Keep it — it ensures dependency resolution matches CI.

### Configuration

**Zero environment variables required.** Runtime configuration lives in:

| **FilePurpose**                                   |                                                        |
| ------------------------------------------------- | ------------------------------------------------------ |
| [`app.json`](https://app.json/)                   | App identity, icons, splash, Expo plugins, experiments |
| [`tsconfig.json`](https://tsconfig.json/)         | Strict TS, `@/*` path alias                            |
| [`eslint.config.mjs`](https://eslint.config.mjs/) | Flat ESLint config                                     |
| [`jest.config.js`](https://jest.config.js/)       | Jest configuration                                     |
| [`babel.config.js`](https://babel.config.js/)     | Babel + Reanimated plugin                              |

---

## 🛠️ Development Scripts

| **CommandDescription**  |                                         |
| ----------------------- | --------------------------------------- |
| `npm start`             | Launch Expo dev server                  |
| `npm run android`       | Start on Android emulator               |
| `npm run ios`           | Start on iOS simulator                  |
| `npm run web`           | Start in web browser                    |
| `npm run lint`          | ESLint (flat config, 0 errors expected) |
| `npm run type-check`    | Strict TypeScript check                 |
| `npm test`              | Run Jest suite (41 suites / 409 tests)  |
| `npm run test:watch`    | Jest watch mode                         |
| `npm run test:coverage` | Coverage report (70% floors enforced)   |
| `npm run build`         | Static web export                       |
| `npm run build:android` | Android platform export                 |
| `npm run build:ios`     | iOS platform export                     |

---

## 🧪 Testing & Quality

The colocated suite covers **every** hook, service, context, screen, component primitive, and utility.

| **MetricValue** |       |
| --------------- | ----- |
| **Statements**  | 93.6% |
| **Branches**    | 83.3% |
| **Functions**   | 90.8% |
| **Lines**       | 94.1% |
| **Test suites** | 41    |
| **Tests**       | 409   |

Testing conventions and fixtures: [`docs/TESTING.md`](https://docs/TESTING.md)

---

## 🎨 Design System

Lumora uses a **token-based theme system** built on typed design tokens:

* **ColorTokens** — Derived from light/dark palettes, fully typed
* **Spacing** — 4pt scale (`xs` → `3xl`)
* **Typography** — Systematic scale with semantic variants
* **Radii** — Consistent corner radius tokens
* **Motion** — Reduced-motion aware animation durations

typescript

```
// Example: accessing theme tokens
const { colors, spacing, typography } = useTheme();
```

---

## ⚡ Performance

| **TechniqueImplementation** |                                                         |
| --------------------------- | ------------------------------------------------------- |
| **Virtualized lists**       | FlashList with measured `estimatedItemSize`             |
| **Cursor pagination** | Photos load in batches via `usePaginatedQuery` with `onEndReachedThreshold={0.5}` |
| **Caching**                 | TTL + LRU (albums 5min / photos 2min / thumbs 10min)    |
| **Request coalescing**      | In-flight deduplication in `MediaService`               |
| **Batched queries**         | `getPhotosByIds` + `Promise.all` album scans            |
| **Targeted invalidation**   | Only affected pages/albums/thumbnails dropped on delete |
| **Smart prefetch**          | Neighbor-image prefetch in viewer                       |
| **Memoization**             | Memoized providers and components throughout            |
| **Worklet gestures**        | Reanimated worklet-driven interactions                  |

---

## ♿ Accessibility

* ✅ Semantic roles, labels, and hints on all interactive elements
* ✅ Live regions on empty and error states
* ✅ 48pt minimum touch targets (`MIN_TOUCH_TARGET`)
* ✅ Reduced motion honored system-wide with manual override
* ✅ Zero-motion paths for all animations (including nav transitions)
* ✅ Screen reader compatible labels throughout

---

## 🌍 Platform Support

| **PlatformStatusNotes** |    |                                                                            |
| ----------------------- | -- | -------------------------------------------------------------------------- |
| **Android**             | ✅  | Adaptive icon, edge-to-edge, hardware back handling                        |
| **iOS**                 | ✅  | Tablet-capable, modal viewer presentation                                  |
| **Web**                 | ⚠️ | Runs, but gallery shows empty states — `expo-media-library` is native-only |

---

## 📦 Deployment

CI performs a web export on pushes to `main`. No EAS Build or store-submission configuration yet.

Details: [`docs/DEPLOYMENT.md`](https://docs/DEPLOYMENT.md)

---

## 🔒 Security

| **AspectDetail**    |                                                           |
| ------------------- | --------------------------------------------------------- |
| **Permissions**     | Read/write media library only, on-demand                  |
| **Data**            | 100% local (MMKV) — no network, no accounts, no telemetry |
| **Error reporting** | Local event bus; Sentry integration point commented out   |
| **Policy**          | [`SECURITY.md`](https://security.md/)                     |

---

## ⚠️ Known Limitations

See [`docs/PROJECT_STATUS.md`](https://docs/PROJECT_STATUS.md) for the full list, including:

* Widget configuration is persisted; grid density is session-only (not persisted)
* No UI to mark photos as favorites (storage exists)
* Search limited to filename/album-ID within loaded pages
* English-only strings
* Minor lint warnings in test files (tracked)

---

## 🗺️ Roadmap

 * □

   Persist grid density
 * □

  Favorites UI (mark/unmark from viewer and grid)
* □

  Full-text search with SQLite index
* □

  i18n support (starting with Spanish and Urdu)
* □

  Native home-screen widgets (iOS WidgetKit / Android AppWidgets)
* □

  EAS Build + TestFlight/Play Store submission
* □

  Cloud backup for favorites and preferences

Full roadmap: [`docs/ROADMAP.md`](https://docs/ROADMAP.md)

---

## 🤝 Contributing

We welcome contributions! Read the [Contributing Guide](https://docs/CONTRIBUTING.md) for:

* **Conventional Commits** required
* **Quality gates:** `lint` ✅ · `type-check` ✅ · `test` ✅
* PR template and review process

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](https://license/) for details.


