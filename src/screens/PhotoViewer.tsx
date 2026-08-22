import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePhotos } from '../hooks/usePhotos';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RootStackParamList } from '../types/navigation';
import { usePhotoGestures } from './PhotoViewer/PhotoViewerGestures';
import { BackButton, NavArrow, PhotoInfoBadge } from './PhotoViewer/PhotoViewerOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PhotoViewerRouteProp = RouteProp<RootStackParamList, 'PhotoViewer'>;

const PhotoViewer = () => {
  const route = useRoute<PhotoViewerRouteProp>();
  const navigation = useNavigation();
  const { albumId, initialIndex = 0 } = route.params;
  const { photos } = usePhotos(albumId);
  const reduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentIndexRef = useSharedValue(initialIndex);
  const goToIndex = useCallback((index: number) => {
    currentIndexRef.value = index;
    setCurrentIndex(index);
  }, [currentIndexRef]);

  const insets = useSafeAreaInsets();

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (currentIndexRef.value < photos.length - 1) {
      goToIndex(currentIndexRef.value + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length, goToIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndexRef.value > 0) {
      goToIndex(currentIndexRef.value - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToIndex]);

  const { animatedStyle, pinchGesture, panGesture, swipeGesture } = usePhotoGestures({
    currentIndexRef,
    photosLength: photos.length,
    goToIndex,
    reduceMotion,
  });

  const backOpacity = useSharedValue(0);

  useEffect(() => {
    StatusBar.setHidden(true);
    backOpacity.value = reduceMotion ? 1 : withSpring(1, { damping: 20 });

    return () => {
      StatusBar.setHidden(false);
    };
  }, [reduceMotion, backOpacity]);

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

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="image" size={64} color="white" />
      </View>
    );
  }

  const currentPhoto = photos[currentIndex] || photos[0];
  const imageRatio = currentPhoto.width / currentPhoto.height;
  const screenRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
  const imageHeight = imageRatio > screenRatio
    ? SCREEN_WIDTH / imageRatio
    : SCREEN_HEIGHT;

  return (
    <View style={styles.container} accessibilityViewIsModal={true}>
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
            accessibilityLabel={`Photo ${currentIndex + 1} of ${photos.length}`}
            accessible={true}
          />
        </Animated.View>
      </GestureDetector>

      <BackButton
        onPress={handleBack}
        backOpacity={backOpacity}
        visible
        top={Math.max(insets.top + 8, 16)}
      />

      <NavArrow
        onPress={handlePrevious}
        backOpacity={backOpacity}
        direction="left"
        visible={currentIndex > 0}
      />

      <NavArrow
        onPress={handleNext}
        backOpacity={backOpacity}
        direction="right"
        visible={currentIndex < photos.length - 1}
      />

      <PhotoInfoBadge
        currentIndex={currentIndex}
        total={photos.length}
        backOpacity={backOpacity}
      />
    </View>
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
});

export default PhotoViewer;
