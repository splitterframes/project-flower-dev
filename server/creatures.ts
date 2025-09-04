import { RarityTier } from "@shared/rarity";

// Fish Data Interface
export interface FishData {
  id: number;
  name: string;
  imageUrl: string;
}

// Caterpillar Data Interface  
export interface CaterpillarData {
  id: number;
  name: string;
  imageUrl: string;
}

// ==================== FISH SYSTEM ====================

// Generate all available fish IDs dynamically from Fische folder
async function generateAvailableFishIds(): Promise<number[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const fishDir = path.join(process.cwd(), 'client/public/Fische');
    const files = await fs.readdir(fishDir);
    
    // Extract fish numbers from xxx.png files
    const ids: number[] = [];
    files.forEach(file => {
      const match = file.match(/^(\d+)\.png$/i);
      if (match) {
        const id = parseInt(match[1]);
        if (!isNaN(id)) {
          ids.push(id);
        }
      }
    });
    
    // Sort IDs numerically
    const sortedIds = ids.sort((a, b) => a - b);
    console.log(`🐟 Found ${sortedIds.length} fish images: ${Math.min(...sortedIds)}-${Math.max(...sortedIds)}`);
    
    return sortedIds.length > 0 ? sortedIds : [1]; // Fallback to just 1 if none found
  } catch (error) {
    console.error('🐟 Error reading Fische directory:', error);
    // Fallback to original range if scanning fails
    const ids: number[] = [];
    for (let i = 1; i <= 15; i++) {
      ids.push(i);
    }
    return ids;
  }
}

// Initialize available fish IDs
let AVAILABLE_FISH_IDS: number[] = [];
let TOTAL_FISH = 15; // Default, will be updated

// Get proper filename for fish ID
function getFishImageFilename(id: number): string {
  return `${id}.png`;
}

// Base rarity distribution for fish (same percentages as butterflies)
const FISH_RARITY_DISTRIBUTION_PERCENT = {
  common: 0.443,      // 44.3%
  uncommon: 0.30,     // 30.0%
  rare: 0.122,        // 12.2%
  'super-rare': 0.078, // 7.8%
  epic: 0.047,        // 4.7%
  legendary: 0.026,   // 2.6%
  mythical: 0.013     // 1.3%
};

// Dynamic fish rarity distribution
let FISH_RARITY_DISTRIBUTION = {};

// Create randomized rarity assignments for each fish ID
const FISH_RARITY_MAP = new Map<number, RarityTier>();

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize fish rarity assignments
async function initializeFishRarities(): Promise<void> {
  // Get available fish IDs
  AVAILABLE_FISH_IDS = await generateAvailableFishIds();
  TOTAL_FISH = AVAILABLE_FISH_IDS.length;
  
  // Calculate rarity distribution based on total fish
  FISH_RARITY_DISTRIBUTION = {
    common: Math.floor(TOTAL_FISH * FISH_RARITY_DISTRIBUTION_PERCENT.common),
    uncommon: Math.floor(TOTAL_FISH * FISH_RARITY_DISTRIBUTION_PERCENT.uncommon),
    rare: Math.floor(TOTAL_FISH * FISH_RARITY_DISTRIBUTION_PERCENT.rare),
    'super-rare': Math.floor(TOTAL_FISH * FISH_RARITY_DISTRIBUTION_PERCENT['super-rare']),
    epic: Math.floor(TOTAL_FISH * FISH_RARITY_DISTRIBUTION_PERCENT.epic),
    legendary: Math.floor(TOTAL_FISH * FISH_RARITY_DISTRIBUTION_PERCENT.legendary),
    mythical: Math.floor(TOTAL_FISH * FISH_RARITY_DISTRIBUTION_PERCENT.mythical)
  };
  
  // Ensure we use all fish by adjusting the common tier
  const totalAssigned = Object.values(FISH_RARITY_DISTRIBUTION).reduce((sum: number, count) => sum + (count as number), 0);
  (FISH_RARITY_DISTRIBUTION as any).common += (TOTAL_FISH - totalAssigned);
  
  // Create rarity assignments
  const rarities: RarityTier[] = [];
  (Object.entries(FISH_RARITY_DISTRIBUTION) as [RarityTier, number][]).forEach(([rarity, count]) => {
    for (let i = 0; i < count; i++) {
      rarities.push(rarity);
    }
  });
  
  // Shuffle rarities for randomness
  const shuffledRarities = shuffleArray(rarities);
  
  // Assign rarities to fish IDs
  AVAILABLE_FISH_IDS.forEach((fishId, index) => {
    FISH_RARITY_MAP.set(fishId, shuffledRarities[index] || 'common');
  });
  
  console.log(`🐟 Initialized fish system with ${TOTAL_FISH} fish`);
}

