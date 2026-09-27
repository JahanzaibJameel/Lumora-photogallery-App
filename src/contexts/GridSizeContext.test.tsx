import { render, renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { getStorageService, StorageKeys } from '../services/storage.service';
import { GridSizeProvider, useGridSize } from './GridSizeContext';

const TestConsumer = ({ onState }: { onState: (state: { gridSize: string; cycleGridSize: () => void }) => void }) => {
  const { gridSize, cycleGridSize } = useGridSize();
  onState({ gridSize, cycleGridSize });
  return null;
};

describe('GridSizeContext', () => {
  beforeEach(() => {
    getStorageService().delete(StorageKeys.GRID_SIZE);
  });

  it('provides default medium grid size', () => {
    const captured: { gridSize: string }[] = [];
    render(
      <GridSizeProvider>
        <TestConsumer onState={(state) => captured.push({ gridSize: state.gridSize })} />
      </GridSizeProvider>
    );
    expect(captured[0].gridSize).toBe('medium');
  });

  it('loads saved grid size from storage', () => {
    getStorageService().save(StorageKeys.GRID_SIZE, 'large');
    const captured: { gridSize: string }[] = [];
    render(
      <GridSizeProvider>
        <TestConsumer onState={(state) => captured.push({ gridSize: state.gridSize })} />
      </GridSizeProvider>
    );
    expect(captured[0].gridSize).toBe('large');
  });

  it('persists grid size changes to storage', () => {
    const captured: { gridSize: string }[] = [];
    let cycle: (() => void) | null = null;

    render(
      <GridSizeProvider>
        <TestConsumer onState={(state) => {
          captured.push({ gridSize: state.gridSize });
          cycle = state.cycleGridSize;
        }} />
      </GridSizeProvider>
    );

    expect(captured[0].gridSize).toBe('medium');
    expect(getStorageService().get(StorageKeys.GRID_SIZE)).toBe('medium');

    act(() => { cycle?.(); });
    expect(captured[1].gridSize).toBe('large');
    expect(getStorageService().get(StorageKeys.GRID_SIZE)).toBe('large');

    act(() => { cycle?.(); });
    expect(captured[2].gridSize).toBe('small');
    expect(getStorageService().get(StorageKeys.GRID_SIZE)).toBe('small');
  });

  it('cycles grid size from small to medium to large and back to small', () => {
    const captured: { gridSize: string }[] = [];
    let cycle: (() => void) | null = null;

    render(
      <GridSizeProvider>
        <TestConsumer onState={(state) => {
          captured.push({ gridSize: state.gridSize });
          cycle = state.cycleGridSize;
        }} />
      </GridSizeProvider>
    );

    expect(captured[0].gridSize).toBe('medium');

    act(() => { cycle?.(); });
    expect(captured[1].gridSize).toBe('large');

    act(() => { cycle?.(); });
    expect(captured[2].gridSize).toBe('small');

    act(() => { cycle?.(); });
    expect(captured[3].gridSize).toBe('medium');
  });

  it('returns fallback values when used outside provider', () => {
    const { result } = renderHook(() => useGridSize());
    expect(result.current.gridSize).toBe('medium');
    expect(typeof result.current.setGridSize).toBe('function');
    expect(typeof result.current.cycleGridSize).toBe('function');
  });
});
