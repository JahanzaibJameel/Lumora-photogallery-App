# Accessibility Guide

> Comprehensive guide to Lumora's accessibility features and implementation patterns.

## Table of Contents

- [Overview](#overview)
- [Screen Reader Support](#screen-reader-support)
- [Touch Targets](#touch-targets)
- [Reduced Motion](#reduced-motion)
- [Color & Contrast](#color--contrast)
- [Keyboard Navigation](#keyboard-navigation)
- [Testing](#testing)
- [Implementation Patterns](#implementation-patterns)
- [WCAG Compliance](#wcag-compliance)

---

## Overview

Lumora is designed to be accessible to users with disabilities. All interactive elements follow accessibility best practices and are tested with screen readers.

**Key Features:**
- ✅ Semantic labels on all interactive elements
- ✅ 48pt minimum touch targets
- ✅ Screen reader announcements via live regions
- ✅ Reduced motion support (system + manual)
- ✅ High contrast color tokens
- ✅ Keyboard-friendly inputs

---

## Screen Reader Support

### Accessibility Properties

All interactive components implement proper accessibility props:

```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Delete photo"
  accessibilityHint="Permanently removes this photo from your library"
  onPress={handleDelete}
>
  <Icon name="trash" />
</Pressable>
```

**Required properties:**
- `accessibilityRole` — Semantic role (button, link, image, etc.)
- `accessibilityLabel` — Clear, concise description
- `accessibilityHint` — Optional context for what the action does

### Role Reference

| Role | When to Use | Example |
|------|-------------|---------|
| `button` | Tappable actions | Delete, refresh, toggle |
| `link` | Navigation | Open settings, view album |
| `image` | Meaningful images | Album covers, photos |
| `imagebutton` | Tappable images | Photo grid items, album cards |
| `text` | Static text | Labels, descriptions |
| `header` | Section headers | Screen titles |
| `search` | Search inputs | Search bar |
| `none` | Decorative elements | Icons within labeled buttons |

### Live Regions

Use `accessibilityLiveRegion` to announce dynamic content:

```typescript
<EmptyState
  variant="error"
  message="Failed to load albums"
  accessibilityLiveRegion="polite"
/>
```

**Values:**
- `none` — Default, no announcements
- `polite` — Announce when user is idle
- `assertive` — Announce immediately

**Use cases:**
- Error messages: `polite`
- Success confirmations: `polite`
- Critical alerts: `assertive`
- Loading states: `polite`

### State Management

Announce state changes that aren't visually obvious:

```typescript
const [isFavorite, setIsFavorite] = useState(false);

<Pressable
  accessibilityRole="button"
  accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
  accessibilityState={{ selected: isFavorite }}
  onPress={toggleFavorite}
>
  <Icon name={isFavorite ? "heart" : "heart-outline"} />
</Pressable>
```

---

## Touch Targets

### Minimum Size

All interactive elements meet the **48pt (48dp) minimum** touch target:

```typescript
export const MIN_TOUCH_TARGET = 48;

export const enforceTouchTarget = (style?: StyleProp<ViewStyle>) => {
  return StyleSheet.flatten([
    { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET },
    style,
  ]);
};
```

### Hit Slop

For small visual elements (icons, close buttons), use `hitSlop`:

```typescript
<Pressable
  onPress={handleClose}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  accessibilityRole="button"
  accessibilityLabel="Close"
>
  <Icon name="close" size={24} />
</Pressable>
```

**Hit slop calculation:**
```typescript
const iconSize = 24;
const targetSize = 48;
const hitSlop = (targetSize - iconSize) / 2; // 12
```

### Visual vs. Tappable Area

```typescript
// Visual: 24×24 icon
// Tappable: 48×48 area

<View style={styles.iconContainer}> {/* 48×48 container */}
  <Pressable
    onPress={handlePress}
    style={styles.iconButton} {/* 24×24 icon */}
    hitSlop={12}
    accessibilityLabel="Action"
  >
    <Icon name="star" size={24} />
  </Pressable>
</View>
```

---

## Reduced Motion

### System Detection

Lumora detects and respects system-level reduced motion preferences:

```typescript
const { reduceMotion } = useReducedMotion();

// Conditionally apply animations
const transition = reduceMotion ? 0 : 200;

<Animated.View
  entering={reduceMotion ? undefined : FadeIn.duration(300)}
>
  {content}
</Animated.View>
```

### Manual Override

Users can override system preferences:

```typescript
const { reduceMotionMode, setReduceMotionMode } = useReduceMotionMode();

// Modes:
// - 'system' (default) — Follow system setting
// - 'always' — Always reduce motion
// - 'never' — Never reduce motion
```

### Implementation

**Navigation transitions:**
```typescript
const transitionSpec = reduceMotion
  ? { animation: 'timing', config: { duration: 0 } }
  : { animation: 'spring', config: { stiffness: 300, damping: 30 } };
```

**Component animations:**
```typescript
const fadeIn = useCallback((index: number) => {
  if (reduceMotion) return { opacity: 1 };
  
  return {
    opacity: 0,
    animation: {
      type: 'timing',
      duration: 300,
      delay: index * 50,
    },
  };
}, [reduceMotion]);
```

**Image transitions:**
```typescript
<Image
  source={{ uri }}
  transition={reduceMotion ? 0 : { duration: 200, effect: 'cross-dissolve' }}
/>
```

---

## Color & Contrast

### Color Tokens

Lumora uses semantic color tokens that meet WCAG AA contrast ratios:

```typescript
// Light theme
{
  text: '#1a1a1a',           // 14.5:1 on white
  textSecondary: '#666666',  // 5.7:1 on white
  background: '#ffffff',
  surface: '#f5f5f5',
}

// Dark theme
{
  text: '#ffffff',           // 21:1 on black
  textSecondary: '#cccccc',  // 12.6:1 on black
  background: '#0a0a0a',
  surface: '#1a1a1a',
}
```

### Contrast Ratios

| Text Size | WCAG AA | WCAG AAA | Lumora |
|-----------|---------|----------|--------|
| Large (18pt+) | 3:1 | 4.5:1 | 5.7:1+ |
| Normal (< 18pt) | 4.5:1 | 7:1 | 5.7:1+ |
| Primary text | 4.5:1 | 7:1 | 14.5:1+ |

### Color Independence

Never rely on color alone to convey information:

```typescript
// ✅ Good: Icon + color + label
<View>
  <Icon name="checkmark-circle" color={colors.success} />
  <Text>Upload complete</Text>
</View>

// ❌ Bad: Color only
<View style={{ backgroundColor: colors.success }} />
```

---

## Keyboard Navigation

### Focus Management

Input fields are keyboard-accessible by default:

```typescript
<TextInput
  accessibilityLabel="Search photos"
  accessibilityHint="Enter filename to search"
  returnKeyType="search"
  onSubmitEditing={handleSearch}
/>
```

### Focus Order

Ensure logical tab order:

```typescript
// Use tabIndex on web or structure elements logically
<View>
  <Button title="First" />  {/* Tab 1 */}
  <Button title="Second" /> {/* Tab 2 */}
  <Button title="Third" />  {/* Tab 3 */}
</View>
```

---

## Testing

### Manual Testing

**iOS VoiceOver:**
1. Settings → Accessibility → VoiceOver → Enable
2. Triple-click home/power button to toggle
3. Swipe right to navigate
4. Double-tap to activate

**Android TalkBack:**
1. Settings → Accessibility → TalkBack → Enable
2. Swipe right to navigate
3. Double-tap to activate

### Automated Testing

Test accessibility properties in unit tests:

```typescript
import { renderWithProviders } from '@/test-utils';

it('has correct accessibility labels', () => {
  const { getByA11yLabel, getByA11yHint } = renderWithProviders(
    <AlbumCard album={album} onPress={jest.fn()} />
  );
  
  expect(getByA11yLabel('My Album')).toBeTruthy();
  expect(getByA11yHint('Opens photo grid for this album')).toBeTruthy();
});

it('meets touch target size', () => {
  const { getByA11yRole } = renderWithProviders(
    <IconButton icon="close" onPress={jest.fn()} />
  );
  
  const button = getByA11yRole('button');
  const { width, height } = button.props.style;
  
  expect(width).toBeGreaterThanOrEqual(48);
  expect(height).toBeGreaterThanOrEqual(48);
});
```

---

## Implementation Patterns

### useAccessibility Hook

Centralized accessibility helper:

```typescript
import { useAccessibility } from '@/hooks/useAccessibility';

const { getButtonProps, getInputProps, enforceTouchTarget } = useAccessibility();

// Button
<Pressable
  {...getButtonProps('Delete', 'button', 'Removes this photo')}
  onPress={handleDelete}
  style={enforceTouchTarget(styles.button)}
/>

// Input
<TextInput
  {...getInputProps('Search', 'Search photos', 'Type to filter')}
  onChangeText={setQuery}
/>
```

### Common Hints

Reusable hint map in `useAccessibility`:

```typescript
const HINTS = {
  opens: 'Opens a new screen',
  closes: 'Closes the current screen',
  toggles: 'Toggles a setting',
  deletes: 'Permanently removes this item',
  saves: 'Saves your changes',
  cancels: 'Discards your changes',
  refreshes: 'Reloads the content',
};
```

### Component Template

```typescript
export const AccessibleButton = ({ label, hint, onPress }: Props) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={styles.button}
      hitSlop={10}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## WCAG Compliance

### Current Status

Lumora targets **WCAG 2.1 Level AA** compliance:

| Guideline | Status | Notes |
|-----------|--------|-------|
| 1.1 Text Alternatives | ✅ | All images have labels |
| 1.3 Adaptable | ✅ | Semantic structure |
| 1.4.3 Contrast (AA) | ✅ | 5.7:1+ ratios |
| 1.4.11 Non-text Contrast | ✅ | UI elements 3:1+ |
| 2.1 Keyboard Accessible | ✅ | All inputs keyboard-friendly |
| 2.2 Enough Time | ✅ | No time limits |
| 2.3 Seizures | ✅ | No flashing content |
| 2.4 Navigable | ✅ | Clear focus indicators |
| 2.5.5 Target Size | ✅ | 48pt minimum |
| 3.1 Readable | ⚠️ | English only (no i18n) |
| 3.2 Predictable | ✅ | Consistent navigation |
| 3.3 Input Assistance | ✅ | Clear error messages |
| 4.1 Compatible | ✅ | Valid semantic markup |

⚠️ **Limitations:**
- No internationalization (English only)
- Manual testing required for full validation
- Dynamic type scaling not implemented

---

## Best Practices

### Do's ✅

- Always provide `accessibilityLabel` for interactive elements
- Use semantic `accessibilityRole` values
- Test with VoiceOver/TalkBack during development
- Ensure 48pt touch targets
- Respect reduced motion preference
- Use live regions for dynamic content
- Provide meaningful hints for complex actions

### Don'ts ❌

- Don't use generic labels like "Button" or "Image"
- Don't rely on color alone for information
- Don't use `accessibilityLabel` on containers with labeled children
- Don't block screen reader navigation with importantForAccessibility
- Don't animate critical information if reduced motion is on
- Don't set overly verbose hints
- Don't use positive-only semantics (e.g., "Favorited" without "Not favorited")

---

## Resources

- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS VoiceOver Testing](https://developer.apple.com/accessibility/voiceover/)
- [Android TalkBack Testing](https://support.google.com/accessibility/android/answer/6283677)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## See Also

- [Architecture](./ARCHITECTURE.md) — useReducedMotion implementation
- [Testing](./TESTING.md) — Accessibility test patterns
- [Contributing](./CONTRIBUTING.md) — Accessibility requirements for PRs
