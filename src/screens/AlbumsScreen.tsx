import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import AlbumCard from '../components/AlbumCard';
import EmptyState from '../components/EmptyState';
import { AlbumSkeleton } from '../components/Skeleton';
import { useAlbums } from '../hooks/useAlbums';
import { usePermission } from '../hooks/usePermission';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList } from '../types/navigation';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Albums'>;

const AlbumsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { permission, isLoading: permissionLoading } = usePermission();
  const {
    albums,
    loading,
    error,
    refreshing,
    loadMore,
    refreshAlbums,
  } = useAlbums();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [sortBy, setSortBy] = useState<'name' | 'count' | 'recent'>('recent');

  const handleAlbumPress = useCallback((album: any) => {
    navigation.navigate('Photos', {
      albumId: album.id,
      albumTitle: album.title,
    });
  }, [navigation]);

  const renderAlbum = useCallback(({ item, index }: { item: any; index: number }) => (
    <AlbumCard
      album={item}
      onPress={handleAlbumPress}
    />
  ), [handleAlbumPress]);

  const renderFooter = useCallback(() => {
    if (loading && albums.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <View style={[
            styles.spinner,
            {
              borderTopColor: colors.accent,
              borderRightColor: colors.accent + '40',
              borderBottomColor: colors.accent + '40',
              borderLeftColor: colors.accent + '40',
            }
          ]} />
        </View>
      );
    }
    return null;
  }, [loading, albums.length, colors.accent]);

  const renderEmpty = useCallback(() => {
    if (permissionLoading || loading) {
      return (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, index) => (
            <AlbumSkeleton key={index} />
          ))}
        </View>
      );
    }

    if (permission !== 'granted') {
      return <EmptyState type="permission" />;
    }

    if (error) {
      return (
        <EmptyState
          type="error"
          title="Failed to Load Albums"
          message={error}
          onAction={refreshAlbums}
        />
      );
    }

    return (
      <EmptyState
        type="empty"
        title="No Albums Found"
        message="Your photo albums will appear here."
        onAction={refreshAlbums}
      />
    );
  }, [permissionLoading, loading, permission, error, refreshAlbums]);

  if (permissionLoading && albums.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingInner}>
            <AlbumSkeleton />
            <AlbumSkeleton />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.listContainer, Platform.OS === 'web' ? { height: '100vh' as any } : undefined]}>
        <AnimatedFlashList
          data={albums}
          renderItem={renderAlbum}
          keyExtractor={(item: any) => item.id}
          numColumns={2}
          estimatedItemSize={200}
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
              onRefresh={refreshAlbums}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          removeClippedSubviews={true}
        />
      </View>

      {albums.length > 0 && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.accent,
              shadowColor: colors.textPrimary,
            }
          ]}
          activeOpacity={0.7}
          onPress={refreshAlbums}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingInner: {
    paddingTop: 64,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AlbumsScreen;