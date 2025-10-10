/**
 * 🚀 PERFORMANCE: Critical Database Indexes
 * 
 * This script adds essential indexes to improve query performance.
 * Run this once on your production database.
 * 
 * Usage: tsx server/addCriticalIndexes.ts
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const criticalIndexes = [
  // User-related indexes
  {
    name: 'idx_users_username_lower',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_lower ON users(LOWER(username))',
    description: 'Case-insensitive username lookups'
  },
  {
    name: 'idx_users_last_active',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_active ON users(last_passive_income_at) WHERE last_passive_income_at IS NOT NULL',
    description: 'Passive income processing'
  },
  
  // Collection indexes (most critical for game performance)
  {
    name: 'idx_user_butterflies_user_rarity',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_butterflies_user_rarity ON user_butterflies(user_id, rarity)',
    description: 'User butterfly queries by rarity'
  },
  {
    name: 'idx_user_fish_user_rarity',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_fish_user_rarity ON user_fish(user_id, rarity)',
    description: 'User fish queries by rarity'
  },
  {
    name: 'idx_user_caterpillars_user_rarity',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_caterpillars_user_rarity ON user_caterpillars(user_id, rarity)',
    description: 'User caterpillar queries by rarity'
  },
  
  // Garden/Field indexes
  {
    name: 'idx_planted_fields_user_field',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planted_fields_user_field ON planted_fields(user_id, field_index)',
    description: 'Fast field lookups'
  },
  {
    name: 'idx_field_butterflies_user_field',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_user_field ON field_butterflies(user_id, field_index)',
    description: 'Field butterfly lookups'
  },
  {
    name: 'idx_field_butterflies_bouquet',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_bouquet ON field_butterflies(bouquet_id) WHERE bouquet_id IS NOT NULL',
    description: 'Bouquet-to-butterfly relationships'
  },
  
  // Bouquet system indexes
  {
    name: 'idx_placed_bouquets_user_field',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_placed_bouquets_user_field ON placed_bouquets(user_id, field_index)',
    description: 'Placed bouquet lookups'
  },
  {
    name: 'idx_placed_bouquets_next_spawn',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_placed_bouquets_next_spawn ON placed_bouquets(next_spawn_at) WHERE next_spawn_at IS NOT NULL',
    description: 'Butterfly spawn timing'
  },
  {
    name: 'idx_placed_bouquets_expires',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_placed_bouquets_expires ON placed_bouquets(expires_at) WHERE expires_at IS NOT NULL',
    description: 'Bouquet expiration cleanup'
  },
  
  // Exhibition indexes
  {
    name: 'idx_exhibition_butterflies_user',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_butterflies_user ON exhibition_butterflies(user_id)',
    description: 'User exhibition queries'
  },
  {
    name: 'idx_exhibition_frame_likes_frame',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_frame_likes_frame ON exhibition_frame_likes(frame_id)',
    description: 'Frame like counts'
  },
  {
    name: 'idx_exhibition_frame_likes_user_frame',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_frame_likes_user_frame ON exhibition_frame_likes(user_id, frame_id)',
    description: 'User like status checks'
  },
  
  // Market indexes
  {
    name: 'idx_market_listings_active',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_listings_active ON market_listings(is_active, created_at DESC) WHERE is_active = true',
    description: 'Active market listings'
  },
  {
    name: 'idx_market_listings_seller',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_listings_seller ON market_listings(seller_id)',
    description: 'Seller listings'
  },
  
  // Sun spawning indexes
  {
    name: 'idx_sun_spawns_field_active',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sun_spawns_field_active ON sun_spawns(field_index, is_collected, expires_at) WHERE is_collected = false',
    description: 'Active sun lookups'
  },
  {
    name: 'idx_sun_spawns_expires',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sun_spawns_expires ON sun_spawns(expires_at) WHERE is_collected = false',
    description: 'Sun expiration cleanup'
  },
  
  // Unlocked fields index
  {
    name: 'idx_unlocked_fields_user',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unlocked_fields_user ON unlocked_fields(user_id, field_index)',
    description: 'Fast unlocked field checks'
  },
  
  // Challenge indexes
  {
    name: 'idx_weekly_challenge_progress_user',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weekly_challenge_progress_user ON weekly_challenge_progress(user_id, challenge_id)',
    description: 'Challenge progress lookups'
  },
  {
    name: 'idx_challenge_donations_challenge',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_donations_challenge ON challenge_donations(challenge_id)',
    description: 'Challenge donation aggregation'
  },
  
  // Aquarium indexes
  {
    name: 'idx_aquarium_fish_user_tank',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aquarium_fish_user_tank ON aquarium_fish(user_id, tank_id)',
    description: 'Aquarium fish queries'
  },
  
  // Pond feeding indexes
  {
    name: 'idx_pond_feeding_progress_user_field',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pond_feeding_progress_user_field ON pond_feeding_progress(user_id, field_index)',
    description: 'Pond feeding status'
  }
];

async function addIndexes() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('🚀 Starting database index creation...\n');
  console.log(`📊 Total indexes to create: ${criticalIndexes.length}\n`);

  const sql = neon(process.env.DATABASE_URL);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const index of criticalIndexes) {
    try {
      console.log(`Creating: ${index.name}`);
      console.log(`  Purpose: ${index.description}`);
      
      await sql(index.sql);
      
      console.log(`  ✅ Success\n`);
      successCount++;
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`  ⏭️  Already exists\n`);
        skipCount++;
      } else {
        console.log(`  ❌ Error: ${error.message}\n`);
        errorCount++;
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`  ✅ Created: ${successCount}`);
  console.log(`  ⏭️  Skipped: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errorCount > 0) {
    console.log('⚠️  Some indexes failed to create. Check the errors above.');
  } else {
    console.log('🎉 All indexes processed successfully!');
    console.log('\n💡 Performance Tip: Run ANALYZE on your database to update statistics:');
    console.log('   psql -d your_database -c "ANALYZE;"');
  }
}

addIndexes().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
