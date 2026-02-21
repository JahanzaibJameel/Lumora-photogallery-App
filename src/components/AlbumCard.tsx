import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback } from 'react';
import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { Album } from '../types/album';

interface AlbumCardProps {
  album: Album;
  onPress: (album: Album) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AlbumCard: React.FC<AlbumCardProps> = memo(({ album, onPress }) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = 1;
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [pressed, scale]);

  const handlePressOut = useCallback(() => {
    pressed.value = 0;
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  }, [pressed, scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(album);
  }, [album, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(
      pressed.value,
      [0, 1],
      [0.1, 0.2],
      Extrapolate.CLAMP
    ),
    shadowOffset: {
      width: 0,
      height: interpolate(
        pressed.value,
        [0, 1],
        [2, 4],
        Extrapolate.CLAMP
      ),
    },
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      pressed.value,
      [0, 1],
      [0, 0.1],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <Animated.View
      style={[styles.container, { shadowColor: colors.textPrimary }, animatedStyle]}
    >
      <AnimatedTouchable
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.touchable}
      >
        {album.thumbnailUri ? (
          <ImageBackground
            source={{ uri: album.thumbnailUri }}
            resizeMode="cover"
            style={styles.imageBackground}
          >
            <Animated.View
              style={[styles.overlay, overlayStyle]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              locations={[0.4, 1]}
              style={styles.gradient}
            >
              <Text
                style={styles.title}
                numberOfLines={1}
              >
                {album.title}
              </Text>
              <Text style={styles.count}>
                {album.count} photo{album.count !== 1 ? 's' : ''}
              </Text>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <View style={[styles.noImageContainer, { backgroundColor: colors.surface }]}>
            <Animated.View
              style={[styles.overlay, overlayStyle]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              locations={[0.4, 1]}
              style={styles.gradient}
            >
              <Text
                style={styles.title}
                numberOfLines={1}
              >
                {album.title}
              </Text>
              <Text style={styles.count}>
                {album.count} photo{album.count !== 1 ? 's' : ''}
              </Text>
            </LinearGradient>
          </View>
        )}
      </AnimatedTouchable>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.album.id === nextProps.album.id;
});

AlbumCard.displayName = 'AlbumCard';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  touchable: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  imageBackground: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  noImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 12,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});

export default AlbumCard;
