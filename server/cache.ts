/**
 * Simple in-memory cache for frequently accessed data
 * Reduces database queries for static/semi-static data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlSeconds = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const cache = new SimpleCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cache.cleanup();
  console.log(`🧹 Cache cleanup completed. Current cache size: ${cache.getStats().size}`);
}, 5 * 60 * 1000);

// Cache helpers for common data types
export const CacheKeys = {
  // Static data (long TTL)
  SEEDS_ALL: 'seeds:all',
  BOUQUET_RECIPES: 'bouquet:recipes',
  WEEKLY_CHALLENGE: 'challenge:weekly',
  
  // User-specific data (short TTL) 
  USER_RESOURCES: (userId: number) => `user:${userId}:resources`,
  USER_BUTTERFLIES: (userId: number) => `user:${userId}:butterflies`,
  USER_EXHIBITION: (userId: number) => `user:${userId}:exhibition`,
  
  // Exhibition sell status (medium TTL)
  EXHIBITION_SELL_STATUS: (butterflyId: number) => `exhibition:sell:${butterflyId}`,
} as const;

/**
 * Cache wrapper for database operations
 */
export function withCache<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttlSeconds = 300
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Check cache first
      const cached = cache.get<T>(key);
      if (cached !== null) {
        resolve(cached);
        return;
      }
      
      // Fetch from source
      const data = await fetcher();
      
      // Store in cache
      cache.set(key, data, ttlSeconds);
      
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}
