import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { getStorageService, StorageKeys } from '../services/storage.service';

type GridSize = 'small' | 'medium' | 'large';

interface GridSizeContextValue {
  gridSize: GridSize;
  setGridSize: (size: GridSize) => void;
  cycleGridSize: () => void;
}

const GridSizeContext = createContext<GridSizeContextValue | undefined>(undefined);

export const GridSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gridSize, setGridSizeState] = useState<GridSize>(() => {
    const saved = getStorageService().get<GridSize>(StorageKeys.GRID_SIZE);
    return saved ?? 'medium';
  });

  useEffect(() => {
    getStorageService().save(StorageKeys.GRID_SIZE, gridSize);
  }, [gridSize]);

  const setGridSize = useCallback((size: GridSize) => {
    setGridSizeState(size);
  }, []);

  const cycleGridSize = useCallback(() => {
    setGridSizeState(prev =>
      prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'small'
    );
  }, []);

  // Stable identity: without memoization every provider render hands consumers
  // a fresh value object and re-renders the entire tree below it.
  const value = useMemo(
    () => ({ gridSize, setGridSize, cycleGridSize }),
    [gridSize, setGridSize, cycleGridSize]
  );

  return (
    <GridSizeContext.Provider value={value}>
      {children}
    </GridSizeContext.Provider>
  );
};

export const useGridSize = (): GridSizeContextValue => {
  const context = useContext(GridSizeContext);
  if (!context) {
    return { gridSize: 'medium', setGridSize: () => {}, cycleGridSize: () => {} };
  }
  return context;
};
