/**
 * 🚀 Query Batching & Data Loading Optimization
 * 
 * Provides utilities to batch database queries and prevent N+1 problems
 */

type BatchedQuery<K, V> = {
  keys: Set<K>;
  promise: Promise<Map<K, V>>;
  resolve: (result: Map<K, V>) => void;
  reject: (error: any) => void;
};

export class DataLoader<K, V> {
  private batch: Map<K, Promise<V>> | null = null;
  private batchedQuery: BatchedQuery<K, V> | null = null;
  private readonly batchFn: (keys: K[]) => Promise<Map<K, V>>;
  private readonly maxBatchSize: number;
  private readonly batchDelayMs: number;

  constructor(
    batchFn: (keys: K[]) => Promise<Map<K, V>>,
    options: {
      maxBatchSize?: number;
      batchDelayMs?: number;
    } = {}
  ) {
    this.batchFn = batchFn;
    this.maxBatchSize = options.maxBatchSize || 100;
    this.batchDelayMs = options.batchDelayMs || 10;
  }

  /**
   * Load a single item, automatically batching with other concurrent loads
   */
  async load(key: K): Promise<V | null> {
    if (!this.batch) {
      this.batch = new Map();
    }

    const existing = this.batch.get(key);
    if (existing) {
      return existing;
    }

    const promise = new Promise<V>((resolve, reject) => {
      if (!this.batchedQuery) {
        this.batchedQuery = {
          keys: new Set([key]),
          promise: null as any,
          resolve: null as any,
          reject: null as any,
        };

        this.batchedQuery.promise = new Promise((res, rej) => {
          this.batchedQuery!.resolve = res;
          this.batchedQuery!.reject = rej;
        });

        // Schedule batch execution
        setTimeout(() => this.executeBatch(), this.batchDelayMs);
      } else {
        this.batchedQuery.keys.add(key);
      }

      // Check if batch is full
      if (this.batchedQuery.keys.size >= this.maxBatchSize) {
        setImmediate(() => this.executeBatch());
      }

      // Wait for batch to complete and extract this key's value
      this.batchedQuery.promise.then(
        (results) => {
          const value = results.get(key);
          if (value !== undefined) {
            resolve(value);
          } else {
            reject(new Error(`Key not found in batch results`));
          }
        },
        (error) => reject(error)
      );
    });

    this.batch.set(key, promise);
    return promise;
  }

  /**
   * Load multiple items at once
   */
  async loadMany(keys: K[]): Promise<(V | null)[]> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  /**
   * Execute the batched query
   */
  private async executeBatch(): Promise<void> {
    if (!this.batchedQuery || this.batchedQuery.keys.size === 0) {
      return;
    }

    const query = this.batchedQuery;
    this.batchedQuery = null;

    try {
      const keys = Array.from(query.keys);
      const results = await this.batchFn(keys);
      query.resolve(results);
    } catch (error) {
      query.reject(error);
    } finally {
      // Clear batch after execution
      this.batch = null;
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.batch = null;
    this.batchedQuery = null;
  }
}

/**
 * Helper to create a DataLoader for a specific entity type
 */
export function createBatchLoader<K, V>(
  fetchFn: (keys: K[]) => Promise<Map<K, V>>,
  options?: {
    maxBatchSize?: number;
    batchDelayMs?: number;
  }
): DataLoader<K, V> {
  return new DataLoader(fetchFn, options);
}

/**
 * 🚀 Query Combiner - Combines multiple sequential queries into parallel execution
 */
export class QueryCombiner {
  private queries: Array<() => Promise<any>> = [];
  private executing = false;

  /**
   * Add a query to be executed
   */
  add<T>(query: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queries.push(async () => {
        try {
          const result = await query();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });

      if (!this.executing) {
        this.executing = true;
        setImmediate(() => this.execute());
      }
    });
  }

  /**
   * Execute all queued queries in parallel
   */
  private async execute(): Promise<void> {
    const toExecute = [...this.queries];
    this.queries = [];
    this.executing = false;

    if (toExecute.length === 0) {
      return;
    }

    // Execute all queries in parallel
    await Promise.allSettled(toExecute.map((query) => query()));
  }
}

/**
 * 🎯 Example Usage - User Data Loader
 * 
 * Instead of:
 *   const user1 = await storage.getUser(1);
 *   const user2 = await storage.getUser(2);
 *   const user3 = await storage.getUser(3);
 * 
 * Use:
 *   const [user1, user2, user3] = await userLoader.loadMany([1, 2, 3]);
 * 
 * This automatically batches into a single query like:
 *   SELECT * FROM users WHERE id IN (1, 2, 3)
 */
export function createUserLoader() {
  return createBatchLoader<number, any>(async (userIds) => {
    const { postgresStorage } = await import('./postgresStorage');
    const { users } = await import('@shared/schema');
    const { inArray, eq } = await import('drizzle-orm');

    // Single batch query instead of N queries
    const results = await postgresStorage['db']
      .select()
      .from(users)
      .where(inArray(users.id, userIds as number[]));

    // Convert to Map for DataLoader
    const resultMap = new Map<number, any>();
    for (const user of results) {
      resultMap.set(user.id, user);
    }

    return resultMap;
  });
}

// Global singleton loaders (reset periodically to prevent memory leaks)
let userLoaderInstance: DataLoader<number, any> | null = null;
let loaderResetTimer: NodeJS.Timeout | null = null;

/**
 * Get or create the global user loader
 */
export function getUserLoader(): DataLoader<number, any> {
  if (!userLoaderInstance) {
    userLoaderInstance = createUserLoader();

    // Reset loader every 60 seconds to prevent memory buildup
    if (loaderResetTimer) {
      clearTimeout(loaderResetTimer);
    }
    loaderResetTimer = setTimeout(() => {
      userLoaderInstance = null;
      loaderResetTimer = null;
    }, 60000);
  }

  return userLoaderInstance;
}
