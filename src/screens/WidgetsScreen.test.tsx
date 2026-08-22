import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { useWidgets } from '../hooks/useWidgets';
import { RootStackParamList } from '../types/navigation';
import WidgetsScreen from './WidgetsScreen';

jest.mock('../hooks/useWidgets');
jest.mock('../hooks/useTheme');
jest.mock('../hooks/useReducedMotion');

const mockedUseWidgets = useWidgets as jest.MockedFunction<typeof useWidgets>;
const mockedUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockedUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

type WidgetConfig = import('../services/widget.service').WidgetConfig;
type WidgetData = import('../services/widget.service').WidgetData;

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

const makeWidget = (overrides: Partial<WidgetConfig> = {}): WidgetConfig => ({
  id: overrides.id ?? 'daily_memory',
  type: overrides.type ?? 'daily_memory',
  size: overrides.size ?? 'medium',
  albumId: overrides.albumId,
  title: overrides.title ?? 'Daily Memory',
  enabled: overrides.enabled ?? true,
});

const makeWidgetData = (overrides: Partial<WidgetData> = {}): WidgetData => ({
  type: overrides.type ?? 'daily_memory',
  photos: overrides.photos ?? [],
  title: overrides.title ?? 'Test Widget',
  subtitle: overrides.subtitle ?? 'subtitle',
  updatedAt: overrides.updatedAt ?? Date.now(),
});

const Stack = createStackNavigator<RootStackParamList>();

const renderScreen = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Widgets" component={() => ui} />
      </Stack.Navigator>
    </NavigationContainer>
  );

describe('WidgetsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTheme.mockReturnValue(mockTheme as any);
    mockedUseReducedMotion.mockReturnValue(false);
  });

  it('renders loading state', () => {
    mockedUseWidgets.mockReturnValue({
      widgets: [],
      widgetData: {},
      loading: true,
      refreshWidget: jest.fn(),
      refreshAllWidgets: jest.fn(),
      toggleWidget: jest.fn(),
      updateWidgetConfig: jest.fn(),
      addWidget: jest.fn(),
      removeWidget: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<WidgetsScreen />);
    expect(getByText('Widgets')).toBeTruthy();
  });

  it('renders widget list', async () => {
    const widgets = [makeWidget({ id: 'daily_memory', title: 'Daily Memory' })];
    mockedUseWidgets.mockReturnValue({
      widgets,
      widgetData: {
        daily_memory: makeWidgetData({ type: 'daily_memory', photos: [{ id: 'p1', uri: 'file://p1.jpg', date: 1000 }] }),
      },
      loading: false,
      refreshWidget: jest.fn(),
      refreshAllWidgets: jest.fn(),
      toggleWidget: jest.fn(),
      updateWidgetConfig: jest.fn(),
      addWidget: jest.fn(),
      removeWidget: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<WidgetsScreen />);
    expect(getByText('Daily Memory')).toBeTruthy();
    expect(getByText('Shows photos from this day in previous years')).toBeTruthy();
  });

  it('toggles widget enabled state', async () => {
    const toggleWidget = jest.fn();
    const widgets = [makeWidget({ id: 'daily_memory', enabled: true })];
    mockedUseWidgets.mockReturnValue({
      widgets,
      widgetData: {},
      loading: false,
      refreshWidget: jest.fn(),
      refreshAllWidgets: jest.fn(),
      toggleWidget,
      updateWidgetConfig: jest.fn(),
      addWidget: jest.fn(),
      removeWidget: jest.fn(),
    } as any);

    const { getByLabelText } = renderScreen(<WidgetsScreen />);
    const toggle = getByLabelText('Daily Memory widget switch');
    fireEvent(toggle, 'valueChange', false);
    expect(toggleWidget).toHaveBeenCalledWith('daily_memory');
  });

  it('shows widget preview when enabled and has data', async () => {
    const widgets = [makeWidget({ id: 'daily_memory', enabled: true })];
    mockedUseWidgets.mockReturnValue({
      widgets,
      widgetData: {
        daily_memory: makeWidgetData({ type: 'daily_memory', photos: [{ id: 'p1', uri: 'file://p1.jpg', date: 1000 }] }),
      },
      loading: false,
      refreshWidget: jest.fn(),
      refreshAllWidgets: jest.fn(),
      toggleWidget: jest.fn(),
      updateWidgetConfig: jest.fn(),
      addWidget: jest.fn(),
      removeWidget: jest.fn(),
    } as any);

    const { getByText } = renderScreen(<WidgetsScreen />);
    expect(getByText(/Last updated:/)).toBeTruthy();
  });

  it('refreshes all widgets on button press', async () => {
    const refreshAllWidgets = jest.fn();
    mockedUseWidgets.mockReturnValue({
      widgets: [makeWidget()],
      widgetData: {},
      loading: false,
      refreshWidget: jest.fn(),
      refreshAllWidgets,
      toggleWidget: jest.fn(),
      updateWidgetConfig: jest.fn(),
      addWidget: jest.fn(),
      removeWidget: jest.fn(),
    } as any);

    const { getByLabelText } = renderScreen(<WidgetsScreen />);
    fireEvent.press(getByLabelText('Refresh all widgets'));
    expect(refreshAllWidgets).toHaveBeenCalled();
  });
});
