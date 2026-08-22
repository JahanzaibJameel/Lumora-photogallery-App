import { useReducedMotionContext, ReducedMotionProvider, ReduceMotionMode } from '../contexts/ReducedMotionContext';

export type { ReduceMotionMode };

export const useReducedMotion = (): boolean => {
  return useReducedMotionContext().reduceMotion;
};

export const useReduceMotionMode = (): {
  reduceMotion: boolean;
  reduceMotionMode: ReduceMotionMode;
  setReduceMotionMode: (mode: ReduceMotionMode) => void;
} => {
  const context = useReducedMotionContext();
  return {
    reduceMotion: context.reduceMotion,
    reduceMotionMode: context.reduceMotionMode,
    setReduceMotionMode: context.setReduceMotionMode,
  };
};

export { ReducedMotionProvider };
