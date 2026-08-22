import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import EmptyState from './EmptyState';

jest.mock('../hooks/usePermission', () => ({
  usePermission: jest.fn(),
}));

const { usePermission } = require('../hooks/usePermission');

describe('EmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePermission.mockReturnValue({
      permission: 'granted',
      isLoading: false,
      requestPermission: jest.fn(),
      checkPermission: jest.fn(),
      openSettings: jest.fn(),
    });
  });

  describe('default (empty) type', () => {
    it('renders with default "No Photos Found" title', () => {
      const { getByText } = renderWithProviders(<EmptyState />);
      expect(getByText('No Photos Found')).toBeTruthy();
    });

    it('renders default message', () => {
      const { getByText } = renderWithProviders(<EmptyState />);
      expect(getByText('Start by adding some photos to your gallery.')).toBeTruthy();
    });

    it('renders "Refresh" button', () => {
      const { getByText } = renderWithProviders(<EmptyState />);
      expect(getByText('Refresh')).toBeTruthy();
    });

    it('calls onAction when button is pressed', () => {
      const onAction = jest.fn();
      const { getByText } = renderWithProviders(<EmptyState onAction={onAction} />);
      fireEvent.press(getByText('Refresh'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('uses custom title and message', () => {
      const { getByText } = renderWithProviders(
        <EmptyState title="Custom Title" message="Custom message" />
      );
      expect(getByText('Custom Title')).toBeTruthy();
      expect(getByText('Custom message')).toBeTruthy();
    });
  });

  describe('permission type', () => {
    it('shows settings when permission is blocked', () => {
      usePermission.mockReturnValue({
        permission: 'blocked',
        isLoading: false,
        requestPermission: jest.fn(),
        checkPermission: jest.fn(),
        openSettings: jest.fn(),
      });
      const { getByText } = renderWithProviders(<EmptyState type="permission" />);
      expect(getByText('Permission Required')).toBeTruthy();
      expect(getByText('Open Settings')).toBeTruthy();
    });

    it('shows "Allow Access" when not blocked', () => {
      const requestPermission = jest.fn();
      usePermission.mockReturnValue({
        permission: 'undetermined',
        isLoading: false,
        requestPermission,
        checkPermission: jest.fn(),
        openSettings: jest.fn(),
      });
      const { getByText } = renderWithProviders(<EmptyState type="permission" />);
      expect(getByText('Access Your Photos')).toBeTruthy();
      expect(getByText('Allow Access')).toBeTruthy();
    });

    it('calls requestPermission when "Allow Access" is pressed', () => {
      const requestPermission = jest.fn();
      usePermission.mockReturnValue({
        permission: 'undetermined',
        isLoading: false,
        requestPermission,
        checkPermission: jest.fn(),
        openSettings: jest.fn(),
      });
      const { getByText } = renderWithProviders(<EmptyState type="permission" />);
      fireEvent.press(getByText('Allow Access'));
      expect(requestPermission).toHaveBeenCalledTimes(1);
    });

    it('calls openSettings when "Open Settings" is pressed', () => {
      const openSettings = jest.fn();
      usePermission.mockReturnValue({
        permission: 'blocked',
        isLoading: false,
        requestPermission: jest.fn(),
        checkPermission: jest.fn(),
        openSettings,
      });
      const { getByText } = renderWithProviders(<EmptyState type="permission" />);
      fireEvent.press(getByText('Open Settings'));
      expect(openSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('error type', () => {
    it('renders with default error title', () => {
      const { getByText } = renderWithProviders(<EmptyState type="error" />);
      expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('renders default error message', () => {
      const { getByText } = renderWithProviders(<EmptyState type="error" />);
      expect(getByText('Please try again later.')).toBeTruthy();
    });

    it('renders "Retry" button', () => {
      const { getByText } = renderWithProviders(<EmptyState type="error" />);
      expect(getByText('Retry')).toBeTruthy();
    });

    it('uses custom title and message', () => {
      const { getByText } = renderWithProviders(
        <EmptyState type="error" title="Load Failed" message="Connection timeout" />
      );
      expect(getByText('Load Failed')).toBeTruthy();
      expect(getByText('Connection timeout')).toBeTruthy();
    });
  });

  describe('no-internet type', () => {
    it('renders with "No Internet Connection" title', () => {
      const { getByText } = renderWithProviders(<EmptyState type="no-internet" />);
      expect(getByText('No Internet Connection')).toBeTruthy();
    });

    it('renders "Retry" button', () => {
      const { getByText } = renderWithProviders(<EmptyState type="no-internet" />);
      expect(getByText('Retry')).toBeTruthy();
    });

    it('calls onAction when retry is pressed', () => {
      const onAction = jest.fn();
      const { getByText } = renderWithProviders(<EmptyState type="no-internet" onAction={onAction} />);
      fireEvent.press(getByText('Retry'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });
});
