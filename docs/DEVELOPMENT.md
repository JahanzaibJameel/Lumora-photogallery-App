# Development Guide

> Comprehensive guide for developing Lumora — workflows, patterns, and best practices.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Code Organization](#code-organization)
- [Coding Standards](#coding-standards)
- [Common Patterns](#common-patterns)
- [Debugging](#debugging)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)

---

## Environment Setup

### Prerequisites

**Required:**
- Node.js 20+ ([nodejs.org](https://nodejs.org))
- npm 10+ (comes with Node)
- Git
- Code editor (VS Code recommended)

**Platform-specific:**
- **iOS:** macOS + Xcode + iOS Simulator
- **Android:** Android Studio + Android SDK + Emulator
- **Web:** Modern browser (Chrome recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/JahanzaibJameel/Lumora-photogallery-App.git
cd Lumora-photogallery-App

# Install dependencies
npm install

# Verify setup
npm run type-check
npm run lint
npm test
```

### VS Code Setup

Recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "expo.vscode-expo-tools"
  ]
}
```

### Environment Configuration

**No `.env` files needed.** All configuration is in:

- `app.json` — App metadata and Expo config
- `tsconfig.json` — TypeScript settings
- `jest.config.js` — Test configuration
- `eslint.config.mjs` — Linting rules

---

## Development Workflow

### Daily Development

```bash
# Start dev server
npx expo start

# In separate terminal: run tests in watch mode
npm run test:watch

# Make changes, verify types
npm run type-check

# Before commit
npm run lint
npm test
```

### Platform Launch

```bash
# iOS (macOS only)
npm run ios
# Or press 'i' in Expo terminal

# Android
npm run android
# Or press 'a' in Expo terminal

# Web
npm run web
# Or press 'w' in Expo terminal
```

### Hot Reload

Changes auto-reload by default:

- **Fast Refresh** — Preserves component state
- **Full Reload** — Press `r` in Expo terminal
- **Clear Cache** — `npx expo start -c`

---

## Code Organization

### Project Structure

```
src/
├── app.tsx              # Root component
├── index.js             # Entry point
├── components/          # Shared UI
│   ├── primitives/      # Base components (Text, Button, etc.)
│   ├── AlbumCard.tsx
│   ├── PhotoGridItem.tsx
│   └── ...
├── contexts/            # React contexts
│   ├── ThemeContext.tsx
│   ├── ReducedMotionContext.tsx
│   └── GridSizeContext.tsx
├── hooks/               # Custom hooks
│   ├── useAlbums.ts
│   ├── usePhotos.ts
│   ├── useTheme.ts
│   └── ...
├── navigation/          # Navigation config
│   └── RootNavigator.tsx
├── screens/             # Screen components
│   ├── AlbumsScreen.tsx
│   ├── PhotosScreen.tsx
│   ├── PhotoViewer.tsx
│   └── WidgetsScreen.tsx
├── services/            # Business logic
│   ├── media.service.ts
│   ├── storage.service.ts
│   └── widget.service.ts
├── test-utils/          # Test helpers
│   ├── fixtures.ts
│   ├── mocks.ts
│   └── render.tsx
├── theme/               # Design tokens
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── tokens.ts
├── types/               # TypeScript types
│   ├── album.ts
│   ├── photo.ts
│   └── navigation.ts
└── utils/               # Utilities
    ├── errors.ts
    ├── errorReporting.ts
    └── ...
```

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `AlbumCard.tsx` |
| Hooks | camelCase with `use` | `useAlbums.ts` |
| Services | camelCase with `.service` | `media.service.ts` |
| Types | PascalCase | `Album`, `Photo` |
| Utils | camelCase | `errorReporting.ts` |
| Tests | Same as file + `.test` | `useAlbums.test.ts` |

---

## Coding Standards

### TypeScript

**Strict mode enabled.** No `any` without comment explaining why.

```typescript
// ✅ Good
const photos: Photo[] = [];

// ✅ Acceptable with comment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = await fetch(...); // Native module returns untyped data

// ❌ Bad
const data: any = {};
```

### Components

```typescript
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './primitives/Text';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

interface Props {
  title: string;
  onPress: () => void;
}

export const Button = memo(({ title, onPress }: Props) => {
  const { colors } = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.primary }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text variant="body" color="textInverse">
        {title}
      </Text>
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

**Key points:**
- `memo()` for pure components
- `useCallback` for handlers
- Static `StyleSheet.create()`
- Accessibility props
- `displayName` for debugging

### Hooks

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getMediaService } from '@/services/media.service';
import type { Album, AppError } from '@/types';

export const useAlbums = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  
  const loadAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const mediaService = getMediaService();
      const data = await mediaService.getAlbums(0, 200);
      setAlbums(data);
    } catch (err) {
      setError(categorizeError(err, 'Albums'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);
  
  return { albums, loading, error, refreshAlbums: loadAlbums };
};
```

**Key points:**
- Typed state
- Error handling
- `useCallback` for stable refs
- Clean return object

### Services

```typescript
class MediaService {
  private static instance: MediaService;
  private albumCache = new Map<string, CacheEntry<Album>>();
  
  private constructor() {}
  
  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }
  
  async getAlbums(offset: number, limit: number): Promise<Album[]> {
    if (Platform.OS === 'web') return [];
    
    // Check cache
    const cached = this.getCached(this.albumCache, 'all');
    if (cached) return cached;
    
    // Fetch and cache
    const albums = await this.fetchAlbums(offset, limit);
    this.setCached(this.albumCache, 'all', albums, ALBUM_TTL);
    return albums;
  }
  
  clearCache(): void {
    this.albumCache.clear();
  }
}

export const getMediaService = () => MediaService.getInstance();
```

**Key points:**
- Singleton pattern
- Web guards
- Caching strategy
- Public interface

---

## Common Patterns

### Theme-Aware Styling

```typescript
const Component = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.text, { color: colors.text }]}>Content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  text: {
    ...typography.body,
  },
});
```

### Reduced Motion

```typescript
const Component = () => {
  const { reduceMotion } = useReducedMotion();
  
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
    >
      {content}
    </Animated.View>
  );
};
```

### Error Handling

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (err) {
  const appError = categorizeError(err, 'Context');
  errorReporter.capture(appError);
  throw appError;
}
```

### List Rendering

```typescript
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={itemSize}
  keyExtractor={(item) => item.id}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  removeClippedSubviews
/>
```

---

## Debugging

### React DevTools

```bash
# Install globally
npm install -g react-devtools

# Run
react-devtools

# Connect from Expo dev menu
```

### Console Logging

```typescript
// Development only
if (__DEV__) {
  console.log('Debug info:', data);
}
```

### Network Debugging

```bash
# Enable in Expo dev menu
# Shake device → "Debug Remote JS"
# Open Chrome DevTools → Network tab
```

### Performance Profiling

```typescript
import { useNavigationTiming } from '@/hooks/performance';

const Component = () => {
  const { startTiming, endTiming } = useNavigationTiming('ScreenName');
  
  useEffect(() => {
    startTiming('mount');
    // ... load data
    endTiming('mount');
  }, []);
};
```

### Common Issues

**Metro won't start:**
```bash
npx expo start -c
```

**Type errors:**
```bash
npm run type-check
```

**Test failures:**
```bash
npm test -- --verbose
```

**Cache issues:**
```bash
rm -rf node_modules
npm install
npx expo start -c
```

---

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feat/short-description

# Create fix branch
git checkout -b fix/bug-description
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Examples
feat(search): add history dropdown
fix(viewer): correct pinch-zoom bounds
docs(readme): update setup instructions
test(albums): add pagination tests
refactor(services): simplify cache logic
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting
- `refactor` — Code restructure
- `test` — Tests
- `chore` — Tooling

### Before Commit

```bash
# Check types
npm run type-check

# Lint code
npm run lint

# Run tests
npm test

# Stage changes
git add <files>

# Commit
git commit -m "feat(feature): description"
```

---

## Pull Request Process

### 1. Prepare

```bash
# Ensure branch is up to date
git checkout main
git pull
git checkout your-branch
git rebase main

# Run all checks
npm run type-check
npm run lint
npm test
```

### 2. Push

```bash
git push -u origin your-branch
```

### 3. Create PR

On GitHub:

1. Click "New Pull Request"
2. Select your branch
3. Fill in template:

```markdown
## Description
Brief description of changes

## Changes
- Added X
- Fixed Y
- Updated Z

## Testing
- [ ] Unit tests pass
- [ ] Manual testing done
- [ ] Types checked

## Changelog
**Category:** Added / Changed / Fixed / Removed
**Entry:** User-facing description

## Screenshots (if UI changes)
Before | After
```

### 4. Review

- Address reviewer comments
- Push additional commits
- Request re-review

### 5. Merge

Once approved:

1. Squash and merge (preferred)
2. Update changelog if needed
3. Delete branch

---

## Best Practices

### Do's ✅

- Write tests for new features
- Add accessibility labels
- Use design tokens (never hardcoded values)
- Document complex logic
- Keep functions small and focused
- Use meaningful variable names
- Handle errors gracefully
- Respect reduced motion

### Don'ts ❌

- Don't use `any` without comment
- Don't hardcode colors or spacing
- Don't skip accessibility
- Don't commit console.logs
- Don't ignore lint errors
- Don't merge without tests
- Don't use `@ts-ignore`
- Don't copy-paste code

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)

---

## See Also

- [Architecture](./ARCHITECTURE.md) — System design
- [API Reference](./API_REFERENCE.md) — Code reference
- [Testing](./TESTING.md) — Test guidelines
- [Contributing](./CONTRIBUTING.md) — Contribution workflow
