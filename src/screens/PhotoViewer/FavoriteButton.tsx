import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius } from '../../theme/tokens';

interface FavoriteButtonProps {
  onPress: () => void;
  isFavorite: boolean;
  backOpacity: Animated.SharedValue<number>;
  visible: boolean;
  top?: number;
}

export const FavoriteButton = ({
  onPress,
  isFavorite,
  backOpacity,
  visible,
  top = 40,
}: FavoriteButtonProps) => {
  const { colors } = useTheme();
  const animatedStyle = useAnimatedStyle(() => ({ opacity: backOpacity.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { top, right: 16 }, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.button, { backgroundColor: colors.overlay }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        accessibilityHint={
          isFavorite
            ? 'Removes this photo from your favorites'
            : 'Adds this photo to your favorites'
        }
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorite ? '#ff4444' : 'white'}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 50,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
