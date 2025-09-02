import { postgresStorage as storage } from './postgresStorage';

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
      console.log('💰 Processing passive income for all users...');
      
      // Get all users who are online or have exhibition butterflies
      const allUsers = await storage.getAllUsersWithStatus();
      let totalCreditsAwarded = 0;
      let usersProcessed = 0;

      for (const user of allUsers) {
        try {
          const result = await storage.processPassiveIncome(user.id);
          if (result.success && result.creditsEarned && result.creditsEarned > 0) {
            totalCreditsAwarded += result.creditsEarned;
            usersProcessed++;
          }
        } catch (error) {
          console.error(`💰 Failed to process passive income for user ${user.id}:`, error);
        }
      }

      if (usersProcessed > 0) {
        console.log(`💰 Passive income processing complete: ${totalCreditsAwarded} credits awarded to ${usersProcessed} users`);
      } else {
        console.log('💰 Passive income processing complete: No credits awarded this cycle');
      }
    } catch (error) {
      console.error('💰 Error in passive income processing:', error);
    }
  }
}

export const passiveIncomeProcessor = new PassiveIncomeProcessor();