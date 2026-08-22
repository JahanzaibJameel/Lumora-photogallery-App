import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface SearchBarProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
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
    style,
    ...rest
  } = props;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style as StyleProp<ViewStyle>,
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
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
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
});

export default SearchBar;
