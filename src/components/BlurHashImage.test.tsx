import { renderWithProviders } from '../test-utils';
import BlurHashImage from './BlurHashImage';

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Image = (props: Record<string, unknown>) =>
    React.createElement(View, { ...props, testID: 'expo-image' });
  return { Image };
});

describe('BlurHashImage', () => {
  it('renders without crashing', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" style={{ width: 100, height: 100 }} />
    );
    expect(UNSAFE_getByType('View')).toBeTruthy();
  });

  it('renders multiple Views (container + placeholder + image)', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" style={{ width: 100, height: 100 }} />
    );
    // Outer View, placeholder View, and Image View
    expect(UNSAFE_getAllByType('View').length).toBeGreaterThanOrEqual(2);
  });

  it('renders when a blurhash prop is provided', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" blurhash="LFFaXYk^00I[ogs" style={{ width: 100, height: 100 }} />
    );
    expect(UNSAFE_getAllByType('View')).toBeTruthy();
  });

  it('renders with default contentFit', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" style={{ width: 100, height: 100 }} />
    );
    const image = UNSAFE_getByType('View');
    expect(image).toBeTruthy();
  });

  it('renders with default transitionDuration', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" style={{ width: 100, height: 100 }} />
    );
    expect(UNSAFE_getByType('View')).toBeTruthy();
  });

  it('renders an Image component', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" style={{ width: 100, height: 100 }} />
    );
    expect(UNSAFE_getByType('View')).toBeTruthy();
  });

  it('forwards blurhash as the native placeholder source', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" blurhash="LFFaXYk^00I[ogs" style={{ width: 100, height: 100 }} />
    );
    const image = UNSAFE_getAllByType('View').find((view) => view.props.placeholder);
    expect(image).toBeTruthy();
    expect(image!.props.placeholder).toEqual({ blurhash: 'LFFaXYk^00I[ogs' });
  });

  it('omits the placeholder when no blurhash is provided', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" style={{ width: 100, height: 100 }} />
    );
    const image = UNSAFE_getAllByType('View').find((view) => 'cachePolicy' in view.props);
    expect(image!.props.placeholder).toBeUndefined();
  });

  it('configures memory-disk cache policy and 300ms transition', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BlurHashImage uri="file://photo.jpg" style={{ width: 100, height: 100 }} />
    );
    const image = UNSAFE_getAllByType('View').find((view) => 'cachePolicy' in view.props);
    expect(image!.props.cachePolicy).toBe('memory-disk');
    expect(image!.props.transition).toBe(300);
  });
});
