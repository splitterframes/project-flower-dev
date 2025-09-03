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

      // Try to spawn a sun for each user with available fields
      for (const user of allUsers) {
        // Always try to spawn for users with available fields
        if (true) {
          
          // Get user's unlocked fields
          const unlockedFields = await storage.getUnlockedFields(user.id);
          
          if (unlockedFields.length === 0) {
            console.log(`☀️ User ${user.username} has no unlocked fields, skipping`);
            continue;
          }

          // Get planted fields to avoid spawning on occupied fields
          const plantedFields = await storage.getPlantedFields(user.id);
          const plantedFieldIndices = plantedFields.map(field => field.fieldIndex);
          
          // Filter to only include empty unlocked fields (not planted and not unlock fields)
          const availableFields = unlockedFields.filter(field => 
            !plantedFieldIndices.includes(field.fieldIndex) && 
            field.fieldIndex > 0 // Skip field 0 which is unlock field
          );

          if (availableFields.length === 0) {
            console.log(`☀️ User ${user.username} has no available empty fields for sun spawn`);
            continue;
          }

          // Check if any field already has an active sun
          const fieldsWithActiveSuns: any[] = [];
          for (const field of availableFields) {
            const activeSun = await storage.getActiveSunOnField(field.fieldIndex);
            if (!activeSun) {
              fieldsWithActiveSuns.push(field);
            }
          }

          if (fieldsWithActiveSuns.length === 0) {
            console.log(`☀️ User ${user.username}: All available fields already have active suns`);
            continue;
          }

          // Pick a random available field
          const randomField = fieldsWithActiveSuns[Math.floor(Math.random() * fieldsWithActiveSuns.length)];
          
          // Spawn sun on the selected field
          const result = await storage.spawnSun(randomField.fieldIndex);
          
          if (result.success) {
            console.log(`☀️ Successfully spawned ${result.sunAmount} suns on field ${randomField.fieldIndex} for user ${user.username}`);
            spawnedAny = true;
          } else {
            console.log(`☀️ Failed to spawn sun on field ${randomField.fieldIndex} for user ${user.username}`);
          }
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