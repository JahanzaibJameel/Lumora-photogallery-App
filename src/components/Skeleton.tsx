import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

const Skeleton: React.FC<SkeletonProps> = memo(({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor = isDark 
    ? 'rgba(255,255,255,0.1)' 
    : 'rgba(0,0,0,0.1)';

  return (
    <View style={[{ width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor,
            borderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;

export const AlbumSkeleton = () => {
  return (
    <View style={styles.albumContainer}>
      <Skeleton height={160} borderRadius={16} />
      <View style={styles.textContainer}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <View style={styles.subtitleContainer}>
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

export const PhotoGridSkeleton = () => {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.gridItem}>
          <Skeleton height={100} borderRadius={8} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  albumContainer: {
    width: '48%',
    marginBottom: 16,
  },
  textContainer: {
    marginTop: 8,
  },
  subtitleContainer: {
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  gridItem: {
    width: '32%',
    marginBottom: 8,
  },
});
