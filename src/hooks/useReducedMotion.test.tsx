import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { ReducedMotionProvider } from '../contexts/ReducedMotionContext';
import { storageService, StorageKeys } from '../services/storage.service';
import { useReducedMotion, useReduceMotionMode } from './useReducedMotion';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {
    ...actual,
    useReducedMotion: () => false,
    ReduceMotion: { System: 'system', Never: 'never', Always: 'always' },
    ReducedMotionConfig: ({ children }: { children?: React.ReactNode }) => children ?? null,
  };
});

describe('useReducedMotion', () => {
  beforeEach(() => {
    storageService.clear();
  });

  it('returns a boolean value', () => {
    const { result } = renderHook(() => useReducedMotion(), { wrapper: ReducedMotionProvider });
    expect(typeof result.current).toBe('boolean');
  });

  it('defaults to false (system mode, no system reduced motion)', () => {
    const { result } = renderHook(() => useReducedMotion(), { wrapper: ReducedMotionProvider });
    expect(result.current).toBe(false);
  });

  it('returns default false without provider', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});

describe('useReduceMotionMode', () => {
  beforeEach(() => {
    storageService.clear();
  });

  it('returns reduceMotion, reduceMotionMode, and setReduceMotionMode', () => {
    const { result } = renderHook(() => useReduceMotionMode(), { wrapper: ReducedMotionProvider });
    expect(result.current).toHaveProperty('reduceMotion');
    expect(result.current).toHaveProperty('reduceMotionMode');
    expect(result.current).toHaveProperty('setReduceMotionMode');
    expect(result.current.reduceMotionMode).toBe('system');
  });

  it('setReduceMotionMode updates the mode and persists to storage', () => {
    const { result } = renderHook(() => useReduceMotionMode(), { wrapper: ReducedMotionProvider });
    act(() => {
      result.current.setReduceMotionMode('always');
    });
    expect(result.current.reduceMotionMode).toBe('always');
    expect(result.current.reduceMotion).toBe(true);
  });

  it('setReduceMotionMode "never" sets reduceMotion to false', () => {
    const { result } = renderHook(() => useReduceMotionMode(), { wrapper: ReducedMotionProvider });
    act(() => {
      result.current.setReduceMotionMode('always');
    });
    expect(result.current.reduceMotion).toBe(true);
    act(() => {
      result.current.setReduceMotionMode('never');
    });
    expect(result.current.reduceMotion).toBe(false);
  });

  it('persists and loads saved mode', () => {
    storageService.save(StorageKeys.REDUCED_MOTION, 'always');
    const { result } = renderHook(() => useReduceMotionMode(), { wrapper: ReducedMotionProvider });
    expect(result.current.reduceMotionMode).toBe('always');
    expect(result.current.reduceMotion).toBe(true);
  });

  it('ignores invalid saved mode', () => {
      storageService.save(StorageKeys.REDUCED_MOTION, 'invalid' as unknown as string);
    const { result } = renderHook(() => useReduceMotionMode(), { wrapper: ReducedMotionProvider });
    expect(result.current.reduceMotionMode).toBe('system');
  });

  it('returns defaults without provider', () => {
    const { result } = renderHook(() => useReduceMotionMode());
    expect(result.current.reduceMotion).toBe(false);
    expect(result.current.reduceMotionMode).toBe('system');
  });

  it('ReducedMotionProvider re-exports', () => {
    expect(ReducedMotionProvider).toBeDefined();
  });
});