// Generate random fish of specific rarity
export async function generateRandomFish(rarity: RarityTier): Promise<FishData> {
  // Get all fish IDs that match the requested rarity
  const matchingIds = Array.from(FISH_RARITY_MAP.entries())
    .filter(([id, assignedRarity]) => assignedRarity === rarity)
    .map(([id]) => id);
  
  // If no fish of this rarity, fall back to any available ID
  const availableIds = matchingIds.length > 0 ? matchingIds : AVAILABLE_FISH_IDS;
  const fishId = availableIds[Math.floor(Math.random() * availableIds.length)];
  
  // Generate consistent Latin name using fishId as seed
  const { generateLatinFishName } = await import('../shared/rarity');
  const name = generateLatinFishName(fishId);

  return {
    id: fishId,
    name,
    imageUrl: `/Fische/${getFishImageFilename(fishId)}`
  };
}

// ==================== CATERPILLAR SYSTEM ====================

// Generate all available caterpillar IDs dynamically from Raupen folder
async function generateAvailableCaterpillarIds(): Promise<number[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const caterpillarDir = path.join(process.cwd(), 'client/public/Raupen');
    const files = await fs.readdir(caterpillarDir);
    
    // Extract caterpillar numbers from xxx.png files
    const ids: number[] = [];
    files.forEach(file => {
      const match = file.match(/^(\d+)\.png$/i);
      if (match) {
        const id = parseInt(match[1]);
        if (!isNaN(id)) {
          ids.push(id);
        }
      }
    });
    
    // Sort IDs numerically
    const sortedIds = ids.sort((a, b) => a - b);
    console.log(`🐛 Found ${sortedIds.length} caterpillar images: ${Math.min(...sortedIds)}-${Math.max(...sortedIds)}`);
    
    return sortedIds.length > 0 ? sortedIds : [1]; // Fallback to just 1 if none found
  } catch (error) {
    console.error('🐛 Error reading Raupen directory:', error);
    // Fallback to original range if scanning fails
    const ids: number[] = [];
    for (let i = 1; i <= 20; i++) {
      ids.push(i);
    }
    return ids;
  }
}

// Initialize available caterpillar IDs
let AVAILABLE_CATERPILLAR_IDS: number[] = [];
let TOTAL_CATERPILLARS = 20; // Default, will be updated

// Get proper filename for caterpillar ID
function getCaterpillarImageFilename(id: number): string {
  return `${id}.png`;
}

// Dynamic caterpillar rarity distribution (same percentages)
let CATERPILLAR_RARITY_DISTRIBUTION = {};

// Create randomized rarity assignments for each caterpillar ID
const CATERPILLAR_RARITY_MAP = new Map<number, RarityTier>();

