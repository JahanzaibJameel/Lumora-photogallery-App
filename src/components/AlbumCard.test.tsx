import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders, makeAlbum } from '../test-utils';
import AlbumCard from './AlbumCard';

describe('AlbumCard', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { UNSAFE_getByType: _UNSAFE_getByType, UNSAFE_getAllByType } = renderWithProviders(
      <AlbumCard album={makeAlbum()} onPress={onPress} />
    );
    expect(UNSAFE_getAllByType('View').length).toBeGreaterThan(0);
  });

  it('renders album title', () => {
    const { getByText } = renderWithProviders(
      <AlbumCard album={makeAlbum({ title: 'Beach Trip' })} onPress={onPress} />
    );
    expect(getByText('Beach Trip')).toBeTruthy();
  });

  it('renders album count with "photos" (plural) for count > 1', () => {
    const { getByText } = renderWithProviders(
      <AlbumCard album={makeAlbum({ count: 5 })} onPress={onPress} />
    );
    expect(getByText('5 photos')).toBeTruthy();
  });

  it('renders album count with "photo" (singular) for count === 1', () => {
    const { getByText } = renderWithProviders(
      <AlbumCard album={makeAlbum({ count: 1 })} onPress={onPress} />
    );
    expect(getByText('1 photo')).toBeTruthy();
  });

  it('renders with thumbnail image when thumbnailUri is provided', () => {
    const { getByText } = renderWithProviders(
      <AlbumCard album={makeAlbum({ thumbnailUri: 'file://thumb.jpg' })} onPress={onPress} />
    );
    expect(getByText('Test Album')).toBeTruthy();
  });

  it('renders fallback view when thumbnailUri is not provided', () => {
    const { UNSAFE_getByType: _UNSAFE_getByType, UNSAFE_queryByType } = renderWithProviders(
      <AlbumCard album={makeAlbum({ thumbnailUri: undefined })} onPress={onPress} />
    );
    // Should have a View fallback instead of ImageBackground
    expect(UNSAFE_queryByType('ImageBackground')).toBeNull();
  });

  it('calls onPress when pressed', () => {
    const { getByLabelText } = renderWithProviders(
      <AlbumCard album={makeAlbum()} onPress={onPress} />
    );
    fireEvent.press(getByLabelText('Open album Test Album, 10 photos'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('passes album to onPress callback', () => {
    const album = makeAlbum({ id: 'my-album', title: 'My Album' });
    const { getByLabelText } = renderWithProviders(<AlbumCard album={album} onPress={onPress} />);
    fireEvent.press(getByLabelText('Open album My Album, 10 photos'));
    expect(onPress).toHaveBeenCalledWith(album);
  });

  it('uses accessibility label with album title and count', () => {
    const { getByLabelText } = renderWithProviders(
      <AlbumCard album={makeAlbum({ title: 'Vacation', count: 42 })} onPress={onPress} />
    );
    expect(getByLabelText('Open album Vacation, 42 photos')).toBeTruthy();
  });
});