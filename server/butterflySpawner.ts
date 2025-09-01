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
            
            // 4-Slot System: Each bouquet has exactly 4 spawn opportunities (one per slot)
            const currentSlot = (placedBouquet as any).currentSpawnSlot || 1;
            
            if (currentSlot > 4) {
              continue; // This bouquet has completed all 4 spawn slots
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
              console.log(`✨ User ${user.id}: Butterfly spawned on field ${result.fieldIndex}: ${result.fieldButterfly?.butterflyName} from ${rarity} bouquet #${placedBouquet.bouquetId}! (Slot ${currentSlot}/4)`);
              
              // Advance to next spawn slot
              await storage.updateBouquetNextSpawnTime(placedBouquet.id, currentSlot);
            } else {
              // Spawn failed due to probability check - still advance to next slot
              console.log(`🎲 User ${user.id}: Spawn probability check failed for ${rarity} bouquet #${placedBouquet.bouquetId} (Slot ${currentSlot}/4)`);
              await storage.updateBouquetNextSpawnTime(placedBouquet.id, currentSlot);
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
  
  // 4-Slot System: No longer needed as slots are managed by storage

  // Force a spawn check (for testing or manual triggers)
  async forceSpawnCheck() {
    console.log('🦋 Forcing individual butterfly spawn check...');
    await this.checkForButterflySpawns();
  }

  // 4-Slot System: Removed max spawns - now determined by slot completion

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasActiveTimer: this.intervalId !== null
    };
  }
}

// Export singleton instance
export const butterflySpawner = new ButterflySpawner();