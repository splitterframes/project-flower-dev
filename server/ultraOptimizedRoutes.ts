/**
 * Ultra-optimized routes that combine multiple database queries
 * Reduces 10+ API calls to 1-2 calls
 */
import { Request, Response } from "express";
import { cache, CacheKeys, withCache } from "./cache";
import type { AuthenticatedRequest } from "./auth";

/**
 * GET /api/user/:userId/complete-state - Everything the game needs in one call
 * Combines: credits, suns, hearts, dna, tickets, butterflies, flowers, seeds, bouquets
 * Frontend can use this instead of 8+ separate API calls
 */
export async function getUserCompleteState(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.validatedUserId!;
    
    console.time(`[PERF] getUserCompleteState(${userId})`);
    
    const { postgresStorage: storage } = await import('./postgresStorage');
    
    // Use cache with 15 second TTL - longer than individual calls
    const cacheKey = `user:${userId}:complete-state`;
    const result = await withCache(cacheKey, async () => {
      
      // Execute all queries in parallel for maximum speed
      const [
        user,
        butterflies, 
        caterpillars,
        fish,
        flowers,
        seeds,
        bouquets,
        exhibitionButterflies,
        fieldButterflies,
        unlockedFeatures,
        placedBouquets
      ] = await Promise.all([
        storage.getUser(userId),
        storage.getUserButterflies(userId),
        storage.getUserCaterpillars(userId),
        storage.getUserFish(userId), 
        storage.getUserFlowers(userId),
        storage.getUserSeeds(userId),
        storage.getUserBouquets(userId),
        storage.getUserExhibitionButterflies(userId),
        storage.getUserFieldButterflies(userId),
        storage.getUnlockedFeatures(userId),
        storage.getUserPlacedBouquets(userId)
      ]);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      return {
        // Resources
        resources: {
          credits: user.credits,
          suns: user.suns,
          hearts: user.hearts,
          dna: user.dna, 
          tickets: user.tickets
        },
        // Inventory
        inventory: {
          butterflies,
          caterpillars,
          fish,
          flowers,
          seeds,
          bouquets
        },
        // Game state
        game: {
          exhibitionButterflies,
          fieldButterflies,
          unlockedFeatures,
          placedBouquets
        },
        lastUpdated: new Date().toISOString()
      };
      
    }, 15); // 15 second cache
    
    console.timeEnd(`[PERF] getUserCompleteState(${userId})`);
    
    // Cache headers for browser
    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    res.json(result);
    
  } catch (error) {
    console.error('[ERROR] getUserCompleteState:', error);
    if (error.message === "User not found") {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: "Failed to get complete user state" });
    }
  }
}

/**
 * GET /api/user/:userId/garden-state - All garden-related data in one call
 * Combines: field butterflies, field flowers, field fish, caterpillars, sun spawns, pond progress
 */
export async function getUserGardenState(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.validatedUserId!;
    
    console.time(`[PERF] getUserGardenState(${userId})`);
    
    const { postgresStorage: storage } = await import('./postgresStorage');
    
    // Cache for 10 seconds since garden state changes frequently
    const cacheKey = `user:${userId}:garden-state`;
    const result = await withCache(cacheKey, async () => {
      
      const [
        fieldButterflies,
        fieldFlowers, 
        fieldFish,
        fieldCaterpillars,
        sunSpawns,
        pondProgress,
        unlockedFields
      ] = await Promise.all([
        storage.getUserFieldButterflies(userId),
        storage.getUserFieldFlowers(userId),
        storage.getUserFieldFish(userId),
        storage.getUserFieldCaterpillars(userId),
        storage.getSunSpawns(userId),
        storage.getUserPondProgress(userId),
        storage.getUnlockedFields(userId)
      ]);
      
      return {
        fieldButterflies,
        fieldFlowers,
        fieldFish, 
        fieldCaterpillars,
        sunSpawns,
        pondProgress,
        unlockedFields,
        lastUpdated: new Date().toISOString()
      };
      
    }, 10); // 10 second cache
    
    console.timeEnd(`[PERF] getUserGardenState(${userId})`);
    
    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=20');
    res.json(result);
    
  } catch (error) {
    console.error('[ERROR] getUserGardenState:', error);
    res.status(500).json({ error: "Failed to get garden state" });
  }
}

