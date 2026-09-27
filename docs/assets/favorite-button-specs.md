# Favorite Button UI Specifications

## Visual Design

```
┌─────────────────────────────────────────────────────────────────┐
│ PhotoViewer (Full Screen)                                       │
│                                                                  │
│  ┌──────┐                                              ┌──────┐ │
│  │  ✕   │  <── BackButton (top-left)      FavoriteButton ──> │  ♡  │ │
│  └──────┘                                              └──────┘ │
│                                                                  │
│                                                                  │
│                    ┌──────────────────┐                         │
│                    │                  │                         │
│                    │                  │                         │
│                    │   Current Photo  │                         │
│                    │                  │                         │
│                    │                  │                         │
│                    └──────────────────┘                         │
│                                                                  │
│  ┌──────┐                                           ┌──────┐    │
│  │  ‹   │  <── NavArrow (prev)        NavArrow ──> │  ›   │    │
│  └──────┘                                           └──────┘    │
│                                                                  │
│                                                                  │
│                      ┌──────────┐                               │
│                      │  3 / 42  │  <── PhotoInfoBadge           │
│                      └──────────┘                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Button States

### Not Favorite
```
┌──────┐
│  ♡   │  heart-outline icon
└──────┘  color: white
          background: rgba(0,0,0,0.5)
```

### Is Favorite
```
┌──────┐
│  ♥   │  heart (filled) icon
└──────┘  color: #ff4444 (red)
          background: rgba(0,0,0,0.5)
```

## Dimensions

```
┌───────────────────────────────────────────┐
│                                           │
│         Hitslop: 10pt all sides           │
│                                           │
│    ┌───────────────────────────────┐     │
│    │                               │     │
│    │    Button: 40 x 40 pt         │     │
│    │    Border radius: xxl          │     │
│    │    Icon: 24 x 24 pt           │     │
│    │                               │     │
│    └───────────────────────────────┘     │
│                                           │
│         Total touch area: 60 x 60 pt      │
└───────────────────────────────────────────┘
```

**Total Touch Target:** 60pt × 60pt (exceeds 48pt minimum)

## Positioning

```typescript
// Top-right corner with safe area inset
{
  position: 'absolute',
  top: Math.max(insets.top + 8, 16),  // Safe area aware
  right: 16,
  zIndex: 50
}
```

## Color Palette

| State        | Icon Name      | Icon Color | Background         |
|--------------|----------------|------------|--------------------|
| Not Favorite | heart-outline  | `white`    | `colors.overlay`   |
| Is Favorite  | heart          | `#ff4444`  | `colors.overlay`   |

**Note:** `colors.overlay` is theme-aware and typically `rgba(0,0,0,0.5)`

## Animation

- Fades in with opacity animation (same as other overlay controls)
- Uses shared value `backOpacity` from PhotoViewer
- Respects reduced motion preference (instant when enabled)
- No animation on icon state change (immediate feedback)

## Accessibility

```typescript
accessibilityRole="button"

// Not favorite:
accessibilityLabel="Add to favorites"
accessibilityHint="Adds this photo to your favorites"

// Is favorite:
accessibilityLabel="Remove from favorites"
accessibilityHint="Removes this photo from your favorites"
```

## Layout Context

The FavoriteButton is positioned to not overlap with other controls:

- **Top-left:** BackButton (close/exit)
- **Top-right:** FavoriteButton ← THIS
- **Middle-left:** NavArrow (previous photo)
- **Middle-right:** NavArrow (next photo)
- **Bottom-center:** PhotoInfoBadge (counter)

All controls use the same overlay styling for visual consistency.

## Interaction

1. User taps button
2. Icon changes immediately (outline ↔ filled)
3. Color changes (white ↔ red)
4. State persists to MMKV storage
5. Change is reflected in favorites widget on next refresh

## Component Props

```typescript
interface FavoriteButtonProps {
  onPress: () => void;           // Toggle handler
  isFavorite: boolean;           // Current favorite state
  backOpacity: SharedValue<number>; // Animated opacity
  visible: boolean;              // Show/hide control
  top?: number;                  // Custom top position (default: 40)
}
```

## Example Usage

```tsx
<FavoriteButton
  onPress={handleToggleFavorite}
  isFavorite={isFavorite(currentPhoto.id)}
  backOpacity={backOpacity}
  visible
  top={Math.max(insets.top + 8, 16)}
/>
```

## Design Rationale

1. **Position (top-right):** Natural location for action buttons, mirrors BackButton symmetry
2. **Heart icon:** Universal symbol for favorites/likes
3. **Red color:** Emotional connection, standard for "loved" content
4. **Outline → Filled:** Clear affordance that state has changed
5. **Same overlay style:** Visual consistency with other PhotoViewer controls
6. **Immediate feedback:** No loading state needed (optimistic UI)
