# Contributing to Lumora

Welcome! This document covers the development workflow for contributing to Lumora.

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Expo CLI** (optional, available via `npx expo`)
- **iOS**: macOS + Xcode 15+ (for iOS simulator builds)
- **Android**: Android Studio with SDK 34+ (for Android emulator builds)
- **Web**: Any modern browser (development via `w` key in Expo)

## Getting Started

```bash
# Clone and install
git clone https://github.com/Jahanzaibjameel/lumora-photogallery-app
cd lumora-photogallery-app
npm install

# Start the dev server
npx expo start
```

In the Expo dev menu, press:
- `i` — iOS simulator
- `a` — Android emulator
- `w` — Web browser
- `j` — JavaScript bundle (debug)

## Code Style & Standards

### TypeScript
- **Strict mode** is enabled (`tsconfig.json` extends `expo/tsconfig.base`)
- All source files must be type-safe — avoid `any` escapes
- Use explicit return types on exported functions
- `Photo` and `Album` interfaces in `src/types/index.ts` are the canonical types — reuse them instead of inline shapes

### ESLint
- Run `npm run lint` or `npx expo lint` before committing
- ESLint config is in `eslint.config.js` (flat config format)
- `no-unused-vars` is set to warn with `argsIgnorePattern: '^_'`

### Formatting
- Prettier is installed (`prettier` in devDependencies) but no config file exists yet
- Follow the existing code style: 2-space indent, single quotes, no semicolons (Expo default), trailing commas

## Architecture Guidelines

Lumora follows a **layered architecture** (see [Architecture](./ARCHITECTURE.md)):

1. **Screens** compose components and consume hooks
2. **Hooks** encapsulate data fetching and state logic, calling services
3. **Services** are singletons that wrap native modules (MMKV, MediaLibrary)
4. **Components** are reusable UI — use `memo` with `displayName`
5. **Contexts** provide cross-cutting concerns (Theme, ReducedMotion)

### Component Patterns
- Wrap all components in `memo()` with a custom `displayName`
- Use `useCallback` for all event handlers
- Use `StyleSheet.create` for static styles — avoid inline objects in render
- Always set `accessibilityRole` and `accessibilityLabel` on interactive elements
- Use `useReducedMotion()` to gate all animations

### Data Layer
- `MediaService` is a singleton — use `getMediaService()` to access it
- Respect the in-memory cache in `MediaService` — don't bypass it for reads
- For batch photo lookups, use `MediaService.getPhotosByIds()` (not a loop of `getPhotoById`)
- For single album lookups, use `MediaService.getAlbumById()` (not `getAlbums().find()`)
- `WidgetService` has a 5-minute TTL cache — call `WidgetService.clearCache()` after data mutations

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

- Tests live in `__tests__/` (integration)
- Test setup is in `jest.setup.js` — comprehensive mocks for all native modules
- Add new unit tests for hooks and services
- Coverage threshold target: 80% global

### Writing Tests
- Mock native modules via `jest.setup.js` only if broadly reusable
- Use `@testing-library/react-native` for component tests
- Test hooks with `@testing-library/react-hooks` pattern (render + act)
- Services can be tested by mocking the underlying native modules

## Commit Conventions

```bash
git checkout -b feature/short-description
# ... make changes ...
git add .
npm run lint && npm run type-check && npm test
git commit -m "feat: brief description of the change"
git push origin feature/short-description
```

### Commit Format
Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring, no behavior change |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `test` | Test additions or fixes |
| `chore` | Tooling, config, dependencies |
| `style` | Formatting, whitespace (no code logic change) |

### Pre-commit Checklist
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run type-check` passes (strict TypeScript)
- [ ] `npm test` passes
- [ ] Changes are covered by tests where applicable

## CI Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. Install dependencies (`npm install --legacy-peer-deps`)
2. ESLint (`npm run lint`)
3. TypeScript check (`npm run type-check`)
4. Jest tests (`npm test`)
5. Web build (`expo export --platform web`) — on `main` branch only

## Pull Requests

1. Open a PR against the `main` branch
2. Ensure all CI checks pass
3. Request review from a team member
4. Address feedback before merging

## Development Tips

- **Expo DevTools**: Run `npx expo start --dev-client` for native module debugging
- **Clear cache**: `npx expo start -c` clears the Metro bundler cache
- **Reset project**: `npm run reset-project` resets to a clean state
- **Logbox**: In dev, shake the device or press `d` in the terminal to toggle the debug menu
