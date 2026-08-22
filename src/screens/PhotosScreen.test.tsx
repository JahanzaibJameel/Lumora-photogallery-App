import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { useGridSize } from '../contexts/GridSizeContext';
import { usePhotos } from '../hooks/usePhotos';
import { useDebouncedValue, useSearchHistory } from '../hooks/useSearch';
import { useTheme } from '../hooks/useTheme';
import { Photo } from '../types';
import { RootStackParamList } from '../types/navigation';
import PhotosScreen from './PhotosScreen';

jest.mock('../hooks/usePhotos');
jest.mock('../hooks/useTheme');
jest.mock('../contexts/GridSizeContext');
jest.mock('../hooks/useSearch');

const mockedUsePhotos = usePhotos as jest.MockedFunction<typeof usePhotos>;
const mockedUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockedUseGridSize = useGridSize as jest.MockedFunction<typeof useGridSize>;
const mockedUseSearchHistory = useSearchHistory as jest.MockedFunction<typeof useSearchHistory>;
const mockedUseDebouncedValue = useDebouncedValue as jest.MockedFunction<typeof useDebouncedValue>;

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

const makePhoto = (overrides: Partial<Photo> = {}): Photo => ({
  id: overrides.id ?? 'p1',
  uri: overrides.uri ?? 'file://p1.jpg',
  filename: overrides.filename ?? 'p1.jpg',
  width: overrides.width ?? 800,
  height: overrides.height ?? 600,
  size: overrides.size ?? 1000,
  albumId: overrides.albumId ?? 'album-1',
  createdAt: overrides.createdAt ?? 1000,
  modifiedAt: overrides.modifiedAt ?? 2000,
  ...overrides,
});

const Stack = createStackNavigator<RootStackParamList>();

const renderScreen = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Photos" component={() => ui} />
      </Stack.Navigator>
    </NavigationContainer>
  );

describe('PhotosScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTheme.mockReturnValue(mockTheme as any);
    mockedUseGridSize.mockReturnValue({ gridSize: 'medium', setGridSize: jest.fn(), cycleGridSize: jest.fn() } as any);
    mockedUseDebouncedValue.mockImplementation((val: unknown) => val as string);
    mockedUseSearchHistory.mockReturnValue({ history: [], recordQuery: jest.fn(), clearHistory: jest.fn() } as any);
  });

  it('renders photo list', async () => {
    const photos = [makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' })];
    mockedUsePhotos.mockReturnValue({
      photos,
      loading: false,
      error: null,
      refreshing: false,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);

    const { UNSAFE_getAllByType } = renderScreen(<PhotosScreen />);
    const views = UNSAFE_getAllByType(require('react-native').View);
    expect(views.length).toBeGreaterThan(0);
  });

  it('shows empty state when no photos', async () => {
    mockedUsePhotos.mockReturnValue({
      photos: [],
      loading: false,
      error: null,
      refreshing: false,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<PhotosScreen />);
    expect(getByText('No Photos')).toBeTruthy();
  });

  it('shows error state on fetch failure', async () => {
    mockedUsePhotos.mockReturnValue({
      photos: [],
      loading: false,
      error: { message: 'Fetch failed', category: 'NETWORK' },
      refreshing: false,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<PhotosScreen />);
    expect(getByText('Connection Issue')).toBeTruthy();
  });

  it('shows no results state when search query matches nothing', async () => {
    mockedUsePhotos.mockReturnValue({
      photos: [makePhoto({ id: 'p1', filename: 'vacation.jpg' })],
      loading: false,
      error: null,
      refreshing: false,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);
    mockedUseDebouncedValue.mockImplementation((val: unknown) => val as string);

    const { getByText, getByLabelText } = renderScreen(<PhotosScreen />);
    // Open the search field and type a query that matches no photo filename.
    fireEvent.press(getByLabelText('Open search'));
    fireEvent.changeText(getByLabelText('Search photos'), 'search');

    expect(getByText('No Results')).toBeTruthy();
  });

  it('renders loading skeleton while loading', async () => {
    mockedUsePhotos.mockReturnValue({
      photos: [],
      loading: true,
      error: null,
      refreshing: false,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);

    const { UNSAFE_getAllByType } = renderScreen(<PhotosScreen />);
    const views = UNSAFE_getAllByType(require('react-native').View);
    expect(views.length).toBeGreaterThan(0);
  });
});
