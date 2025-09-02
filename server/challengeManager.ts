import { postgresStorage } from './postgresStorage';

class ChallengeManager {
  private checkInterval: NodeJS.Timeout | null = null;
  
  async start() {
    console.log('🌸 Starting weekly challenge management system...');
    
    // Check immediately on startup
    await this.checkAndCreateChallenge();
    
    // Check every hour for new challenges needed
    this.checkInterval = setInterval(async () => {
      await this.checkAndCreateChallenge();
    }, 60 * 60 * 1000); // Every hour
    
    console.log('🌸 Weekly challenge management system initialized');
  }
  
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  private async checkAndCreateChallenge() {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Don't create new challenges on Sunday (day 0)
      if (dayOfWeek === 0) {
        console.log('🌸 Sunday detected - no new challenge creation');
        return;
      }
      
      // Check if there's an active challenge
      const currentChallenge = await postgresStorage.getCurrentWeeklyChallenge();
      
      if (!currentChallenge) {
        console.log('🌸 No active challenge found - creating new weekly challenge...');
        
        // Create a new challenge
        const newChallenge = await postgresStorage.createWeeklyChallenge();
        console.log(`🌸 New weekly challenge created for week ${newChallenge.weekNumber}!`);
        console.log(`🌸 Challenge runs from ${newChallenge.startTime.toLocaleDateString()} to ${newChallenge.endTime.toLocaleDateString()}`);
        
        return newChallenge;
      } else {
        // Check if current challenge has expired
        if (now > currentChallenge.endTime) {
          console.log('🌸 Current challenge has expired - marking as inactive...');
          
          // Deactivate the old challenge
          await this.deactivateChallenge(currentChallenge.id);
          
          // Create a new challenge (unless it's Sunday)
          if (dayOfWeek !== 0) {
            console.log('🌸 Creating new weekly challenge after expiration...');
            const newChallenge = await postgresStorage.createWeeklyChallenge();
            console.log(`🌸 New weekly challenge created for week ${newChallenge.weekNumber}!`);
            return newChallenge;
          }
        } else {
          console.log(`🌸 Active challenge found: Week ${currentChallenge.weekNumber} (ends ${currentChallenge.endTime.toLocaleDateString()})`);
        }
      }
    } catch (error) {
      console.error('🌸 Error in challenge management:', error);
    }
  }
  
  private async deactivateChallenge(challengeId: number) {
    try {
      await postgresStorage.deactivateChallenge(challengeId);
    } catch (error) {
      console.error('🌸 Error deactivating challenge:', error);
    }
  }
}

export const challengeManager = new ChallengeManager();