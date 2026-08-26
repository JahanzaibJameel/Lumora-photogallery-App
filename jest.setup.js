const { View, Text, ScrollView, Image } = require('react-native');

// ----------------------------------------------------------------------------
// react-native-reanimated
// ----------------------------------------------------------------------------
jest.mock('react-native-reanimated', () => {
const { View, Text, ScrollView, Image } = require('react-native');

global.window = global.window || {};
global.window.dispatchEvent = global.window.dispatchEvent || (() => {});
  const ID = (v) => v;
  const NOOP = () => undefined;
  const NOOP_FACTORY = () => () => undefined;

  const Animated = {
    View,
    Text,
    ScrollView,
    Image,
    createAnimatedComponent: (Comp) => Comp,
    createNativeWrapper: (Comp) => Comp,
    addWhitelistedNativeProps: NOOP,
    addWhitelistedUIProps: NOOP,
  };

  const useSharedValue = (init) => ({ value: init });

  return {
    __esModule: true,
    default: Animated,
    Animated,
    useSharedValue,
    useAnimatedStyle: (cb) => (typeof cb === 'function' ? cb() : {}),
    useAnimatedProps: (cb) => (typeof cb === 'function' ? cb() : {}),
    useAnimatedScrollHandler: NOOP_FACTORY,
    useAnimatedRef: () => ({ current: null }),
    useAnimatedReaction: NOOP,
    useDerivedValue: (processor) => ({
      value: typeof processor === 'function' ? processor() : 0,
    }),
    useEvent: NOOP,
    useAnimatedSensor: NOOP_FACTORY,
    useAnimatedKeyboard: () => ({ height: 0, state: 0 }),
    useScrollViewOffset: () => ({ value: 0 }),
    useScrollOffset: () => ({ value: 0 }),
    withSpring: (v, config, cb) => {
      if (typeof cb === 'function') Promise.resolve().then(() => cb(true));
      return v;
    },
    withTiming: ID,
    withRepeat: ID,
    withDelay: (d, v) => v,
    withSequence: (...vals) => vals[0],
    withDecay: () => 0,
    interpolate: ID,
    interpolateColor: NOOP,
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    Easing: {
      linear: ID, ease: ID, quad: ID, cubic: ID, poly: ID,
      sin: ID, circle: ID, exp: ID, elastic: ID, back: ID, bounce: ID,
      bezier: () => ({ factory: ID }), bezierFn: ID, steps: ID,
      in: ID, out: ID, inOut: ID,
    },
    runOnJS: ID,
    runOnUI: ID,
    createWorkletRuntime: NOOP,
    makeMutable: ID,
    isReanimated3: () => false,
    enableScreens: jest.fn(),
    FadeIn: {}, FadeOut: {}, ZoomIn: {}, ZoomOut: {},
    FadeInUp: { delay: () => ({}) },
    SlideInUp: {}, SlideOutDown: {}, SlideInDown: {}, SlideOutUp: {},
    FlipInYLeft: {}, FlipOutYRight: {},
    Layout: {}, LinearTransition: {}, CurvedTransition: {},
    ColorSpace: { DEVICE: 1, LEGACY: 0 },
    ReduceMotion: { System: 'system', Never: 'never', Always: 'always' },
    ReducedMotionConfig: ({ children }) => children ?? null,
    SensorType: { ACCELEROMETER: 1, GYROSCOPE: 2, MAGNETOMETER: 3, GRAVITY: 4 },
    InterfaceOrientation: { PORTRAIT: 0, LANDSCAPE_LEFT: 1, LANDSCAPE_RIGHT: 2 },
    KeyboardState: { UNKNOWN: 0, IMPOSSIBLE: 1, VERTICAL: 2, HORIZONTAL: 3 },
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    useReducedMotion: () => false,
    reanimatedVersion: '4.1.1',
    setUpTests: NOOP,
    withReanimatedTimer: NOOP,
    advanceAnimationByTime: NOOP,
    advanceAnimationByFrame: NOOP,
    getAnimatedStyle: (style) => style,
    measure: () => ({ x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 }),
    scrollTo: NOOP,
  };
});

