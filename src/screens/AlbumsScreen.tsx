import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated from 'react-native-reanimated';

import AlbumCard from '../components/AlbumCard';
import EmptyState from '../components/EmptyState';
import { AlbumSkeleton } from '../components/Skeleton';
import { useAlbums } from '../hooks/useAlbums';
import { usePermission } from '../hooks/usePermission';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius } from '../theme/tokens';
import { Album } from '../types';
import { RootStackParamList } from '../types/navigation';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<Album>);

type NavigationProp = StackNavigationProp<RootStackParamList, 'Albums'>;

const AlbumsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { permission, isLoading: permissionLoading } = usePermission();
  const {
    albums,
    loading,
    error,
    refreshing,
    refreshAlbums,
    retryLoad,
  } = useAlbums();

  const handleAlbumPress = useCallback((album: Album) => {
    navigation.navigate('Photos', {
      albumId: album.id,
      albumTitle: album.title,
    });
  }, [navigation]);

  const renderAlbum = useCallback(({ item }: { item: Album; index: number }) => (
    <AlbumCard
      album={item}
      onPress={handleAlbumPress}
    />
  ), [handleAlbumPress]);

  const renderFooter = useCallback(() => {
    if (loading && albums.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
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
          title={error.category === 'NETWORK' ? 'Connection Issue' : 'Failed to Load Albums'}
          message={error.message}
          onAction={retryLoad}
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
  }, [permissionLoading, loading, permission, error, refreshAlbums, retryLoad]);

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
      <View style={styles.listContainer}>
        <AnimatedFlashList
          data={albums}
          renderItem={renderAlbum}
          keyExtractor={(item: Album) => item.id}
          numColumns={2}
          estimatedItemSize={200}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
          accessibilityRole="button"
          accessibilityLabel="Refresh albums"
          accessibilityHint="Updates your album list"
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
  listContent: {
    paddingTop: 80,
    paddingBottom: spacing.md,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  loadingInner: {
    paddingTop: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
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
});

export default AlbumsScreen;
