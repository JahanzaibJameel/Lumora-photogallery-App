import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import BlurHeader from '../components/BlurHeader';
import AlbumsScreen from '../screens/AlbumsScreen';
import PhotosScreen from '../screens/PhotosScreen';
import PhotoViewer from '../screens/PhotoViewer';
import WidgetsScreen from '../screens/WidgetsScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
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
        }}
      >
        <Stack.Screen
          name="Albums"
          component={AlbumsScreen}
          options={{
            header: () => <BlurHeader title="Albums" showSearch showWidgets />,
          }}
        />
        <Stack.Screen
          name="Photos"
          component={PhotosScreen}
          options={({ route }) => ({
            header: () => <BlurHeader title={route.params.albumTitle} showBack />,
          })}
        />
        <Stack.Screen
          name="PhotoViewer"
          component={PhotoViewer}
          options={{
            headerShown: false,
            presentation: 'modal',
            // animationEnabled removed - use TransitionPresets instead
            ...TransitionPresets.ModalSlideFromBottomIOS,
          }}
        />
        <Stack.Screen
          name="Widgets"
          component={WidgetsScreen}
          options={{
            header: () => <BlurHeader title="Widgets" showBack />,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}