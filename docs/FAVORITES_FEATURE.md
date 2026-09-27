# Favorites Feature

## Overview

The favorites feature allows users to mark photos they want quick access to. Favorites are stored persistently in MMKV and integrated with the widget system.

## Architecture

### Storage Layer

Favorites are stored in MMKV under the key `StorageKeys.FAVORITES` as an array of photo IDs:

```typescript
// Example stored value
["photo-id-1", "photo-id-2", "photo-id-3"]
```

### Hook: `useFavorites`

Location: `src/hooks/useFavorites.ts`

Provides a React hook interface for managing favorites:

```typescript
const { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite } = useFavorites();

// Check if a photo is favorited
isFavorite('photo-id-123'); // boolean

// Toggle favorite state
toggleFavorite('photo-id-123');

// Explicitly add or remove
addFavorite('photo-id-123');
removeFavorite('photo-id-123');
```

**Features:**
- Loads favorites from MMKV on mount
- Automatically persists changes to storage
- Prevents duplicate entries
- Optimized with useCallback to minimize re-renders

### UI Component: `FavoriteButton`

Location: `src/screens/PhotoViewer/FavoriteButton.tsx`

A reanimated overlay button that displays in the PhotoViewer:

**Visual States:**
- Not favorite: Outlined heart icon (`heart-outline`) with white color
- Favorite: Filled heart icon (`heart`) with red color (#ff4444)

**Positioning:**
- Top-right corner of the screen
- Respects safe area insets
- Uses the same overlay styling as BackButton for consistency

**Accessibility:**
- Clear accessibility labels that change based on favorite state
- Descriptive hints for screen readers
- 48pt touch target (40px button + 10px hitSlop)

### PhotoViewer Integration

The PhotoViewer screen (`src/screens/PhotoViewer.tsx`) integrates the favorite button:

1. Imports the `useFavorites` hook
2. Creates a `handleToggleFavorite` callback that toggles the current photo
3. Renders the `FavoriteButton` alongside other overlay controls
4. Dynamically shows filled/outline heart based on favorite state

The button animates in with the same opacity animation as other overlay controls.

## Widget Integration

The widget system already reads from `StorageKeys.FAVORITES` to show favorite photos in widgets:

```typescript
// From widget.service.ts
const favoriteIds = storage.get<string[]>(StorageKeys.FAVORITES) || [];
const favoritePhotos = await mediaService.getPhotosByIds(favoriteIds.slice(0, 4));
```

The widget caps favorites at 4 photos for the grid display.

## Testing

### Hook Tests: `useFavorites.test.ts`

Tests cover:
- Loading favorites from storage on mount
- Empty array when no favorites exist
- Checking if photo is favorite
- Toggling favorites on/off
- Adding favorites without duplicates
- Removing favorites
- Persistence to storage on every change

### Component Tests: `FavoriteButton.test.tsx`

Tests cover:
- Rendering when visible/hidden
- Correct icon and label for favorite/not-favorite states
- Press handler invocation
- Custom top positioning
- Default positioning
- Accessibility properties

## User Flow

1. User opens a photo in the PhotoViewer
2. Heart button appears in the top-right corner
3. User taps the heart button
4. Icon changes from outline to filled (or vice versa)
5. Favorite state is immediately persisted to MMKV
6. If user has a favorites widget, it will show this photo on next refresh

## Performance Considerations

- **Lightweight storage**: Array of IDs only, not full photo objects
- **Memoized callbacks**: All hook functions use `useCallback` to prevent unnecessary re-renders
- **Synchronous reads**: MMKV is fast enough for synchronous access
- **No network calls**: 100% local operation

## Future Enhancements

Potential improvements for future versions:

1. **Grid view marking**: Add heart button overlay on PhotoGridItem for quicker marking
2. **Favorites screen**: Dedicated screen to view all favorites
3. **Bulk operations**: Select multiple photos to favorite at once
4. **Import/export**: Backup favorites list to file
5. **Smart collections**: Auto-favorite based on criteria (most viewed, highest quality, etc.)
6. **Animation**: Add spring animation to heart button when toggling

## Related Files

- `src/hooks/useFavorites.ts` - Core favorites hook
- `src/hooks/useFavorites.test.ts` - Hook tests
- `src/screens/PhotoViewer.tsx` - Main screen integration
- `src/screens/PhotoViewer/FavoriteButton.tsx` - UI component
- `src/screens/PhotoViewer/FavoriteButton.test.tsx` - Component tests
- `src/services/storage.service.ts` - StorageKeys definition
- `src/services/widget.service.ts` - Widget integration
