import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { borderRadius } from '../theme/tokens';
import { Photo } from '../types';
import BlurHashImage from './BlurHashImage';

interface PhotoGridItemProps {
  photo: Photo;
  index: number;
  onPress: (photo: Photo, index: number, layout?: { x: number; y: number; width: number; height: number }) => void;
  onLongPress?: (photo: Photo) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PhotoGridItem: React.FC<PhotoGridItemProps> = memo(({
  photo,
  index,
  onPress,
  onLongPress,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 20);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withDelay(index * 30, withSpring(1, { damping: 20 }));
    translateY.value = withDelay(index * 30, withSpring(0, { damping: 20 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.id, index, reduceMotion]);

  const handlePressIn = useCallback(() => {
    if (reduceMotion) {
      scale.value = 0.95;
    } else {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 150,
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale, reduceMotion]);

  const handlePressOut = useCallback(() => {
    if (reduceMotion) {
      scale.value = 1;
    } else {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [scale, reduceMotion]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(photo, index);
  }, [photo, index, onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress(photo);
    }
  }, [photo, onLongPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <AnimatedTouchable
      activeOpacity={0.7}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={400}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Photo ${photo.filename}`}
      accessibilityHint="Double-tap to view full size"
      style={[
        styles.container,
        animatedStyle,
        {
          aspectRatio: 1,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <BlurHashImage
        uri={photo.uri}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />
      <View style={styles.shine} />
    </AnimatedTouchable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.photo.uri === nextProps.photo.uri &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.onLongPress === nextProps.onLongPress
  );
});

PhotoGridItem.displayName = 'PhotoGridItem';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: borderRadius.md,
    flex: 1,
    margin: 2,
  },
  shine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

export default PhotoGridItem;
