import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { memo } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

interface BlurHeaderProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  showWidgets?: boolean;
  onSearchChange?: (text: string) => void;
  scrollY?: any;
}

const BlurHeader: React.FC<BlurHeaderProps> = memo(({
  title,
  showBack = false,
  showSearch = false,
  showWidgets = false,
  onSearchChange,
  scrollY,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [searchVisible, setSearchVisible] = React.useState(false);
  const searchText = React.useState('');

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) {
        scrollY.value = event.contentOffset.y;
      }
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      { extrapolateRight: 'clamp' }
    );

    return {
      opacity,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const translateY = interpolate(
      scrollY.value,
      [0, 50],
      [0, -10],
      { extrapolateRight: 'clamp' }
    );

    return {
      transform: [{ translateY }],
    };
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const handleWidgets = () => {
    navigation.navigate('Widgets');
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
  };

  const blurIntensity = Platform.OS === 'ios' ? 30 : 80;
  const tint = isDark ? 'dark' : 'light';

  return (
    <View style={styles.container}>
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={styles.blurView}
      >
        <Animated.View
          style={[
            { backgroundColor: colors.overlay + '10' },
            headerStyle,
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.leftSection}>
              {showBack && (
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              )}

              <Animated.View style={[contentStyle, styles.titleContainer]}>
                {searchVisible ? (
                  <TextInput
                    placeholder="Search photos..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchText[0]}
                    onChangeText={(text) => {
                      searchText[1](text);
                      onSearchChange?.(text);
                    }}
                    autoFocus
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                  />
                ) : (
                  <Text
                    numberOfLines={1}
                    style={[styles.title, { color: colors.textPrimary }]}
                  >
                    {title}
                  </Text>
                )}
              </Animated.View>

              {showSearch && (
                <TouchableOpacity
                  onPress={toggleSearch}
                  style={styles.iconButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={searchVisible ? 'close' : 'search'}
                    size={22}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              )}

              {showWidgets && (
                <TouchableOpacity
                  onPress={handleWidgets}
                  style={styles.iconButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="grid-outline"
                    size={22}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </BlurView>
    </View>
  );
});

BlurHeader.displayName = 'BlurHeader';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: 40,
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
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 8,
    flex: 1,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default BlurHeader;
