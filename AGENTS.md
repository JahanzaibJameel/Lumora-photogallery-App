# AGENTS.md

## Project Overview

**Lumora** is a React Native + Expo SDK 53 photo gallery app with smart album browsing, an immersive photo viewer, in-app widgets, and full dark/light theme support.

## Tech Stack

- **React Native** 0.79.6 + **Expo SDK** 53.0.27
- **React** 19.0.0
- **React Navigation** v7 (Stack navigator)
- **React Native Reanimated** 3.17.4
- **React Native Gesture Handler** v2
- **FlashList** (@shopify/flash-list) for performant lists
- **MMKV** (react-native-mmkv) for storage
- **Expo Media Library** for device photo access
- **Jest** + jest-expo + @testing-library/react-native for testing

## Commands

### Install dependencies

```bash
npm install
```

### Development

```bash
npx expo start     # Opens the Expo dev menu (i/a/w)
```

### Quality checks

```bash
npm run lint          # ESLint via expo lint
npm run type-check    # TypeScript strict type checking (tsc --noEmit --skipLibCheck)
npm test              # Jest test suite
npm run test:watch    # Jest in watch mode
npm run test:coverage # Jest with coverage report
```

### Production builds

```bash
npm run build          # Expo web export
npm run build:android  # Android export
npm run build:ios      # iOS export
```

## Project structure

```text
src/
├── app.tsx              # Root app: providers + error boundary
├── index.js             # RN entry point
├── components/          # Shared UI (+ components/primitives)
├── contexts/            # React context providers (Theme, ReducedMotion, GridSize)
├── hooks/               # Custom React hooks
├── navigation/          # Stack navigator
├── screens/             # Screen components (+ screens/PhotoViewer internals)
├── services/            # Singleton data services (web-platform guarded)
├── test-utils/          # Shared test fixtures, mock builders, renderWithProviders
├── theme/               # Design tokens
├── types/               # TypeScript interfaces
└── utils/               # Helpers + typed error taxonomy / reporter
```

See `docs/ARCHITECTURE.md` for the full layered architecture and `docs/CONTRIBUTING.md` for the development workflow.

## Testing conventions

- Reuse `src/test-utils` — `makePhoto`/`makeAlbum`/`makeWidget*` factories and `makeMockMediaService`/`makeMockWidgetService` instead of hand-rolling mocks; use `renderWithProviders` so Theme/ReducedMotion context matches production.
- Coverage floors (**70%**) are enforced in `jest.config.js`; keep the suite green before handing off.
- Prefer asserting on `accessibilityLabel` over visible copy.
- `MediaService` returns empty results on web (`Platform.OS === 'web'`) because expo-media-library's album/asset APIs are native-only — don't remove those guards.
