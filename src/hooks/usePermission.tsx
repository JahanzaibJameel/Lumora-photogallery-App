import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

export const usePermission = () => {
  const [permission, setPermission] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      
      if (status === 'granted') {
        setPermission('granted');
      } else if (!canAskAgain) {
        setPermission('blocked');
      } else {
        setPermission('denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermission('denied');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      
      if (status === 'granted') {
        setPermission('granted');
      } else if (!canAskAgain) {
        setPermission('blocked');
      } else {
        setPermission('undetermined');
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      setPermission('denied');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert('Error', 'Unable to open settings');
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permission,
    isLoading,
    requestPermission,
    checkPermission,
    openSettings,
  };
};