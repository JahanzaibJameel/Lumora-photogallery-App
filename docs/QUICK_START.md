# Quick Start Guide

> Get Lumora running on your machine in 5 minutes.

## Prerequisites Checklist

- [ ] Node.js 20+ installed ([nodejs.org](https://nodejs.org))
- [ ] npm 10+ installed (comes with Node)
- [ ] Git installed
- [ ] iOS: Xcode + Simulator (macOS only)
- [ ] Android: Android Studio + Emulator
- [ ] Web: Modern browser (Chrome, Firefox, Safari)

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/JahanzaibJameel/Lumora-photogallery-App.git
cd Lumora-photogallery-App

# Install dependencies
npm install
```

**Expected output:**
```
added 1234 packages in 30s
```

---

## Step 2: Start Development Server

```bash
npx expo start
```

**Expected output:**
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

---

## Step 3: Launch on Your Platform

### iOS (macOS only)

1. Press `i` in the terminal
2. Or run: `npm run ios`
3. Wait for Xcode Simulator to launch
4. First build takes ~2-3 minutes

### Android

1. Press `a` in the terminal
2. Or run: `npm run android`
3. Make sure an emulator is running or device is connected
4. First build takes ~2-3 minutes

### Web

1. Press `w` in the terminal
2. Or run: `npm run web`
3. Browser opens automatically
4. **Note:** Gallery will show empty states (native-only APIs)

---

## Step 4: Verify Installation

Run the quality gates:

```bash
# Type check (should pass)
npm run type-check

# Lint (should show 0 errors)
npm run lint

# Tests (should pass 497 tests)
npm test
```

All three should complete successfully.

---

## What's Next?

### Explore the App

1. **Albums Screen** — Browse your photo albums (iOS/Android only)
2. **Search** — Tap search icon to filter photos by filename
3. **Grid Density** — Tap the grid icon to cycle between 2/3/4 columns
4. **Photo Viewer** — Tap a photo for full-screen view with pinch-zoom
5. **Widgets** — Tap the widgets icon to see widget dashboard
6. **Theme** — Toggle light/dark mode in settings

### Development Workflow

```bash
# Clear Metro cache (if needed)
npx expo start -c

# Run tests in watch mode
npm run test:watch

# Check bundle size
npm run bundle-size

# Type-safe imports with @/ alias
import { useTheme } from '@/hooks/useTheme';
```

---

## Troubleshooting

### Metro won't start

```bash
# Clear caches
npx expo start -c

# Or reset the project
npm run reset-project
```

### iOS Simulator not found

```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 15 Pro"
```

### Android emulator not detected

1. Open Android Studio
2. Tools → Device Manager
3. Start an AVD (Android Virtual Device)
4. Wait for it to fully boot
5. Run `npm run android`

### Permission errors

On first launch, the app will request media library access. If denied:

1. Open device Settings
2. Find Lumora
3. Enable Media Library access
4. Restart the app

### Web shows empty gallery

**This is expected.** `expo-media-library` only works on iOS/Android. The web build is a working shell to verify the UI.

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start dev server |
| `npm run ios` | Launch on iOS |
| `npm run android` | Launch on Android |
| `npm run web` | Launch on web |
| `npm test` | Run test suite |
| `npm run lint` | Check code style |
| `npm run type-check` | Check types |

---

## File Structure

```
src/
├── app.tsx              # Root component
├── screens/             # Screen components
│   ├── AlbumsScreen.tsx
│   ├── PhotosScreen.tsx
│   ├── PhotoViewer.tsx
│   └── WidgetsScreen.tsx
├── components/          # Reusable UI
├── hooks/               # Custom hooks
├── services/            # Data layer
├── contexts/            # React contexts
└── theme/               # Design tokens
```

---

## Learn More

- [Architecture](./ARCHITECTURE.md) — System design deep dive
- [Contributing](./CONTRIBUTING.md) — Development workflow
- [Testing](./TESTING.md) — Test conventions
- [Troubleshooting](./TROUBLESHOOTING.md) — Detailed solutions

---

## Get Help

- **Issues:** [GitHub Issues](https://github.com/JahanzaibJameel/Lumora-photogallery-App/issues)
- **Discussions:** [GitHub Discussions](https://github.com/JahanzaibJameel/Lumora-photogallery-App/discussions)
- **Expo Docs:** [docs.expo.dev](https://docs.expo.dev)
- **React Native Docs:** [reactnative.dev](https://reactnative.dev)

---

## Success!

You're now running Lumora locally. Start exploring the code or making changes!

**Next steps:**
1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) to understand the workflow
2. Pick an issue from the roadmap
3. Make your first contribution
4. Share your improvements with the community
