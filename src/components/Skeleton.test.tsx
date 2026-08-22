import { renderWithProviders } from '../test-utils';
import Skeleton, { AlbumSkeleton, PhotoGridSkeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders without crashing with default props', () => {
    const { UNSAFE_getByType } = renderWithProviders(<Skeleton />);
    expect(UNSAFE_getByType('View')).toBeTruthy();
  });

  it('applies default width, height, and borderRadius', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<Skeleton />);
    const views = UNSAFE_getAllByType('View');
    const outer = views[0];
    const styleArray = Array.isArray(outer.props.style) ? outer.props.style : [outer.props.style];
    expect(styleArray[0]).toMatchObject(
      expect.objectContaining({ width: '100%', height: 20, borderRadius: 8 })
    );
  });

  it('applies custom width, height, and borderRadius', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <Skeleton width={200} height={100} borderRadius={20} />
    );
    const views = UNSAFE_getAllByType('View');
    const outer = views[0];
    const styleArray = Array.isArray(outer.props.style) ? outer.props.style : [outer.props.style];
    expect(styleArray[0]).toMatchObject(
      expect.objectContaining({ width: 200, height: 100, borderRadius: 20 })
    );
  });

  it('applies custom style', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <Skeleton style={{ marginTop: 10 }} />
    );
    const views = UNSAFE_getAllByType('View');
    const outer = views[0];
    const styleArray = Array.isArray(outer.props.style) ? outer.props.style : [outer.props.style];
    expect(styleArray).toContainEqual(expect.objectContaining({ marginTop: 10 }));
  });

  it('renders AlbumSkeleton with child skeletons', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<AlbumSkeleton />);
    const views = UNSAFE_getAllByType('View');
    expect(views.length).toBeGreaterThan(1);
  });

  it('renders PhotoGridSkeleton with 6 grid items', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<PhotoGridSkeleton />);
    const views = UNSAFE_getAllByType('View');
    expect(views.length).toBeGreaterThan(5);
  });
});
