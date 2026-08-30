import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { usePermission } from '../hooks/usePermission';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius } from '../theme/tokens';
import { AppError } from '../utils/errors';
import { Text } from './primitives/Text';

interface EmptyStateProps {
  type?: 'permission' | 'empty' | 'error' | 'no-internet';
  title?: string;
  message?: string | AppError;
  onAction?: () => void;
}

interface EmptyStateConfig {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  onPress?: () => void;
}

const EmptyStateShell = memo(({ config }: { config: EmptyStateConfig }) => {
  const { colors } = useTheme();

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}
        >
          <Ionicons
            name={config.icon as keyof typeof Ionicons.glyphMap}
            size={48}
            color={colors.accent}
          />
        </View>

        <Text
          variant="h3"
          color="primary"
          style={styles.title}
          numberOfLines={2}
        >
          {config.title}
        </Text>

        <Text
          variant="body"
          color="secondary"
          style={styles.message}
          numberOfLines={4}
        >
          {config.message}
        </Text>

        {config.onPress && config.actionText && (
          <TouchableOpacity
            onPress={config.onPress}
            style={[styles.button, { backgroundColor: colors.accent }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={config.actionText}
            accessibilityHint="Performs the suggested action"
          >
            <Text variant="title" color="onSurface" style={styles.buttonText}>
              {config.actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

EmptyStateShell.displayName = 'EmptyStateShell';

const buildConfig = (
  type: 'empty' | 'error' | 'no-internet',
  title: string | undefined,
  message: string | AppError | undefined,
  onAction: (() => void) | undefined,
): EmptyStateConfig => {
  const errorMessage = typeof message === 'string' ? message : message?.message;

  switch (type) {
    case 'error':
      return {
        icon: 'warning-outline',
        title: title || 'Something went wrong',
        message: errorMessage || 'Please try again later.',
        actionText: 'Retry',
        onPress: () => {
          Vibration.vibrate(50);
          onAction?.();
        },
      };

    case 'no-internet':
      return {
        icon: 'cloud-offline-outline',
        title: 'No Internet Connection',
        message: 'Please check your connection and try again.',
        actionText: 'Retry',
        onPress: () => {
          Vibration.vibrate(50);
          onAction?.();
        },
      };

    default:
      return {
        icon: 'images-outline',
        title: title || 'No Photos Found',
        message: errorMessage || 'Start by adding some photos to your gallery.',
        actionText: 'Refresh',
        onPress: () => {
          Vibration.vibrate(50);
          onAction?.();
        },
      };
  }
};

// Isolated component so that non-permission empty states never subscribe to
// permission state (previously every EmptyState called usePermission on mount).
const PermissionEmptyState = memo(() => {
  const { permission, requestPermission, openSettings } = usePermission();

  const config: EmptyStateConfig =
    permission === 'blocked'
      ? {
          icon: 'settings-outline',
          title: 'Permission Required',
          message: 'Please enable photo access in settings to continue.',
          actionText: 'Open Settings',
          onPress: () => {
            Vibration.vibrate(50);
            openSettings();
          },
        }
      : {
          icon: 'images-outline',
          title: 'Access Your Photos',
          message: 'Grant photo access to organize and view your albums.',
          actionText: 'Allow Access',
          onPress: () => {
            Vibration.vibrate(50);
            requestPermission();
          },
        };

  return <EmptyStateShell config={config} />;
});

PermissionEmptyState.displayName = 'PermissionEmptyState';

const EmptyState: React.FC<EmptyStateProps> = memo(({
  type = 'empty',
  title,
  message,
  onAction,
}) => {
  if (type === 'permission') {
    return <PermissionEmptyState />;
  }

  return <EmptyStateShell config={buildConfig(type, title, message, onAction)} />;
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default EmptyState;
