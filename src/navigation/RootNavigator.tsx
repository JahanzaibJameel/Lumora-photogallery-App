import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import BlurHeader from '../components/BlurHeader';
import { useReducedMotion } from '../hooks/useReducedMotion';
import AlbumsScreen from '../screens/AlbumsScreen';
import PerformanceDashboard from '../screens/PerformanceDashboard';
import PhotoViewer from '../screens/PhotoViewer';
import PhotosScreen from '../screens/PhotosScreen';
import WidgetsScreen from '../screens/WidgetsScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

const noAnimationTransition = {
  transitionSpec: {
    open: { animation: 'timing' as const, config: { duration: 0 } },
    close: { animation: 'timing' as const, config: { duration: 0 } },
  },
  cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
};

export default function RootNavigator() {
  const reduceMotion = useReducedMotion();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Albums"
        screenOptions={{
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTransparent: true,
          headerTitle: '',
          // headerBackTitleVisible removed - not supported in v7
          cardStyle: { backgroundColor: 'transparent' },
          cardOverlayEnabled: true,
          transitionSpec: reduceMotion ? noAnimationTransition.transitionSpec : undefined,
        }}
      >
        <Stack.Screen
          name="Albums"
          component={AlbumsScreen}
          options={{
            header: () => <BlurHeader title="Albums" showSearch showWidgets showPerformance />,
          }}
        />
        <Stack.Screen
          name="Photos"
          component={PhotosScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PhotoViewer"
          component={PhotoViewer}
          options={{
            headerShown: false,
            presentation: 'modal',
            ...(reduceMotion ? noAnimationTransition : TransitionPresets.ModalSlideFromBottomIOS),
          }}
        />
        <Stack.Screen
          name="Widgets"
          component={WidgetsScreen}
          options={{
            header: () => <BlurHeader title="Widgets" showBack />,
          }}
        />
        <Stack.Screen
          name="PerformanceDashboard"
          component={PerformanceDashboard}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}