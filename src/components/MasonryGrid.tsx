import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { Photo } from '../types/photo';
import BlurHashImage from './BlurHashImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 4;
const NUM_COLUMNS = 3;

interface MasonryItem extends Photo {
  column: number;
  height: number;
}

interface MasonryGridProps {
  photos: Photo[];
  onPhotoPress: (photo: Photo, index: number) => void;
  onPhotoLongPress?: (photo: Photo) => void;
  numColumns?: number;
  gap?: number;
}

const MasonryGrid: React.FC<MasonryGridProps> = memo(({
  photos,
  onPhotoPress,
  onPhotoLongPress,
  numColumns = NUM_COLUMNS,
  gap = GAP,
}) => {
  const { colors } = useTheme();

  // Calculate column widths
  const columnWidth = useMemo(() => 
    (SCREEN_WIDTH - gap * (numColumns + 1)) / numColumns,
  [numColumns, gap]);

  // Distribute photos into columns based on aspect ratio
  const masonryData = useMemo(() => {
    const columns: MasonryItem[][] = Array.from({ length: numColumns }, () => []);
    const columnHeights = new Array(numColumns).fill(0);

    photos.forEach((photo, index) => {
      // Find the shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Calculate height based on aspect ratio
      const aspectRatio = photo.width / photo.height;
      const height = columnWidth / aspectRatio;

      columns[shortestColumn].push({
        ...photo,
        column: shortestColumn,
        height,
      });

      columnHeights[shortestColumn] += height + gap;
    });

    // Flatten columns into a single array for FlashList
    const maxItems = Math.max(...columns.map(c => c.length));
    const rows: MasonryItem[][] = [];

    for (let i = 0; i < maxItems; i++) {
      const row: MasonryItem[] = [];
      for (let col = 0; col < numColumns; col++) {
        if (columns[col][i]) {
          row.push(columns[col][i]);
        }
      }
      if (row.length > 0) {
        rows.push(row);
      }
    }

    return rows;
  }, [photos, numColumns, columnWidth, gap]);

  const renderItem = useCallback(({ item, index }: { item: MasonryItem[]; index: number }) => (
    <View style={{ flexDirection: 'row', paddingHorizontal: gap / 2 }}>
      {item.map((photo) => (
        <Animated.View
          key={photo.id}
          entering={FadeInUp.delay(index * 50)}
          style={{
            width: columnWidth,
            height: photo.height,
            margin: gap / 2,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: colors.surface,
          }}
        >
          <BlurHashImage
            uri={photo.uri}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </Animated.View>
      ))}
    </View>
  ), [columnWidth, gap, colors.surface]);

  return (
    <FlashList
      data={masonryData}
      renderItem={renderItem}
      keyExtractor={(_, index) => `row-${index}`}
      estimatedItemSize={150}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: gap / 2 }}
    />
  );
});

MasonryGrid.displayName = 'MasonryGrid';

export default MasonryGrid;
