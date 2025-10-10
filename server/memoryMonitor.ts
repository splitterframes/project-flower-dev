/**
 * 🔍 Memory & Performance Monitoring Utilities
 * 
 * Provides real-time monitoring of server performance and memory usage
 */

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsedMB: string;
  heapTotalMB: string;
  rssMB: string;
  heapUsagePercent: string;
}

interface PerformanceStats {
  uptime: number;
  uptimeFormatted: string;
  memory: MemoryStats;
  eventLoopDelay: number;
  activeHandles: number;
  activeRequests: number;
}

class PerformanceMonitor {
  private startTime: number;
  private lastGC: number | null = null;
  private gcCount = 0;

  constructor() {
    this.startTime = Date.now();
    this.setupGCMonitoring();
  }

  /**
   * Setup GC monitoring if available
   */
  private setupGCMonitoring(): void {
    if (global.gc) {
      const originalGC = global.gc;
      (global as any).gc = () => {
        this.lastGC = Date.now();
        this.gcCount++;
        return originalGC();
      };
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryStats(): MemoryStats {
    const mem = process.memoryUsage();
    
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss,
      heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: (mem.rss / 1024 / 1024).toFixed(2),
      heapUsagePercent: ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1),
    };
  }

  /**
   * Get event loop delay (approximation)
   */
  async getEventLoopDelay(): Promise<number> {
    const start = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    return Date.now() - start;
  }

  /**
   * Get comprehensive performance stats
   */
  async getStats(): Promise<PerformanceStats> {
    const uptime = Date.now() - this.startTime;
    const eventLoopDelay = await this.getEventLoopDelay();

    return {
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      memory: this.getMemoryStats(),
      eventLoopDelay,
      activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
      activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
    };
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Check if memory usage is high
   */
  isMemoryHigh(): boolean {
    const stats = this.getMemoryStats();
    return parseFloat(stats.heapUsagePercent) > 85;
  }

  /**
   * Print memory stats to console
   */
  logMemoryStats(): void {
    const stats = this.getMemoryStats();
    console.log(`
╔════════════════════════════════════════╗
║         Memory Usage Report            ║
╠════════════════════════════════════════╣
║ Heap Used:    ${stats.heapUsedMB.padStart(8)} MB    ║
║ Heap Total:   ${stats.heapTotalMB.padStart(8)} MB    ║
║ RSS:          ${stats.rssMB.padStart(8)} MB    ║
║ Heap Usage:   ${stats.heapUsagePercent.padStart(8)} %     ║
╚════════════════════════════════════════╝
    `);
  }

  /**
   * Suggest garbage collection if needed
   */
  suggestGC(): boolean {
    if (this.isMemoryHigh() && global.gc) {
      console.log('⚠️ High memory usage detected, running garbage collection...');
      global.gc();
      return true;
    }
    return false;
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Start periodic memory monitoring
 */
export function startMemoryMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`🔍 Memory monitoring started (interval: ${intervalMs}ms)`);
  
  return setInterval(() => {
    const stats = perfMonitor.getMemoryStats();
    const heapUsagePercent = parseFloat(stats.heapUsagePercent);
    
    if (heapUsagePercent > 85) {
      console.warn(`⚠️ High memory usage: ${stats.heapUsagePercent}% (${stats.heapUsedMB}MB / ${stats.heapTotalMB}MB)`);
      perfMonitor.suggestGC();
    } else if (heapUsagePercent > 70 && process.env.NODE_ENV !== 'production') {
      console.log(`📊 Memory usage: ${stats.heapUsagePercent}% (${stats.heapUsedMB}MB / ${stats.heapTotalMB}MB)`);
    }
  }, intervalMs);
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    
    if (durationMs > 1000) {
      console.warn(`⚠️ Slow operation: ${label} took ${durationMs}ms`);
    } else if (process.env.NODE_ENV !== 'production' && durationMs > 100) {
      console.log(`⏱️ ${label} took ${durationMs}ms`);
    }
    
    return { result, durationMs };
  } catch (error) {
    const durationMs = Date.now() - start;
    console.error(`❌ ${label} failed after ${durationMs}ms:`, error);
    throw error;
  }
}

/**
 * Create a memory-aware cache with automatic cleanup
 */
export class MemoryAwareCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;
  private cleanupThreshold: number;

  constructor(maxSize: number = 1000, cleanupThresholdPercent: number = 90) {
    this.maxSize = maxSize;
    this.cleanupThreshold = (maxSize * cleanupThresholdPercent) / 100;
  }

  set(key: K, value: V): void {
    // Check if cleanup is needed
    if (this.cache.size >= this.cleanupThreshold) {
      this.cleanup();
    }

    this.cache.set(key, value);
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const itemsToRemove = Math.floor(this.cache.size * 0.2); // Remove 20% oldest items
    const keys = Array.from(this.cache.keys());
    
    for (let i = 0; i < itemsToRemove && i < keys.length; i++) {
      this.cache.delete(keys[i]);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🧹 Cache cleanup: removed ${itemsToRemove} items (${this.cache.size}/${this.maxSize} remaining)`);
    }
  }
}

/**
 * Express middleware to add performance headers
 */
export function performanceHeadersMiddleware(req: any, res: any, next: any): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Add server timing header for detailed breakdown
    if (process.env.ENABLE_TIMING_HEADERS === 'true') {
      res.setHeader('Server-Timing', `total;dur=${duration}`);
    }
  });
  
  next();
}
