import { render, renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { storageService, StorageKeys } from '../services/storage.service';
import { ReducedMotionProvider, useReducedMotionContext } from './ReducedMotionContext';

jest.mock('../services/storage.service', () => ({
  storageService: {
    get: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
  },
  StorageKeys: {
    REDUCED_MOTION: 'lumora_reduced_motion',
  },
}));

const mockedStorage = storageService as jest.Mocked<typeof storageService>;

type CapturedReducedMotionState = ReturnType<typeof useReducedMotionContext>;

const TestConsumer = ({ onState }: { onState: (state: { reduceMotion: boolean; reduceMotionMode: string; setReduceMotionMode: (mode: 'system' | 'always' | 'never') => void }) => void }) => {
  const state = useReducedMotionContext();
  onState({
    reduceMotion: state.reduceMotion,
    reduceMotionMode: state.reduceMotionMode,
    setReduceMotionMode: state.setReduceMotionMode,
  });
  return null;
};

describe('ReducedMotionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.get.mockReturnValue(null);
  });

  it('provides default reduceMotion false and mode system when no saved preference', () => {
    const captured: any[] = [];
    render(
      <ReducedMotionProvider>
        <TestConsumer onState={(state) => captured.push(state)} />
      </ReducedMotionProvider>
    );
    expect(captured[0].reduceMotion).toBe(false);
    expect(captured[0].reduceMotionMode).toBe('system');
  });

  it('loads saved reduceMotion mode from storage', () => {
    mockedStorage.get.mockReturnValue('always');

    const captured: any[] = [];
    render(
      <ReducedMotionProvider>
        <TestConsumer onState={(state) => captured.push(state)} />
      </ReducedMotionProvider>
    );

    expect(mockedStorage.get).toHaveBeenCalledWith(StorageKeys.REDUCED_MOTION);
    expect(captured[captured.length - 1].reduceMotionMode).toBe('always');
    expect(captured[captured.length - 1].reduceMotion).toBe(true);
  });

  it('persists mode change to storage', () => {
    const captured: any[] = [];
    let setMode: (mode: 'system' | 'always' | 'never') => void;

    render(
      <ReducedMotionProvider>
        <TestConsumer onState={(state) => {
          captured.push(state);
          setMode = state.setReduceMotionMode;
        }} />
      </ReducedMotionProvider>
    );

    act(() => { setMode('never'); });
    expect(mockedStorage.save).toHaveBeenCalledWith(StorageKeys.REDUCED_MOTION, 'never');
  });

  it('returns fallback values when used outside provider', () => {
    const { result } = renderHook(() => useReducedMotionContext());
    expect(result.current.reduceMotion).toBe(false);
    expect(result.current.reduceMotionMode).toBe('system');
    expect(typeof result.current.setReduceMotionMode).toBe('function');
  });
});
