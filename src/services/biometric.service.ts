import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { StorageKeys, storageService } from './storage.service';

export interface BiometricConfig {
  enabled: boolean;
  hiddenAlbums: string[];
  lastAuthenticated: number | null;
  authTimeout: number; // minutes
}

const DEFAULT_CONFIG: BiometricConfig = {
  enabled: false,
  hiddenAlbums: [],
  lastAuthenticated: null,
  authTimeout: 5, // 5 minutes
};

export const BiometricService = {
  /**
   * Check if biometric authentication is available on device
   */
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  /**
   * Get supported authentication types
   */
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  /**
   * Get biometric configuration
   */
  getConfig(): BiometricConfig {
    return storageService.get<BiometricConfig>(StorageKeys.BIOMETRIC_CONFIG) || DEFAULT_CONFIG;
  },

  /**
   * Save biometric configuration
   */
  saveConfig(config: Partial<BiometricConfig>): void {
    const current = this.getConfig();
    storageService.set(StorageKeys.BIOMETRIC_CONFIG, { ...current, ...config });
  },

  /**
   * Authenticate user with biometrics
   */
  async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to access hidden albums',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        this.saveConfig({ lastAuthenticated: Date.now() });
      }

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  },

  /**
   * Check if user is currently authenticated (within timeout)
   */
  isAuthenticated(): boolean {
    const config = this.getConfig();
    if (!config.enabled) return true;
    if (!config.lastAuthenticated) return false;

    const timeoutMs = config.authTimeout * 60 * 1000;
    const elapsed = Date.now() - config.lastAuthenticated;

    return elapsed < timeoutMs;
  },

  /**
   * Require authentication - prompts if not authenticated
   */
  async requireAuthentication(promptMessage?: string): Promise<boolean> {
    const config = this.getConfig();
    
    if (!config.enabled) return true;
    if (this.isAuthenticated()) return true;

    return this.authenticate(promptMessage);
  },

  /**
   * Hide an album (requires authentication to view)
   */
  hideAlbum(albumId: string): void {
    const config = this.getConfig();
    if (!config.hiddenAlbums.includes(albumId)) {
      config.hiddenAlbums.push(albumId);
      this.saveConfig({ hiddenAlbums: config.hiddenAlbums });
    }
  },

  /**
   * Unhide an album
   */
  unhideAlbum(albumId: string): void {
    const config = this.getConfig();
    config.hiddenAlbums = config.hiddenAlbums.filter(id => id !== albumId);
    this.saveConfig({ hiddenAlbums: config.hiddenAlbums });
  },

  /**
   * Check if album is hidden
   */
  isAlbumHidden(albumId: string): boolean {
    const config = this.getConfig();
    return config.hiddenAlbums.includes(albumId);
  },

  /**
   * Get all hidden albums
   */
  getHiddenAlbums(): string[] {
    return this.getConfig().hiddenAlbums;
  },

  /**
   * Enable biometric protection
   */
  async enableBiometrics(): Promise<boolean> {
    const available = await this.isAvailable();
    if (!available) return false;

    const authenticated = await this.authenticate('Enable biometric protection for hidden albums');
    if (authenticated) {
      this.saveConfig({ enabled: true });
    }
    return authenticated;
  },

  /**
   * Disable biometric protection
   */
  async disableBiometrics(): Promise<boolean> {
    const authenticated = await this.authenticate('Disable biometric protection');
    if (authenticated) {
      this.saveConfig({ enabled: false });
    }
    return authenticated;
  },

  /**
   * Cancel authentication
   */
  cancelAuthentication(): void {
    LocalAuthentication.cancelAuthenticate();
  },

  /**
   * Get authentication type name
   */
  async getAuthTypeName(): Promise<string> {
    const types = await this.getSupportedTypes();
    
    if (Platform.OS === 'ios') {
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      }
    } else {
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face Recognition';
      }
    }
    
    return 'Biometric';
  },
};

export default BiometricService;
