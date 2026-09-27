import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState, useCallback } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  FlatList,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export interface SearchBarProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  searchHistory?: string[];
  onSelectHistory?: (query: string) => void;
  onClearHistory?: () => void;
  showHistory?: boolean;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>((props, ref) => {
  const { colors } = useTheme();
  const {
    value,
    onChangeText,
    placeholder = 'Search photos...',
    onClear,
    accessibilityLabel = 'Search photos',
    accessibilityHint = 'Type to search photos',
    searchHistory = [],
    onSelectHistory,
    onClearHistory,
    showHistory = false,
    style,
    ...rest
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const shouldShowDropdown = isFocused && dropdownVisible && showHistory && searchHistory.length > 0 && value.length === 0;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (searchHistory.length > 0 && value.length === 0) {
      setDropdownVisible(true);
    }
  }, [searchHistory.length, value.length]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay to allow taps on dropdown items
    setTimeout(() => setDropdownVisible(false), 150);
  }, []);

  const handleSelectHistory = useCallback((query: string) => {
    onSelectHistory?.(query);
    onChangeText(query);
    setDropdownVisible(false);
  }, [onSelectHistory, onChangeText]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    if (text.length > 0) {
      setDropdownVisible(false);
    } else if (isFocused && searchHistory.length > 0) {
      setDropdownVisible(true);
    }
  }, [onChangeText, isFocused, searchHistory.length]);

  const handleClearAll = useCallback(() => {
    onClearHistory?.();
    setDropdownVisible(false);
  }, [onClearHistory]);

  return (
    <View style={[styles.wrapper, style as StyleProp<ViewStyle>]}>
      <View
        style={[
          styles.container,
          { 
            backgroundColor: colors.surface, 
            borderColor: isFocused ? colors.accent : colors.border,
            borderWidth: isFocused ? 2 : 1,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          accessibilityRole="text"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityLiveRegion="polite"
          style={[styles.input, { color: colors.textPrimary }]}
          returnKeyType="search"
          {...rest}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              onClear?.();
              if (isFocused && searchHistory.length > 0) {
                setDropdownVisible(true);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            accessibilityHint="Removes the current search text"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {shouldShowDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.textPrimary,
            },
          ]}
          accessibilityRole="list"
          accessibilityLabel="Recent searches"
        >
          <View style={styles.dropdownHeader}>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              Recent Searches
            </Text>
            {onClearHistory && (
              <TouchableOpacity
                onPress={handleClearAll}
                accessibilityRole="button"
                accessibilityLabel="Clear search history"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="caption" style={{ color: colors.accent }}>
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyItem}
                onPress={() => handleSelectHistory(item)}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${item}`}
              >
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text
                  variant="body"
                  numberOfLines={1}
                  style={[styles.historyText, { color: colors.textPrimary }]}
                >
                  {item}
                </Text>
                <Ionicons name="arrow-up-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    maxHeight: 240,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyText: {
    flex: 1,
  },
});

export default SearchBar;
