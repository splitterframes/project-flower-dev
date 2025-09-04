import { postgresStorage } from './postgresStorage.js';
import { RarityTier } from '../shared/rarity.js';

/**
 * Server-side Butterfly Lifecycle System
 * Handles: Butterfly placed → 5s wiggle → 10s shrink → Caterpillar spawn
 * NO frontend timers needed - server does everything!
 */
export class ButterflyLifecycle {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lifecycleTimers = new Map<string, NodeJS.Timeout>();

  start() {
    if (this.isRunning) {
      console.log('🐛 Butterfly lifecycle already running');
      return;
    }

    this.isRunning = true;
    console.log('🐛 Starting butterfly lifecycle system...');
    
    // Check every 2 seconds for precise timing
    this.intervalId = setInterval(() => {
      this.checkButterflyLifecycles();
    }, 2000);

    // Run immediately once
    this.checkButterflyLifecycles();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Clear all lifecycle timers
    this.lifecycleTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.lifecycleTimers.clear();
    
    this.isRunning = false;
    console.log('🐛 Butterfly lifecycle stopped');
  }

  private async checkButterflyLifecycles() {
    try {
      // Get all users with butterflies
      const allUsers = await postgresStorage.getAllUsersWithStatus();
      
      for (const user of allUsers) {
        try {
          const fieldButterflies = await postgresStorage.getFieldButterflies(user.id);
          
          for (const butterfly of fieldButterflies) {
            const butterflyKey = `${user.id}-${butterfly.fieldIndex}`;
            
            // Skip if already has lifecycle timer
            if (this.lifecycleTimers.has(butterflyKey)) {
              continue;
            }

            // Calculate time since butterfly was placed
            const spawnedAt = new Date(butterfly.spawnedAt || butterfly.createdAt);
            const timeAlive = Date.now() - spawnedAt.getTime();

            // Only start lifecycle for butterflies placed less than 1 second ago
            if (timeAlive > 1000) {
              continue;
            }

            console.log(`🐛 LIFECYCLE: Starting for butterfly on field ${butterfly.fieldIndex} (user ${user.id})`);

            // Create lifecycle timer: 5s wiggle + 10s shrink + caterpillar spawn
            const lifecycleTimer = setTimeout(async () => {
              console.log(`🐛 LIFECYCLE: Field ${butterfly.fieldIndex} → spawning caterpillar`);
              
              try {
                // Spawn caterpillar with inherited rarity
                const spawnResponse = await postgresStorage.spawnCaterpillarOnField(
                  user.id,
                  butterfly.fieldIndex,
                  butterfly.butterflyRarity as RarityTier || 'common'
                );

                if (spawnResponse) {
                  console.log(`✅ LIFECYCLE: Caterpillar spawned on field ${butterfly.fieldIndex}`);
                  
                  // Remove butterfly from database
                  await postgresStorage.removeFieldButterfly(user.id, butterfly.fieldIndex);
                  console.log(`✅ LIFECYCLE: Butterfly removed from field ${butterfly.fieldIndex}`);
                } else {
                  console.error(`❌ LIFECYCLE: Failed to spawn caterpillar on field ${butterfly.fieldIndex}`);
                }
              } catch (error) {
                console.error(`❌ LIFECYCLE: Error processing field ${butterfly.fieldIndex}:`, error);
              }

              // Clean up timer
              this.lifecycleTimers.delete(butterflyKey);
            }, 15000); // 15 seconds total (5s wiggle + 10s shrink)

            // Store the timer
            this.lifecycleTimers.set(butterflyKey, lifecycleTimer);
          }
        } catch (error) {
          console.error(`❌ LIFECYCLE: Error processing user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ LIFECYCLE: Error in checkButterflyLifecycles:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasActiveTimer: this.intervalId !== null,
      activeLifecycles: this.lifecycleTimers.size
    };
  }
}

// Export singleton instance
export const butterflyLifecycle = new ButterflyLifecycle();