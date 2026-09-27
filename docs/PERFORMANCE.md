# Performance Guide

> Optimization strategies, benchmarks, and performance monitoring in Lumora.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [List Rendering](#list-rendering)
- [Image Loading](#image-loading)
- [Caching Strategy](#caching-strategy)
- [Animation Performance](#animation-performance)
- [Bundle Size](#bundle-size)
- [Memory Management](#memory-management)
- [Monitoring](#monitoring)
- [Optimization Checklist](#optimization-checklist)

---

## Architecture Overview

Lumora is optimized for performance through:

| Strategy | Implementation |
|----------|---------------|
| **Virtualized lists** | FlashList with measured itemSize |
| **Cursor pagination** | 30-item batches, onEndReached prefetch |
| **Multi-tier caching** | TTL + LRU in MediaService |
| **Request coalescing** | In-flight deduplication |
| **Targeted invalidation** | Surgical cache updates on mutations |
| **Smart prefetch** | Neighbor images in viewer |
| **Memoization** | Strategic memo() and useCallback |
| **Worklet animations** | Reanimated UI thread gestures |

---

## List Rendering

### FlashList Configuration

Lumora uses [@shopify/flash-list](https://shopify.github.io/flash-list/) for all scrollable content:

```typescript
// PhotosScreen example
<AnimatedFlashList
  data={photos}
  renderItem={renderItem}
  estimatedItemSize={estimatedItemSize}
  numColumns={numColumns}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  removeClippedSubviews={true}
  keyExtractor={item => item.id}
/>
```

**Key optimizations:**

1. **Accurate estimatedItemSize**
   ```typescript
   const estimatedItemSize = useMemo(() => {
     const { width } = Dimensions.get('window');
     const columns = gridSizeToColumns(gridSize);
     const gap = spacing.xs * (columns - 1);
     return (width - gap) / columns;
   }, [gridSize]);
   ```

2. **removeClippedSubviews**
   - Unmounts off-screen cells to reduce render load
   - Enabled by default

3. **Pagination threshold**
   - `onEndReachedThreshold={0.5}` triggers at 50% scroll
   - Smooth prefetch without double-loading

4. **Stable keys**
   - Always use unique IDs: `keyExtractor={item => item.id}`
   - Never use array indices for keyed data

### Avoiding Re-renders

```typescript
// ✅ Memoize render callbacks
const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Photo>) => (
  <PhotoGridItem
    item={item}
    index={index}
    onPress={() => handlePhotoPress(item, index)}
    gridSize={gridSize}
  />
), [handlePhotoPress, gridSize]);

// ✅ Memoize components
export const PhotoGridItem = memo(({ item, onPress, gridSize }: Props) => {
  // ...
});
```

---

## Image Loading

### expo-image Configuration

All images use `expo-image` with optimized cache policy:

```typescript
<Image
  source={{ uri: photo.uri }}
  cachePolicy="memory-disk"
  contentFit="cover"
  transition={reduceMotion ? 0 : { duration: 200, effect: 'cross-dissolve' }}
/>
```

**Cache hierarchy:**
1. **Memory** — Fast, limited capacity
2. **Disk** — Persists across launches
3. **Network/File** — Fallback

### Thumbnail Strategy

Albums show thumbnails via dedicated cache:

```typescript
// MediaService
private thumbnailCache = new Map<string, CacheEntry<string>>();
const THUMBNAIL_TTL = 10 * 60 * 1000; // 10 minutes
const THUMBNAIL_MAX_ENTRIES = 300;
```

Benefits:
- Separate TTL from full photo cache
- LRU eviction prevents unbounded growth
- In-flight deduplication avoids redundant queries

### Prefetching

**PhotoViewer** prefetches neighbors:

```typescript
useEffect(() => {
  const prefetchIndices = [currentIndex - 1, currentIndex + 1];
  prefetchIndices.forEach(idx => {
    if (idx >= 0 && idx < photos.length) {
      Image.prefetch(photos[idx].uri);
    }
  });
}, [currentIndex, photos]);
```

---

## Caching Strategy

### MediaService Caches

Three independent caches with different TTLs:

| Cache | TTL | Max Entries | Key Format |
|-------|-----|-------------|------------|
| Albums | 5 min | 200 | `albumId` |
| Photos | 2 min | 500 | `${albumId}_${after}_${limit}` |
| Thumbnails | 10 min | 300 | `albumId` |

**LRU Eviction:**

```typescript
private evictLRU<T>(cache: Map<string, CacheEntry<T>>, maxEntries: number) {
  if (cache.size <= maxEntries) return;
  
  let oldest: [string, CacheEntry<T>] | null = null;
  for (const entry of cache.entries()) {
    if (!oldest || entry[1].timestamp < oldest[1].timestamp) {
      oldest = entry;
    }
  }
  if (oldest) cache.delete(oldest[0]);
}
```

### In-Flight Deduplication

Concurrent requests for the same resource share a single promise:

```typescript
private inFlight = new Map<string, Promise<any>>();

async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (this.inFlight.has(key)) {
    return this.inFlight.get(key)!;
  }
  
  const promise = fetcher();
  this.inFlight.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    this.inFlight.delete(key);
  }
}
```

**Benefits:**
- Prevents thundering herd on FlashList recycling
- Reduces native bridge calls
- Saves battery and memory

### Targeted Invalidation

Delete operations only invalidate affected data:

```typescript
async deletePhoto(photoId: string): Promise<boolean> {
  // 1. Delete from native library
  await MediaLibrary.deleteAssetsAsync([photoId]);
  
  // 2. Drop only pages containing this photo
  for (const [key] of this.photoCache.entries()) {
    const page = this.photoCache.get(key);
    if (page?.data.photos.some(p => p.id === photoId)) {
      this.photoCache.delete(key);
    }
  }
  
  // 3. Decrement album count
  const album = this.albumCache.get(albumId);
  if (album) {
    album.data.count -= 1;
  }
  
  // 4. Clear affected album thumbnail
  this.thumbnailCache.delete(albumId);
  
  return true;
}
```

---

## Animation Performance

### Reanimated Worklets

All gestures and animations run on the UI thread:

```typescript
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const gesture = Gesture.Pinch()
  .onUpdate(e => {
    scale.value = e.scale;
  })
  .onEnd(() => {
    scale.value = withSpring(1);
  });
```

**Why worklets?**
- 60 FPS native animations
- No JS thread blocking
- Reduced bridge traffic

### Reduced Motion

Animations respect accessibility preferences:

```typescript
const { reduceMotion } = useReducedMotion();

// Navigation
const transitionSpec = reduceMotion
  ? { animation: 'timing', config: { duration: 0 } }
  : { animation: 'spring', config: { stiffness: 300, damping: 30 } };

// Component animations
const fadeIn = reduceMotion ? 0 : 200;
```

---

## Bundle Size

### Current Metrics

See [BUNDLE_SIZE.md](./BUNDLE_SIZE.md) for detailed analysis.

**Targets:**
- iOS/Android: < 2 MB
- Web: < 1 MB

### Optimization Techniques

1. **Tree shaking**
   ```typescript
   // ✅ Named imports
   import { useTheme } from './hooks/useTheme';
   
   // ❌ Namespace imports
   import * as hooks from './hooks';
   ```

2. **Lazy loading**
   ```typescript
   const WidgetsScreen = lazy(() => import('./screens/WidgetsScreen'));
   ```

3. **Asset optimization**
   - WebP for web
   - Appropriate resolutions (icon.png is 1024×1024, scaled down)
   - Use vector icons (`@expo/vector-icons`)

4. **Dependency audit**
   ```bash
   npx expo-atlas
   npm ls | grep -v deduped
   ```

---

## Memory Management

### FlashList Recycling

FlashList automatically recycles off-screen views:

```typescript
// No manual cleanup needed
<FlashList
  data={photos}
  renderItem={renderItem}
  estimatedItemSize={itemSize}
/>
```

### Image Cache Limits

`expo-image` manages memory automatically. For manual control:

```typescript
import { Image } from 'expo-image';

// Clear memory cache
await Image.clearMemoryCache();

// Clear disk cache
await Image.clearDiskCache();
```

### MMKV Storage

MMKV is memory-mapped and efficient. Cleanup is rarely needed:

```typescript
// Clear all storage (use sparingly)
storage.clearAll();
```

---

## Monitoring

### Performance Hooks

Track navigation timing:

```typescript
import { useNavigationTiming } from '@/hooks/performance';

const { startTiming, endTiming } = useNavigationTiming('AlbumsScreen');

useEffect(() => {
  startTiming('mount');
  // ... load data
  endTiming('mount');
}, []);
```

### React DevTools

Profile component renders:

1. Enable Hermes in `app.json` (already enabled)
2. Open React DevTools
3. Use Profiler tab
4. Record interaction
5. Identify slow components

### Expo Atlas

Analyze bundle composition:

```bash
npm run bundle-size
# Opens .expo/atlas.html
```

---

## Optimization Checklist

### Component Level

- [ ] Memoize components with `memo()`
- [ ] Use `useCallback` for handlers passed as props
- [ ] Use `useMemo` for expensive computations
- [ ] Avoid inline object/array creation in render
- [ ] Provide stable `key` props (IDs, not indices)

### List Level

- [ ] Use FlashList over FlatList/ScrollView
- [ ] Provide accurate `estimatedItemSize`
- [ ] Enable `removeClippedSubviews`
- [ ] Set appropriate `onEndReachedThreshold`
- [ ] Implement pagination for large datasets

### Image Level

- [ ] Use `expo-image` with `cachePolicy="memory-disk"`
- [ ] Prefetch critical images
- [ ] Use appropriate `contentFit` (cover/contain)
- [ ] Implement reduced motion for transitions

### Data Level

- [ ] Implement caching with TTL
- [ ] Use in-flight deduplication
- [ ] Batch operations where possible
- [ ] Implement targeted invalidation
- [ ] Use cursor pagination for large datasets

### Animation Level

- [ ] Use Reanimated worklets for gestures
- [ ] Run animations on UI thread
- [ ] Respect reduced motion preference
- [ ] Avoid animating layout properties

---

## Common Pitfalls

### ❌ Don't: Render expensive computations inline

```typescript
// Bad
<Text>{photos.filter(p => p.favorite).length} favorites</Text>
```

```typescript
// Good
const favoriteCount = useMemo(
  () => photos.filter(p => p.favorite).length,
  [photos]
);
<Text>{favoriteCount} favorites</Text>
```

---

### ❌ Don't: Create objects/arrays in render

```typescript
// Bad
<Component style={{ marginTop: 10 }} data={[item]} />
```

```typescript
// Good
const style = useMemo(() => ({ marginTop: 10 }), []);
const data = useMemo(() => [item], [item]);
<Component style={style} data={data} />
```

---

### ❌ Don't: Use array indices as keys for dynamic lists

```typescript
// Bad
{photos.map((photo, index) => <Photo key={index} />)}
```

```typescript
// Good
{photos.map(photo => <Photo key={photo.id} />)}
```

---

## Benchmarks

### Initial Load (iPhone 14 Pro)

| Operation | Time | Target |
|-----------|------|--------|
| App launch → Albums visible | ~800ms | < 1s |
| Album tap → Photos visible | ~400ms | < 500ms |
| Photo tap → Viewer ready | ~200ms | < 300ms |

### List Performance (1000 items)

| Metric | FlashList | FlatList |
|--------|-----------|----------|
| Initial mount | ~300ms | ~800ms |
| Scroll to 500 | ~150ms | ~400ms |
| Memory usage | ~80 MB | ~150 MB |

### Cache Hit Rates

| Cache | Hit Rate | Target |
|-------|----------|--------|
| Albums | ~85% | > 80% |
| Photos | ~70% | > 60% |
| Thumbnails | ~90% | > 85% |

---

## Future Improvements

- **Web Workers** — Offload image processing
- **Hermes bytecode** — Pre-compile JS for faster startup
- **Native modules** — Replace JS-heavy operations
- **Incremental loading** — Stream album metadata
- **Background sync** — Pre-cache common queries

---

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlashList Best Practices](https://shopify.github.io/flash-list/docs/fundamentals/performant-components)
- [Reanimated Performance](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary/#ui-thread)
- [Expo Image Caching](https://docs.expo.dev/versions/latest/sdk/image/#caching)

---

## See Also

- [Architecture](./ARCHITECTURE.md) — System design
- [Bundle Size](./BUNDLE_SIZE.md) — Bundle analysis
- [Testing](./TESTING.md) — Performance test coverage
