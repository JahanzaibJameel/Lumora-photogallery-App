import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../components/primitives/IconButton';
import { Text } from '../components/primitives/Text';
import { usePerformanceMonitoring } from '../hooks/performance';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList } from '../types/navigation';
import { AggregatedMetrics, PerformanceConfig, PerformanceStats } from '../types/performance';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface MetricCardProps {
  title: string;
  stats: PerformanceStats | null;
  unit: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, stats, unit }) => {
  const { colors } = useTheme();

  if (!stats || stats.count === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text variant="label" color="secondary">{title}</Text>
        <Text variant="caption" color="secondary">No data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text variant="label" color="secondary">{title}</Text>
      <Text variant="h3" style={styles.value}>
        {stats.avg.toFixed(1)}{unit}
      </Text>
      <View style={styles.row}>
        <Text variant="caption" color="secondary">
          min: {stats.min.toFixed(1)}{unit}
        </Text>
        <Text variant="caption" color="secondary">
          p95: {stats.p95.toFixed(1)}{unit}
        </Text>
        <Text variant="caption" color="secondary">
          max: {stats.max.toFixed(1)}{unit}
        </Text>
      </View>
      <Text variant="caption" color="secondary">
        n={stats.count}
      </Text>
    </View>
  );
};

const CacheHitRateCard: React.FC<{ rates: Record<string, number> }> = ({ rates }) => {
  const { colors } = useTheme();
  const entries = Object.entries(rates);

  if (entries.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text variant="label" color="secondary">Cache Hit Rates</Text>
        <Text variant="caption" color="secondary">No data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text variant="label" color="secondary">Cache Hit Rates</Text>
      {entries.map(([type, rate]) => (
        <View key={type} style={styles.row}>
          <Text variant="caption" color="secondary">{type}</Text>
          <Text variant="caption" color="secondary">
            {(rate * 100).toFixed(1)}%
          </Text>
        </View>
      ))}
    </View>
  );
};

const ConfigToggle: React.FC<{
  label: string;
  value: boolean;
  onToggle: () => void;
}> = ({ label, value, onToggle }) => {

  return (
    <View style={styles.configRow}>
      <Text variant="label" color="secondary">{label}</Text>
      <Text
        variant="body"
        color={value ? 'success' : 'error'}
        onPress={onToggle}
        style={styles.configToggle}
      >
        {value ? 'ON' : 'OFF'}
      </Text>
    </View>
  );
};

const PerformanceDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const perfService = usePerformanceMonitoring();

  const [config, setConfig] = useState<PerformanceConfig | null>(null);
  const [aggregated, setAggregated] = useState<AggregatedMetrics | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(() => {
    if (!perfService) return;

    setConfig(perfService.getConfig());
    setAggregated(perfService.getAggregatedMetrics('hour'));
  }, [perfService]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData, refreshKey]);

  const handleBack = () => navigation.goBack();

  const handleClearMetrics = async () => {
    if (!perfService) return;
    await perfService.clearMetrics();
    setRefreshKey((k) => k + 1);
  };

  const handleToggleConfig = (key: keyof PerformanceConfig) => {
    if (!perfService || !config) return;
    const newConfig = { ...config, [key]: !config[key] };
    perfService.updateConfig(newConfig);
    setConfig(newConfig);
  };

  const handleRefresh = () => {
    loadData();
    setRefreshKey((k) => k + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerContent}>
          <IconButton
            name="chevron-back"
            size={24}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
            onPress={handleBack}
          />
          <Text variant="h3" numberOfLines={1} style={styles.title}>
            Performance
          </Text>
          <IconButton
            name="refresh"
            size={22}
            accessibilityLabel="Refresh metrics"
            onPress={handleRefresh}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {config && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text variant="title" style={styles.sectionTitle}>Configuration</Text>
            <ConfigToggle
              label="Performance Monitoring"
              value={config.enabled}
              onToggle={() => handleToggleConfig('enabled')}
            />
            <ConfigToggle
              label="Track API Calls"
              value={config.trackApiCalls}
              onToggle={() => handleToggleConfig('trackApiCalls')}
            />
            <ConfigToggle
              label="Track Navigation"
              value={config.trackNavigation}
              onToggle={() => handleToggleConfig('trackNavigation')}
            />
            <ConfigToggle
              label="Track Images"
              value={config.trackImages}
              onToggle={() => handleToggleConfig('trackImages')}
            />
            <ConfigToggle
              label="Track List Renders"
              value={config.trackListRenders}
              onToggle={() => handleToggleConfig('trackListRenders')}
            />
            <ConfigToggle
              label="Track Memory"
              value={config.trackMemory}
              onToggle={() => handleToggleConfig('trackMemory')}
            />
            <ConfigToggle
              label="Track Cache Hit Rates"
              value={config.trackCacheHitRates}
              onToggle={() => handleToggleConfig('trackCacheHitRates')}
            />
          </View>
        )}

        {aggregated && (
          <>
            <Text variant="title" style={styles.sectionTitle}>
              Navigation (last hour)
            </Text>
            {Object.entries(aggregated.navigation).map(([name, stats]) => (
              <MetricCard
                key={name}
                title={name}
                stats={stats}
                unit="ms"
              />
            ))}
            {Object.keys(aggregated.navigation).length === 0 && (
              <Text variant="caption" color="secondary" style={styles.emptyText}>
                No navigation data yet
              </Text>
            )}

            <Text variant="title" style={styles.sectionTitle}>
              API Calls (last hour)
            </Text>
            {Object.entries(aggregated.apiCalls).map(([name, stats]) => (
              <MetricCard
                key={name}
                title={name}
                stats={stats}
                unit="ms"
              />
            ))}
            {Object.keys(aggregated.apiCalls).length === 0 && (
              <Text variant="caption" color="secondary" style={styles.emptyText}>
                No API call data yet
              </Text>
            )}

            <Text variant="title" style={styles.sectionTitle}>
              Image Loads (last hour)
            </Text>
            <MetricCard
              title="Image Load Time"
              stats={aggregated.imageLoads.count > 0 ? aggregated.imageLoads : null}
              unit="ms"
            />

            <Text variant="title" style={styles.sectionTitle}>
              List Renders (last hour)
            </Text>
            {Object.entries(aggregated.listRenders).map(([name, stats]) => (
              <MetricCard
                key={name}
                title={name}
                stats={stats}
                unit="ms"
              />
            ))}
            {Object.keys(aggregated.listRenders).length === 0 && (
              <Text variant="caption" color="secondary" style={styles.emptyText}>
                No list render data yet
              </Text>
            )}

            <Text variant="title" style={styles.sectionTitle}>
              Memory (last hour)
            </Text>
            <MetricCard
              title="JS Heap Usage"
              stats={aggregated.memory.count > 0 ? aggregated.memory : null}
              unit="MB"
            />

            <Text variant="title" style={styles.sectionTitle}>
              Cache Performance
            </Text>
            <CacheHitRateCard rates={aggregated.cacheHitRates} />
          </>
        )}

        <Text
          variant="body"
          color="error"
          onPress={handleClearMetrics}
          style={styles.clearButton}
        >
          Clear All Metrics
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  value: {
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  configToggle: {
    fontWeight: '600',
  },
  emptyText: {
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  clearButton: {
    textAlign: 'center',
    paddingVertical: 16,
    marginTop: 16,
    fontWeight: '600',
  },
});

export default PerformanceDashboard;
