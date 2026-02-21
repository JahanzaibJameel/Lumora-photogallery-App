import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { usePermission } from '../hooks/usePermission';
import { useTheme } from '../hooks/useTheme';

interface EmptyStateProps {
  type?: 'permission' | 'empty' | 'error' | 'no-internet';
  title?: string;
  message?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = memo(({
  type = 'empty',
  title,
  message,
  onAction,
}) => {
  const { colors } = useTheme();
  const { permission, requestPermission, openSettings } = usePermission();

  const getConfig = () => {
    switch (type) {
      case 'permission':
        if (permission === 'blocked') {
          return {
            icon: 'settings-outline',
            title: 'Permission Required',
            message: 'Please enable photo access in settings to continue.',
            actionText: 'Open Settings',
            onPress: () => {
              Vibration.vibrate(50);
              openSettings();
            },
          };
        }
        return {
          icon: 'images-outline',
          title: 'Access Your Photos',
          message: 'Grant photo access to organize and view your albums.',
          actionText: 'Allow Access',
          onPress: () => {
            Vibration.vibrate(50);
            requestPermission();
          },
        };

      case 'error':
        return {
          icon: 'warning-outline',
          title: title || 'Something went wrong',
          message: message || 'Please try again later.',
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
          message: message || 'Start by adding some photos to your gallery.',
          actionText: 'Refresh',
          onPress: () => {
            Vibration.vibrate(50);
            onAction?.();
          },
        };
    }
  };

  const config = getConfig();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}
        >
          <Ionicons
            name={config.icon as any}
            size={48}
            color={colors.accent}
          />
        </View>

        <Text
          style={[styles.title, { color: colors.textPrimary }]}
        >
          {config.title}
        </Text>

        <Text
          style={[styles.message, { color: colors.textSecondary }]}
        >
          {config.message}
        </Text>

        {config.onPress && (
          <TouchableOpacity
            onPress={config.onPress}
            style={[styles.button, { backgroundColor: colors.accent }]}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {config.actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default EmptyState;
