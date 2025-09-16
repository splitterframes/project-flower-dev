import { getRarityTierIndex, type RarityTier } from "@shared/rarity";
import { generateBouquetName as generateEnglishBouquetName } from './bouquetNameGenerator';

interface ButterflyData {
  id: number;
  name: string;
  imageUrl: string;
}

// Generate a unique bouquet name using AI
// Get existing bouquet names to avoid duplicates
async function getExistingBouquetNames(): Promise<string[]> {
  try {
    const { storage } = await import('./storage');
    
    // Get all bouquets from database to find existing names
    const db = (storage as any).db;
    if (db) {
      const { bouquets } = await import('../shared/schema');
      const result = await db.select({ name: bouquets.name }).from(bouquets);
      return result.map((bouquet: any) => bouquet.name || '').filter((name: string) => name.length > 0);
    }
    
    // Fallback to in-memory storage
    const allBouquets = Array.from((storage as any).bouquets?.values() || []);
    return allBouquets.map((bouquet: any) => bouquet.name || '').filter((name: string) => name.length > 0);
  } catch (error) {
    console.error('Failed to get existing names:', error);
    return [];
  }
}

export async function generateBouquetName(rarity: RarityTier): Promise<string> {
  try {
    // Get existing names to avoid duplicates
    const existingNames = await getExistingBouquetNames();
    
    // Use the new English bouquet name generator
    return generateEnglishBouquetName(rarity, existingNames);
  } catch (error) {
    console.error('Failed to generate bouquet name:', error);
    
    // Ultimate fallback
    return generateEnglishBouquetName(rarity, []);
  }
}

// Calculate average rarity from three flower rarities
export function calculateAverageRarity(rarity1: RarityTier, rarity2: RarityTier, rarity3: RarityTier): RarityTier {
  const score1 = getRarityTierIndex(rarity1);
  const score2 = getRarityTierIndex(rarity2);
  const score3 = getRarityTierIndex(rarity3);
  
  const avgScore = Math.round((score1 + score2 + score3) / 3);
  const rarities: RarityTier[] = ["common", "uncommon", "rare", "super-rare", "epic", "legendary", "mythical"];
  return rarities[Math.min(avgScore, rarities.length - 1)];
}


// Generate all available butterfly IDs dynamically from Schmetterlinge folder
async function generateAvailableButterflyIds(): Promise<number[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const butterflyDir = path.join(process.cwd(), 'client/public/Schmetterlinge');
    const files = await fs.readdir(butterflyDir);
    
    // Extract butterfly numbers from xxx.jpg files
    const ids: number[] = [];
    files.forEach(file => {
      const match = file.match(/^(\d+)\.jpg$/i);
      if (match) {
        const id = parseInt(match[1]);
        if (!isNaN(id)) {
          ids.push(id);
        }
      }
    });
    
    // Sort IDs numerically
    const sortedIds = ids.sort((a, b) => a - b);
    console.log(`🦋 Found ${sortedIds.length} butterfly images: 0-${Math.max(...sortedIds)}`);
    
    return sortedIds.length > 0 ? sortedIds : [0]; // Fallback to just 0 if none found
  } catch (error) {
    console.error('🦋 Error reading Schmetterlinge directory:', error);
    // Fallback to original range if scanning fails
    const ids: number[] = [];
    for (let i = 0; i <= 960; i++) {
      ids.push(i);
    }
    return ids;
  }
}

// Initialize available butterfly IDs (will be set after async call)
let AVAILABLE_BUTTERFLY_IDS: number[] = [];
// Will be initialized asynchronously
let TOTAL_BUTTERFLIES = 960; // Default to 960, will be updated

// Get proper filename for butterfly ID
function getButterflyImageFilename(id: number): string {
  return `${id}.jpg`;
}

// Base rarity distribution for original 960 butterflies
const BASE_RARITY_DISTRIBUTION = {
  common: Math.floor(960 * 0.443),      // ~425 butterflies (44.3%)
  uncommon: Math.floor(960 * 0.30),     // ~288 butterflies (30%)
  rare: Math.floor(960 * 0.122),        // ~117 butterflies (12.2%)
  'super-rare': Math.floor(960 * 0.078), // ~75 butterflies (7.8%)
  epic: Math.floor(960 * 0.047),        // ~45 butterflies (4.7%)
  legendary: Math.floor(960 * 0.026),   // ~25 butterflies (2.6%)
  mythical: Math.floor(960 * 0.013)     // ~12 butterflies (1.3%)
};

