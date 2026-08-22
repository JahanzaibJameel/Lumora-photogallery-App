import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';

interface BlurHashImageProps {
  uri: string;
  blurhash?: string;
  style?: React.ComponentProps<typeof View>['style'];
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transitionDuration?: number;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const BlurHashImage: React.FC<BlurHashImageProps> = ({
  uri,
  blurhash,
  style,
  contentFit = 'cover',
  transitionDuration = 300,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(loaded ? 1 : 0, {
      duration: transitionDuration,
      reduceMotion: reduceMotion ? ReduceMotion.Always : ReduceMotion.System,
    }),
  }));

  return (
    <View style={[style, { backgroundColor: colors.surface }]}>
      {/* Placeholder with blurhash or solid color */}
      {!loaded && (
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: blurhash ? undefined : colors.surface,
            },
            style,
          ]}
        />
      )}
      
      {/* Actual image with fade-in */}
      <AnimatedImage
        source={{ uri }}
        style={[{ width: '100%', height: '100%' }, imageAnimatedStyle]}
        contentFit={contentFit}
        transition={transitionDuration}
        onLoad={() => setLoaded(true)}
        cachePolicy="memory-disk"
      />
    </View>
  );
};

export default BlurHashImage;
