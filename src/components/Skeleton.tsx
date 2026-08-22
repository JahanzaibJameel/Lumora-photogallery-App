import React, { memo, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: React.ComponentProps<typeof View>['style'];
}

const Skeleton: React.FC<SkeletonProps> = memo(({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 0.6 : 0.5);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withTiming(0.8, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor = colors.surfaceVariant;

  return (
    <View style={[{ width, height, borderRadius } as ViewStyle, style]}>
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
    marginBottom: spacing.md,
  },
  textContainer: {
    marginTop: spacing.sm,
  },
  subtitleContainer: {
    marginTop: spacing.xs,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  gridItem: {
    width: '32%',
    marginBottom: spacing.sm,
  },
});
