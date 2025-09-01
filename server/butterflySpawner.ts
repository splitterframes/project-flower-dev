import { storage } from './storage';
import type { RarityTier } from '@shared/rarity';

/**
 * Butterfly Spawning System
 * - Checks active bouquets every 1-5 minutes
 * - Spawns butterflies based on bouquet rarity
 * - Automatically manages expired bouquets
 */
export class ButterflySpawner {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('🦋 Butterfly spawner already running');
      return;
    }

    this.isRunning = true;
    console.log('🦋 Starting butterfly spawning system...');
    
    // Run immediately once, then start interval
    this.checkForButterflySpawns();
    
    // Fixed 5-minute interval (300000ms)
    const SPAWN_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    const scheduleNext = () => {
      if (!this.isRunning) return;
      
      console.log(`🦋 Next butterfly check in 5:00 minutes`);
      
      this.intervalId = setTimeout(() => {
        this.checkForButterflySpawns();
        scheduleNext(); // Schedule the next check
      }, SPAWN_INTERVAL);
    };

    scheduleNext();
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🦋 Butterfly spawner stopped');
  }

  private async checkForButterflySpawns() {
    try {
      console.log('🦋 Checking for butterfly spawns...');
      
      const currentTime = new Date();
      let totalSpawns = 0;
      
      // Get all users with active bouquets  
      const allUsers = await storage.getAllUsersWithStatus();
      
      for (const user of allUsers) {
        try {
          const placedBouquets = await storage.getPlacedBouquets(user.id);
          
          // Check for active bouquets for butterfly spawning (skip expired ones)  
          const activeBouquets = placedBouquets.filter(pb => new Date(pb.expiresAt) > currentTime);
          
          if (activeBouquets.length === 0) {
            continue; // Skip this user, no active bouquets
          }
          
          console.log(`🦋 User ${user.id}: Found ${activeBouquets.length} active bouquets`);
          
          for (const placedBouquet of activeBouquets) {
            // Check how many butterflies already spawned for this bouquet
            const existingButterflies = await storage.getFieldButterflies(user.id);
            const butterflyCount = existingButterflies.filter(fb => fb.bouquetId === placedBouquet.bouquetId).length;
            
            // Each bouquet can spawn 1-4 butterflies over 21 minutes (every 5 minutes)
            // So after 4 spawns (20 minutes), stop spawning
            const maxSpawns = this.getBouquetMaxSpawns((placedBouquet as any).bouquetRarity as RarityTier);
            
            if (butterflyCount >= maxSpawns) {
              continue; // This bouquet has reached its spawn limit
            }
            
            // Use the rarity stored in the placed bouquet
            const rarity = (placedBouquet as any).bouquetRarity as RarityTier || 'common';
            
            const result = await storage.spawnButterflyOnField(
              user.id, 
              placedBouquet.bouquetId, 
              rarity
            );
            
            if (result.success) {
              totalSpawns++;
              console.log(`✨ User ${user.id}: Butterfly spawned on field ${result.fieldIndex}: ${result.fieldButterfly?.butterflyName} from ${rarity} bouquet #${placedBouquet.bouquetId}! (${butterflyCount + 1}/${maxSpawns})`);
            }
          }
        } catch (error) {
          console.error(`🦋 Error checking bouquets for user ${user.id}:`, error);
        }
      }
      
      if (totalSpawns > 0) {
        console.log(`🦋 Spawn cycle complete: ${totalSpawns} butterflies spawned across all users`);
      } else {
        console.log('🦋 Spawn cycle complete: No butterflies spawned this time');
      }
      
    } catch (error) {
      console.error('🦋 Error in butterfly spawn check:', error);
    }
  }

  // Force a spawn check (for testing or manual triggers)
  async forceSpawnCheck() {
    console.log('🦋 Forcing butterfly spawn check...');
    await this.checkForButterflySpawns();
  }

  // Determine max spawns (always random 2-4 butterflies regardless of rarity)
  private getBouquetMaxSpawns(rarity: RarityTier): number {
    // Random 2-4 butterflies per bouquet (independent of rarity)
    return Math.floor(Math.random() * 3) + 2; // 2-4 butterflies
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasActiveTimer: this.intervalId !== null
    };
  }
}

// Export singleton instance
export const butterflySpawner = new ButterflySpawner();