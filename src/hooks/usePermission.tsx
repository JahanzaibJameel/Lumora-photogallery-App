import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { errorReporter } from '../utils/errorReporting';
import { AppError, categorizeError } from '../utils/errors';

type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

interface PermissionState {
  permission: PermissionStatus;
  isLoading: boolean;
  error: AppError | null;
}

export const usePermission = () => {
  const [state, setState] = useState<PermissionState>({
    permission: 'undetermined',
    isLoading: true,
    error: null,
  });

  const checkPermission = useCallback(async () => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

      if (status === 'granted') {
        setState(s => ({ ...s, permission: 'granted' }));
      } else if (!canAskAgain) {
        setState(s => ({ ...s, permission: 'blocked' }));
      } else {
        setState(s => ({ ...s, permission: 'undetermined' }));
      }
    } catch (error) {
      const appError = categorizeError(error);
      appError.context = { action: 'checkPermission' };
      errorReporter.capture(appError, { hook: 'usePermission' });

      setState(s => ({
        ...s,
        permission: 'denied',
        error: appError,
      }));
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

      if (status === 'granted') {
        setState(s => ({ ...s, permission: 'granted' }));
      } else if (!canAskAgain) {
        setState(s => ({ ...s, permission: 'blocked' }));
      } else {
        setState(s => ({ ...s, permission: 'denied' }));
      }
    } catch (error) {
      const appError = categorizeError(error);
      appError.context = { action: 'requestPermission' };
      errorReporter.capture(appError, { hook: 'usePermission' });

      setState(s => ({
        ...s,
        permission: 'denied',
        error: appError,
      }));
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      const appError = categorizeError(error);
      appError.context = { action: 'openSettings' };
      errorReporter.capture(appError, { hook: 'usePermission' });

      Alert.alert('Error', 'Unable to open settings');
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    });

    return () => subscription.remove();
  }, [checkPermission]);

  return {
    permission: state.permission,
    isLoading: state.isLoading,
    error: state.error,
    requestPermission,
    checkPermission,
    openSettings,
  };
};
