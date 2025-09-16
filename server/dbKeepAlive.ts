/**
 * Database Keep-Alive System
 * Prevents Neon database from sleeping and keeps connections warm
 */

let keepAliveInterval: NodeJS.Timeout | null = null;

/**
 * Start database keep-alive system
 * Pings database every 4 minutes to prevent hibernation
 */
export function startDatabaseKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  console.log('🔄 Starting database keep-alive system (4min intervals)');
  
  keepAliveInterval = setInterval(async () => {
    try {
      console.time('[DB-KEEPALIVE]');
      const { postgresStorage: storage } = await import('./postgresStorage');
      
      // Simple query to keep connection warm
      await (storage as any).db.execute('SELECT 1 as keepalive, NOW() as timestamp');
      
      console.timeEnd('[DB-KEEPALIVE]');
      console.log('💓 Database keep-alive ping successful');
      
    } catch (error) {
      console.error('❌ Database keep-alive failed:', error);
    }
  }, 4 * 60 * 1000); // 4 minutes
}

/**
 * Stop database keep-alive system
 */
export function stopDatabaseKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('🛑 Database keep-alive system stopped');
  }
}

/**
 * Initialize keep-alive on startup
 */
export function initializeDatabaseKeepAlive() {
  // Start keep-alive after a short delay to ensure DB is initialized
  setTimeout(() => {
    startDatabaseKeepAlive();
  }, 5000); // 5 second delay
  
  // Graceful shutdown
  process.on('SIGINT', stopDatabaseKeepAlive);
  process.on('SIGTERM', stopDatabaseKeepAlive);
}