// ----------------------------------------------------------------------------
// react-native-mmkv (instantiated at module load by StorageService)
// ----------------------------------------------------------------------------
jest.mock('react-native-mmkv', () => {
  const storage = new Map();
  return {
    __esModule: true,
    MMKV: jest.fn().mockImplementation(() => ({
      get: jest.fn((key) => storage.get(key) ?? null),
      getString: jest.fn((key) => (storage.has(key) ? storage.get(key) : undefined)),
      getNumber: jest.fn((key) => storage.get(key) ?? null),
      getBoolean: jest.fn((key) => storage.get(key) ?? null),
      set: jest.fn((key, value) => storage.set(key, value)),
      delete: jest.fn((key) => storage.delete(key)),
      clearAll: jest.fn(() => storage.clear()),
      contains: jest.fn((key) => storage.has(key)),
      getAllKeys: jest.fn(() => Array.from(storage.keys())),
    })),
  };
});

// ----------------------------------------------------------------------------
// expo-media-library (used by MediaService + usePermission)
// ----------------------------------------------------------------------------
jest.mock('expo-media-library', () => {
  const granted = () =>
    Promise.resolve({
      status: 'granted',
      canAskAgain: true,
      expires: true,
      permissions: { camera: 'granted', mediaLibrary: 'granted' },
    });
  return {
    __esModule: true,
    MediaType: { photo: 'photo', video: 'video', audio: 'audio', usda: 'usda', wallpaper: 'wallpaper' },
    SortBy: {
      id: 'id', album: 'album', uri: 'uri', filename: 'filename',
      width: 'width', height: 'height', size: 'size', mediaType: 'mediaType',
      creationTime: 'creationTime', modificationTime: 'modificationTime',
      duration: 'duration', smartAlbum: 'smartAlbum',
    },
    getPermissionsAsync: jest.fn(granted),
    requestPermissionsAsync: jest.fn(granted),
    requestLegacyPermissionsAsync: jest.fn(granted),
    getAlbumsAsync: jest.fn(() => Promise.resolve([])),
    getAssetsAsync: jest.fn(() =>
      Promise.resolve({ assets: [], endCursor: null, hasNextPage: false })
    ),
    getAlbumAsync: jest.fn(() => Promise.resolve(null)),
    getAssetInfoAsync: jest.fn(() => Promise.resolve(null)),
    deleteAssetsAsync: jest.fn(() => Promise.resolve(true)),
    saveToLibraryAsync: jest.fn(() => Promise.resolve(undefined)),
    createAlbumAsync: jest.fn(() => Promise.resolve(null)),
    addAssetsToAlbumAsync: jest.fn(() => Promise.resolve()),
    removeAssetsFromAlbumAsync: jest.fn(() => Promise.resolve()),
    getCameraPermissionsAsync: jest.fn(granted),
    requestCameraPermissionsAsync: jest.fn(granted),
    getCameraRollAsync: jest.fn(() =>
      Promise.resolve({ assets: [], endCursor: null, hasNextPage: false })
    ),
    getPendingResultAsync: jest.fn(() => Promise.resolve(null)),
  };
});

// ----------------------------------------------------------------------------
// expo-blur, expo-linear-gradient, expo-haptics, expo-image (rendered across
// album/photo surfaces)
// ----------------------------------------------------------------------------
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  const BlurView = ({ children, style }) =>
    React.createElement(View, { style }, children);
  return { __esModule: true, BlurView, BlurViewProps: {} };
});

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Image = (props) =>
    React.createElement(View, { ...props, testID: props.testID ?? 'expo-image' });
  Image.prefetch = jest.fn(() => Promise.resolve(true));
  return { __esModule: true, Image };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, style }) =>
    React.createElement(View, { style }, children);
  return { __esModule: true, LinearGradient };
});

