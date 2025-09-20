/**
 * Query Optimizer - Reduces database round trips with parallel queries
 */

/**
 * Execute multiple database queries in parallel
 * Much faster than sequential execution
 */
export async function executeParallel<T extends any[]>(
  queries: Array<() => Promise<T[number]>>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(queries.map(query => query()));
    
    const duration = Date.now() - startTime;
    console.log(`🚀 [PARALLEL] Executed ${queries.length} queries in ${duration}ms`);
    
    return results as T;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PARALLEL] Failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Batch user data queries - gets all user-related data in parallel
 */
export async function getUserDataBatch(storage: any, userId: number) {
  console.time(`[BATCH] getUserDataBatch(${userId})`);
  
  const [
    user,
    butterflies,
    caterpillars, 
    fish,
    flowers,
    seeds,
    bouquets,
    credits,
    unlocked
  ] = await executeParallel([
    () => storage.getUser(userId),
    () => storage.getUserButterflies(userId),
    () => storage.getUserCaterpillars(userId),
    () => storage.getUserFish(userId),
    () => storage.getUserFlowers(userId),
    () => storage.getUserSeeds(userId),
    () => storage.getUserBouquets(userId),
    () => storage.getUser(userId).then((u: any) => u?.credits || 0),
    () => storage.getUnlockedFeatures(userId)
  ]);
  
  console.timeEnd(`[BATCH] getUserDataBatch(${userId})`);
  
  return {
    user,
    butterflies,
    caterpillars,
    fish, 
    flowers,
    seeds,
    bouquets,
    credits,
    unlocked
  };
}

/**
 * Batch exhibition data queries
 */
export async function getExhibitionDataBatch(storage: any, userId: number) {
  console.time(`[BATCH] getExhibitionDataBatch(${userId})`);
  
  const [
    exhibitionButterflies,
    vipButterflies,
    frames,
    exhibitionLikes
  ] = await executeParallel([
    () => storage.getExhibitionButterflies(userId),
    () => storage.getExhibitionVipButterflies(userId), 
    () => storage.getExhibitionFrames(userId),
    () => storage.getExhibitionLikes(userId, userId) // User's own likes
  ]);
  
  console.timeEnd(`[BATCH] getExhibitionDataBatch(${userId})`);
  
  return {
    exhibitionButterflies,
    vipButterflies,
    frames,
    exhibitionLikes
  };
}

/**
 * Optimized query builder for common WHERE conditions
 */
export class QueryBuilder {
  private conditions: string[] = [];
  private params: any[] = [];
  
  where(condition: string, value?: any): this {
    this.conditions.push(condition);
    if (value !== undefined) {
      this.params.push(value);
    }
    return this;
  }
  
  build(): { whereClause: string; params: any[] } {
    const whereClause = this.conditions.length > 0 
      ? `WHERE ${this.conditions.join(' AND ')}`
      : '';
      
    return {
      whereClause,
      params: this.params
    };
  }
}
