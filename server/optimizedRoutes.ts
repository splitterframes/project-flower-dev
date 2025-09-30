/**
 * Optimized API routes to reduce database queries and improve performance
 */
import { Request, Response } from "express";
import { cache, CacheKeys, withCache } from "./cache";
import {
  getUserResourceSnapshot,
  invalidateUserResourceCache,
  RESOURCE_CACHE_TTL_SECONDS,
  UserNotFoundError,
} from "./userResourceCache";

/**
 * GET /api/user/:userId/resources - Aggregated user resources in single query
 * Replaces separate calls to credits, suns, hearts, dna, tickets
 */
export async function getUserResources(req: Request, res: Response) {
  const userId = parseInt(req.params.userId);
  const timerLabel = `[PERF] getUserResources(${userId})`;
  console.time(timerLabel);

  try {
    const snapshot = await getUserResourceSnapshot(userId);
    res.set(
      'Cache-Control',
      `public, max-age=${RESOURCE_CACHE_TTL_SECONDS}, stale-while-revalidate=${RESOURCE_CACHE_TTL_SECONDS * 2}`
    );
    res.json(snapshot);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ error: "User not found" });
    }

    console.error('[ERROR] getUserResources:', error);
    res.status(500).json({ error: "Failed to get user resources" });
  } finally {
    console.timeEnd(timerLabel);
  }
}

/**
 * GET /api/user/:userId/inventory - Aggregated inventory in single query
 * Combines butterflies, caterpillars, fish, flowers, seeds, bouquets
 */
export async function getUserInventory(req: Request, res: Response) {
  const userId = parseInt(req.params.userId);
  const timerLabel = `[PERF] getUserInventory(${userId})`;
  console.time(timerLabel);

  try {
    const cacheKey = CacheKeys.USER_INVENTORY(userId);
    const forceFresh = req.query.fresh === "1";

    const fetchInventoryData = async () => {
      const { postgresStorage: storage } = await import('./postgresStorage');

      const [butterflies, caterpillars, fish, flowers, seeds, bouquets] = await Promise.all([
        storage.getUserButterflies(userId),
        storage.getUserCaterpillars(userId),
        storage.getUserFish(userId),
        storage.getUserFlowers(userId),
        storage.getUserSeeds(userId),
        storage.getUserBouquets(userId),
      ]);

      return {
        butterflies,
        caterpillars,
        fish,
        flowers,
        seeds,
        bouquets,
        lastUpdated: new Date().toISOString(),
      };
    };

    let inventory;
    if (forceFresh) {
      cache.delete(cacheKey);
      inventory = await fetchInventoryData();
      cache.set(cacheKey, inventory, 10);
    } else {
      inventory = await withCache(cacheKey, fetchInventoryData, 10);
    }

    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=20');
    res.json(inventory);
  } catch (error) {
    console.error('[ERROR] getUserInventory:', error);
    res.status(500).json({ error: "Failed to get user inventory" });
  } finally {
    console.timeEnd(timerLabel);
  }
}

/**
 * POST /api/user/:userId/resources/update - Atomic resource updates
 * Accepts multiple resource changes in single transaction
 */
export async function updateUserResources(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { credits, suns, hearts, dna, tickets } = req.body;
  const { postgresStorage: storage } = await import('./postgresStorage');
    
    console.time(`[PERF] updateUserResources(${userId})`);
    
    // Atomic update in single query using SQL
    const updates: any = {};
    if (credits !== undefined) updates.credits = credits;
    if (suns !== undefined) updates.suns = suns;
    if (hearts !== undefined) updates.hearts = hearts; 
    if (dna !== undefined) updates.dna = dna;
    if (tickets !== undefined) updates.tickets = tickets;
    
    if (Object.keys(updates).length === 0) {
      console.timeEnd(`[PERF] updateUserResources(${userId})`);
      return res.status(400).json({ error: "No updates provided" });
    }
    
    // Single atomic update
    const updatedUser = await storage.atomicUpdateUser(userId, updates);
    
    console.timeEnd(`[PERF] updateUserResources(${userId})`);
    invalidateUserResourceCache(userId);
    
    res.json({
      success: true,
      resources: {
        credits: updatedUser.credits,
        suns: updatedUser.suns,
        hearts: updatedUser.hearts, 
        dna: updatedUser.dna,
        tickets: updatedUser.tickets
      }
    });
    
  } catch (error) {
    console.error('[ERROR] updateUserResources:', error);
    res.status(500).json({ error: "Failed to update user resources" });
  }
}

/**
 * Database warm-up endpoint - keeps connection alive
 */
export async function warmupDatabase(req: Request, res: Response) {
  try {
  const { postgresStorage: storage } = await import('./postgresStorage');
    console.time(`[PERF] warmupDatabase`);
    
    // Simple query to keep connection warm
  await storage.warmupDatabase();
    
    console.timeEnd(`[PERF] warmupDatabase`);
    res.json({ success: true, message: "Database warmed up" });
    
  } catch (error) {
    console.error('[ERROR] warmupDatabase:', error);
    res.status(500).json({ error: "Failed to warm up database" });
  }
}
