#!/usr/bin/env tsx
import { sql } from 'drizzle-orm';
import { postgresStorage } from '../server/postgresStorage.js';

async function ensureCollectionStatsTable() {
  try {
    console.log('📊 Creating collection_stats table if not exists...');
    
    // Create the collection_stats table with exact schema from shared/schema.ts
    await (postgresStorage as any).db.execute(sql`
      CREATE TABLE IF NOT EXISTS collection_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        item_type VARCHAR(20) NOT NULL,
        item_id INTEGER NOT NULL,
        total_obtained INTEGER NOT NULL DEFAULT 1,
        first_obtained_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_obtained_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, item_type, item_id)
      );
    `);
    
    console.log('✅ collection_stats table ensured successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create collection_stats table:', error);
    process.exit(1);
  }
}

ensureCollectionStatsTable();