// Ensure we use all 960 original butterflies by adjusting the common tier
const totalAssigned = Object.values(BASE_RARITY_DISTRIBUTION).reduce((sum, count) => sum + count, 0);
BASE_RARITY_DISTRIBUTION.common += (960 - totalAssigned);

// Dynamic rarity distribution (will be calculated based on total butterflies)
let RARITY_DISTRIBUTION = { ...BASE_RARITY_DISTRIBUTION };

// Create randomized rarity assignments for each butterfly ID
export const BUTTERFLY_RARITY_MAP = new Map<number, RarityTier>();

// Store original 960 butterfly rarities to preserve them
let ORIGINAL_BUTTERFLY_RARITIES: Map<number, RarityTier> | null = null;

// Fisher-Yates shuffle algorithm for true randomness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize butterfly system with dynamic detection
async function initializeButterflySystem(): Promise<void> {
  try {
    // Get all available butterfly IDs from folder
    AVAILABLE_BUTTERFLY_IDS = await generateAvailableButterflyIds();
    TOTAL_BUTTERFLIES = AVAILABLE_BUTTERFLY_IDS.filter(id => id > 0).length;
    
    // Preserve original rarities for existing butterflies (1-960)
    if (!ORIGINAL_BUTTERFLY_RARITIES) {
      ORIGINAL_BUTTERFLY_RARITIES = new Map();
      
      // Create original rarity assignments for butterflies 1-960
      const originalIds = Array.from({length: 960}, (_, i) => i + 1);
      const originalRarityAssignments: RarityTier[] = [];
      
      for (const [rarity, count] of Object.entries(BASE_RARITY_DISTRIBUTION) as [RarityTier, number][]) {
        for (let i = 0; i < count; i++) {
          originalRarityAssignments.push(rarity);
        }
      }
      
      const shuffledOriginalRarities = shuffleArray(originalRarityAssignments);
      
      // Assign preserved rarities to original butterfly IDs
      for (let i = 0; i < originalIds.length && i < shuffledOriginalRarities.length; i++) {
        ORIGINAL_BUTTERFLY_RARITIES.set(originalIds[i], shuffledOriginalRarities[i]);
      }
    }
    
    // Clear and rebuild butterfly rarity map
    BUTTERFLY_RARITY_MAP.clear();
    
    // First, add all preserved original rarities
    for (const [id, rarity] of ORIGINAL_BUTTERFLY_RARITIES) {
      if (AVAILABLE_BUTTERFLY_IDS.includes(id)) {
        BUTTERFLY_RARITY_MAP.set(id, rarity);
      }
    }
    
    // Find new butterflies (961+) that need rarity assignment
    const newButterflyIds = AVAILABLE_BUTTERFLY_IDS.filter(id => id > 960 && id > 0);
    
    if (newButterflyIds.length > 0) {
      // Assign rarities to new butterflies using same distribution percentages
      const newRarityAssignments: RarityTier[] = [];
      const percentages = {
        common: 0.443,
        uncommon: 0.30,
        rare: 0.122,
        'super-rare': 0.078,
        epic: 0.047,
        legendary: 0.026,
        mythical: 0.013
      };
      
      for (const [rarity, percentage] of Object.entries(percentages) as [RarityTier, number][]) {
        const count = Math.floor(newButterflyIds.length * percentage);
        for (let i = 0; i < count; i++) {
          newRarityAssignments.push(rarity);
        }
      }
      
      // Fill remaining slots with common rarity
      while (newRarityAssignments.length < newButterflyIds.length) {
        newRarityAssignments.push('common');
      }
      
      const shuffledNewRarities = shuffleArray(newRarityAssignments);
      
      // Assign rarities to new butterflies
      for (let i = 0; i < newButterflyIds.length; i++) {
        BUTTERFLY_RARITY_MAP.set(newButterflyIds[i], shuffledNewRarities[i]);
      }
      
      console.log(`🦋 Added ${newButterflyIds.length} new butterflies: ${Math.min(...newButterflyIds)}-${Math.max(...newButterflyIds)}`);
    }
    
    // Update total count for logging
    const totalMapped = BUTTERFLY_RARITY_MAP.size;
    console.log(`🦋 Initialized butterfly system with ${totalMapped} butterflies (${TOTAL_BUTTERFLIES} total files found)`);
    
  } catch (error) {
    console.error('🦋 Error initializing butterfly system:', error);
  }
}

