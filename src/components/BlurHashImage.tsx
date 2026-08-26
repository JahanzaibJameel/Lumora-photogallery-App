import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface BlurHashImageProps {
  uri: string;
  blurhash?: string;
  style?: React.ComponentProps<typeof View>['style'];
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transitionDuration?: number;
}

// Stateless on purpose: expo-image fades in via its native transition and the
// placeholder always sits underneath, so no load state, no reanimated worklet,
// and zero re-renders per grid cell.
export const BlurHashImage: React.FC<BlurHashImageProps> = ({
  uri,
  blurhash,
  style,
  contentFit = 'cover',
  transitionDuration = 300,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[style, { backgroundColor: colors.surface }]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          blurhash ? undefined : { backgroundColor: colors.surface },
        ]}
      />
      <Image
        source={{ uri }}
        placeholder={blurhash ? { blurhash } : undefined}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={transitionDuration}
        cachePolicy="memory-disk"
      />
    </View>
  );
};

export default BlurHashImage;
