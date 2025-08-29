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
    
    // Random interval between 1-5 minutes (60000ms - 300000ms)
    const getRandomInterval = () => Math.floor(Math.random() * 240000) + 60000;
    
    const scheduleNext = () => {
      if (!this.isRunning) return;
      
      const nextInterval = getRandomInterval();
      console.log(`🦋 Next butterfly check in ${Math.floor(nextInterval / 60000)}:${Math.floor((nextInterval % 60000) / 1000).toString().padStart(2, '0')} minutes`);
      
      this.intervalId = setTimeout(() => {
        this.checkForButterflySpawns();
        scheduleNext(); // Schedule the next check
      }, nextInterval);
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
      
      // Get all active (non-expired) placed bouquets
      const currentTime = new Date();
      
      // For now, we'll check for user ID 1 (the main user)
      // In a real system, we'd iterate through all users
      const userId = 1;
      let totalSpawns = 0;
      
      try {
        const placedBouquets = await storage.getPlacedBouquets(userId);
        const activeBouquets = placedBouquets.filter(pb => new Date(pb.expiresAt) > currentTime);
        
        if (activeBouquets.length === 0) {
          console.log('🦋 No active bouquets found');
          return;
        }
        
        console.log(`🦋 Found ${activeBouquets.length} active bouquets`);
        
        for (const placedBouquet of activeBouquets) {
          // Use the rarity stored in the placed bouquet
          const rarity = (placedBouquet as any).bouquetRarity as RarityTier || 'common';
          
          const result = await storage.spawnButterflyFromBouquet(
            userId, 
            placedBouquet.bouquetId, 
            rarity
          );
          
          if (result.success) {
            totalSpawns++;
            console.log(`✨ Spawned butterfly from ${rarity} bouquet #${placedBouquet.bouquetId}!`);
          }
        }
      } catch (error) {
        console.error('🦋 Error checking bouquets for user:', error);
      }
      
      if (totalSpawns > 0) {
        console.log(`🦋 Spawn cycle complete: ${totalSpawns} butterflies spawned`);
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

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasActiveTimer: this.intervalId !== null
    };
  }
}

// Export singleton instance
export const butterflySpawner = new ButterflySpawner();