/**
 * POST /api/exhibition/sell-status-ultra-batch - Optimized batch endpoint
 * Handles all exhibition butterflies in one call with aggressive caching
 */
export async function getExhibitionSellStatusUltraBatch(req: Request, res: Response) {
  try {
    const userId = parseInt(req.headers['x-user-id'] as string) || 4;
    const { butterflyIds = [] } = req.body;
    
    console.time(`[PERF] getExhibitionSellStatusUltraBatch(${userId})`);
    
    // Validate input
    if (!Array.isArray(butterflyIds) || butterflyIds.length === 0) {
      return res.status(400).json({ error: "butterflyIds array required" });
    }
    
    const { postgresStorage: storage } = await import('./postgresStorage');
    
    // Use individual caching for each butterfly (30 second TTL)
    const results: { [key: string]: any } = {};
    
    await Promise.all(butterflyIds.map(async (butterflyId: number) => {
      const cacheKey = CacheKeys.EXHIBITION_SELL_STATUS(butterflyId);
      
      try {
        const result = await withCache(cacheKey, async () => {
          const exhibitionButterfly = await storage.getExhibitionButterflyById(userId, butterflyId);
          if (!exhibitionButterfly) {
            throw new Error("Butterfly not found");
          }
          
          const [canSell, timeRemaining, likesCount] = await Promise.all([
            storage.canSellButterfly(userId, butterflyId),
            storage.getTimeUntilSellable(userId, butterflyId),
            storage.getFrameLikesCount(exhibitionButterfly.frameId)
          ]);
          
          return {
            canSell,
            timeRemainingMs: timeRemaining,
            likesCount,
            frameId: exhibitionButterfly.frameId
          };
        }, 30); // 30 second cache for sell status
        
        results[`butterfly-${butterflyId}`] = result;
        
      } catch (error) {
        // Skip failed butterflies instead of failing entire request
        console.warn(`Failed to get sell status for butterfly ${butterflyId}:`, error.message);
        results[`butterfly-${butterflyId}`] = {
          canSell: false,
          timeRemainingMs: 72 * 60 * 60 * 1000,
          likesCount: 0,
          frameId: 0,
          error: "Not found"
        };
      }
    }));
    
    console.timeEnd(`[PERF] getExhibitionSellStatusUltraBatch(${userId})`);
    
    // Long cache since this data doesn't change frequently
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json(results);
    
  } catch (error) {
    console.error('[ERROR] getExhibitionSellStatusUltraBatch:', error);
    res.status(500).json({ error: "Failed to get exhibition sell status" });
  }
}

/**
 * GET /api/static/game-data - All static game data that never changes
 * Combines: bouquet recipes, weekly challenge, seed data, rarity info
 */
export async function getStaticGameData(req: Request, res: Response) {
  try {
    console.time(`[PERF] getStaticGameData`);
    
    const result = await withCache('static:game-data', async () => {
      const { postgresStorage: storage } = await import('./postgresStorage');
      
      const [bouquetRecipes, weeklyChallenge] = await Promise.all([
        storage.getBouquetRecipes(),
        storage.getCurrentWeeklyChallenge()
      ]);
      
      return {
        bouquetRecipes,
        weeklyChallenge,
        rarityTiers: ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'],
        lastUpdated: new Date().toISOString()
      };
      
    }, 3600); // 1 hour cache for static data
    
    console.timeEnd(`[PERF] getStaticGameData`);
    
    // Very long cache for static data
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800');
    res.json(result);
    
  } catch (error) {
    console.error('[ERROR] getStaticGameData:', error);
    res.status(500).json({ error: "Failed to get static game data" });
  }
}