jest.mock('expo-haptics', () => ({
  __esModule: true,
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  impactAsync: jest.fn(() => Promise.resolve()),
  impactAsyncWithNotification: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

// ----------------------------------------------------------------------------
// @shopify/flash-list (FlashList has native rendering that does not work in jest)
// ----------------------------------------------------------------------------
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');

  const renderListChild = (renderItem, item, index, keyExtractor) =>
    React.createElement(View, { key: keyExtractor ? keyExtractor(item, index) : String(index) }, renderItem({ item, index }));

  const FlashList = ({
    data,
    renderItem,
    keyExtractor,
    ListEmptyComponent,
    ListHeaderComponent,
    ListFooterComponent,
  }) => {
    if (!data || data.length === 0) {
      if (ListHeaderComponent) {
        const Header = typeof ListHeaderComponent === 'function' ? ListHeaderComponent : null;
        if (Header) return React.createElement(Header, null);
      }
      if (ListEmptyComponent) {
        const Empty = ListEmptyComponent;
        return React.createElement(Empty, null);
      }
      return React.createElement(View, null);
    }

    const children = [];
    if (ListHeaderComponent) {
      const Header = typeof ListHeaderComponent === 'function' ? ListHeaderComponent : null;
      if (Header) children.push(React.createElement(Header, { key: 'header' }));
    }
    data.forEach((item, index) => {
      children.push(renderListChild(renderItem, item, index, keyExtractor));
    });
    if (ListFooterComponent) {
      const Footer = typeof ListFooterComponent === 'function' ? ListFooterComponent : null;
      if (Footer) children.push(React.createElement(Footer, { key: 'footer' }));
    }
    return React.createElement(View, null, children);
  };

  return { __esModule: true, FlashList, FlatList: FlashList };
});

// ----------------------------------------------------------------------------
// react-native-gesture-handler
// ----------------------------------------------------------------------------
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  // A minimal gesture that supports the builder-chain API used by components.
  // Handler callbacks are recorded on `_handlers` so tests can drive simulated
  // gesture lifecycles (onUpdate/onEnd) directly against real handler logic.
  const createGesture = () => {
    const gesture = {
      _handlers: {},
      onUpdate: (fn) => { gesture._handlers.onUpdate = fn; return gesture; },
      onEnd: (fn) => { gesture._handlers.onEnd = fn; return gesture; },
      onStart: (fn) => { gesture._handlers.onStart = fn; return gesture; },
      onBegin: (fn) => { gesture._handlers.onBegin = fn; return gesture; },
      onFinalize: (fn) => { gesture._handlers.onFinalize = fn; return gesture; },
      onTouchesDown: () => gesture,
      onTouchesMove: () => gesture,
      onTouchesUp: () => gesture,
      onTouchesCancel: () => gesture,
      enabled: () => gesture,
      withMeta: () => gesture,
      c: () => gesture,
    };
    return gesture;
  };

  const Gesture = {
    Pinch: () => createGesture(),
    Pan: () => createGesture(),
    Tap: () => createGesture(),
    LongPress: () => createGesture(),
    Fling: () => createGesture(),
    ForceTouch: () => createGesture(),
    External: () => createGesture(),
    Simultaneous: () => createGesture(),
    Race: () => createGesture(),
    Exclusive: () => createGesture(),
    Explode: () => createGesture(),
  };

  const GestureHandlerRootView = ({ children, style }) =>
    React.createElement(View, { style }, children);
  const GestureDetector = ({ children }) =>
    React.createElement(View, null, children);

  return {
    __esModule: true,
    GestureHandlerRootView,
    GestureDetector,
    Gesture,
    PanGestureHandler: View,
    TapGestureHandler: View,
    LongPressGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    State: { UNDETERMINED: 0, BEGAN: 1, ACTIVE: 2, END: 3, CANCELLED: 4, FAILED: 5 },
    GestureType: {},
    Directions: { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 },
  };
});

// ----------------------------------------------------------------------------
// react-native-safe-area-context
// ----------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const SafeAreaInsetsContext = React.createContext({ top: 0, bottom: 0, left: 0, right: 0 });
  const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, width: 0, height: 0 });
  const SafeAreaProvider = ({ children, ...rest }) =>
    React.createElement(SafeAreaInsetsContext.Provider, { value: { top: 0, bottom: 0, left: 0, right: 0 } },
      React.createElement(SafeAreaFrameContext.Provider, { value: { x: 0, y: 0, width: 0, height: 0 } },
        React.createElement(View, rest, children)));
  const SafeAreaView = ({ children, ...rest }) =>
    React.createElement(View, rest, children);
  const SafeAreaConsumer = SafeAreaInsetsContext.Consumer;
  const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
  const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 0, height: 0 });
  return {
    __esModule: true,
    SafeAreaProvider,
    SafeAreaView,
    SafeAreaConsumer,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    useSafeAreaInsets,
    useSafeAreaFrame,
    initialWindowInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    initialWindowFrame: { x: 0, y: 0, width: 0, height: 0 },
    default: {
      SafeAreaProvider,
      SafeAreaView,
      SafeAreaInsetsContext,
      SafeAreaFrameContext,
      useSafeAreaInsets,
      useSafeAreaFrame,
    },
  };
});

// ----------------------------------------------------------------------------
// react-native-screens (rendered by @react-navigation/stack)
// ----------------------------------------------------------------------------
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = ({ children, ...props }) =>
    React.createElement(View, props, children);
  return {
    __esModule: true,
    enableScreens: jest.fn(() => true),
    enableFreeze: jest.fn(),
    Screen: passthrough,
    ScreenContainer: passthrough,
    ScreenStack: passthrough,
    ScreenStackHeaderConfig: passthrough,
    ScreenStackHeaderSubview: passthrough,
    HeaderConfig: passthrough,
    HeaderBackContext: {},
    addWhitelistedNativeProps: jest.fn(),
    addNativeWrapper: (c) => c,
    getHeaderTitle: (title) => title || '',
    default: { enableScreens: jest.fn(() => true), Screen: passthrough },
  };
});

