/**
 * 🗄️ Advanced Query Cache with Smart Invalidation
 * 
 * Sophisticated caching system with automatic invalidation on mutations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  tags: Set<string>;
  hits: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  totalSize: number;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  maxSize?: number;
}

class SmartQueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> Set of cache keys
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  private maxSize: number;
  private defaultTTL: number;
  private maxEntrySize: number;

  constructor(
    maxSize: number = 100 * 1024 * 1024, // 100MB
    defaultTTL: number = 300000, // 5 minutes
    maxEntrySize: number = 5 * 1024 * 1024 // 5MB per entry
  ) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.maxEntrySize = maxEntrySize;
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    const age = now - entry.timestamp;
    const ttl = this.defaultTTL;

    if (age > ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update stats
    entry.hits++;
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Set item in cache with tags
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const tags = new Set(options.tags || []);
    const size = this.estimateSize(data);

    // Check if entry is too large
    if (size > this.maxEntrySize) {
      console.warn(`⚠️ Cache entry too large (${(size / 1024 / 1024).toFixed(1)}MB): ${key}`);
      return;
    }

    // Create entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      tags,
      hits: 0,
      size,
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Ensure we have space
    this.ensureSpace(size);

    // Add to cache
    this.cache.set(key, entry);

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from tag index
    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    this.cache.delete(key);
    return true;
  }

  /**
   * Invalidate all cache entries with specific tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidatedCount = 0;
    const keysToDelete = new Set<string>();

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        for (const key of keys) {
          keysToDelete.add(key);
        }
      }
    }

    for (const key of keysToDelete) {
      if (this.delete(key)) {
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      console.log(`🗑️ Invalidated ${invalidatedCount} cache entries with tags: ${tags.join(', ')}`);
    }

    return invalidatedCount;
  }

  /**
   * Get or compute cached value
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await computeFn();
    this.set(key, value, options);
    return value;
  }

  /**
   * Ensure we have space in cache
   */
  private ensureSpace(requiredSize: number): void {
    const currentSize = this.getTotalSize();
    
    if (currentSize + requiredSize <= this.maxSize) {
      return;
    }

    // Need to evict entries
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
      score: this.calculateEvictionScore(entry),
    }));

    // Sort by eviction score (lower = evict first)
    entries.sort((a, b) => a.score - b.score);

    // Evict entries until we have enough space
    let freedSpace = 0;
    for (const { key, entry } of entries) {
      if (currentSize - freedSpace + requiredSize <= this.maxSize) {
        break;
      }

      this.delete(key);
      freedSpace += entry.size;
      this.stats.evictions++;
    }
  }

  /**
   * Calculate eviction score (lower = evict first)
   */
  private calculateEvictionScore(entry: CacheEntry<any>): number {
    const age = Date.now() - entry.timestamp;
    const ageScore = age / 1000; // Age in seconds
    const hitScore = entry.hits * 1000; // Weight hits heavily
    const sizeScore = entry.size / 1024; // Penalize large entries slightly

    // Lower score = more likely to evict
    return hitScore - ageScore - (sizeScore * 0.1);
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    const jsonStr = JSON.stringify(data);
    return jsonStr.length * 2; // Rough estimate: 2 bytes per character
  }

  /**
   * Get total cache size
   */
  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      hitRate: parseFloat(hitRate.toFixed(2)),
      totalSize: this.getTotalSize(),
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.defaultTTL) {
        this.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleared ${expiredCount} expired cache entries`);
    }

    return expiredCount;
  }
}

// Singleton instance
export const smartCache = new SmartQueryCache();

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  user: (userId: number) => `user:${userId}`,
  userButterflies: (userId: number) => `user:${userId}:butterflies`,
  userFish: (userId: number) => `user:${userId}:fish`,
  userGarden: (userId: number) => `user:${userId}:garden`,
  userExhibition: (userId: number) => `user:${userId}:exhibition`,
  userResources: (userId: number) => `user:${userId}:resources`,
  marketListings: () => 'market:listings',
  leaderboard: (type: string) => `leaderboard:${type}`,
};

/**
 * Cache tags for invalidation
 */
export const CacheTags = {
  user: (userId: number) => `user:${userId}`,
  butterflies: () => 'butterflies',
  fish: () => 'fish',
  garden: () => 'garden',
  exhibition: () => 'exhibition',
  market: () => 'market',
  leaderboard: () => 'leaderboard',
};

/**
 * Middleware to invalidate cache on mutations
 */
export function cacheInvalidationMiddleware(req: any, res: any, next: any): void {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Invalidate cache based on successful mutations
    if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
      const userId = req.user?.id || req.params.userId;
      
      if (userId) {
        // Invalidate user-specific caches
        smartCache.invalidateByTags([CacheTags.user(userId)]);
      }

      // Invalidate specific resource caches based on endpoint
      const path = req.path.toLowerCase();
      if (path.includes('butterfly')) {
        smartCache.invalidateByTags([CacheTags.butterflies()]);
      }
      if (path.includes('fish')) {
        smartCache.invalidateByTags([CacheTags.fish()]);
      }
      if (path.includes('garden')) {
        smartCache.invalidateByTags([CacheTags.garden()]);
      }
      if (path.includes('market')) {
        smartCache.invalidateByTags([CacheTags.market()]);
      }
    }

    return originalJson(data);
  };

  next();
}

/**
 * Auto-cleanup expired entries every 5 minutes
 */
setInterval(() => {
  smartCache.clearExpired();
}, 5 * 60 * 1000);

/**
 * Express endpoint for cache stats
 */
export function cacheStatsEndpoint(req: any, res: any): void {
  const stats = smartCache.getStats();
  res.json(stats);
}
