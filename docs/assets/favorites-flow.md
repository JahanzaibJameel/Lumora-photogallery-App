# Favorites Feature Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Journey                              │
└─────────────────────────────────────────────────────────────────┘

User opens PhotoViewer
         │
         ▼
   ┌─────────────┐
   │  View Photo │
   └─────────────┘
         │
         ▼
   Sees heart button (top-right)
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
   Not Favorite              Is Favorite
   (outline heart)           (filled heart, red)
         │                         │
         ▼                         ▼
   Tap to Add                Tap to Remove
         │                         │
         └───────────┬─────────────┘
                     │
                     ▼
            toggleFavorite(photoId)
                     │
                     ▼
         ┌───────────────────────┐
         │   Update State        │
         │   Save to MMKV        │
         └───────────────────────┘
                     │
                     ▼
         Icon changes immediately
                     │
                     ▼
         Widget will show on next refresh


┌─────────────────────────────────────────────────────────────────┐
│                     Component Architecture                       │
└─────────────────────────────────────────────────────────────────┘

    PhotoViewer.tsx
         │
         ├─ useFavorites() ────────► MMKV Storage
         │                            (StorageKeys.FAVORITES)
         │
         ├─ FavoriteButton
         │       │
         │       ├─ isFavorite(photoId)
         │       ├─ handleToggleFavorite()
         │       └─ Animated overlay
         │
         └─ Other overlay controls
               (BackButton, NavArrows, InfoBadge)


┌─────────────────────────────────────────────────────────────────┐
│                     Data Flow                                    │
└─────────────────────────────────────────────────────────────────┘

1. Mount:
   useFavorites() → Load from MMKV → Set state ['photo1', 'photo2']

2. Check:
   isFavorite('photo1') → Check in array → Return true/false

3. Toggle:
   toggleFavorite('photo3')
      → Current: ['photo1', 'photo2']
      → New: ['photo1', 'photo2', 'photo3']
      → Save to MMKV
      → Update state

4. Widget reads:
   WidgetService → Load from MMKV → Get first 4 IDs → Fetch photos
```
