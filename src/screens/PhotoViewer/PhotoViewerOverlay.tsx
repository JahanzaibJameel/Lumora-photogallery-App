import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../theme/tokens';

interface BackButtonProps {
  onPress: () => void;
  backOpacity: Animated.SharedValue<number>;
  visible: boolean;
  top?: number;
}

export const BackButton = ({ onPress, backOpacity, visible, top = 40 }: BackButtonProps) => {
  const { colors } = useTheme();
  const animatedStyle = useAnimatedStyle(() => ({ opacity: backOpacity.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { top }, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.button, { backgroundColor: colors.overlay }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Close viewer"
        accessibilityHint="Returns to the album screen"
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

interface NavArrowProps {
  onPress: () => void;
  backOpacity: Animated.SharedValue<number>;
  direction: 'left' | 'right';
  visible: boolean;
}

export const NavArrow = ({ onPress, backOpacity, direction, visible }: NavArrowProps) => {
  const { colors } = useTheme();
  const animatedStyle = useAnimatedStyle(() => ({ opacity: backOpacity.value }));

  if (!visible) return null;

  const iconName = direction === 'left' ? 'chevron-back' : 'chevron-forward';

  return (
    <Animated.View
      style={[
        styles.container,
        direction === 'left' ? styles.left : styles.right,
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[styles.button, { backgroundColor: colors.overlay }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="adjustable"
        accessibilityLabel={direction === 'left' ? 'Previous photo' : 'Next photo'}
        accessibilityHint={direction === 'left' ? 'Swipes to the previous photo' : 'Swipes to the next photo'}
      >
        <Ionicons name={iconName} size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

interface PhotoInfoBadgeProps {
  currentIndex: number;
  total: number;
  backOpacity: Animated.SharedValue<number>;
}

export const PhotoInfoBadge = ({ currentIndex, total, backOpacity }: PhotoInfoBadgeProps) => {
  const animatedStyle = useAnimatedStyle(() => ({ opacity: backOpacity.value }));

  return (
    <Animated.View style={[styles.infoContainer, animatedStyle]}>
      <Animated.View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Animated.Text style={[styles.infoText, { color: 'white' }]}>
          {currentIndex + 1} / {total}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 50,
  },
  left: {
    left: 16,
    top: '50%',
    zIndex: 50,
    marginTop: -20,
  },
  right: {
    right: 16,
    top: '50%',
    zIndex: 50,
    marginTop: -20,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  infoText: {
    ...typography.body,
    color: 'white',
  },
});
