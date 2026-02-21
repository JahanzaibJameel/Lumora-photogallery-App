import { InteractionManager } from 'react-native';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameDrops: number[] = [];
  private startTime: number = 0;
  private frameCount: number = 0;
  private readonly SAMPLE_SIZE = 60;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    this.startTime = Date.now();
    this.frameCount = 0;
    this.frameDrops = [];
  }

  recordFrame() {
    this.frameCount++;
    
    if (this.frameCount % this.SAMPLE_SIZE === 0) {
      const elapsed = Date.now() - this.startTime;
      const expectedFrames = elapsed / 16.67; // 60fps = 16.67ms per frame
      const frameDropRate = Math.max(0, 1 - (this.frameCount / expectedFrames));
      
      this.frameDrops.push(frameDropRate);
      
      if (this.frameDrops.length > 10) {
        this.frameDrops.shift();
      }

      this.startTime = Date.now();
      this.frameCount = 0;
    }
  }

  getAverageFrameDrop(): number {
    if (this.frameDrops.length === 0) return 0;
    
    const sum = this.frameDrops.reduce((a, b) => a + b, 0);
    return sum / this.frameDrops.length;
  }

  isPerformanceGood(): boolean {
    return this.getAverageFrameDrop() < 0.1; // Less than 10% frame drops
  }
}

export const runAfterInteractions = (callback: () => void) => {
  InteractionManager.runAfterInteractions(() => {
    setTimeout(callback, 100);
  });
};