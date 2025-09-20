/**
 * Migration script to convert German butterfly names to Latin names
 * Updates all existing butterflies in database with new Latin scientific names
 */

import { postgresStorage as storage } from "./postgresStorage";
import { generateLatinButterflyName } from "../shared/rarity";

// German butterfly name patterns to identify what needs migration
const germanPatterns = [
  'Großer', 'Kleiner', 'Roter', 'Blauer', 'Goldener', 'Silberner', 'Weißer', 'Schwarzer',
  'Grüner', 'Gelber', 'Violetter', 'Oranger', 'Brauner', 'Rosa', 'Türkiser', 'Purpurner',
  'Falter', 'Fuchs', 'Bläuling', 'Weißling', 'Perlmuttfalter', 'Scheckenfalter', 'Mohrenfalter',
  'Schwalbenschwanz', 'Admiral', 'Distelfalter', 'Trauerfalter', 'Landkärtchen', 'Tagpfauenauge'
];

function isGermanButterflyName(name: string): boolean {
  return germanPatterns.some(pattern => name.includes(pattern));
}

export async function migrateButterflyNamesToLatin(): Promise<void> {
  try {
    console.log('🔄 Starting butterfly name migration from German to Latin...');
    
    const db = (storage as any).db;
    if (!db) {
      throw new Error('Database not available');
    }

    // Get all butterflies with German names from all tables
    console.log('📋 Scanning database for German butterfly names...');
    
    // 1. User Butterflies (inventory)
    const userButterflies = await db.execute(`
      SELECT id, "butterflyId", "butterflyName" FROM "userButterflies" 
      WHERE "butterflyName" IS NOT NULL
    `);
    
    // 2. Field Butterflies (active on fields)
    const fieldButterflies = await db.execute(`
      SELECT id, "butterflyId", "butterflyName" FROM "fieldButterflies" 
      WHERE "butterflyName" IS NOT NULL
    `);
    
    // 3. Exhibition Butterflies (in exhibition)
    const exhibitionButterflies = await db.execute(`
      SELECT id, "butterflyId", "butterflyName" FROM "exhibitionButterflies" 
      WHERE "butterflyName" IS NOT NULL
    `);

    let updateCount = 0;

    // Update User Butterflies
    console.log(`🦋 Processing ${userButterflies.rows.length} user butterflies...`);
    for (const row of userButterflies.rows) {
      const { id, butterflyId, butterflyName } = row;
      
      if (isGermanButterflyName(butterflyName)) {
        const newLatinName = generateLatinButterflyName(butterflyId);
        
        await db.execute(`
          UPDATE "userButterflies" 
          SET "butterflyName" = $1 
          WHERE id = $2
        `, [newLatinName, id]);
        
        console.log(`  ✅ ${butterflyName} → ${newLatinName}`);
        updateCount++;
      }
    }

    // Update Field Butterflies
    console.log(`🌸 Processing ${fieldButterflies.rows.length} field butterflies...`);
    for (const row of fieldButterflies.rows) {
      const { id, butterflyId, butterflyName } = row;
      
      if (isGermanButterflyName(butterflyName)) {
        const newLatinName = generateLatinButterflyName(butterflyId);
        
        await db.execute(`
          UPDATE "fieldButterflies" 
          SET "butterflyName" = $1 
          WHERE id = $2
        `, [newLatinName, id]);
        
        console.log(`  ✅ ${butterflyName} → ${newLatinName}`);
        updateCount++;
      }
    }

    // Update Exhibition Butterflies
    console.log(`🖼️ Processing ${exhibitionButterflies.rows.length} exhibition butterflies...`);
    for (const row of exhibitionButterflies.rows) {
      const { id, butterflyId, butterflyName } = row;
      
      if (isGermanButterflyName(butterflyName)) {
        const newLatinName = generateLatinButterflyName(butterflyId);
        
        await db.execute(`
          UPDATE "exhibitionButterflies" 
          SET "butterflyName" = $1 
          WHERE id = $2
        `, [newLatinName, id]);
        
        console.log(`  ✅ ${butterflyName} → ${newLatinName}`);
        updateCount++;
      }
    }

    console.log(`\n🎉 Migration complete! Updated ${updateCount} butterfly names to Latin.`);
    
    // Test some examples
    console.log('\n🧪 Sample Latin names generated:');
    for (let i = 1; i <= 5; i++) {
      const name = generateLatinButterflyName(i * 47, 'rare');
      console.log(`  Butterfly ${i * 47}: ${name}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for manual execution
export async function runMigration() {
  console.log('🚀 Starting butterfly name migration...');
  await migrateButterflyNamesToLatin();
  console.log('✅ Migration completed successfully!');
}
