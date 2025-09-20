// Quick script to add database indexes
import { postgresStorage } from './server/postgresStorage.js';

async function addIndexes() {
  try {
    console.log('🗂️ Adding database indexes...');
    
    const db = postgresStorage.db;
    
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_butterflies_user_id ON user_butterflies(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_butterflies_user_id ON exhibition_butterflies(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_user_id ON field_butterflies(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_flowers_user_id ON user_flowers(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_seeds_user_id ON user_seeds(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planted_fields_user_id ON planted_fields(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sun_spawns_user_id ON sun_spawns(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_listings_seller_id ON market_listings(seller_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_likes_frame_id ON exhibition_likes(frame_id)'
    ];
    
    for (const indexSQL of indexes) {
      try {
        console.log('Adding:', indexSQL.split('idx_')[1]?.split(' ON')[0]);
        await db.execute(indexSQL);
        console.log('✅ Success');
      } catch (error) {
        console.log('⚠️ Already exists or failed:', error.message);
      }
    }
    
    console.log('🎉 Database indexes completed!');
    
  } catch (error) {
    console.error('❌ Failed to add indexes:', error);
  }
}

addIndexes();
