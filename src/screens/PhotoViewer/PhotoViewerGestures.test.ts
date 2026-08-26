import { renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Dimensions } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { usePhotoGestures } from './PhotoViewerGestures';

// File-local reanimated double: unlike the global setup mock, useAnimatedStyle
// re-evaluates its worklet on every property read, so tests can observe live
// shared-value mutations through the returned style.
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  useSharedValue: (init: unknown) => ({ value: init }),
  useAnimatedStyle: (worklet: () => Record<string | symbol, unknown>) =>
    new Proxy({} as Record<string | symbol, unknown>, {
      get: (_, key) => {
        const style = worklet();
        return Reflect.get(style, key);
      },
    }),
  withSpring: (value: unknown, _config?: unknown, callback?: (finished: boolean) => void) => {
    if (typeof callback === 'function') Promise.resolve().then(() => callback(true));
    return value;
  },
  withTiming: (value: unknown) => value,
  interpolate: (_value: unknown, _input: unknown, output: unknown[]) => output[0],
  runOnJS: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH / 4;
const EDGE_FEEDBACK_THRESHOLD = SCREEN_WIDTH / 3;

// The jest gesture double records builder callbacks on `_handlers`, letting
// tests drive real handler logic through simulated gesture lifecycles.
const handlersOf = <T extends object>(gesture: unknown): T =>
  (gesture as { _handlers: T })._handlers;

interface PanEvent {
  translationX: number;
  translationY?: number;
}

interface PinchHandlers {
  onUpdate: (e: { scale: number }) => void;
  onEnd: () => void;
}

interface PanHandlers {
  onUpdate: (e: PanEvent) => void;
  onEnd: () => void;
}

interface SwipeHandlers {
  onUpdate: (e: { translationX: number }) => void;
  onEnd: (e: { translationX: number }) => void;
}

const setup = ({ initialIndex = 0, photosLength = 3, reduceMotion = false } = {}) => {
  const currentIndexRef = { value: initialIndex } as SharedValue<number>;
  const goToIndex = jest.fn();
  const { result } = renderHook(() =>
    usePhotoGestures({ currentIndexRef, photosLength, goToIndex, reduceMotion })
  );
  const gestures = result.current;
  return {
    currentIndexRef,
    goToIndex,
    gestures,
    pinch: handlersOf<PinchHandlers>(gestures.pinchGesture),
    pan: handlersOf<PanHandlers>(gestures.panGesture),
    swipe: handlersOf<SwipeHandlers>(gestures.swipeGesture),
  };
};

