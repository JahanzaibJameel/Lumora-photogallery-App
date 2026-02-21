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
import { useTheme } from '../hooks/useTheme';
import { Photo } from '../types/photo';
import BlurHashImage from './BlurHashImage';

interface PhotoGridItemProps {
  photo: Photo;
  index: number;
  onPress: (photo: Photo, index: number, layout?: { x: number; y: number; width: number; height: number }) => void;
  onLongPress?: (photo: Photo) => void;
  gridSize?: 'small' | 'medium' | 'large';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PhotoGridItem: React.FC<PhotoGridItemProps> = memo(({
  photo,
  index,
  onPress,
  onLongPress,
  gridSize = 'medium',
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const getDimensions = () => {
    // FlashList handles column layout, so we use flex-based sizing
    switch (gridSize) {
      case 'small':
        return { aspectRatio: 1 };
      case 'large':
        return { aspectRatio: 1 };
      default:
        return { aspectRatio: 1 };
    }
  };

  useEffect(() => {
    opacity.value = withDelay(index * 30, withSpring(1, { damping: 20 }));
    translateY.value = withDelay(index * 30, withSpring(0, { damping: 20 }));
  }, []);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(photo, index);
  }, [photo, index, onPress]);

  // Generate unique ID for shared element transition
  const sharedElementId = `photo-${photo.id}`;

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

  const dimensions = getDimensions();

  return (
    <AnimatedTouchable
      activeOpacity={0.7}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={400}
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
  return prevProps.photo.id === nextProps.photo.id &&
    prevProps.gridSize === nextProps.gridSize;
});

PhotoGridItem.displayName = 'PhotoGridItem';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
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
