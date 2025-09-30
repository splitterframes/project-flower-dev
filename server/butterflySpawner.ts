import { postgresStorage as storage, type BouquetSpawnCandidate } from './postgresStorage';
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
      
      const readyBouquets = await storage.getBouquetsReadyToSpawn(currentTime);

      if (readyBouquets.length === 0) {
        console.log('🦋 No bouquets ready to spawn in this cycle');
        return;
      }

      const bouquetsByUser = new Map<number, BouquetSpawnCandidate[]>();
      for (const bouquet of readyBouquets) {
        const list = bouquetsByUser.get(bouquet.userId) ?? [];
        list.push(bouquet);
        bouquetsByUser.set(bouquet.userId, list);
      }

      let blockedDueToFields = 0;
      let probabilityFailures = 0;

      for (const [userId, bouquets] of bouquetsByUser.entries()) {
        try {
          const totalSlots = 4;
          const existingButterflies = await storage.getFieldButterflies(userId);
          const butterfliesPerBouquet = new Map<number, number>();
          for (const butterfly of existingButterflies) {
            if (typeof butterfly.bouquetId === 'number') {
              butterfliesPerBouquet.set(
                butterfly.bouquetId,
                (butterfliesPerBouquet.get(butterfly.bouquetId) || 0) + 1
              );
            }
          }

          for (const bouquet of bouquets) {
            totalChecked++;

            const currentSlot = bouquet.currentSpawnSlot || 1;
            if (currentSlot > totalSlots) {
              continue;
            }

            const butterflyCount = butterfliesPerBouquet.get(bouquet.bouquetId) || 0;
            const rarity = bouquet.bouquetRarity as RarityTier || 'common';

            const result = await storage.spawnButterflyOnFieldWithSlot(
              userId,
              bouquet.bouquetId,
              rarity,
              currentSlot,
              totalSlots,
              butterflyCount
            );

            if (result.success) {
              totalSpawns++;
              if (result.fieldButterfly) {
                existingButterflies.push(result.fieldButterfly);
                butterfliesPerBouquet.set(bouquet.bouquetId, butterflyCount + 1);
                console.log(`✨ User ${userId}: Butterfly spawned on field ${result.fieldIndex}: ${result.fieldButterfly.butterflyName} from ${rarity} bouquet #${bouquet.bouquetId}! (Slot ${currentSlot}/${totalSlots})`);
              } else {
                console.warn(`✨ User ${userId}: Butterfly spawned but no field butterfly returned for bouquet #${bouquet.bouquetId}`);
              }

              await storage.updateBouquetNextSpawnTime(userId, bouquet.fieldIndex, new Date());
            } else {
              switch (result.reason) {
                case 'NO_FREE_FIELD':
                  blockedDueToFields++;
                  console.warn(`🚫 User ${userId}: Garden full, bouquet #${bouquet.bouquetId} (Slot ${currentSlot}/${totalSlots}) will retry in 60s`);
                  await storage.scheduleBouquetSpawnRetry(userId, bouquet.bouquetId, bouquet.fieldIndex);
                  break;
                case 'BOUQUET_NOT_FOUND':
                  console.warn(`⚠️ User ${userId}: Bouquet #${bouquet.bouquetId} missing during spawn attempt`);
                  break;
                case 'ERROR':
                  console.error(`❌ User ${userId}: Error spawning from bouquet #${bouquet.bouquetId}, scheduling retry in 120s`);
                  await storage.scheduleBouquetSpawnRetry(userId, bouquet.bouquetId, bouquet.fieldIndex, 120 * 1000);
                  break;
                case 'PROBABILITY_FAIL':
                default:
                  probabilityFailures++;
                  console.log(`🎲 User ${userId}: Spawn probability check failed for ${rarity} bouquet #${bouquet.bouquetId} (Slot ${currentSlot}/${totalSlots})`);
                  await storage.updateBouquetNextSpawnTime(userId, bouquet.fieldIndex, new Date());
                  break;
              }
            }
          }
        } catch (error) {
          console.error(`🦋 Error processing bouquets for user ${userId}:`, error);
        }
      }

      if (totalSpawns > 0) {
        console.log(`🦋 Individual spawn cycle complete: ${totalSpawns} butterflies spawned from ${totalChecked} bouquets checked`);
      } else {
        console.log(`🦋 Individual spawn cycle complete: No butterflies spawned (${totalChecked} bouquets checked)`);
      }

      if (blockedDueToFields > 0) {
        console.warn(`🦋 ${blockedDueToFields} bouquet spawn attempts blocked due to full gardens`);
      }

      if (probabilityFailures > 0) {
        console.log(`🦋 ${probabilityFailures} spawn attempts failed probability checks this cycle`);
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