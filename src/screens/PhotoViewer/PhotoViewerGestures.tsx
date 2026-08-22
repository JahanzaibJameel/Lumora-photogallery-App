import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GestureHandlersProps {
  currentIndexRef: SharedValue<number>;
  photosLength: number;
  goToIndex: (index: number) => void;
  reduceMotion: boolean;
  onPhotoNotFound?: () => void;
}

export const usePhotoGestures = ({
  currentIndexRef,
  photosLength,
  goToIndex,
  reduceMotion,
}: GestureHandlersProps) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const springTo = useCallback((sv: SharedValue<number>, to: number) => {
    'worklet';
    sv.value = reduceMotion ? to : withSpring(to);
  }, [reduceMotion]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      scale.value = Math.max(1, event.scale);
    })
    .onEnd(() => {
      if (scale.value > 1.5) {
        springTo(scale, 2);
      } else if (scale.value > 1.1) {
        springTo(scale, 1.5);
      } else {
        springTo(scale, 1);
        springTo(translateX, 0);
        springTo(translateY, 0);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value === 1) {
        springTo(translateX, 0);
        springTo(translateY, 0);
      }
    });

  const swipeGesture = Gesture.Pan()
    .onUpdate((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (scale.value === 1) {
        translateX.value = event.translationX;
        opacity.value = interpolate(
          Math.abs(event.translationX),
          [0, SCREEN_WIDTH / 2],
          [1, 0.5],
          { extrapolateRight: 'clamp' }
        );
      }
    })
    .onEnd((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (scale.value === 1) {
        const shouldNavigate = Math.abs(event.translationX) > SCREEN_WIDTH / 4;

        if (shouldNavigate) {
          const direction = event.translationX > 0 ? -1 : 1;
          const newIndex = currentIndexRef.value + direction;

          if (newIndex >= 0 && newIndex < photosLength) {
            goToIndex(newIndex);
            springTo(translateX, direction * SCREEN_WIDTH);
            springTo(opacity, 0);

            if (!reduceMotion) {
              setTimeout(() => {
                translateX.value = 0;
                opacity.value = 1;
              }, 300);
            } else {
              translateX.value = 0;
              opacity.value = 1;
            }
          } else {
            springTo(translateX, 0);
            springTo(opacity, 1);

            if (Math.abs(event.translationX) > SCREEN_WIDTH / 3) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          }
        } else {
          springTo(translateX, 0);
          springTo(opacity, 1);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return {
    pinchGesture,
    panGesture,
    swipeGesture,
    animatedStyle,
  };
};
