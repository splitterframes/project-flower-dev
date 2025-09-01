import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema.ts';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function initializeProductionDatabase() {
  try {
    console.log('🚀 Initializing production database...');
    
    // Initialize seeds data (same as in MemStorage constructor)
    const seedsData = [
      { id: 1, name: "Common Samen", rarity: "common", price: 10, growthTime: 75, description: "Ein gewöhnlicher Samen mit einfachen Eigenschaften", imageUrl: "/Blumen/0.jpg" },
      { id: 2, name: "Uncommon Samen", rarity: "uncommon", price: 25, growthTime: 120, description: "Ein ungewöhnlicher Samen mit besonderen Eigenschaften", imageUrl: "/Blumen/0.jpg" },
      { id: 3, name: "Rare Samen", rarity: "rare", price: 50, growthTime: 180, description: "Ein seltener Samen mit wertvollen Eigenschaften", imageUrl: "/Blumen/0.jpg" },
      { id: 4, name: "Super-rare Samen", rarity: "super-rare", price: 100, growthTime: 300, description: "Ein super-seltener Samen mit außergewöhnlichen Eigenschaften", imageUrl: "/Blumen/0.jpg" },
      { id: 5, name: "Epic Samen", rarity: "epic", price: 200, growthTime: 420, description: "Ein epischer Samen mit legendären Eigenschaften", imageUrl: "/Blumen/0.jpg" },
      { id: 6, name: "Legendary Samen", rarity: "legendary", price: 500, growthTime: 540, description: "Ein legendärer Samen mit mythischen Eigenschaften", imageUrl: "/Blumen/0.jpg" },
      { id: 7, name: "Mythical Samen", rarity: "mythical", price: 1000, growthTime: 600, description: "Ein mythischer Samen mit göttlichen Eigenschaften", imageUrl: "/Blumen/0.jpg" }
    ];

    // Check if seeds already exist
    const existingSeeds = await db.select().from(schema.seeds).limit(1);
    
    if (existingSeeds.length === 0) {
      // Insert seeds
      await db.insert(schema.seeds).values(seedsData);
      console.log('✅ Seeds initialized in production database');
    } else {
      console.log('ℹ️ Seeds already exist in production database');
    }

    console.log('🎉 Production database initialization complete!');
    
  } catch (error) {
    console.error('❌ Failed to initialize production database:', error);
    process.exit(1);
  }
}

initializeProductionDatabase();