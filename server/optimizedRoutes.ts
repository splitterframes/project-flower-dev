/**
 * Optimized API routes to reduce database queries and improve performance
 */
import { Request, Response } from "express";

/**
 * GET /api/user/:userId/resources - Aggregated user resources in single query
 * Replaces separate calls to credits, suns, hearts, dna, tickets
 */
export async function getUserResources(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { storage } = await import('./storage');
    
    console.time(`[PERF] getUserResources(${userId})`);
    
    // Get all resources in single database call
    const user = await storage.getUser(userId);
    if (!user) {
      console.timeEnd(`[PERF] getUserResources(${userId})`);
      return res.status(404).json({ error: "User not found" });
    }
    
    const resources = {
      credits: user.credits,
      suns: user.suns,  
      hearts: user.hearts,
      dna: user.dna,
      tickets: user.tickets,
      lastUpdated: new Date().toISOString()
    };
    
    console.timeEnd(`[PERF] getUserResources(${userId})`);
    
    // Cache for 5 seconds
    res.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');
    res.json(resources);
    
  } catch (error) {
    console.error('[ERROR] getUserResources:', error);
    res.status(500).json({ error: "Failed to get user resources" });
  }
}

/**
 * GET /api/user/:userId/inventory - Aggregated inventory in single query
 * Combines butterflies, caterpillars, fish, flowers, seeds, bouquets
 */
export async function getUserInventory(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { storage } = await import('./storage');
    
    console.time(`[PERF] getUserInventory(${userId})`);
    
    // Parallel database queries for inventory items
    const [butterflies, caterpillars, fish, flowers, seeds, bouquets] = await Promise.all([
      storage.getUserButterflies(userId),
      storage.getUserCaterpillars(userId), 
      storage.getUserFish(userId),
      storage.getUserFlowers(userId),
      storage.getUserSeeds(userId),
      storage.getUserBouquets(userId)
    ]);
    
    const inventory = {
      butterflies,
      caterpillars, 
      fish,
      flowers,
      seeds,
      bouquets,
      lastUpdated: new Date().toISOString()
    };
    
    console.timeEnd(`[PERF] getUserInventory(${userId})`);
    
    // Cache for 10 seconds since inventory changes less frequently
    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=20');
    res.json(inventory);
    
  } catch (error) {
    console.error('[ERROR] getUserInventory:', error);
    res.status(500).json({ error: "Failed to get user inventory" });
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
    const { storage } = await import('./storage');
    
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
    const { storage } = await import('./storage');
    console.time(`[PERF] warmupDatabase`);
    
    // Simple query to keep connection warm
    await storage.db.execute('SELECT 1 as warmup');
    
    console.timeEnd(`[PERF] warmupDatabase`);
    res.json({ success: true, message: "Database warmed up" });
    
  } catch (error) {
    console.error('[ERROR] warmupDatabase:', error);
    res.status(500).json({ error: "Failed to warm up database" });
  }
}
