import { storage } from './storage';
import type { RarityTier } from '@shared/rarity';

/**
 * Individual Butterfly Spawning System
 * - Checks bouquets every 60 seconds for individual spawn times
 * - Each bouquet has its own nextSpawnAt timestamp
 * - Spawns butterflies based on bouquet rarity and individual timing
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
    
    // Individual timing checks every 60 seconds
    const CHECK_INTERVAL = 60 * 1000; // 1 minute
    
    const scheduleNext = () => {
      if (!this.isRunning) return;
      
      console.log(`🦋 Next butterfly check in 1:00 minute`);
      
      this.intervalId = setTimeout(() => {
        this.checkForButterflySpawns();
        scheduleNext(); // Schedule the next check
      }, CHECK_INTERVAL);
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
      console.log('🦋 Checking individual bouquet spawn times...');
      
      const currentTime = new Date();
      let totalSpawns = 0;
      let totalChecked = 0;
      
      // Get all users with active bouquets  
      const allUsers = await storage.getAllUsersWithStatus();
      
      for (const user of allUsers) {
        try {
          const placedBouquets = await storage.getPlacedBouquets(user.id);
          const activeBouquets = placedBouquets.filter(pb => new Date(pb.expiresAt) > currentTime);
          
          if (activeBouquets.length === 0) {
            continue; // Skip this user, no active bouquets
          }
          
          for (const placedBouquet of activeBouquets) {
            totalChecked++;
            
            // Check if this bouquet is ready to spawn (individual timing)
            const nextSpawnTime = new Date((placedBouquet as any).nextSpawnAt);
            if (currentTime < nextSpawnTime) {
              continue; // Not time yet for this bouquet
            }
            
            // Check how many butterflies already spawned for this bouquet
            const existingButterflies = await storage.getFieldButterflies(user.id);
            const butterflyCount = existingButterflies.filter(fb => fb.bouquetId === placedBouquet.bouquetId).length;
            
            // Each bouquet can spawn 2-4 butterflies over 21 minutes
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
              
              // Set next spawn time for this bouquet (1-5 minutes from now)
              await this.setNextSpawnTime(placedBouquet.id, currentTime);
            }
          }
        } catch (error) {
          console.error(`🦋 Error checking bouquets for user ${user.id}:`, error);
        }
      }
      
      if (totalSpawns > 0) {
        console.log(`🦋 Individual spawn cycle complete: ${totalSpawns} butterflies spawned from ${totalChecked} bouquets checked`);
      } else {
        console.log(`🦋 Individual spawn cycle complete: No butterflies spawned (${totalChecked} bouquets checked)`);
      }
      
    } catch (error) {
      console.error('🦋 Error in individual butterfly spawn check:', error);
    }
  }
  
  // Set individual next spawn time for a bouquet (1-5 minutes from now)
  private async setNextSpawnTime(placedBouquetId: number, fromTime: Date) {
    try {
      // Random spawn time between 1-5 minutes
      const minMinutes = 1;
      const maxMinutes = 5;
      const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
      const nextSpawnTime = new Date(fromTime.getTime() + randomMinutes * 60 * 1000);
      
      await storage.updateBouquetNextSpawnTime(placedBouquetId, nextSpawnTime);
      console.log(`🦋 Next spawn for bouquet #${placedBouquetId} set to ${nextSpawnTime.toLocaleTimeString()} (in ${randomMinutes} minutes)`);
    } catch (error) {
      console.error(`🦋 Error setting next spawn time for bouquet ${placedBouquetId}:`, error);
    }
  }

  // Force a spawn check (for testing or manual triggers)
  async forceSpawnCheck() {
    console.log('🦋 Forcing individual butterfly spawn check...');
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