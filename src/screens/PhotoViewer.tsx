import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
    BackHandler,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { usePhotos } from '../hooks/usePhotos';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PhotoViewer = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const { albumId, initialIndex = 0 } = route.params;
  const { photos } = usePhotos(albumId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const backOpacity = useSharedValue(0);

  const currentPhoto = photos[currentIndex] || photos[0];

  // Gesture handlers - using new Gesture API
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event: any) => {
      scale.value = Math.max(1, event.scale);
    })
    .onEnd(() => {
      if (scale.value > 1.5) {
        scale.value = withSpring(2);
      } else if (scale.value > 1.1) {
        scale.value = withSpring(1.5);
      } else {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (scale.value > 1) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onUpdate((event: any) => {
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value === 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const swipeGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event: any) => {
      if (scale.value === 1) {
        translateX.value = event.translationX;
        opacity.value = interpolate(
          Math.abs(event.translationX),
          [0, SCREEN_WIDTH / 2],
          [1, 0.5],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((event: any) => {
      if (scale.value === 1) {
        const shouldNavigate = Math.abs(event.translationX) > SCREEN_WIDTH / 4;
        
        if (shouldNavigate) {
          const direction = event.translationX > 0 ? -1 : 1;
          const newIndex = currentIndex + direction;
          
          if (newIndex >= 0 && newIndex < photos.length) {
            runOnJS(setCurrentIndex)(newIndex);
            translateX.value = withSpring(direction * SCREEN_WIDTH);
            opacity.value = withSpring(0);
            
            setTimeout(() => {
              translateX.value = 0;
              opacity.value = 1;
            }, 300);
          } else {
            translateX.value = withSpring(0);
            opacity.value = withSpring(1);
            
            if (Math.abs(event.translationX) > SCREEN_WIDTH / 3) {
              runOnJS(Haptics.notificationAsync)(
                Haptics.NotificationFeedbackType.Error
              );
            }
          }
        } else {
          translateX.value = withSpring(0);
          opacity.value = withSpring(1);
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

  const backButtonStyle = useAnimatedStyle(() => ({
    opacity: backOpacity.value,
  }));

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, photos.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [handleBack]);

  useEffect(() => {
    StatusBar.setHidden(true);
    backOpacity.value = withSpring(1, { damping: 20 });

    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  if (!currentPhoto) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="image" size={64} color="white" />
      </View>
    );
  }

  const imageRatio = currentPhoto.width / currentPhoto.height;
  const screenRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
  const imageHeight = imageRatio > screenRatio
    ? SCREEN_WIDTH / imageRatio
    : SCREEN_HEIGHT;

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={Gesture.Simultaneous(pinchGesture, Gesture.Race(swipeGesture, panGesture))}>
        <Animated.View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: currentPhoto.uri }}
            style={[
              animatedStyle,
              {
                width: SCREEN_WIDTH,
                height: imageHeight,
                maxHeight: SCREEN_HEIGHT,
              },
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>

      {/* Back Button */}
      <Animated.View
        style={[backButtonStyle, styles.backButtonContainer]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <Animated.View
          style={[backButtonStyle, styles.leftArrowContainer]}
        >
          <TouchableOpacity
            onPress={handlePrevious}
            style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {currentIndex < photos.length - 1 && (
        <Animated.View
          style={[backButtonStyle, styles.rightArrowContainer]}
        >
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Photo Info */}
      <Animated.View
        style={[backButtonStyle, styles.infoContainer]}
      >
        <View
          style={[styles.infoBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        >
          <Text style={styles.infoText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 50,
  },
  leftArrowContainer: {
    position: 'absolute',
    left: 16,
    top: '50%',
    zIndex: 50,
    marginTop: -20,
  },
  rightArrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    zIndex: 50,
    marginTop: -20,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  infoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
  },
});

export default PhotoViewer;
