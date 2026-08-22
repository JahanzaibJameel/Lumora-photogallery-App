import React, { createContext, useContext, useState, useCallback } from 'react';

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

  return (
    <GridSizeContext.Provider value={{ gridSize, setGridSize, cycleGridSize }}>
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
