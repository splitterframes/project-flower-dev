/**
 * 🚀 Request Coalescing - Prevents duplicate concurrent requests
 * 
 * When multiple parts of the app request the same data simultaneously,
 * this ensures only ONE database query is made and all requests share the result.
 * 
 * Example:
 * - Component A requests user data
 * - Component B requests user data (0.5s later)
 * - Component C requests user data (1s later)
 * 
 * Without coalescing: 3 database queries
 * With coalescing: 1 database query, all 3 components get the same result
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  requestCount: number;
}

class RequestCoalescer {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly maxAge = 5000; // 5 seconds
  private readonly cleanupInterval = 10000; // 10 seconds
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Coalesce a request - if same key is already pending, return existing promise
   */
  async coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const pending = this.pendingRequests.get(key);

    // Check if there's a pending request and it's still fresh
    if (pending && (now - pending.timestamp) < this.maxAge) {
      pending.requestCount++;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔄 Request coalesced: ${key} (${pending.requestCount} requests merged)`);
      }
      
      return pending.promise;
    }

    // Create new request
    const promise = fetcher().finally(() => {
      // Clean up after completion
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, 100);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
      requestCount: 1,
    });

    return promise;
  }

  /**
   * Clear a specific coalesced request
   */
  clear(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get stats about coalescing efficiency
   */
  getStats(): {
    pendingCount: number;
    keys: string[];
    totalCoalescedRequests: number;
  } {
    let totalCoalesced = 0;
    
    for (const pending of this.pendingRequests.values()) {
      totalCoalesced += pending.requestCount - 1; // -1 because first request is not coalesced
    }

    return {
      pendingCount: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys()),
      totalCoalescedRequests: totalCoalesced,
    };
  }

  /**
   * Periodic cleanup of stale pending requests
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const staleKeys: string[] = [];

      for (const [key, pending] of this.pendingRequests.entries()) {
        if (now - pending.timestamp > this.maxAge) {
          staleKeys.push(key);
        }
      }

      for (const key of staleKeys) {
        this.pendingRequests.delete(key);
      }

      if (staleKeys.length > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`🧹 Cleaned up ${staleKeys.length} stale pending requests`);
      }
    }, this.cleanupInterval);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop cleanup timer
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Global singleton
export const requestCoalescer = new RequestCoalescer();

/**
 * Express middleware to coalesce identical concurrent requests
 */
export function requestCoalescingMiddleware(req: any, res: any, next: any): void {
  // Only coalesce GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Create unique key for this request
  const userId = req.headers['x-user-id'] || req.user?.id || 'anonymous';
  const coalescingKey = `${req.method}:${req.path}:${userId}:${JSON.stringify(req.query)}`;

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Coalesce the request handling
  requestCoalescer
    .coalesce(coalescingKey, () => {
      return new Promise((resolve, reject) => {
        // Replace res.json to capture the response
        res.json = function (data: any) {
          resolve(data);
          return originalJson(data);
        };

        // Handle errors
        const originalSend = res.send.bind(res);
        res.send = function (data: any) {
          if (res.statusCode >= 400) {
            reject(new Error(`Request failed with status ${res.statusCode}`));
          }
          return originalSend(data);
        };

        next();
      });
    })
    .then((data) => {
      // If request was coalesced, we need to send the response
      if (!res.headersSent) {
        originalJson(data);
      }
    })
    .catch((error) => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
}

/**
 * Helper function to create a coalescing wrapper for any async function
 */
export function createCoalescedFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyFn: (...args: TArgs) => string
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const key = keyFn(...args);
    return requestCoalescer.coalesce(key, () => fn(...args));
  };
}

/**
 * Example usage with storage functions
 */
export function createCoalescedStorage() {
  return {
    /**
     * Coalesced getUser - prevents duplicate user fetches
     */
    getUser: createCoalescedFunction(
      async (userId: number) => {
        const { postgresStorage } = await import('./postgresStorage');
        return postgresStorage.getUser(userId);
      },
      (userId) => `getUser:${userId}`
    ),

    /**
     * Coalesced getUserButterflies
     */
    getUserButterflies: createCoalescedFunction(
      async (userId: number) => {
        const { postgresStorage } = await import('./postgresStorage');
        return postgresStorage.getUserButterflies(userId);
      },
      (userId) => `getUserButterflies:${userId}`
    ),

    /**
     * Coalesced getUserFlowers
     */
    getUserFlowers: createCoalescedFunction(
      async (userId: number) => {
        const { postgresStorage } = await import('./postgresStorage');
        return postgresStorage.getUserFlowers(userId);
      },
      (userId) => `getUserFlowers:${userId}`
    ),
  };
}

// Export singleton coalesced storage
export const coalescedStorage = createCoalescedStorage();
