import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { usePhotos } from '../hooks/usePhotos';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { makePhoto } from '../test-utils';
import PhotoViewer from './PhotoViewer';

const mockGoBack = jest.fn();

let mockRouteParams: { photoId: string; albumId: string; initialIndex?: number } = {
  photoId: 'p2',
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

jest.mock('../hooks/usePhotos');
jest.mock('../hooks/useReducedMotion');

const mockedUsePhotos = usePhotos as jest.MockedFunction<typeof usePhotos>;
const mockedUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

const mockPhotosReturn = (photos: ReturnType<typeof makePhoto>[]) =>
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

describe('PhotoViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseReducedMotion.mockReturnValue(false);
    mockRouteParams = { photoId: 'p2', albumId: 'album-1', initialIndex: 1 };
  });

  it('renders the photo at the initial index with position info', () => {
    mockPhotosReturn([makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' }), makePhoto({ id: 'p3' })]);

    const { getByLabelText, getByText } = render(<PhotoViewer />);

    expect(getByLabelText('Photo 2 of 3')).toBeTruthy();
    expect(getByText('2 / 3')).toBeTruthy();
  });

  it('hides the previous arrow on the first photo and shows the next arrow', () => {
    mockRouteParams = { photoId: 'p1', albumId: 'album-1', initialIndex: 0 };
    mockPhotosReturn([makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' })]);

    const { queryByLabelText, getByLabelText } = render(<PhotoViewer />);

    expect(queryByLabelText('Previous photo')).toBeNull();
    expect(getByLabelText('Next photo')).toBeTruthy();
  });

  it('advances to the next photo when the next arrow is pressed', () => {
    mockPhotosReturn([makePhoto({ id: 'p1' }), makePhoto({ id: 'p2' }), makePhoto({ id: 'p3' })]);

    const { getByLabelText, queryByLabelText, getByText } = render(<PhotoViewer />);

    fireEvent.press(getByLabelText('Next photo'));

    expect(getByText('3 / 3')).toBeTruthy();
    expect(queryByLabelText('Next photo')).toBeNull();
    expect(getByLabelText('Previous photo')).toBeTruthy();
  });

  it('goes back when the close button is pressed', () => {
    mockPhotosReturn([makePhoto({ id: 'p1' })]);

    const { getByLabelText } = render(<PhotoViewer />);

    fireEvent.press(getByLabelText('Close viewer'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('renders an empty container when the album has no photos', () => {
    mockPhotosReturn([]);

    const { queryByLabelText, UNSAFE_getAllByType } = render(<PhotoViewer />);
    const views = UNSAFE_getAllByType(require('react-native').View);

    expect(views.length).toBeGreaterThan(0);
    expect(queryByLabelText(/Photo \d+ of \d+/)).toBeNull();
    expect(queryByLabelText('Close viewer')).toBeNull();
    expect(queryByLabelText('Next photo')).toBeNull();
  });
});
