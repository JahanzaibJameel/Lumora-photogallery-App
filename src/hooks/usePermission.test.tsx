import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking } from 'react-native';
import { usePermission } from './usePermission';

jest.mock('expo-media-library');

const mockMediaLibrary = MediaLibrary as jest.Mocked<typeof MediaLibrary>;

const permissionResult = (status: string, canAskAgain: boolean): any => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
  status,
  canAskAgain,
  expires: 'never',
  granted: status === 'granted',
  permissions: { camera: status, mediaLibrary: status },
});

describe('usePermission', () => {
  let alertSpy: jest.SpyInstance;
  let linkingSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    linkingSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);

    mockMediaLibrary.getPermissionsAsync.mockResolvedValue(permissionResult('granted', true));
    mockMediaLibrary.requestPermissionsAsync.mockResolvedValue(permissionResult('granted', true));
  });

  afterEach(() => {
    alertSpy.mockRestore();
    linkingSpy.mockRestore();
  });

  it('starts with undetermined permission and loading state', () => {
    mockMediaLibrary.getPermissionsAsync.mockResolvedValue(permissionResult('denied', true));
    const { result } = renderHook(() => usePermission());
    expect(result.current.permission).toBe('undetermined');
    expect(result.current.isLoading).toBe(true);
  });

  it('sets permission to granted when permission is granted on mount', async () => {
    mockMediaLibrary.getPermissionsAsync.mockResolvedValue(permissionResult('granted', true));
    const { result } = renderHook(() => usePermission());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.permission).toBe('granted');
  });

  it('sets permission to blocked when cannot ask again', async () => {
    mockMediaLibrary.getPermissionsAsync.mockResolvedValue(permissionResult('denied', false));
    const { result } = renderHook(() => usePermission());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.permission).toBe('blocked');
  });

  it('sets permission to undetermined when denied but can ask again', async () => {
    mockMediaLibrary.getPermissionsAsync.mockResolvedValue(permissionResult('denied', true));
    const { result } = renderHook(() => usePermission());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.permission).toBe('undetermined');
  });

  describe('requestPermission', () => {
    it('sets permission to granted when request succeeds', async () => {
      mockMediaLibrary.requestPermissionsAsync.mockResolvedValue(permissionResult('granted', true));
      const { result } = renderHook(() => usePermission());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('granted');
      expect(mockMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('sets permission to blocked when request denied and cannot ask again', async () => {
      mockMediaLibrary.requestPermissionsAsync.mockResolvedValue(permissionResult('denied', false));
      const { result } = renderHook(() => usePermission());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('blocked');
    });

    it('sets permission to denied when request denied but can ask again', async () => {
      mockMediaLibrary.requestPermissionsAsync.mockResolvedValue(permissionResult('denied', true));
      const { result } = renderHook(() => usePermission());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('denied');
    });

    it('sets permission to denied on error', async () => {
      mockMediaLibrary.requestPermissionsAsync.mockRejectedValue(new Error('Permission error'));
      const { result } = renderHook(() => usePermission());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('denied');
    });
  });

  describe('openSettings', () => {
    it('opens settings successfully', async () => {
      const { result } = renderHook(() => usePermission());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.openSettings();
      });

      expect(Linking.openSettings).toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('shows alert on error', async () => {
      linkingSpy.mockRejectedValue(new Error('Cannot open settings'));
      const { result } = renderHook(() => usePermission());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.openSettings();
      });

      expect(alertSpy).toHaveBeenCalledWith('Error', 'Unable to open settings');
    });
  });
});
