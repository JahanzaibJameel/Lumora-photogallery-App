import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import BlurHeader from '../components/BlurHeader';
import EmptyState from '../components/EmptyState';
import PhotoGridItem from '../components/PhotoGridItem';
import { PhotoGridSkeleton } from '../components/Skeleton';
import { useGridSize } from '../contexts/GridSizeContext';
import { usePhotos } from '../hooks/usePhotos';
import { useDebouncedValue, useSearchHistory } from '../hooks/useSearch';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius } from '../theme/tokens';
import { Photo } from '../types';
import { RootStackParamList } from '../types/navigation';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<Photo>);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Photos'>;
type PhotosRouteProp = RouteProp<RootStackParamList, 'Photos'>;

const PhotosScreen = () => {
  const route = useRoute<PhotosRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const { albumId, albumTitle } = route.params;
  const {
    photos,
    loading,
    error,
    refreshing,
    loadMore,
    refreshPhotos,
    retryLoad,
    deletePhoto,
  } = usePhotos(albumId);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const { gridSize, cycleGridSize } = useGridSize();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const { recordQuery } = useSearchHistory();

  // FlashList uses this estimate to size the scrollbar and pre-render window;
  // deriving it from the actual cell geometry beats hardcoding per-grid guesses.
  const numColumns = gridSize === 'small' ? 4 : gridSize === 'large' ? 2 : 3;
  const { width: windowWidth } = useWindowDimensions();
  const estimatedItemSize = useMemo(
    () => Math.round(windowWidth / numColumns),
    [windowWidth, numColumns]
  );

  const filteredPhotos = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter(
      (p: Photo) =>
        p.filename?.toLowerCase().includes(q) ||
        p.albumId?.toLowerCase().includes(q)
    );
  }, [photos, debouncedQuery]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (text.trim()) recordQuery(text);
    },
    [recordQuery]
  );

  const handlePhotoPress = useCallback((photo: Photo, index: number) => {
    navigation.navigate('PhotoViewer', {
      photoId: photo.id,
      albumId,
      initialIndex: index,
    });
  }, [navigation, albumId]);

  const handlePhotoLongPress = useCallback((photo: Photo) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePhoto(photo.id),
        },
      ]
    );
  }, [deletePhoto]);

  const renderPhoto = useCallback(({ item, index }: { item: Photo; index: number }) => (
    <PhotoGridItem
      photo={item}
      index={index}
      onPress={handlePhotoPress}
      onLongPress={handlePhotoLongPress}
    />
  ), [handlePhotoPress, handlePhotoLongPress]);

  const renderFooter = useCallback(() => {
    if (loading && photos.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <PhotoGridSkeleton />
        </View>
      );
    }
    return null;
  }, [loading, photos.length]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptySkeletonContainer}>
          <PhotoGridSkeleton />
        </View>
      );
    }

    if (error) {
      return (
        <EmptyState
          type="error"
          title={error.category === 'NETWORK' ? 'Connection Issue' : 'Failed to Load Photos'}
          message={error.message}
          onAction={retryLoad}
        />
      );
    }

    if (debouncedQuery.trim() && filteredPhotos.length === 0) {
      return (
        <EmptyState
          type="empty"
          title="No Results"
          message={`No photos match "${debouncedQuery.trim()}".`}
          onAction={refreshPhotos}
        />
      );
    }

    return (
      <EmptyState
        type="empty"
        title="No Photos"
        message="This album is empty."
        onAction={refreshPhotos}
      />
    );
  }, [loading, error, refreshPhotos, debouncedQuery, filteredPhotos.length, retryLoad]);

  const gridIconName = gridSize === 'small' ? 'grid' : gridSize === 'medium' ? 'square' : 'list';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <BlurHeader
        title={albumTitle}
        showBack
        showSearch
        onSearchChange={handleSearchChange}
      />

      <View style={styles.listContainer}>
        <AnimatedFlashList
          data={filteredPhotos}
          renderItem={renderPhoto}
          keyExtractor={(item: Photo) => item.id}
          numColumns={numColumns}
          estimatedItemSize={estimatedItemSize}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshPhotos}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          removeClippedSubviews={true}
          key={`grid-${gridSize}`}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.accent,
              shadowColor: colors.textPrimary,
            }
          ]}
          activeOpacity={0.7}
          onPress={refreshPhotos}
          accessibilityRole="button"
          accessibilityLabel="Refresh photos"
          accessibilityHint="Updates your photo list"
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.gridToggle,
            { backgroundColor: colors.surface }
          ]}
          activeOpacity={0.7}
          onPress={cycleGridSize}
          accessibilityRole="button"
          accessibilityLabel="Change grid size"
          accessibilityHint="Cycles through small, medium, and large grid layouts"
        >
          <Ionicons
            name={gridIconName}
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 80,
    paddingBottom: spacing.md,
  },
  footerContainer: {
    paddingVertical: spacing.md,
  },
  emptySkeletonContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  actionButtons: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gridToggle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PhotosScreen;