// Initialize caterpillar rarity assignments
async function initializeCaterpillarRarities(): Promise<void> {
  // Get available caterpillar IDs
  AVAILABLE_CATERPILLAR_IDS = await generateAvailableCaterpillarIds();
  TOTAL_CATERPILLARS = AVAILABLE_CATERPILLAR_IDS.length;
  
  // Calculate rarity distribution based on total caterpillars
  CATERPILLAR_RARITY_DISTRIBUTION = {
    common: Math.floor(TOTAL_CATERPILLARS * FISH_RARITY_DISTRIBUTION_PERCENT.common),
    uncommon: Math.floor(TOTAL_CATERPILLARS * FISH_RARITY_DISTRIBUTION_PERCENT.uncommon),
    rare: Math.floor(TOTAL_CATERPILLARS * FISH_RARITY_DISTRIBUTION_PERCENT.rare),
    'super-rare': Math.floor(TOTAL_CATERPILLARS * FISH_RARITY_DISTRIBUTION_PERCENT['super-rare']),
    epic: Math.floor(TOTAL_CATERPILLARS * FISH_RARITY_DISTRIBUTION_PERCENT.epic),
    legendary: Math.floor(TOTAL_CATERPILLARS * FISH_RARITY_DISTRIBUTION_PERCENT.legendary),
    mythical: Math.floor(TOTAL_CATERPILLARS * FISH_RARITY_DISTRIBUTION_PERCENT.mythical)
  };
  
  // Ensure we use all caterpillars by adjusting the common tier
  const totalAssigned = Object.values(CATERPILLAR_RARITY_DISTRIBUTION).reduce((sum: number, count) => sum + (count as number), 0);
  (CATERPILLAR_RARITY_DISTRIBUTION as any).common += (TOTAL_CATERPILLARS - totalAssigned);
  
  // Create rarity assignments
  const rarities: RarityTier[] = [];
  (Object.entries(CATERPILLAR_RARITY_DISTRIBUTION) as [RarityTier, number][]).forEach(([rarity, count]) => {
    for (let i = 0; i < count; i++) {
      rarities.push(rarity);
    }
  });
  
  // Shuffle rarities for randomness
  const shuffledRarities = shuffleArray(rarities);
  
  // Assign rarities to caterpillar IDs
  AVAILABLE_CATERPILLAR_IDS.forEach((caterpillarId, index) => {
    CATERPILLAR_RARITY_MAP.set(caterpillarId, shuffledRarities[index] || 'common');
  });
  
  console.log(`🐛 Initialized caterpillar system with ${TOTAL_CATERPILLARS} caterpillars`);
}

// Generate random caterpillar of specific rarity
export async function generateRandomCaterpillar(rarity: RarityTier): Promise<CaterpillarData> {
  // Get all caterpillar IDs that match the requested rarity
  const matchingIds = Array.from(CATERPILLAR_RARITY_MAP.entries())
    .filter(([id, assignedRarity]) => assignedRarity === rarity)
    .map(([id]) => id);
  
  // If no caterpillars of this rarity, fall back to any available ID
  const availableIds = matchingIds.length > 0 ? matchingIds : AVAILABLE_CATERPILLAR_IDS;
  const caterpillarId = availableIds[Math.floor(Math.random() * availableIds.length)];
  
  // Generate consistent Latin name using caterpillarId as seed
  const { generateLatinCaterpillarName } = await import('../shared/rarity');
  const name = generateLatinCaterpillarName(caterpillarId);

  return {
    id: caterpillarId,
    name,
    imageUrl: `/Raupen/${getCaterpillarImageFilename(caterpillarId)}`
  };
}

// ==================== INITIALIZATION ====================

// Initialize both systems
export async function initializeCreatureSystems(): Promise<void> {
  await Promise.all([
    initializeFishRarities(),
    initializeCaterpillarRarities()
  ]);
  console.log(`🌊 Creature systems initialized: ${TOTAL_FISH} fish, ${TOTAL_CATERPILLARS} caterpillars`);
}

// Get fish rarity for specific fish ID
export function getFishRarity(fishId: number): RarityTier {
  return FISH_RARITY_MAP.get(fishId) || 'common';
}

// Get caterpillar rarity for specific caterpillar ID  
export function getCaterpillarRarity(caterpillarId: number): RarityTier {
  return CATERPILLAR_RARITY_MAP.get(caterpillarId) || 'common';
}

// Export available IDs for external use
export function getAvailableFishIds(): number[] {
  return [...AVAILABLE_FISH_IDS];
}

export function getAvailableCaterpillarIds(): number[] {
  return [...AVAILABLE_CATERPILLAR_IDS];
}