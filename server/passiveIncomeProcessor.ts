import { postgresStorage as storage, type PassiveIncomeUserList } from './postgresStorage';
import { cache, CacheKeys } from './cache';

class PassiveIncomeProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) {
      console.log('💰 Passive income processor already running');
      return;
    }

    this.isRunning = true;
    console.log('💰 Starting passive income processing system...');
    
    // Process immediately once, then start interval
    this.processAllUsersPassiveIncome();
    
    // Process every minute (60000ms) - but only award whole credits based on time elapsed
    this.intervalId = setInterval(() => {
      this.processAllUsersPassiveIncome();
    }, 60000);
  }

  stop() {
    if (!this.isRunning) {
      console.log('💰 Passive income processor not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('💰 Passive income processing stopped');
  }

  private async processAllUsersPassiveIncome() {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const allUsersList = await storage.getUsersForPassiveIncome();
      const nowMs = Date.now();
      const activeThreshold = nowMs - 30 * 60 * 1000;
      const staleIncomeThreshold = nowMs - 10 * 60 * 1000;

      const usersToProcessMap = new Map<number, PassiveIncomeUserList[number]>();

      for (const user of allUsersList) {
        const lastActiveTime = user.lastActive ? user.lastActive.getTime() : 0;
        if (lastActiveTime >= activeThreshold) {
          usersToProcessMap.set(user.id, user);
          continue;
        }

        if (!user.lastPassiveIncomeAt) {
          usersToProcessMap.set(user.id, user);
          continue;
        }

        const lastIncomeTime = user.lastPassiveIncomeAt.getTime();
        if (Number.isNaN(lastIncomeTime) || lastIncomeTime <= staleIncomeThreshold) {
          usersToProcessMap.set(user.id, user);
        }
      }

      let allUsers = Array.from(usersToProcessMap.values());
      if (allUsers.length === 0) {
        allUsers = allUsersList;
      }

      if (allUsers.length !== allUsersList.length && !isProduction) {
        console.log(`💰 Passive income sweep: ${allUsers.length} users selected (${allUsersList.length - allUsers.length} deferred)`);
      }
      let totalCreditsAwarded = 0;
      let usersProcessed = 0;

      // 🚀 OPTIMIZATION: Process users in parallel batches
      const BATCH_SIZE = 20; // Process 20 users at a time
      for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
        const batch = allUsers.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (user) => {
          try {
            const result = await storage.processPassiveIncome(user.id);
            if (result.success && result.creditsEarned && result.creditsEarned > 0) {
              totalCreditsAwarded += result.creditsEarned;
              usersProcessed++;

              // 🚀 OPTIMIZATION: Batch cache invalidation
              cache.delete(CacheKeys.USER_RESOURCES(user.id));
              cache.delete(`user:${user.id}:complete-state`);
              cache.delete(`user:${user.id}:garden-state`);
            }
          } catch (error) {
            console.error(`💰 Failed to process passive income for user ${user.id}:`, error);
          }
        }));
      }

      if (usersProcessed > 0 && !isProduction) {
        console.log(`💰 Passive income processing complete: ${totalCreditsAwarded} credits awarded to ${usersProcessed} users`);
      } else if (!isProduction) {
        console.log('💰 Passive income processing complete: No credits awarded this cycle');
      }
    } catch (error) {
      console.error('💰 Error in passive income processing:', error);
    }
  }
}

export const passiveIncomeProcessor = new PassiveIncomeProcessor();