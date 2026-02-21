import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    SafeAreaView,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedScrollHandler,
    useSharedValue,
} from 'react-native-reanimated';

import EmptyState from '../components/EmptyState';
import PhotoGridItem from '../components/PhotoGridItem';
import { PhotoGridSkeleton } from '../components/Skeleton';
import { usePhotos } from '../hooks/usePhotos';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList } from '../types/navigation';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Photos'>;

const PhotosScreen = () => {
  const route = useRoute<any>();
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
    deletePhoto,
  } = usePhotos(albumId);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  const handlePhotoPress = useCallback((photo: any, index: number) => {
    navigation.navigate('PhotoViewer', {
      photoId: photo.id,
      albumId,
      initialIndex: index,
    });
  }, [navigation, albumId]);

  const handlePhotoLongPress = useCallback((photo: any) => {
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

  const renderPhoto = useCallback(({ item, index }: { item: any; index: number }) => (
    <PhotoGridItem
      photo={item}
      index={index}
      onPress={handlePhotoPress}
      onLongPress={handlePhotoLongPress}
      gridSize={gridSize}
    />
  ), [handlePhotoPress, handlePhotoLongPress, gridSize]);

  const renderFooter = useCallback(() => {
    if (loading && photos.length > 0) {
      return (
        <View style={{ paddingVertical: 16 }}>
          <PhotoGridSkeleton />
        </View>
      );
    }
    return null;
  }, [loading, photos.length]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <PhotoGridSkeleton />
        </View>
      );
    }

    if (error) {
      return (
        <EmptyState
          type="error"
          title="Failed to Load Photos"
          message={error}
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
  }, [loading, error, refreshPhotos]);

  const getNumColumns = () => {
    switch (gridSize) {
      case 'small': return 4;
      case 'large': return 2;
      default: return 3;
    }
  };

  const getItemSpacing = () => {
    switch (gridSize) {
      case 'small': return 2;
      case 'large': return 4;
      default: return 3;
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1" style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}>
      <AnimatedFlashList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item: any) => item.id}
        numColumns={getNumColumns()}
        estimatedItemSize={gridSize === 'small' ? 80 : gridSize === 'large' ? 120 : 100}
        contentContainerStyle={{
          paddingTop: 80,
          paddingBottom: 20,
        }}
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

      <View className="absolute bottom-6 right-6 space-y-3">
        <TouchableOpacity
          className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{
            backgroundColor: colors.accent,
            shadowColor: colors.textPrimary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          activeOpacity={0.7}
          onPress={refreshPhotos}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
          activeOpacity={0.7}
          onPress={() => setGridSize(
            gridSize === 'small' ? 'medium' :
            gridSize === 'medium' ? 'large' : 'small'
          )}
        >
          <Ionicons
            name={
              gridSize === 'small' ? 'grid' :
              gridSize === 'medium' ? 'square' : 'list'
            }
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PhotosScreen;