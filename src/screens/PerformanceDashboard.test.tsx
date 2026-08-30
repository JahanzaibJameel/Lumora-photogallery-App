import { renderWithProviders } from '../test-utils';
import PerformanceDashboard from './PerformanceDashboard';

const mockUsePerformanceMonitoring = jest.fn();
jest.mock('../hooks/performance', () => ({
  usePerformanceMonitoring: () => mockUsePerformanceMonitoring(),
}));

const mockUseTheme = jest.fn();
jest.mock('../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
}));

const mockNavigation = { goBack: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({
      colors: { background: '#fff', surface: '#f5f5f5', textPrimary: '#000', textSecondary: '#666', accent: '#007AFF' },
    });
  });

  it('renders without perf service', () => {
    mockUsePerformanceMonitoring.mockReturnValue(null);
    const { getByText } = renderWithProviders(<PerformanceDashboard />);
    expect(getByText('Performance')).toBeTruthy();
  });

  it('renders with perf service and config', () => {
    mockUsePerformanceMonitoring.mockReturnValue({
      getConfig: () => ({
        enabled: true,
        sampleRate: 1.0,
        maxStoredMetrics: 10000,
        aggregationIntervalMs: 300000,
        flushIntervalMs: 30000,
        trackMemory: true,
        trackImages: true,
        trackApiCalls: true,
        trackNavigation: true,
        trackListRenders: true,
        trackCacheHitRates: true,
      }),
      getAggregatedMetrics: () => null,
    });
    const { getByText } = renderWithProviders(<PerformanceDashboard />);
    expect(getByText('Performance')).toBeTruthy();
    expect(getByText('Configuration')).toBeTruthy();
  });

  it('renders aggregated metrics when available', () => {
    mockUsePerformanceMonitoring.mockReturnValue({
      getConfig: () => ({
        enabled: true,
        sampleRate: 1.0,
        maxStoredMetrics: 10000,
        aggregationIntervalMs: 300000,
        flushIntervalMs: 30000,
        trackMemory: true,
        trackImages: true,
        trackApiCalls: true,
        trackNavigation: true,
        trackListRenders: true,
        trackCacheHitRates: true,
      }),
      getAggregatedMetrics: () => ({
        period: 'hour',
        startTime: 0,
        endTime: 1000,
        navigation: {},
        apiCalls: {},
        imageLoads: { avg: 0, min: 0, max: 0, p50: 0, p90: 0, p95: 0, p99: 0, count: 0 },
        listRenders: {},
        memory: { avg: 0, min: 0, max: 0, p50: 0, p90: 0, p95: 0, p99: 0, count: 0 },
        cacheHitRates: {},
      }),
    });
    const { getByText } = renderWithProviders(<PerformanceDashboard />);
    expect(getByText('Navigation (last hour)')).toBeTruthy();
    expect(getByText('API Calls (last hour)')).toBeTruthy();
  });
});
