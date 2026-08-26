# Contributing to Lumora

Thanks for contributing. This guide covers the workflow used by the repo.

## Prerequisites

- **Node.js 20+** and **npm 10+** (CI pins Node 20.x)
- Expo CLI (run via `npx expo`)
- iOS: macOS + Xcode (simulator) · Android: Android Studio + emulator · Web: any modern browser

> The repo pins `.npmrc` with `legacy-peer-deps=true`. Keep it so resolution matches CI.

## Getting started

```bash
git clone https://github.com/JahanzaibJameel/Lumora-photogallery-App.git
cd Lumora-photogallery-App
npm install
npm start
```

In the Expo dev menu: `i` = iOS, `a` = Android, `w` = Web.

## Required gates (must pass before push)

```bash
npm run lint          # ESLint flat config (eslint.config.mjs) — 0 errors expected
npm run type-check     # tsc --noEmit --skipLibCheck (strict)
npm test               # or: npm run test:coverage
```

CI runs all of the above plus a web export on pushes/PRs to `main`.

## Code style

- **TypeScript** strict mode (`tsconfig.json` extends `expo/tsconfig.base`). Avoid `any`; the codebase uses audited intersection types for native-only fields (`src/services/media.service.ts`).
- **ESLint** flat config (`eslint.config.mjs`). Notable rules: `import/no-unresolved` (error), `import/order` (warn, alphabetize asc), `@typescript-eslint/no-explicit-any` (warn), `no-unused-vars` off → `@typescript-eslint/no-unused-vars` warn (ignores `^_`).
- **Formatting:** no Prettier config yet — match the prevailing style (2-space indent, single quotes, no semicolons, trailing commas).
- **Components:** `memo()` + `displayName`; `useCallback` for handlers; `StyleSheet.create` for static styles; `accessibilityRole` + `accessibilityLabel` (+ `accessibilityHint` where useful) on interactive elements; `useReducedMotion()` to gate animations.

## Architecture guidelines

Lumora is a layered architecture — see [ARCHITECTURE.md](./ARCHITECTURE.md).

- **Screens** compose components and consume hooks.
- **Hooks** encapsulate data/state, calling services.
- **Services** are singletons wrapping native modules (MMKV, MediaLibrary). Use `getMediaService()` / `WidgetService`.
- **Components** are reusable UI; read theme via `useTheme()`.

### Data layer

- Honor `MediaService` caches; use `getPhotosByIds()` for batch reads (not a loop of `getPhotoById`).
- For a single album, use `getAlbumById()` (not `getAlbums().find()`).
- After mutations, call `WidgetService.clearCache(prefix?)` so the next fetch is fresh.
- Persist user data through `StorageService` / `StorageKeys` — MMKV is synchronous.

## Testing

- Tests are colocated (`src/**/*.test.tsx?`) plus `__tests__/App.test.tsx`.
- Coverage floors are **70%** (branches/functions/lines/statements) in `jest.config.js`.
- Reuse `src/test-utils` (`makePhoto`, `makeAlbum`, `makeMock*`, `renderWithProviders`).
- Prefer asserting on `accessibilityLabel`.
- Use `@testing-library/react-native` for components, `renderHook` for hooks, and `jest.setup.js` mocks for native modules.

## Commit & branch conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git checkout -b feat/short-description
# make changes, run gates
npm run lint && npm run type-check && npm test
git commit -m "feat: brief description"
git push -u origin feat/short-description
```

| Type | Use |
| :--- | :--- |
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Restructure, no behavior change |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `test` | Test additions/fixes |
| `chore` | Tooling, config, deps |

## Pre-PR checklist

- [ ] `npm run lint` shows 0 errors
- [ ] `npm run type-check` passes
- [ ] `npm test` (or coverage) passes
- [ ] New behavior is covered by tests where practical
- [ ] Docs updated if behavior/API changed (see `README.md`, `docs/`)

## Pull requests

Open against `main`. Ensure CI is green, then request review.

## Development tips

- Clear Metro cache: `npx expo start -c`
- Reset scaffold: `npm run reset-project`
- Dev menu: `d` in terminal (or shake on device)
- Windows note: the New Architecture + native modules build cleanly; use PowerShell or the WSL shell consistently to avoid path/case mismatches.
