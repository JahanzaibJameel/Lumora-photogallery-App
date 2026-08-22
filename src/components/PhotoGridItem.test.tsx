import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from '../test-utils';
import { Photo } from '../types';
import PhotoGridItem from './PhotoGridItem';

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Image = (props: Record<string, unknown>) =>
    React.createElement(View, { ...props, testID: 'expo-image' });
  return { Image };
});

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

describe('PhotoGridItem', () => {
  const photo = makePhoto();
  const onPress = jest.fn();
  const _onLongPress = jest.fn();
  const noop = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <PhotoGridItem photo={photo} index={0} onPress={noop} />
    );
    expect(UNSAFE_getAllByType('View').length).toBeGreaterThan(0);
  });

  it('calls onPress when pressed', () => {
    const { getByLabelText } = renderWithProviders(
      <PhotoGridItem photo={photo} index={0} onPress={onPress} />
    );
    fireEvent.press(getByLabelText('Photo p1.jpg'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress with photo and index arguments', () => {
    const { getByLabelText } = renderWithProviders(
      <PhotoGridItem photo={photo} index={2} onPress={onPress} />
    );
    fireEvent.press(getByLabelText('Photo p1.jpg'));
    expect(onPress).toHaveBeenCalledWith(photo, 2);
  });

  it('does not set onLongPress when not provided', () => {
    const { getByLabelText } = renderWithProviders(
      <PhotoGridItem photo={photo} index={0} onPress={noop} />
    );
    const button = getByLabelText('Photo p1.jpg');
    expect(button.props.onLongPress).toBeUndefined();
  });

  it('memo prevents re-render when photo id and size are unchanged', () => {
    const { rerender, UNSAFE_getByType } = renderWithProviders(
      <PhotoGridItem photo={photo} index={0} onPress={noop} />
    );
    const tree1 = UNSAFE_getByType('View');
    rerender(
      <PhotoGridItem photo={{ ...photo, filename: 'changed.jpg' }} index={0} onPress={noop} />
    );
    // Same instance due to memo (photo.id is same, gridSize is same)
    const tree2 = UNSAFE_getByType('View');
    expect(tree1).toBe(tree2);
  });
});
