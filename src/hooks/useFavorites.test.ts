import { renderHook, act } from '@testing-library/react-native';
import { StorageKeys } from '../services/storage.service';
import { useFavorites } from './useFavorites';

jest.mock('../services/storage.service', () => ({
  StorageKeys: {
    FAVORITES: 'lumora_favorites',
  },
  getStorageService: jest.fn(),
}));

const mockStorageService = {
  get: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  contains: jest.fn(),
};

const { getStorageService } = require('../services/storage.service');

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStorageService.mockReturnValue(mockStorageService);
    mockStorageService.get.mockReturnValue([]);
  });

  it('loads favorites from storage on mount', () => {
    mockStorageService.get.mockReturnValue(['photo1', 'photo2']);

    const { result } = renderHook(() => useFavorites());

    expect(mockStorageService.get).toHaveBeenCalledWith(StorageKeys.FAVORITES);
    expect(result.current.favorites).toEqual(['photo1', 'photo2']);
  });

  it('returns empty array when no favorites in storage', () => {
    mockStorageService.get.mockReturnValue(null);

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
  });

  it('checks if photo is favorite', () => {
    mockStorageService.get.mockReturnValue(['photo1', 'photo2']);

    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite('photo1')).toBe(true);
    expect(result.current.isFavorite('photo3')).toBe(false);
  });

  it('toggles favorite on', () => {
    mockStorageService.get.mockReturnValue([]);

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite('photo1');
    });

    expect(result.current.favorites).toEqual(['photo1']);
    expect(mockStorageService.save).toHaveBeenCalledWith(StorageKeys.FAVORITES, ['photo1']);
  });

  it('toggles favorite off', () => {
    mockStorageService.get.mockReturnValue(['photo1', 'photo2']);

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite('photo1');
    });

    expect(result.current.favorites).toEqual(['photo2']);
    expect(mockStorageService.save).toHaveBeenCalledWith(StorageKeys.FAVORITES, ['photo2']);
  });

  it('adds favorite', () => {
    mockStorageService.get.mockReturnValue(['photo1']);

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('photo2');
    });

    expect(result.current.favorites).toEqual(['photo1', 'photo2']);
    expect(mockStorageService.save).toHaveBeenCalledWith(StorageKeys.FAVORITES, [
      'photo1',
      'photo2',
    ]);
  });

  it('does not add duplicate favorites', () => {
    mockStorageService.get.mockReturnValue(['photo1']);

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('photo1');
    });

    expect(result.current.favorites).toEqual(['photo1']);
    expect(mockStorageService.save).not.toHaveBeenCalled();
  });

  it('removes favorite', () => {
    mockStorageService.get.mockReturnValue(['photo1', 'photo2']);

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.removeFavorite('photo1');
    });

    expect(result.current.favorites).toEqual(['photo2']);
    expect(mockStorageService.save).toHaveBeenCalledWith(StorageKeys.FAVORITES, ['photo2']);
  });

  it('handles removing non-existent favorite gracefully', () => {
    mockStorageService.get.mockReturnValue(['photo1']);

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.removeFavorite('photo2');
    });

    expect(result.current.favorites).toEqual(['photo1']);
    expect(mockStorageService.save).not.toHaveBeenCalled();
  });

  it('persists favorites to storage on each change', () => {
    mockStorageService.get.mockReturnValue([]);

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite('photo1');
    });

    expect(mockStorageService.save).toHaveBeenCalledWith(StorageKeys.FAVORITES, ['photo1']);

    act(() => {
      result.current.toggleFavorite('photo2');
    });

    expect(mockStorageService.save).toHaveBeenCalledWith(StorageKeys.FAVORITES, [
      'photo1',
      'photo2',
    ]);
  });
});
