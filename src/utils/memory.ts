import { Image } from 'react-native';

export class MemoryManager {
  private static instance: MemoryManager;
  private cachedImages: Set<string> = new Set();
  private readonly MAX_CACHE_SIZE = 50;

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  cacheImage(uri: string): void {
    if (this.cachedImages.has(uri)) {
      return;
    }

    if (this.cachedImages.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    Image.prefetch(uri)
      .then(() => {
        this.cachedImages.add(uri);
      })
      .catch(() => {
        // Silent fail
      });
  }

  evictImage(uri: string): void {
    this.cachedImages.delete(uri);
  }

  evictOldest(): void {
    const iterator = this.cachedImages.values();
    const oldest = iterator.next().value;
    if (oldest) {
      this.cachedImages.delete(oldest);
    }
  }

  clearCache(): void {
    this.cachedImages.clear();
    // Clear all cached images
    this.cachedImages.forEach(uri => this.evictImage(uri));
  }

  getCacheSize(): number {
    return this.cachedImages.size;
  }
}