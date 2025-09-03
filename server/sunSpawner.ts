import { postgresStorage as storage } from './postgresStorage';

class SunSpawner {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) {
      console.log('☀️ Sun spawner already running');
      return;
    }

    this.isRunning = true;
    console.log('☀️ Starting sun spawning system...');
    
    // Start immediately, then set up intervals
    this.scheduleNextSpawn();
    this.startCleanupTimer();
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('☀️ Sun spawning system stopped');
  }

  private scheduleNextSpawn() {
    if (!this.isRunning) return;

    // Random interval between 1-3 minutes (60-180 seconds)
    const minInterval = 60 * 1000; // 1 minute
    const maxInterval = 180 * 1000; // 3 minutes
    const nextSpawnInterval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

    console.log(`☀️ Next sun spawn in ${Math.round(nextSpawnInterval / 1000)} seconds`);

    this.intervalId = setTimeout(async () => {
      await this.attemptSunSpawn();
      this.scheduleNextSpawn(); // Schedule the next spawn
    }, nextSpawnInterval);
  }

  private async attemptSunSpawn() {
    try {
      console.log('☀️ Attempting to spawn sun...');

      // Get all users with unlocked fields
      const allUsers = await storage.getAllUsersWithStatus();
      
      if (allUsers.length === 0) {
        console.log('☀️ No users found, skipping sun spawn');
        return;
      }

      let spawnedAny = false;

      // Try to spawn a sun for each user on inactive fields
      for (const user of allUsers) {
        try {
          console.log(`☀️ Processing user ${user.username} (ID: ${user.id})`);
          
          // Get user's unlocked fields
          const unlockedFields = await storage.getUnlockedFields(user.id);
          const unlockedFieldIndices = unlockedFields.map(field => field.fieldIndex);
          console.log(`☀️ User ${user.username} unlocked fields:`, unlockedFieldIndices);
          
          // Calculate which fields are "unlock fields" (adjacent to unlocked fields)
          const unlockFieldIndices: number[] = [];
          for (const fieldIndex of unlockedFieldIndices) {
            // Add adjacent fields as unlock fields
            const row = Math.floor(fieldIndex / 10);
            const col = fieldIndex % 10;
            
            // Check all 8 directions (including diagonal) to match frontend logic
            const adjacents = [
              (row - 1) * 10 + (col - 1), // up-left
              (row - 1) * 10 + col,       // up
              (row - 1) * 10 + (col + 1), // up-right
              row * 10 + (col - 1),       // left
              row * 10 + (col + 1),       // right
              (row + 1) * 10 + (col - 1), // down-left
              (row + 1) * 10 + col,       // down
              (row + 1) * 10 + (col + 1)  // down-right
            ];
            
            for (const adj of adjacents) {
              if (adj >= 0 && adj < 50 && !unlockedFieldIndices.includes(adj) && !unlockFieldIndices.includes(adj)) {
                unlockFieldIndices.push(adj);
              }
            }
          }
          console.log(`☀️ User ${user.username} unlock fields:`, unlockFieldIndices);
          
          // Find inactive fields (not unlocked, not unlock fields)
          const inactiveFields: number[] = [];
          for (let fieldIndex = 0; fieldIndex < 50; fieldIndex++) {
            if (!unlockedFieldIndices.includes(fieldIndex) && !unlockFieldIndices.includes(fieldIndex)) {
              inactiveFields.push(fieldIndex);
            }
          }
          console.log(`☀️ User ${user.username} has ${inactiveFields.length} inactive fields available`);

          if (inactiveFields.length === 0) {
            console.log(`☀️ User ${user.username} has no inactive fields for sun spawn`);
            continue;
          }

          // Check if any inactive field already has an active sun
          const fieldsWithoutActiveSuns: number[] = [];
          for (const fieldIndex of inactiveFields) {
            const activeSun = await storage.getActiveSunOnField(fieldIndex);
            if (!activeSun) {
              fieldsWithoutActiveSuns.push(fieldIndex);
            }
          }

          console.log(`☀️ User ${user.username} has ${fieldsWithoutActiveSuns.length} inactive fields without active suns`);

          if (fieldsWithoutActiveSuns.length === 0) {
            console.log(`☀️ User ${user.username}: All inactive fields already have active suns`);
            continue;
          }

          // Pick a random inactive field
          const randomFieldIndex = fieldsWithoutActiveSuns[Math.floor(Math.random() * fieldsWithoutActiveSuns.length)];
          
          // TRIPLE-CHECK: Ultra-safe verification system
          const finalUnlockedFields = await storage.getUnlockedFields(user.id);
          const finalUnlockedIndices = finalUnlockedFields.map(field => field.fieldIndex);
          
          // Recalculate unlock fields to be 100% sure
          const finalUnlockFields: number[] = [];
          for (const fieldIndex of finalUnlockedIndices) {
            const row = Math.floor(fieldIndex / 10);
            const col = fieldIndex % 10;
            
            const adjacents = [
              (row - 1) * 10 + (col - 1), // up-left
              (row - 1) * 10 + col,       // up
              (row - 1) * 10 + (col + 1), // up-right
              row * 10 + (col - 1),       // left
              row * 10 + (col + 1),       // right
              (row + 1) * 10 + (col - 1), // down-left
              (row + 1) * 10 + col,       // down
              (row + 1) * 10 + (col + 1)  // down-right
            ];
            
            for (const adj of adjacents) {
              if (adj >= 0 && adj < 50 && !finalUnlockedIndices.includes(adj) && !finalUnlockFields.includes(adj)) {
                finalUnlockFields.push(adj);
              }
            }
          }
          
          // ABSOLUTE FINAL CHECK: No spawn on unlocked OR unlock fields
          if (finalUnlockedIndices.includes(randomFieldIndex)) {
            console.log(`☀️ CRITICAL ERROR: Attempted to spawn sun on UNLOCKED field ${randomFieldIndex} for user ${user.username}! ABORT!`);
            continue;
          }
          
          if (finalUnlockFields.includes(randomFieldIndex)) {
            console.log(`☀️ CRITICAL ERROR: Attempted to spawn sun on UNLOCK field ${randomFieldIndex} for user ${user.username}! ABORT!`);
            console.log(`☀️ Final unlocked fields: [${finalUnlockedIndices.join(', ')}]`);
            console.log(`☀️ Final unlock fields: [${finalUnlockFields.join(', ')}]`);
            continue;
          }
          
          console.log(`☀️ VERIFIED SAFE: Field ${randomFieldIndex} is neither unlocked nor unlock field for user ${user.username}`);

          // Spawn sun on the selected inactive field
          const result = await storage.spawnSun(randomFieldIndex, user.id);
          
          if (result.success) {
            console.log(`☀️ Successfully spawned ${result.sunAmount} suns on inactive field ${randomFieldIndex} for user ${user.username}`);
            spawnedAny = true;
          } else {
            console.log(`☀️ Failed to spawn sun on inactive field ${randomFieldIndex} for user ${user.username}`);
          }
          
        } catch (error) {
          console.error(`☀️ Error processing user ${user.username}:`, error);
        }
      }

      if (!spawnedAny) {
        console.log('☀️ No suns spawned in this cycle');
      }

    } catch (error) {
      console.error('☀️ Error during sun spawn attempt:', error);
    }
  }

  private startCleanupTimer() {
    // Clean up expired suns every 30 seconds
    const cleanupInterval = 30 * 1000; // 30 seconds
    
    const scheduleCleanup = () => {
      if (!this.isRunning) return;
      
      setTimeout(async () => {
        await storage.cleanupExpiredSuns();
        scheduleCleanup(); // Schedule next cleanup
      }, cleanupInterval);
    };

    scheduleCleanup();
  }
}

export const sunSpawner = new SunSpawner();