// ----------------------------------------------------------------------------
// @react-navigation (test doubles)
// @react-navigation/stack drives React Native's native animated card
// transitions, which don't run in the jest renderer. These thin stand-ins keep
// the real App shell, ThemeProvider, screens and hooks in the render path while
// replacing only the navigation primitives.
// ----------------------------------------------------------------------------
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const NavigationContext = React.createContext({
    navigate: jest.fn(),
    dispatch: jest.fn(),
    goBack: jest.fn(),
    canGoBack: () => false,
    isFocused: () => true,
    setParams: jest.fn(),
    getState: () => ({ key: 'root', index: 0, routes: [] }),
    dangerouslyGetState: () => ({ key: 'root', index: 0, routes: [] }),
    addListener: () => ({ remove: () => {} }),
  });
  return {
    __esModule: true,
    NavigationContainer: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    useNavigation: () => React.useContext(NavigationContext),
    useRoute: () => ({ key: 'route-key', name: 'Albums', params: {} }),
    useFocusEffect: () => {},
    useIsFocused: () => true,
    NavigationContext,
    ThemeContext: React.createContext({
      colors: {
        primary: '#007bff',
        background: '#f8f9fa',
        card: '#ffffff',
        text: '#333333',
        border: '#e0e0e0',
        notification: '#007bff',
        destructive: '#dc3545',
      },
      dark: false,
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        bold: { fontFamily: 'System', fontWeight: '700' },
        heavy: { fontFamily: 'System', fontWeight: '800' },
      },
      search: '#000',
    }),
    DefaultTheme: {
      colors: {
        primary: '#007bff',
        background: '#f8f9fa',
        card: '#ffffff',
        text: '#333333',
        border: '#e0e0e0',
        notification: '#007bff',
      },
      dark: false,
      fonts: { regular: {}, medium: {}, bold: {} },
    },
  };
});

jest.mock('@react-navigation/stack', () => {
  const React = require('react');
  const TransitionPresets = {
    ModalSlideFromBottomIOS: { cardStyleInterpolator: () => ({}) },
    ModalTransition: {},
    DefaultSlide: {},
    FlipLargeToSmall: {},
    FadeFromBottomAndroid: {},
    CloseFromRight: {},
    RevealFromBottomAndroid: {},
    FadeInFromBottomAndroid: {},
    FadeInFromLeftAndroid: {},
    FadeInFromRightAndroid: {},
    FadeInFromTopAndroid: {},
    ScaleFromCenter: {},
    ScaleFromBottomIOS: {},
    ScaleFromLeftIOS: {},
    ScaleFromRightIOS: {},
    ScaleFromTopIOS: {},
    SlideFromRightIOS: {},
    HorizontalSwipeEnabled: {},
     VerticalSwipeEnabled: {},
   };
   const CardStyleInterpolators = {
     forNoAnimation: () => ({}),
     forHorizontalIOS: () => ({}),
     forVerticalIOS: () => ({}),
     forModalPresentationIOS: () => ({}),
     forFadeFromBottomAndroid: () => ({}),
     forRevealFromBottomAndroid: () => ({}),
     forScaleFromCenterAndroid: () => ({}),
     forFadeFromRightAndroid: () => ({}),
     forBottomSheetAndroid: () => ({}),
     forFadeFromCenter: () => ({}),
   };
  const Screen = ({ component: Component, options }) => {
    let header = null;
    if (options && typeof options.header === 'function') {
      try {
        header = options.header();
      } catch (e) {
        header = null;
      }
    }
    if (!Component) return header;
    return React.createElement(
      React.Fragment,
      null,
      header,
      React.createElement(Component, null)
    );
  };
  const Navigator = ({ children, initialRouteName }) => {
    const screens = React.Children.toArray(children).filter(
      (c) => c && c.props && typeof c.props.name === 'string'
    );
    const chosen =
      screens.find((c) => c.props.name === initialRouteName) || screens[0];
    return chosen || null;
  };
  return {
    __esModule: true,
    createStackNavigator: () => ({ Navigator, Screen }),
     TransitionPresets,
     CardStyleInterpolators,
   };
});
