# Testing

Lumora's test suite is colocated with the source and runs under Jest + `jest-expo`. As of v1.0.0 it covers **39 suites / 357 tests**, with global coverage of **93.6% statements / 83.3% branches / 90.8% functions / 94.1% lines**.

## Commands

```bash
npm test                 # full suite
npm run test:watch       # watch mode
npm run test:coverage    # coverage report with enforced 70% floors
```

`jest.config.js` uses the `jest-expo` preset. Coverage is collected from `src/**/*.{ts,tsx}` excluding `*.d.ts`, `types/**`, and test files; thresholds are 70% for branches, functions, lines, and statements.

## Structure

- **Unit tests** live next to the code they exercise: `src/hooks/usePhotos.test.ts`, `src/services/media.service.test.ts`, `src/components/AlbumCard.test.tsx`, etc. (38 colocated files).
- **Integration test:** [`__tests__/App.test.tsx`](../__tests__/App.test.tsx) renders the full provider tree and asserts the Albums screen mounts.

## Native module mocks

`jest.setup.js` provides deterministic fakes for every native dependency so tests exercise real app logic:

- `react-native-reanimated` — shared values, animated styles, `withSpring`/`withTiming`, `ReduceMotion`/`ReducedMotionConfig`
- `react-native-mmkv` — in-memory `Map` store
- `expo-media-library` — albums/assets with configurable page shapes
- `@shopify/flash-list`, `react-native-gesture-handler` (`Gesture.Pinch/Pan/Tap/Race/Simultaneous`), `react-native-safe-area-context`, `@react-navigation/*`

Retry paths are covered with `jest.useFakeTimers()`.

## Test utilities (`src/test-utils/`)

Reuse these instead of hand-rolling mocks:

| Export | Use |
| :--- | :--- |
| `makePhoto`, `makeAlbum`, `makeAlbumResult`, `makeFullBatch` | Domain fixtures (accept partial overrides; derive defaults from IDs) |
| `makeWidgetData`, `makeWidgetConfig` | Widget fixtures |
| `makeMediaLibraryAlbum`, `makeMediaLibraryAsset` | Raw `expo-media-library` shape builders |
| `makeMockMediaService`, `makeMockWidgetService` | Typed service mocks + `*Defaults` |
| `renderWithProviders` | Renders with `ThemeProvider` + `ReducedMotionProvider` (mirrors production) + RTL re-exports (`renderHook`, `waitFor`, `act`, `fireEvent`) |

```tsx
import { renderWithProviders, makeAlbum } from '../test-utils';

it('renders an album card', () => {
  const { getByText } = renderWithProviders(
    <AlbumCard album={makeAlbum({ title: 'Beach' })} onPress={jest.fn()} />
  );
  expect(getByText('Beach')).toBeTruthy();
});
```

## Conventions

- Prefer asserting on `accessibilityLabel` over visible copy — resilient to wording changes and reinforces the a11y contract.
- Keep `*.test.ts` for hooks/services/utils and `*.test.tsx` for components/screens.
- Mock native modules via `jest.setup.js` only when globally reusable; otherwise `jest.mock()` within the test file.
- Use `act()`/`waitFor()` around async state updates; fake timers for retry/backoff paths.
