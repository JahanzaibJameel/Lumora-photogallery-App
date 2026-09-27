# Features

> Complete feature reference for Lumora v1.0.0.

## Table of Contents

- [Gallery Features](#gallery-features)
- [Photo Viewer](#photo-viewer)
- [Search](#search)
- [Widgets](#widgets)
- [Favorites](#favorites)
- [Customization](#customization)
- [Accessibility](#accessibility)
- [Platform Features](#platform-features)

---

## Gallery Features

### Album Browsing

**Location:** Albums Screen (initial route)

- **Grid View** — FlashList-powered scrollable grid of albums
- **Cover Images** — Automatic thumbnail from first photo
- **Album Metadata** — Title and photo count
- **Pull-to-Refresh** — Swipe down to reload albums
- **Skeleton Loading** — Smooth loading placeholders
- **Empty States** — Themed messages for permissions, errors, empty library
- **Haptic Feedback** — Touch feedback on album tap (iOS/Android)

### Photo Grid

**Location:** Photos Screen (album detail)

- **Adaptive Columns** — 2, 3, or 4 columns based on density setting
- **Density Cycling** — FAB button to toggle small/medium/large grid
- **Cursor Pagination** — Load 30 photos at a time, infinite scroll
- **Pull-to-Refresh** — Reload current album
- **Long Press to Delete** — Confirmation dialog before deletion
- **Search** — Filter photos by filename
- **Performance** — Virtualized rendering, measured item size
- **Empty States** — No photos, errors, permission denied

### Photo Management

- **View** — Tap any photo to open full-screen viewer
- **Delete** — Long press → confirm → permanent deletion
- **Favorite** — Heart button in viewer (persist to storage)
- **Metadata** — Filename, dimensions, date (in viewer)

---

## Photo Viewer

**Location:** PhotoViewer Screen (modal)

### Gestures

- **Pinch-to-Zoom** — Two-finger pinch scales up to 4×
- **Pan** — Drag to move zoomed photo
- **Swipe** — Left/right to navigate between photos
- **Double-Tap** — Zoom to 2× (or reset to 1×)
- **Tap** — Show/hide overlay controls

### Controls

- **Back Arrow** — Top-left, return to grid
- **Navigation Arrows** — Left/right, move between photos
- **Favorite Button** — Top-right, heart icon (outline/filled)
- **Info Badge** — Bottom, shows filename and index

### Performance

- **Prefetch** — Loads neighbor photos in background
- **Smooth Animations** — Reanimated worklet-driven gestures
- **Reduced Motion** — Respects accessibility preference
- **Memory Efficient** — Cleans up off-screen images

### Platform Integration

- **Status Bar** — Hidden while viewing, restored on exit
- **Hardware Back** — Android back button closes viewer
- **Safe Areas** — Respects notches and home indicators

---

## Search

**Location:** Photos Screen (header icon)

### Functionality

- **Debounced Input** — 300ms delay, smooth typing
- **Filename Matching** — Case-insensitive substring search
- **Real-Time Filtering** — Results update as you type
- **Clear Button** — × icon to reset search

### Search History

- **Recent Searches** — Up to 20 stored queries
- **Dropdown** — Shows when input is focused and empty
- **Tap to Reuse** — Instant re-search
- **Clear All** — Button to wipe history
- **Persistence** — Stored in MMKV, survives app restarts
- **Deduplication** — Existing queries moved to top

### Limitations

- Album-scoped (doesn't search other albums)
- Loaded photos only (doesn't search unpaginated content)
- Filename only (no metadata search)

---

## Widgets

**Location:** Widgets Screen (header icon from Albums)

### Widget Types

#### Daily Memory

- **Photos from history** — Same month/day in prior years
- **Up to 5 photos** — Scans first 10 albums (30 photos each)
- **Nostalgia feature** — Rediscover old photos

#### Random Photos

- **Shuffled selection** — Fisher-Yates shuffle algorithm
- **Configurable count** — Default 4 photos
- **Fresh on refresh** — New random selection each time

#### Album Preview

- **First 4 photos** — From a specific album
- **Album metadata** — Title and count
- **Quick access** — Jump to album from widget

#### Favorites

- **Your favorites** — Up to 4 favorited photos
- **Heart icon** — Visual indicator
- **Empty state** — Message when no favorites yet

### Widget Management

- **Toggle On/Off** — Enable/disable widgets
- **Live Previews** — See widget content immediately
- **Hourly Refresh** — Automatic updates every 60 minutes
- **Manual Refresh** — Pull down to reload
- **Persistent Config** — Saved to MMKV

### Limitations

- In-app only (no native home screen widgets yet)
- Limited to 4 photos per widget
- Refresh requires app to be open

---

## Favorites

**Location:** Photo Viewer (heart button)

### Features

- **Toggle Button** — Tap to favorite/unfavorite
- **Visual Feedback** — Outline → filled red heart
- **Persistent Storage** — Saved to MMKV
- **Widget Integration** — Favorites widget shows favorited photos
- **No Limit** — Favorite as many photos as you want

### Usage

1. Open any photo in viewer
2. Tap heart icon in top-right
3. Icon fills with red color
4. Photo saved to favorites
5. Tap again to unfavorite

---

## Customization

### Theme

**Location:** System + app-level (no dedicated Settings screen yet)

- **Light Mode** — High contrast, clean white background
- **Dark Mode** — OLED-friendly, reduced eye strain
- **System** — Follow device preference (default)
- **Persistent** — Saved across app restarts
- **Note:** `toggleTheme` / `setThemeMode` exist on the context but are not yet exposed through a UI control; wire one up to complete the customization loop.

### Grid Density

**Location:** Photos Screen (grid icon FAB)

- **Small** — 4 columns, compact view
- **Medium** — 3 columns, balanced (default)
- **Large** — 2 columns, spacious
- **Cycle Button** — Tap to toggle through sizes
- **Persistent** — Saved to MMKV

### Reduced Motion

**Location:** System + app-level (no dedicated Settings screen yet)

- **System** — Follow device accessibility setting (default)
- **Always** — Disable all animations
- **Never** — Enable all animations
- **Persistent** — Saved across app restarts
- **Comprehensive** — Affects navigation, images, gestures
- **Note:** `setReduceMotionMode` exists on the context but is not yet exposed through a UI control.

---

## Accessibility

### Screen Reader Support

- **VoiceOver** (iOS) — Full navigation support
- **TalkBack** (Android) — All elements labeled
- **Semantic Roles** — Buttons, images, headers
- **Descriptive Labels** — Clear action descriptions
- **Live Regions** — Dynamic content announcements

### Touch Targets

- **48pt Minimum** — All interactive elements
- **Hit Slop** — Expanded tap areas for small icons
- **Visual Feedback** — Highlight on press

### Visual

- **High Contrast** — WCAG AA compliant colors (5.7:1+)
- **Color Independence** — Never relies on color alone
- **Reduced Motion** — Full animation bypass support
- **Dynamic Type** — Scales with system font size (future)

### Keyboard

- **Tab Navigation** — Logical focus order
- **Return Key** — Submit search, activate buttons
- **Escape** — Close modals, cancel actions

---

## Platform Features

### iOS

- **Adaptive Icons** — App icon adapts to iOS style
- **Modal Presentation** — Native modal transitions
- **Haptics** — Feedback via Haptics API
- **Safe Area** — Respects notches and rounded corners
- **Status Bar** — Tinted to match theme
- **Swipe Back** — Standard iOS navigation gesture

### Android

- **Adaptive Icons** — Background + foreground layers
- **Monochrome Icon** — Themed icon support (Android 13+)
- **Edge-to-Edge** — Immersive status/navigation bars
- **Hardware Back** — Back button handling throughout
- **Material Design** — Elevation, ripples, transitions
- **Status Bar** — Themed, hides in viewer

### Web

- **Static Export** — Deployable to any host
- **Responsive** — Adapts to window size
- **Keyboard** — Full keyboard navigation
- **Touch** — Touch-friendly on tablets
- **Limitations** — No media library access (native-only API)

---

## Performance

### List Rendering

- **FlashList** — Shopify's high-performance list
- **Virtualization** — Only renders visible items
- **Accurate Sizing** — Measured `estimatedItemSize`
- **Remove Clipped** — Unmounts off-screen views

### Image Loading

- **expo-image** — Native image component
- **Memory-Disk Cache** — Two-tier caching
- **Prefetch** — Neighbor images in viewer
- **Lazy Loading** — Images load as they enter viewport

### Data Caching

- **Albums** — 5 minute TTL, 200 max entries
- **Photos** — 2 minute TTL, 500 max entries
- **Thumbnails** — 10 minute TTL, 300 max entries
- **LRU Eviction** — Oldest entries removed first
- **In-Flight Dedup** — Concurrent requests share promise

### Animation

- **Worklets** — UI thread animations
- **60 FPS** — Smooth, native-feeling gestures
- **Spring Physics** — Natural, realistic motion
- **Reduced Motion** — Zero-duration fallbacks

---

## Data & Privacy

### Local-First

- **No Network** — Zero outbound requests
- **No Accounts** — No login, no servers
- **No Telemetry** — No analytics or tracking
- **100% Local** — All data stays on device

### Permissions

- **Media Library** — Read/write access (requested on first use)
- **No Location** — Never requests location data
- **No Contacts** — Never requests contacts
- **No Camera** — Gallery only (no photo capture)

### Storage

- **MMKV** — Fast, synchronous on-device storage
- **Favorites** — Photo IDs only (not full data)
- **Theme** — Light/dark/system preference
- **Search History** — Recent queries (max 20)
- **Widget Config** — Enabled widgets and settings
- **Grid Density** — Preferred column count

---

## Future Features

See [ROADMAP.md](./ROADMAP.md) for planned features:

- Native home-screen widgets (iOS/Android)
- Cross-library search with SQLite
- Internationalization (Spanish, Urdu)
- Cloud backup for favorites
- EAS Build and app store submission
- Editorial features (clustering, edits)

---

## Feature Matrix

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Album browsing | ✅ | ✅ | ⚠️ |
| Photo grid | ✅ | ✅ | ⚠️ |
| Photo viewer | ✅ | ✅ | ⚠️ |
| Pinch-to-zoom | ✅ | ✅ | ❌ |
| Search | ✅ | ✅ | ⚠️ |
| Favorites | ✅ | ✅ | ✅ |
| Widgets | ✅ | ✅ | ⚠️ |
| Themes | ✅ | ✅ | ✅ |
| Reduced motion | ✅ | ✅ | ✅ |
| Haptics | ✅ | ✅ | ❌ |
| Hardware back | ❌ | ✅ | ❌ |

⚠️ = Partial support (UI works, media library is empty)

---

## See Also

- [Architecture](./ARCHITECTURE.md) — Technical implementation
- [Accessibility](./ACCESSIBILITY.md) — A11y features in detail
- [Performance](./PERFORMANCE.md) — Performance optimizations
- [API Reference](./API_REFERENCE.md) — Hook and service docs
