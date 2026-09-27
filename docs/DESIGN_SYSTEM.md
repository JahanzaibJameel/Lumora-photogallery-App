# Design System

> Lumora's token-based design system with comprehensive guidelines and usage patterns.

## Table of Contents

- [Philosophy](#philosophy)
- [Color Tokens](#color-tokens)
- [Typography](#typography)
- [Spacing](#spacing)
- [Layout](#layout)
- [Border Radius](#border-radius)
- [Elevation & Shadows](#elevation--shadows)
- [Opacity](#opacity)
- [Icons](#icons)
- [Components](#components)
- [Dark Mode](#dark-mode)
- [Usage Patterns](#usage-patterns)

---

## Philosophy

Lumora's design system is built on **typed tokens** for consistency, maintainability, and type safety.

**Core Principles:**

1. **Token-based** — All design decisions reference tokens, not raw values
2. **Type-safe** — Full TypeScript support with autocomplete
3. **Theme-aware** — Automatic light/dark mode support
4. **Accessible** — WCAG AA contrast ratios, 48pt touch targets
5. **Performant** — Static StyleSheet creation, zero runtime cost

**Architecture:**

```
theme/
├── colors.ts        # Color palettes + semantic tokens
├── typography.ts    # Text styles
├── spacing.ts       # Spacing scale
├── borderRadius.ts  # Corner radii
├── elevation.ts     # Shadow styles
├── opacity.ts       # Opacity values
└── tokens.ts        # Aggregated export
```

---

## Color Tokens

### Palettes

Two complete palettes: light and dark.

**Light Mode:**
```typescript
export const lightColors = {
  // Primary
  primary: '#667eea',
  primaryLight: '#8a9ff5',
  primaryDark: '#4d5fb8',
  
  // Text
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',
  
  // Background
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  surface: '#f5f5f5',
  surfaceHover: '#e8e8e8',
  
  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Interactive
  border: '#e0e0e0',
  borderFocus: '#667eea',
  overlay: 'rgba(0, 0, 0, 0.4)',
  
  // Specific
  iconPrimary: '#1a1a1a',
  iconSecondary: '#666666',
  cardBorder: '#e0e0e0',
  inputBackground: '#ffffff',
  inputBorder: '#d1d5db',
  placeholder: '#9ca3af',
  skeleton: '#e0e0e0',
  divider: '#e5e7eb',
} as const;
```

**Dark Mode:**
```typescript
export const darkColors = {
  // Primary
  primary: '#8a9ff5',
  primaryLight: '#a5b6f7',
  primaryDark: '#667eea',
  
  // Text
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  textInverse: '#1a1a1a',
  
  // Background
  background: '#0a0a0a',
  backgroundSecondary: '#141414',
  surface: '#1a1a1a',
  surfaceHover: '#2a2a2a',
  
  // Semantic
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  
  // Interactive
  border: '#333333',
  borderFocus: '#8a9ff5',
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  // Specific
  iconPrimary: '#ffffff',
  iconSecondary: '#cccccc',
  cardBorder: '#2a2a2a',
  inputBackground: '#1a1a1a',
  inputBorder: '#374151',
  placeholder: '#6b7280',
  skeleton: '#2a2a2a',
  divider: '#2a2a2a',
} as const;
```

### Semantic Usage

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| `primary` | Brand actions, focus | #667eea | #8a9ff5 |
| `text` | Body text | #1a1a1a | #ffffff |
| `textSecondary` | Supporting text | #666666 | #cccccc |
| `background` | Main background | #ffffff | #0a0a0a |
| `surface` | Cards, panels | #f5f5f5 | #1a1a1a |
| `success` | Positive feedback | #10b981 | #34d399 |
| `error` | Negative feedback | #ef4444 | #f87171 |

### Accessing Colors

```typescript
import { useTheme } from '@/hooks/useTheme';

const Component = () => {
  const { colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

---

## Typography

### Scale

Seven semantic text styles with platform-aware defaults:

```typescript
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
} as const;
```

### Usage

**With Text component:**
```typescript
import { Text } from '@/components/primitives/Text';

<Text variant="h1">Heading</Text>
<Text variant="body">Body text</Text>
<Text variant="caption" color="textSecondary">Caption</Text>
```

**Direct styling:**
```typescript
import { typography } from '@/theme/typography';
import { useTheme } from '@/hooks/useTheme';

const { colors } = useTheme();

<Text style={[typography.h2, { color: colors.text }]}>
  Custom Heading
</Text>
```

---

## Spacing

### Scale

8-point grid system:

```typescript
export const spacing = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 16,   // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  xxl: 48,  // 3rem
  xxxl: 64, // 4rem
} as const;
```

### Usage

```typescript
import { spacing } from '@/theme/spacing';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
```

### Layout Patterns

**Card spacing:**
```typescript
{
  padding: spacing.md,      // 16pt inner padding
  margin: spacing.sm,       // 8pt outer margin
  borderRadius: borderRadius.md, // 12pt corners
}
```

**List item:**
```typescript
{
  paddingHorizontal: spacing.md,  // 16pt sides
  paddingVertical: spacing.sm,    // 8pt top/bottom
  gap: spacing.xs,                // 4pt between elements
}
```

---

## Layout

### Container

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
});
```

### Grid

FlashList columns based on grid size:

```typescript
const numColumns = {
  small: 4,
  medium: 3,
  large: 2,
};
```

### Safe Areas

Always respect safe area insets:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Component = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {content}
    </View>
  );
};
```

---

## Border Radius

### Scale

```typescript
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;
```

### Usage

```typescript
const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,  // 8pt
  },
  card: {
    borderRadius: borderRadius.lg,  // 12pt
  },
  avatar: {
    borderRadius: borderRadius.full, // Circle
  },
});
```

---

## Elevation & Shadows

### Levels

```typescript
export const elevation = {
  none: {
    elevation: 0,
    shadowOpacity: 0,
  },
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  md: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
} as const;
```

### Usage

```typescript
const styles = StyleSheet.create({
  card: {
    ...elevation.sm,
    backgroundColor: colors.surface,
  },
  modal: {
    ...elevation.lg,
    backgroundColor: colors.background,
  },
});
```

---

## Opacity

### Levels

```typescript
export const opacity = {
  disabled: 0.4,
  dimmed: 0.6,
  hover: 0.8,
  full: 1.0,
} as const;
```

### Usage

```typescript
const styles = StyleSheet.create({
  disabledButton: {
    opacity: opacity.disabled,
  },
  hoverState: {
    opacity: opacity.hover,
  },
});
```

---

## Icons

### @expo/vector-icons

Lumora uses Ionicons from `@expo/vector-icons`:

```typescript
import { Ionicons } from '@expo/vector-icons';

<Ionicons
  name="heart"
  size={24}
  color={colors.primary}
/>
```

### Common Icons

| Action | Icon Name | Variants |
|--------|-----------|----------|
| Favorite | `heart` | `heart-outline` |
| Delete | `trash` | `trash-outline` |
| Search | `search` | `search-outline` |
| Close | `close` | `close-circle` |
| Back | `arrow-back` | `chevron-back` |
| Settings | `settings` | `settings-outline` |
| Refresh | `refresh` | `reload` |
| Grid | `grid` | `apps` |

### Sizes

```typescript
const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};
```

---

## Components

### Button

```typescript
const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
```

### Card

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...elevation.sm,
  },
  cardTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
```

### Input

```typescript
const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    ...typography.body,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
  },
});
```

---

## Dark Mode

### Implementation

Automatic theme switching based on user preference:

```typescript
import { useTheme } from '@/hooks/useTheme';

const Component = () => {
  const { isDark, colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>
        {isDark ? 'Dark mode' : 'Light mode'}
      </Text>
    </View>
  );
};
```

### Best Practices

1. **Always use color tokens**, never hardcoded colors
2. **Test both themes** during development
3. **Avoid assumptions** about color values
4. **Use semantic tokens** over palette colors

```typescript
// ✅ Good
backgroundColor: colors.surface

// ❌ Bad
backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5'
```

---

## Usage Patterns

### Screen Layout

```typescript
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/theme';

const Screen = () => {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[typography.h1, { color: colors.text }]}>
          Screen Title
        </Text>
        <View style={styles.content}>
          {/* Content */}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  content: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});
```

### Interactive Element

```typescript
const InteractiveCard = ({ onPress }: Props) => {
  const { colors } = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          opacity: pressed ? opacity.hover : opacity.full,
        },
      ]}
    >
      <Text style={[typography.title, { color: colors.text }]}>
        Card Title
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...elevation.sm,
  },
});
```

---

## Migration Guide

### From Hardcoded to Tokens

**Before:**
```typescript
<View style={{ backgroundColor: '#ffffff', padding: 16 }}>
  <Text style={{ fontSize: 24, fontWeight: '600', color: '#1a1a1a' }}>
    Title
  </Text>
</View>
```

**After:**
```typescript
const { colors } = useTheme();

<View style={{ backgroundColor: colors.background, padding: spacing.md }}>
  <Text style={[typography.h3, { color: colors.text }]}>
    Title
  </Text>
</View>
```

---

## Resources

- [Color Theory](https://www.smashingmagazine.com/2010/01/color-theory-for-designers-part-1-the-meaning-of-color/)
- [Typography Best Practices](https://material.io/design/typography)
- [8pt Grid System](https://spec.fm/specifics/8-pt-grid)
- [Shadow Guidelines](https://material.io/design/environment/elevation.html)

---

## See Also

- [Accessibility](./ACCESSIBILITY.md) — Color contrast requirements
- [Architecture](./ARCHITECTURE.md) — ThemeContext implementation
- [Testing](./TESTING.md) — Testing themed components