const flushMicrotasks = () => Promise.resolve();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('pinch gesture', () => {
  it('tracks scale updates without dropping below rest scale', () => {
    const { gestures, pinch } = setup();

    pinch.onUpdate({ scale: 2 });
    expect(gestures.animatedStyle.transform[0].scale).toBe(2);

    pinch.onUpdate({ scale: 0.5 });
    expect(gestures.animatedStyle.transform[0].scale).toBe(1);
  });

  it('springs to zoomed-in resting points above the pinch thresholds', () => {
    const { gestures, pinch } = setup();

    pinch.onUpdate({ scale: 1.8 });
    pinch.onEnd();
    expect(gestures.animatedStyle.transform[0].scale).toBe(2);

    pinch.onUpdate({ scale: 1.2 });
    pinch.onEnd();
    expect(gestures.animatedStyle.transform[0].scale).toBe(1.5);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('resets fully when the pinch stays near rest scale', () => {
    const { gestures, pinch, pan } = setup();

    // Zoom in and drag while zoomed.
    pinch.onUpdate({ scale: 2 });
    pan.onUpdate({ translationX: 40, translationY: -30 });
    expect(gestures.animatedStyle.transform[1].translateX).toBe(40);
    expect(gestures.animatedStyle.transform[2].translateY).toBe(-30);

    // Release below the zoom threshold resets scale and translations together.
    pinch.onUpdate({ scale: 1.05 });
    pinch.onEnd();
    expect(gestures.animatedStyle.transform[0].scale).toBe(1);
    expect(gestures.animatedStyle.transform[1].translateX).toBe(0);
    expect(gestures.animatedStyle.transform[2].translateY).toBe(0);
  });
});

describe('pan gesture', () => {
  it('holds zoomed translations across release and clears them once fully unpinched', () => {
    const { gestures, pinch, pan } = setup();

    pan.onUpdate({ translationX: 25, translationY: 15 });
    expect(gestures.animatedStyle.transform[1].translateX).toBe(0);

    pinch.onUpdate({ scale: 1.4 });
    pan.onUpdate({ translationX: 25, translationY: 15 });
    expect(gestures.animatedStyle.transform[1].translateX).toBe(25);
    expect(gestures.animatedStyle.transform[2].translateY).toBe(15);

    // Releasing while still zoomed keeps the pan offset.
    pan.onEnd();
    expect(gestures.animatedStyle.transform[1].translateX).toBe(25);
    expect(gestures.animatedStyle.transform[2].translateY).toBe(15);

    // Only returning to rest scale clears the offsets.
    pinch.onUpdate({ scale: 1.05 });
    pinch.onEnd();
    expect(gestures.animatedStyle.transform[1].translateX).toBe(0);
    expect(gestures.animatedStyle.transform[2].translateY).toBe(0);
  });

  it('keeps zoomed translations after release', () => {
    const { gestures, pinch, pan } = setup();

    pinch.onUpdate({ scale: 2 });
    pan.onUpdate({ translationX: 60, translationY: 10 });
    pan.onEnd();
    expect(gestures.animatedStyle.transform[1].translateX).toBe(60);
    expect(gestures.animatedStyle.transform[2].translateY).toBe(10);
  });
});

describe('swipe gesture navigation', () => {
  it('navigates forward through the spring completion callback', async () => {
    const { goToIndex, swipe } = setup({ initialIndex: 1 });

    swipe.onUpdate({ translationX: -SWIPE_THRESHOLD - 20 });
    swipe.onEnd({ translationX: -SWIPE_THRESHOLD - 20 });
    await flushMicrotasks();

    expect(goToIndex).toHaveBeenCalledWith(2);
  });

  it('navigates backward immediately under reduced motion', () => {
    const { goToIndex, gestures, swipe } = setup({ initialIndex: 2, reduceMotion: true });

    swipe.onEnd({ translationX: SWIPE_THRESHOLD + 20 });

    expect(goToIndex).toHaveBeenCalledWith(1);
    expect(gestures.animatedStyle.opacity).toBe(1);
    expect(gestures.animatedStyle.transform[1].translateX).toBe(0);
  });

  it('snaps back without navigating below the swipe threshold', () => {
    const { goToIndex, gestures, swipe } = setup({ initialIndex: 1 });

    swipe.onUpdate({ translationX: -20 });
    swipe.onEnd({ translationX: -20 });

    expect(goToIndex).not.toHaveBeenCalled();
    expect(gestures.animatedStyle.transform[1].translateX).toBe(0);
    expect(gestures.animatedStyle.opacity).toBe(1);
  });

  it('ignores swipes while the photo is zoomed', () => {
    const { goToIndex, pinch, swipe } = setup({ initialIndex: 1 });

    pinch.onUpdate({ scale: 2 });
    swipe.onUpdate({ translationX: -SCREEN_WIDTH });
    swipe.onEnd({ translationX: -SCREEN_WIDTH });

    expect(goToIndex).not.toHaveBeenCalled();
  });

  it('bounces back at the first photo without error haptics for small drags', () => {
    const { goToIndex, gestures, swipe } = setup({ initialIndex: 0 });

    swipe.onEnd({ translationX: SWIPE_THRESHOLD + 20 });

    expect(goToIndex).not.toHaveBeenCalled();
    expect(gestures.animatedStyle.transform[1].translateX).toBe(0);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('signals error haptics on hard drags past the last photo', () => {
    const { goToIndex, gestures, swipe } = setup({ initialIndex: 2 });

    swipe.onEnd({ translationX: -EDGE_FEEDBACK_THRESHOLD - 20 });

    expect(goToIndex).not.toHaveBeenCalled();
    expect(gestures.animatedStyle.transform[1].translateX).toBe(0);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });
});
