import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, EmitterSubscription, NativeModules } from 'react-native';
import { StorageKeys, storageService } from './storage.service';

interface ScreenshotEvent {
  timestamp: number;
  screen: string;
  photoId?: string;
}

interface ScreenshotConfig {
  enabled: boolean;
  notifyOnScreenshot: boolean;
  sensitivePhotoIds: string[];
  screenshotHistory: ScreenshotEvent[];
}

const DEFAULT_CONFIG: ScreenshotConfig = {
  enabled: true,
  notifyOnScreenshot: true,
  sensitivePhotoIds: [],
  screenshotHistory: [],
};

// Native module for screenshot detection (iOS/Android)
const { ScreenshotDetector } = NativeModules;

export const ScreenshotService = {
  /**
   * Get screenshot configuration
   */
  getConfig(): ScreenshotConfig {
    return storageService.get<ScreenshotConfig>(StorageKeys.SCREENSHOT_CONFIG) || DEFAULT_CONFIG;
  },

  /**
   * Save screenshot configuration
   */
  saveConfig(config: Partial<ScreenshotConfig>): void {
    const current = this.getConfig();
    storageService.set(StorageKeys.SCREENSHOT_CONFIG, { ...current, ...config });
  },

  /**
   * Mark a photo as sensitive (will trigger alert if screenshotted)
   */
  markAsSensitive(photoId: string): void {
    const config = this.getConfig();
    if (!config.sensitivePhotoIds.includes(photoId)) {
      config.sensitivePhotoIds.push(photoId);
      this.saveConfig({ sensitivePhotoIds: config.sensitivePhotoIds });
    }
  },

  /**
   * Unmark a photo as sensitive
   */
  unmarkAsSensitive(photoId: string): void {
    const config = this.getConfig();
    config.sensitivePhotoIds = config.sensitivePhotoIds.filter(id => id !== photoId);
    this.saveConfig({ sensitivePhotoIds: config.sensitivePhotoIds });
  },

  /**
   * Check if photo is marked as sensitive
   */
  isSensitive(photoId: string): boolean {
    return this.getConfig().sensitivePhotoIds.includes(photoId);
  },

  /**
   * Log a screenshot event
   */
  logScreenshot(screen: string, photoId?: string): void {
    const config = this.getConfig();
    const event: ScreenshotEvent = {
      timestamp: Date.now(),
      screen,
      photoId,
    };
    
    config.screenshotHistory.unshift(event);
    // Keep only last 100 events
    if (config.screenshotHistory.length > 100) {
      config.screenshotHistory = config.screenshotHistory.slice(0, 100);
    }
    
    this.saveConfig({ screenshotHistory: config.screenshotHistory });
  },

  /**
   * Get screenshot history
   */
  getHistory(): ScreenshotEvent[] {
    return this.getConfig().screenshotHistory;
  },

  /**
   * Clear screenshot history
   */
  clearHistory(): void {
    this.saveConfig({ screenshotHistory: [] });
  },

  /**
   * Enable screenshot detection
   */
  enable(): void {
    this.saveConfig({ enabled: true });
  },

  /**
   * Disable screenshot detection
   */
  disable(): void {
    this.saveConfig({ enabled: false });
  },
};

/**
 * React Hook for screenshot detection
 */
export const useScreenshotDetection = (
  screenName: string,
  onScreenshot?: (event: ScreenshotEvent) => void,
  currentPhotoId?: string
) => {
  const appState = useRef(AppState.currentState);
  const subscriptionRef = useRef<EmitterSubscription | null>(null);

  useEffect(() => {
    const config = ScreenshotService.getConfig();
    if (!config.enabled) return;

    // iOS: Use UIApplicationUserDidTakeScreenshotNotification
    // Android: Use ContentObserver on MediaStore
    const handleScreenshot = () => {
      const event: ScreenshotEvent = {
        timestamp: Date.now(),
        screen: screenName,
        photoId: currentPhotoId,
      };

      ScreenshotService.logScreenshot(screenName, currentPhotoId);
      
      // Check if current photo is sensitive
      if (currentPhotoId && ScreenshotService.isSensitive(currentPhotoId)) {
        // Trigger sensitive content alert
        console.warn('Screenshot detected of sensitive content!');
      }

      onScreenshot?.(event);
    };

    // Subscribe to screenshot events
    if (ScreenshotDetector && ScreenshotDetector.addListener) {
      subscriptionRef.current = ScreenshotDetector.addListener('ScreenshotTaken', handleScreenshot);
    }

    // Alternative: Monitor app state changes (screenshot causes brief backgrounding on iOS)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current === 'active' &&
        nextAppState === 'inactive'
      ) {
        // Potential screenshot - iOS pauses app briefly
        setTimeout(() => {
          if (AppState.currentState === 'active') {
            handleScreenshot();
          }
        }, 500);
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscriptionRef.current?.remove();
      appStateSubscription.remove();
    };
  }, [screenName, onScreenshot, currentPhotoId]);
};

export default ScreenshotService;
