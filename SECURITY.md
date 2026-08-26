# Security Policy

## Scope

Lumora is a local-first photo gallery. It:

- requests **media-library read/write permission only**, on demand, via `usePermission`;
- persists user preferences and widget data **on-device** using `react-native-mmkv`;
- makes **no network requests**, has **no accounts**, and emits **no analytics or telemetry**.

## Permissions

| Permission | When requested | Used for |
| :--- | :--- | :--- |
| `READ/WRITE_MEDIA` (expo-media-library) | On first gallery use; re-checked on app resume | Listing albums, loading photos, deleting a photo |

If permission is denied, the UI shows a themed empty state explaining how to re-enable it (`Linking.openSettings()`). There is no silent fallback that exfiltrates data.

## Data storage

All stored keys live under a single MMKV instance (`lumora-storage`):

| Key | Contents |
| :--- | :--- |
| `lumora_themes` | Theme mode |
| `lumora_reduced_motion` | Reduced-motion mode |
| `lumora_search_history` | Recent search queries (capped at 20) |
| `lumora_favorites` | Favorited photo IDs (reserved; no UI writes yet) |
| `lumora_widget_*` | Cached widget data |

Keys are not encrypted at rest. MMKV encrypts only if explicitly configured (not currently). Treat the device as the trust boundary.

## Error reporting

`errorReporter` is a local in-process event bus. It has a **commented-out Sentry integration point** but is **not wired to any backend** — captured errors stay on the device. To enable remote reporting, implement the Sentry listener in `src/utils/errorReporting.ts` and add `@sentry/react-native`. Doing so introduces outbound network traffic and should be disclosed to users.

## Unused capabilities

The following are installed/declared but **not used** by the app code today: `expo-secure-store` (also an `app.json` plugin), `expo-web-browser`. They expose no attack surface unless activated.

## Supported versions

Security fixes target the latest `main` of the `1.x` line.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via **GitHub Security Advisories** for this repository (or by emailing the maintainer) rather than opening a public issue. Include steps to reproduce, affected version, and impact.
