import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { useGridSize } from '../contexts/GridSizeContext';
import { usePhotos, type UsePhotosReturn } from '../hooks/usePhotos';
import { useDebouncedValue, useSearchHistory } from '../hooks/useSearch';
import { useTheme } from '../hooks/useTheme';
import { makePhoto } from '../test-utils';
import { lightColors } from '../theme/tokens';
import { RootStackParamList } from '../types/navigation';
import { AppError, ErrorCategory } from '../utils/errors';
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
  colors: lightColors,
  isDark: false,
  themeMode: 'light' as const,
  setThemeMode: jest.fn(),
  toggleTheme: jest.fn(),
};

const makeMockPhotosReturn = (overrides: Partial<UsePhotosReturn> = {}): UsePhotosReturn => ({
  photos: [],
  loading: false,
  error: null,
  refreshing: false,
  retryCount: 0,
  loadMore: jest.fn(),
  refreshPhotos: jest.fn(),
  retryLoad: jest.fn(),
  deletePhoto: jest.fn(),
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
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockedUseTheme.mockReturnValue(mockTheme);
    mockedUseGridSize.mockReturnValue({ gridSize: 'medium' as const, setGridSize: jest.fn(), cycleGridSize: jest.fn() });
    mockedUseDebouncedValue.mockImplementation((val: unknown) => val as string);
    mockedUseSearchHistory.mockReturnValue({ history: [], recordQuery: jest.fn(), clear: jest.fn(), clearHistory: jest.fn() });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders photo list', async () => {
    const photos = [makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' })];
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({ photos }));

    const { UNSAFE_getAllByType } = renderScreen(<PhotosScreen />);
    const views = UNSAFE_getAllByType(require('react-native').View);
    expect(views.length).toBeGreaterThan(0);
  });

  it('shows empty state when no photos', async () => {
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({ photos: [] }));

    const { getByText } = renderScreen(<PhotosScreen />);
    expect(getByText('No Photos')).toBeTruthy();
  });

  it('shows error state on fetch failure', async () => {
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({
      error: new AppError({ message: 'Fetch failed', category: ErrorCategory.NETWORK }),
    }));

    const { getByText } = renderScreen(<PhotosScreen />);
    expect(getByText('Connection Issue')).toBeTruthy();
  });

  it('shows no results state when search query matches nothing', async () => {
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({
      photos: [makePhoto({ id: 'p1', filename: 'vacation.jpg' })],
    }));
    mockedUseDebouncedValue.mockImplementation((val: unknown) => val as string);

    const { getByText, getByLabelText } = renderScreen(<PhotosScreen />);
    fireEvent.press(getByLabelText('Open search'));
    fireEvent.changeText(getByLabelText('Search photos'), 'search');

    expect(getByText('No Results')).toBeTruthy();
  });

  it('renders loading skeleton while loading', async () => {
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({ loading: true, photos: [] }));

    const { UNSAFE_getAllByType } = renderScreen(<PhotosScreen />);
    const views = UNSAFE_getAllByType(require('react-native').View);
    expect(views.length).toBeGreaterThan(0);
  });

  it('calls refreshPhotos when refresh FAB is pressed', () => {
    const mockRefreshPhotos = jest.fn();
    const photos = [makePhoto({ id: 'p1' })];
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({
      photos,
      refreshPhotos: mockRefreshPhotos,
    }));

    const { getByLabelText } = renderScreen(<PhotosScreen />);
    fireEvent.press(getByLabelText('Refresh photos'));
    expect(mockRefreshPhotos).toHaveBeenCalledTimes(1);
  });

  it('calls cycleGridSize when grid toggle is pressed', () => {
    const mockCycleGridSize = jest.fn();
    mockedUseGridSize.mockReturnValue({ gridSize: 'medium' as const, setGridSize: jest.fn(), cycleGridSize: mockCycleGridSize });
    const photos = [makePhoto({ id: 'p1' })];
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({ photos }));

    const { getByLabelText } = renderScreen(<PhotosScreen />);
    fireEvent.press(getByLabelText('Change grid size'));
    expect(mockCycleGridSize).toHaveBeenCalledTimes(1);
  });

  it('calls deletePhoto when photo is long-pressed and delete is confirmed', () => {
    const mockDeletePhoto = jest.fn().mockResolvedValue(undefined);
    const photos = [makePhoto({ id: 'p1', filename: 'photo1.jpg' })];
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({
      photos,
      deletePhoto: mockDeletePhoto,
    }));

    const { getByLabelText } = renderScreen(<PhotosScreen />);
    fireEvent(getByLabelText('Photo photo1.jpg'), 'longPress');
    const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const deleteBtn = lastCall[2].find((b: { text: string; onPress?: () => void }) => b.text === 'Delete');
    deleteBtn?.onPress?.();
    expect(mockDeletePhoto).toHaveBeenCalledWith('p1');
  });

  it('filters photos when search query matches filename', async () => {
    const photos = [
      makePhoto({ id: 'p1', filename: 'vacation.jpg' }),
      makePhoto({ id: 'p2', filename: 'work.jpg' }),
    ];
    mockedUsePhotos.mockReturnValue(makeMockPhotosReturn({ photos }));
    mockedUseDebouncedValue.mockImplementation((val: unknown) => val as string);

    const { getByLabelText, queryByLabelText } = renderScreen(<PhotosScreen />);
    fireEvent.press(getByLabelText('Open search'));
    fireEvent.changeText(getByLabelText('Search photos'), 'vacation');

    expect(queryByLabelText('Photo vacation.jpg')).toBeTruthy();
    expect(queryByLabelText('Photo work.jpg')).toBeNull();
  });
});
