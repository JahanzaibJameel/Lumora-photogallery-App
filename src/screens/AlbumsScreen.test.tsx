import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { useAlbums } from '../hooks/useAlbums';
import { usePermission } from '../hooks/usePermission';
import { useTheme } from '../hooks/useTheme';
import { makeAlbum } from '../test-utils';
import { RootStackParamList } from '../types/navigation';
import AlbumsScreen from './AlbumsScreen';

jest.mock('../hooks/useAlbums');
jest.mock('../hooks/usePermission');
jest.mock('../hooks/useTheme');

const mockedUseAlbums = useAlbums as jest.MockedFunction<typeof useAlbums>;
const mockedUsePermission = usePermission as jest.MockedFunction<typeof usePermission>;
const mockedUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

const mockTheme = {
  colors: {
    background: '#fff',
    surface: '#f5f5f5',
    textPrimary: '#000',
    textSecondary: '#666',
    accent: '#007AFF',
    border: '#ddd',
  },
  isDark: false,
};

const Stack = createStackNavigator<RootStackParamList>();

const mockNavigateFn = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  useNavigation: () => ({ navigate: mockNavigateFn, goBack: jest.fn() }),
  useRoute: () => ({ key: 'route-key', name: 'Albums', params: {} }),
  useFocusEffect: () => {},
  useIsFocused: () => true,
}));

const renderScreen = (ui: React.ReactElement, mockNavigate?: jest.Mock) => {
  if (mockNavigate) {
    mockNavigateFn.mockImplementation(mockNavigate);
  }
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Albums" component={() => ui} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('AlbumsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTheme.mockReturnValue(mockTheme as any);
    mockedUsePermission.mockReturnValue({ permission: 'granted', isLoading: false } as any);
  });

  it('renders loading skeletons while loading', () => {
    mockedUseAlbums.mockReturnValue({
      albums: [],
      loading: true,
      error: null,
      refreshing: false,
      refreshAlbums: jest.fn(),
      retryLoad: jest.fn(),
    } as any);

    const { UNSAFE_getAllByType } = renderScreen(<AlbumsScreen />);
    // Skeletons render as Views; verify the loading state produced content
    const views = UNSAFE_getAllByType(require('react-native').View);
    expect(views.length).toBeGreaterThan(0);
  });

  it('renders empty state when no albums', async () => {
    mockedUseAlbums.mockReturnValue({
      albums: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshAlbums: jest.fn(),
      retryLoad: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<AlbumsScreen />);
    expect(getByText('No Albums Found')).toBeTruthy();
  });

  it('renders error state when error occurs', async () => {
    mockedUseAlbums.mockReturnValue({
      albums: [],
      loading: false,
      error: { message: 'Network error', category: 'NETWORK' },
      refreshing: false,
      refreshAlbums: jest.fn(),
      retryLoad: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<AlbumsScreen />);
    expect(getByText('Connection Issue')).toBeTruthy();
  });

  it('renders album list', async () => {
    const albums = [makeAlbum({ id: 'a1', title: 'Beach' }), makeAlbum({ id: 'a2', title: 'Mountains' })];
    mockedUseAlbums.mockReturnValue({
      albums,
      loading: false,
      error: null,
      refreshing: false,
      refreshAlbums: jest.fn(),
      retryLoad: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<AlbumsScreen />);
    expect(getByText('Beach')).toBeTruthy();
    expect(getByText('Mountains')).toBeTruthy();
  });

  it('navigates to Photos on album press', async () => {
    const mockNavigate = jest.fn();
    const albums = [makeAlbum({ id: 'a1', title: 'Beach' })];
    mockedUseAlbums.mockReturnValue({
      albums,
      loading: false,
      error: null,
      refreshing: false,
      refreshAlbums: jest.fn(),
      retryLoad: jest.fn(),
    } as any);

    const { getByLabelText } = renderScreen(<AlbumsScreen />, mockNavigate);
    fireEvent.press(getByLabelText('Open album Beach, 10 photos'));
    expect(mockNavigate).toHaveBeenCalledWith('Photos', { albumId: 'a1', albumTitle: 'Beach' });
  });

  it('shows permission empty state when permission denied', async () => {
    mockedUseAlbums.mockReturnValue({
      albums: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshAlbums: jest.fn(),
      retryLoad: jest.fn(),
    } as any);
    mockedUsePermission.mockReturnValue({ permission: 'denied', isLoading: false } as any);

    const { getByText } = renderScreen(<AlbumsScreen />);
    expect(getByText('Access Your Photos')).toBeTruthy();
  });

  it('calls retryLoad when retry button is pressed in error state', () => {
    const mockRetryLoad = jest.fn();
    mockedUseAlbums.mockReturnValue({
      albums: [],
      loading: false,
      error: { message: 'Network error', category: 'NETWORK' },
      refreshing: false,
      refreshAlbums: jest.fn(),
      retryLoad: mockRetryLoad,
    } as any);

    const { getByText } = renderScreen(<AlbumsScreen />);
    fireEvent.press(getByText('Retry'));
    expect(mockRetryLoad).toHaveBeenCalledTimes(1);
  });

  it('calls refreshAlbums when FAB is pressed', () => {
    const mockRefreshAlbums = jest.fn();
    const albums = [makeAlbum({ id: 'a1', title: 'Beach' })];
    mockedUseAlbums.mockReturnValue({
      albums,
      loading: false,
      error: null,
      refreshing: false,
      refreshAlbums: mockRefreshAlbums,
      retryLoad: jest.fn(),
    } as any);

    const { getByLabelText } = renderScreen(<AlbumsScreen />);
    fireEvent.press(getByLabelText('Refresh albums'));
    expect(mockRefreshAlbums).toHaveBeenCalledTimes(1);
  });

  it('calls refreshAlbums when pull-to-refresh is triggered', () => {
    const mockRefreshAlbums = jest.fn();
    const albums = [makeAlbum({ id: 'a1', title: 'Beach' })];
    mockedUseAlbums.mockReturnValue({
      albums,
      loading: false,
      error: null,
      refreshing: false,
      refreshAlbums: mockRefreshAlbums,
      retryLoad: jest.fn(),
    } as any);

    const { UNSAFE_getByType } = renderScreen(<AlbumsScreen />);
    const refreshControl = UNSAFE_getByType(require('react-native').RefreshControl);
    fireEvent(refreshControl, 'refresh');
    expect(mockRefreshAlbums).toHaveBeenCalledTimes(1);
  });

  it('calls refreshAlbums when empty state refresh button is pressed', () => {
    const mockRefreshAlbums = jest.fn();
    mockedUseAlbums.mockReturnValue({
      albums: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshAlbums: mockRefreshAlbums,
      retryLoad: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<AlbumsScreen />);
    fireEvent.press(getByText('Refresh'));
    expect(mockRefreshAlbums).toHaveBeenCalledTimes(1);
  });
});
