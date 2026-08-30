import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { ReduceMotion, ReducedMotionConfig, useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';
import { getStorageService, StorageKeys } from '../services/storage.service';

export type ReduceMotionMode = 'system' | 'always' | 'never';

export interface ReducedMotionContextType {
  reduceMotion: boolean;
  reduceMotionMode: ReduceMotionMode;
  setReduceMotionMode: (mode: ReduceMotionMode) => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextType | undefined>(undefined);

const REANIMATED_MODE_MAP: Record<ReduceMotionMode, ReduceMotion> = {
  system: ReduceMotion.System,
  always: ReduceMotion.Always,
  never: ReduceMotion.Never,
};

export const ReducedMotionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemReduced = useReanimatedReducedMotion();
  const [reduceMotionMode, setReduceMotionModeState] = useState<ReduceMotionMode>('system');

  useEffect(() => {
    const saved = getStorageService().get<string>(StorageKeys.REDUCED_MOTION);
    if (saved && ['system', 'always', 'never'].includes(saved)) {
      setReduceMotionModeState(saved as ReduceMotionMode);
    }
  }, []);

  const reduceMotion =
    reduceMotionMode === 'always'
      ? true
      : reduceMotionMode === 'never'
        ? false
        : systemReduced;

  const setReduceMotionMode = useCallback((mode: ReduceMotionMode) => {
    setReduceMotionModeState(mode);
    getStorageService().save(StorageKeys.REDUCED_MOTION, mode);
  }, []);

  const reanimatedMode = REANIMATED_MODE_MAP[reduceMotionMode];

  const contextValue = useMemo(
    () => ({ reduceMotion, reduceMotionMode, setReduceMotionMode }),
    [reduceMotion, reduceMotionMode, setReduceMotionMode]
  );

  return (
    <ReducedMotionContext.Provider value={contextValue}>
      {/* 'system' is Reanimated's default - mounting the config then would
          only trigger a dev warning about overriding the OS setting. */}
      {reduceMotionMode !== 'system' && (
        <ReducedMotionConfig mode={reanimatedMode} />
      )}
      {children}
    </ReducedMotionContext.Provider>
  );
};

export const useReducedMotionContext = (): ReducedMotionContextType => {
  const context = useContext(ReducedMotionContext);
  if (!context) {
    return {
      reduceMotion: false,
      reduceMotionMode: 'system',
      setReduceMotionMode: () => {},
    };
  }
  return context;
};
