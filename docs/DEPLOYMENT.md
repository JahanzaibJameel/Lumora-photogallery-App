# Deployment

Lumora deploys by **exporting static bundles** with Expo. There is no EAS Build / store-submission configuration in the repo today.

## Build commands

```bash
npm run build            # web   → dist/      (expo export --platform web)
npm run build:android    # android (expo export --platform android)
npm run build:ios        # ios     (expo export --platform ios)
```

`expo export` produces a self-contained bundle of the JS, assets, and native shell config. For web the output is a static site (`web.output: "single"` in `app.json`).

## CI

`.github/workflows/ci.yml` runs on push/PR to `main` (Node 20.x, `npm ci`):

1. `npm run lint`
2. `npm run type-check`
3. `npm run test:coverage`
4. `npx expo export --platform web` — **only on the `main` branch**

The CI web export validates that the app builds but does **not** publish it.

## Web hosting

The web export (`dist/`) is a static single-page bundle. Host it on any static file server (GitHub Pages, Netlify, Vercure, S3 + CDN). Note the [platform limitation](./PROJECT_STATUS.md): on web the gallery shows empty states because `expo-media-library` is native-only.

## Native distribution (not configured)

To ship to app stores you would additionally need:

- **EAS Build / Submit** (`eas.json`) — not present.
- Store metadata, signing credentials, and provisioning profiles.
- A production bundle (`expo prebuild` / EAS) for iOS/Android.

These are out of scope for the current repository; add them when native distribution is required.

## Pre-deploy checklist

- [ ] `npm run lint`, `npm run type-check`, `npm run test:coverage` green
- [ ] `app.json` version bumped when releasing (currently `1.0.0`)
- [ ] Assets present (`assets/images/icon.png`, splash, adaptive icons, favicon)
- [ ] For web: confirm empty-gallery behavior is acceptable for the target audience
