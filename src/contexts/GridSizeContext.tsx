import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type GridSize = 'small' | 'medium' | 'large';

interface GridSizeContextValue {
  gridSize: GridSize;
  setGridSize: (size: GridSize) => void;
  cycleGridSize: () => void;
}

const GridSizeContext = createContext<GridSizeContextValue | undefined>(undefined);

export const GridSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gridSize, setGridSize] = useState<GridSize>('medium');

  const cycleGridSize = useCallback(() => {
    setGridSize(prev =>
      prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'small'
    );
  }, []);

  // Stable identity: without memoization every provider render hands consumers
  // a fresh value object and re-renders the entire tree below it.
  const value = useMemo(
    () => ({ gridSize, setGridSize, cycleGridSize }),
    [gridSize, cycleGridSize]
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
