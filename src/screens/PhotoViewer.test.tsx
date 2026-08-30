import { render, fireEvent } from '@testing-library/react-native';
import { Image } from 'expo-image';
import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { usePhotos } from '../hooks/usePhotos';
import { makePhoto } from '../test-utils';
import PhotoViewer from './PhotoViewer';

const mockGoBack = jest.fn();

let mockRouteParams: { albumId: string; initialIndex?: number } = {
  albumId: 'album-1',
  initialIndex: 1,
};

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NavigationContainer: ({ children }: any) => {
    const React = require('react');
    return React.createElement(React.Fragment, null, children);
  },
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: mockGoBack,
    dispatch: jest.fn(),
    canGoBack: () => true,
  }),
  useRoute: () => ({ key: 'route-key', name: 'PhotoViewer', params: mockRouteParams }),
  useIsFocused: () => true,
}));

jest.mock('../hooks/useReducedMotion');
jest.mock('../hooks/usePhotos');

const mockedUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;
const mockedUsePhotos = usePhotos as jest.MockedFunction<typeof usePhotos>;

describe('PhotoViewer', () => {
  const mockPhotos = [makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' }), makePhoto({ id: 'p3' })];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseReducedMotion.mockReturnValue(false);
    mockedUsePhotos.mockReturnValue({
      photos: mockPhotos,
      loading: false,
      error: null,
      refreshing: false,
      retryCount: 0,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);
    mockRouteParams = {
      albumId: 'album-1',
      initialIndex: 1,
    };
  });

  it('renders the photo at the initial index with position info', () => {
    const { getByLabelText, getByText } = render(<PhotoViewer />);

    expect(getByLabelText('Photo 2 of 3')).toBeTruthy();
    expect(getByText('2 / 3')).toBeTruthy();
  });

  it('hides the previous arrow on the first photo and shows the next arrow', () => {
    mockRouteParams = {
      albumId: 'album-1',
      initialIndex: 0,
    };

    const { queryByLabelText, getByLabelText } = render(<PhotoViewer />);

    expect(queryByLabelText('Previous photo')).toBeNull();
    expect(getByLabelText('Next photo')).toBeTruthy();
  });

  it('advances to the next photo when the next arrow is pressed', () => {
    const { getByLabelText, queryByLabelText, getByText } = render(<PhotoViewer />);

    fireEvent.press(getByLabelText('Next photo'));

    expect(getByText('3 / 3')).toBeTruthy();
    expect(queryByLabelText('Next photo')).toBeNull();
    expect(getByLabelText('Previous photo')).toBeTruthy();
  });

  it('goes back when the close button is pressed', () => {
    mockRouteParams = {
      albumId: 'album-1',
      initialIndex: 0,
    };

    const { getByLabelText } = render(<PhotoViewer />);

    fireEvent.press(getByLabelText('Close viewer'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('renders an empty container when the album has no photos', () => {
    mockedUsePhotos.mockReturnValue({
      photos: [],
      loading: false,
      error: null,
      refreshing: false,
      retryCount: 0,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);

    const { queryByLabelText, UNSAFE_getAllByType } = render(<PhotoViewer />);
    const views = UNSAFE_getAllByType(require('react-native').View);

    expect(views.length).toBeGreaterThan(0);
    expect(queryByLabelText(/Photo \d+ of \d+/)).toBeNull();
    expect(queryByLabelText('Close viewer')).toBeNull();
    expect(queryByLabelText('Next photo')).toBeNull();
  });

  it('prefetches both neighbouring photos so swipes resolve from cache', () => {
    const prefetch = Image.prefetch as jest.Mock;
    const photos = [makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' }), makePhoto({ id: 'p3' })];
    mockedUsePhotos.mockReturnValue({
      photos,
      loading: false,
      error: null,
      refreshing: false,
      retryCount: 0,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);
    mockRouteParams = {
      albumId: 'album-1',
      initialIndex: 1,
    };

    render(<PhotoViewer />);

    expect(prefetch).toHaveBeenCalledWith([photos[0].uri, photos[2].uri]);
  });

  it('prefetches only the existing neighbour at the edge of the album', () => {
    const prefetch = Image.prefetch as jest.Mock;
    const photos = [makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' })];
    mockedUsePhotos.mockReturnValue({
      photos,
      loading: false,
      error: null,
      refreshing: false,
      retryCount: 0,
      loadMore: jest.fn(),
      refreshPhotos: jest.fn(),
      retryLoad: jest.fn(),
      deletePhoto: jest.fn(),
    } as any);
    mockRouteParams = {
      albumId: 'album-1',
      initialIndex: 0,
    };

    render(<PhotoViewer />);

    expect(prefetch).toHaveBeenCalledWith([photos[1].uri]);
  });
});