// Export the initialization function for server startup
export { initializeButterflySystem };

// Initialize the system immediately
initializeButterflySystem();

// Generate random butterfly based on bouquet rarity using pre-assigned rarities
export async function generateRandomButterfly(rarity: RarityTier): Promise<ButterflyData> {
  // Get all butterfly IDs that match the requested rarity
  const matchingIds = Array.from(BUTTERFLY_RARITY_MAP.entries())
    .filter(([id, assignedRarity]) => assignedRarity === rarity)
    .map(([id]) => id);
  
  // If no butterflies of this rarity, fall back to any available ID
  const availableIds = matchingIds.length > 0 ? matchingIds : AVAILABLE_BUTTERFLY_IDS.filter(id => id > 0);
  const butterflyId = availableIds[Math.floor(Math.random() * availableIds.length)];
  
  // Generate consistent Latin name using butterflyId as seed
const { generateLatinButterflyName } = await import('../shared/rarity');
const name = generateLatinButterflyName(butterflyId);

  return {
    id: butterflyId,
    name,
    imageUrl: `/Schmetterlinge/${getButterflyImageFilename(butterflyId)}`
  };
}

// Get butterfly spawn probability based on rarity
export function getButterflySpawnProbability(rarity: RarityTier): number {
  const probabilities = {
    common: 0.85,      // 85%
    uncommon: 0.75,    // 75%
    rare: 0.65,        // 65%
    "super-rare": 0.50, // 50%
    epic: 0.35,        // 35%
    legendary: 0.20,   // 20%
    mythical: 0.10     // 10%
  };
  
  return probabilities[rarity];
}

// Get random spawn interval (1-5 minutes in milliseconds)
export function getRandomSpawnInterval(): number {
  const minMinutes = 1;
  const maxMinutes = 5;
  const minutes = Math.random() * (maxMinutes - minMinutes) + minMinutes;
  return minutes * 60 * 1000; // Convert to milliseconds
}

// Check if a bouquet should spawn a butterfly
export function shouldSpawnButterfly(rarity: RarityTier, attemptNumber?: number, totalAttempts?: number): boolean {
  const probability = getButterflySpawnProbability(rarity);
  
  // Guarantee minimum spawns for all rarities to prevent frustrating "zero spawn" scenarios
  if (attemptNumber && totalAttempts) {
    // For all rarities: guarantee at least 1 spawn if this is the last attempt
    if (attemptNumber === totalAttempts) {
      return true; // Force spawn on final attempt if none spawned yet
    }
  }
  
  return Math.random() < probability;
}

// Debug function to show rarity distribution
export function getRarityDistribution(): Record<RarityTier, number> {
  const distribution: Record<RarityTier, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    'super-rare': 0,
    epic: 0,
    legendary: 0,
    mythical: 0
  };
  
  BUTTERFLY_RARITY_MAP.forEach((rarity: RarityTier, id: number) => {
    distribution[rarity]++;
  });
  
  return distribution;
}

// Get seed drop when bouquet wilts
export function getBouquetSeedDrop(rarity: RarityTier): { rarity: RarityTier; quantity: number } {
  const quantity = Math.floor(Math.random() * 4) + 1; // 1-4 seeds
  const rarities: RarityTier[] = ["common", "uncommon", "rare", "super-rare", "epic", "legendary", "mythical"];
  const currentIndex = getRarityTierIndex(rarity);
  
  const roll = Math.random();
  
  // 15% chance for higher rarity (if possible)
  if (roll < 0.15 && currentIndex < rarities.length - 1) {
    const upgradedRarity = rarities[currentIndex + 1];
    return { rarity: upgradedRarity, quantity };
  }
  
  // 30% chance for lower rarity (if possible)  
  if (roll >= 0.15 && roll < 0.45 && currentIndex > 0) {
    const downgradedRarity = rarities[currentIndex - 1];
    return { rarity: downgradedRarity, quantity };
  }
  
  // 55% chance for same rarity (also fallback for edge cases)
  return { rarity, quantity };
}