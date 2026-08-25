import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import React, { memo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import AnimatedReanimated, {
    interpolate,
    useAnimatedStyle,
    SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList } from '../types/navigation';
import { IconButton } from './primitives/IconButton';
import { SearchBar } from './primitives/SearchBar';
import { Text } from './primitives/Text';

interface BlurHeaderProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  showWidgets?: boolean;
  onSearchChange?: (text: string) => void;
  scrollY?: SharedValue<number>;
}

const BlurHeader: React.FC<BlurHeaderProps> = memo(
  ({
    title,
    showBack = false,
    showSearch = false,
    showWidgets = false,
    onSearchChange,
    scrollY,
  }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { isDark } = useTheme();
    const reduceMotion = useReducedMotion();
    const insets = useSafeAreaInsets();
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    const headerStyle = useAnimatedStyle(() => {
      if (!scrollY || reduceMotion) {
        return { opacity: reduceMotion ? 1 : 0 };
      }
      const opacity = interpolate(
        scrollY.value,
        [0, 50],
        [0, 1],
        { extrapolateRight: 'clamp' }
      );
      return { opacity };
    });

    const contentStyle = useAnimatedStyle(() => {
      if (!scrollY || reduceMotion) return {};
      const translateY = interpolate(
        scrollY.value,
        [0, 50],
        [0, -10],
        { extrapolateRight: 'clamp' }
      );
      return { transform: [{ translateY }] };
    });

    const handleBack = () => navigation.goBack();
    const handleWidgets = () => navigation.navigate('Widgets');
    const toggleSearch = () => {
      setSearchVisible((v) => !v);
      if (searchVisible) {
        setSearchText('');
        onSearchChange?.('');
      }
    };

    const blurIntensity = Platform.OS === 'ios' ? 30 : 80;
    const tint = isDark ? 'dark' : 'light';

    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]} accessibilityRole="header" accessibilityLabel={title}>
        <BlurView intensity={blurIntensity} tint={tint} style={styles.blurView}>
          <AnimatedReanimated.View
            style={[
              {
                backgroundColor: isDark
                  ? 'rgba(28,28,30,0.85)'
                  : 'rgba(248,249,250,0.85)',
              },
              headerStyle,
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.leftSection}>
                {showBack && (
                  <IconButton
                    name="chevron-back"
                    size={24}
                    accessibilityLabel="Go back"
                    accessibilityHint="Returns to the previous screen"
                    onPress={handleBack}
                  />
                )}

                <AnimatedReanimated.View style={[contentStyle, styles.titleContainer]}>
                  {searchVisible ? (
                    <SearchBar
                      value={searchText}
                      onChangeText={(text) => {
                        setSearchText(text);
                        onSearchChange?.(text);
                      }}
                      accessibilityLabel="Search photos"
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <Text variant="h3" numberOfLines={1} style={styles.title}>
                      {title}
                    </Text>
                  )}
                </AnimatedReanimated.View>

                {showSearch && (
                  <IconButton
                    name={searchVisible ? 'close' : 'search'}
                    size={22}
                    accessibilityLabel={searchVisible ? 'Close search' : 'Open search'}
                    accessibilityHint={searchVisible ? 'Hides the search bar' : 'Shows the search bar'}
                    onPress={toggleSearch}
                  />
                )}

                {showWidgets && (
                  <IconButton
                    name="grid-outline"
                    size={22}
                    accessibilityLabel="Open widgets"
                    accessibilityHint="Opens the widgets configuration screen"
                    onPress={handleWidgets}
                  />
                )}
              </View>
            </View>
          </AnimatedReanimated.View>
        </BlurView>
      </View>
    );
  }
);

BlurHeader.displayName = 'BlurHeader';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  blurView: {
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    flexShrink: 1,
  },
});

export default BlurHeader;
