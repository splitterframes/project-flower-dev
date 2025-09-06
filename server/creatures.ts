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
    
    // Extract fish numbers from xxx.jpg files
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
  return `${id}.jpg`;
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
  console.log(`🐟 DEBUG: Generating fish with rarity: ${rarity}`);
  console.log(`🐟 DEBUG: Available fish IDs:`, AVAILABLE_FISH_IDS.slice(0, 10), `(total: ${AVAILABLE_FISH_IDS.length})`);
  console.log(`🐟 DEBUG: Fish rarity map size:`, FISH_RARITY_MAP.size);
  
  // Get all fish IDs that match the requested rarity
  const matchingIds = Array.from(FISH_RARITY_MAP.entries())
    .filter(([id, assignedRarity]) => assignedRarity === rarity)
    .map(([id]) => id);
  
  console.log(`🐟 DEBUG: Matching IDs for ${rarity}:`, matchingIds.slice(0, 5), `(total: ${matchingIds.length})`);
  
  // If no fish of this rarity, fall back to any available ID
  const availableIds = matchingIds.length > 0 ? matchingIds : AVAILABLE_FISH_IDS;
  console.log(`🐟 DEBUG: Using ${availableIds.length} available IDs`);
  
  if (availableIds.length === 0) {
    console.error('🐟 ERROR: No available fish IDs found!');
    // Emergency fallback - create a default fish
    return {
      id: 0,
      name: 'Notfall-Fisch',
      imageUrl: '/Fische/0.jpg'
    };
  }
  
  const fishId = availableIds[Math.floor(Math.random() * availableIds.length)];
  console.log(`🐟 DEBUG: Selected fishId: ${fishId}`);
  
  // Generate consistent Latin name using fishId as seed
  const { generateLatinFishName } = await import('../shared/rarity');
  const name = generateLatinFishName(fishId);
  console.log(`🐟 DEBUG: Generated name: ${name}`);

  const fishData = {
    id: fishId,
    name,
    imageUrl: `/Fische/${getFishImageFilename(fishId)}`
  };
  
  console.log(`🐟 DEBUG: Final fish data:`, fishData);
  return fishData;
}

// Generate random fish using proper distribution
export async function generateRandomFishByDistribution(rarity: RarityTier): Promise<FishData> {
  return generateRandomFish(rarity);
}

// Get random rarity based on distribution
export function getRandomRarity(): RarityTier {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (const [rarity, percentage] of Object.entries(FISH_RARITY_DISTRIBUTION_PERCENT) as [RarityTier, number][]) {
    cumulativeWeight += percentage;
    if (random <= cumulativeWeight) {
      return rarity;
    }
  }
  
  return 'common'; // Fallback
}

// ==================== CATERPILLAR SYSTEM ====================

// Generate all available caterpillar IDs dynamically from Raupen folder
async function generateAvailableCaterpillarIds(): Promise<number[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const caterpillarDir = path.join(process.cwd(), 'client/public/Raupen');
    const files = await fs.readdir(caterpillarDir);
    
    // Extract caterpillar numbers from xxx.jpg files (not png!)
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
  return `${id}.jpg`;
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
// ==================== FLOWER SYSTEM ====================

// Initialize available flower IDs
let AVAILABLE_FLOWER_IDS: number[] = [];
let TOTAL_FLOWERS = 200; // Default, will be updated

// Get proper filename for flower ID
function getFlowerImageFilename(id: number): string {
  return `${id}.jpg`;
}

// Base rarity distribution for flowers (same percentages as fish/caterpillars)
const FLOWER_RARITY_DISTRIBUTION_PERCENT = {
  common: 0.275,       // 27.5% (55/200)
  uncommon: 0.225,     // 22.5% (45/200)
  rare: 0.175,         // 17.5% (35/200)
  'super-rare': 0.125, // 12.5% (25/200)
  epic: 0.10,          // 10.0% (20/200)
  legendary: 0.075,    // 7.5%  (15/200)
  mythical: 0.025      // 2.5%  (5/200)
};

// Dynamic flower rarity distribution
let FLOWER_RARITY_DISTRIBUTION = {};

// Create randomized rarity assignments for each flower ID
const FLOWER_RARITY_MAP = new Map<number, RarityTier>();

// Store original flower rarities (1-200) to preserve existing assignments
let ORIGINAL_FLOWER_RARITIES: Map<number, RarityTier> | null = null;

// Generate all available flower IDs dynamically from Blumen folder
async function generateAvailableFlowerIds(): Promise<number[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const flowerDir = path.join(process.cwd(), 'client/public/Blumen');
    const files = await fs.readdir(flowerDir);
    
    // Extract flower numbers from xxx.jpg files
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
    console.log(`🌸 Found ${sortedIds.length} flower images: ${Math.min(...sortedIds)}-${Math.max(...sortedIds)}`);
    
    return sortedIds.length > 0 ? sortedIds : [1]; // Fallback to just 1 if none found
  } catch (error) {
    console.error('🌸 Error reading Blumen directory:', error);
    // Fallback to original range from RARITY_CONFIG if scanning fails
    const ids: number[] = [];
    for (let i = 1; i <= 200; i++) {
      ids.push(i);
    }
    return ids;
  }
}

// Initialize flower rarity assignments
async function initializeFlowerRarities(): Promise<void> {
  try {
    // Get available flower IDs
    AVAILABLE_FLOWER_IDS = await generateAvailableFlowerIds();
    TOTAL_FLOWERS = AVAILABLE_FLOWER_IDS.length;
    
    // Preserve original rarities for existing flowers (1-200) from RARITY_CONFIG
    if (!ORIGINAL_FLOWER_RARITIES) {
      ORIGINAL_FLOWER_RARITIES = new Map();
      
      // Import RARITY_CONFIG to get original flower rarities
      const { RARITY_CONFIG } = await import('../shared/rarity');
      
      // Create original rarity assignments for flowers 1-200 based on RARITY_CONFIG
      for (let flowerId = 1; flowerId <= 200; flowerId++) {
        if (AVAILABLE_FLOWER_IDS.includes(flowerId)) {
          let rarity: RarityTier = 'common'; // Default fallback
          
          // Determine rarity based on RARITY_CONFIG ranges
          if (flowerId >= 1 && flowerId <= 55) {
            rarity = 'common';
          } else if (flowerId >= 56 && flowerId <= 100) {
            rarity = 'uncommon';
          } else if (flowerId >= 101 && flowerId <= 135) {
            rarity = 'rare';
          } else if (flowerId >= 136 && flowerId <= 160) {
            rarity = 'super-rare';
          } else if (flowerId >= 161 && flowerId <= 180) {
            rarity = 'epic';
          } else if (flowerId >= 181 && flowerId <= 195) {
            rarity = 'legendary';
          } else if (flowerId >= 196 && flowerId <= 200) {
            rarity = 'mythical';
          }
          
          ORIGINAL_FLOWER_RARITIES.set(flowerId, rarity);
        }
      }
    }
    
    // Clear and rebuild flower rarity map
    FLOWER_RARITY_MAP.clear();
    
    // First, add all preserved original rarities
    for (const [id, rarity] of ORIGINAL_FLOWER_RARITIES) {
      if (AVAILABLE_FLOWER_IDS.includes(id)) {
        FLOWER_RARITY_MAP.set(id, rarity);
      }
    }
    
    // Find new flowers (201+) that need rarity assignment
    const newFlowerIds = AVAILABLE_FLOWER_IDS.filter(id => id > 200);
    
    if (newFlowerIds.length > 0) {
      // Assign rarities to new flowers using distribution percentages
      const newRarityAssignments: RarityTier[] = [];
      
      for (const [rarity, percentage] of Object.entries(FLOWER_RARITY_DISTRIBUTION_PERCENT) as [RarityTier, number][]) {
        const count = Math.floor(newFlowerIds.length * percentage);
        for (let i = 0; i < count; i++) {
          newRarityAssignments.push(rarity);
        }
      }
      
      // Fill remaining slots with common rarity
      while (newRarityAssignments.length < newFlowerIds.length) {
        newRarityAssignments.push('common');
      }
      
      // Shuffle assignments for randomness
      const shuffledNewRarities = shuffleArray(newRarityAssignments);
      
      // Assign rarities to new flower IDs
      newFlowerIds.forEach((flowerId, index) => {
        FLOWER_RARITY_MAP.set(flowerId, shuffledNewRarities[index] || 'common');
      });
      
      console.log(`🌸 Assigned rarities to ${newFlowerIds.length} new flowers (201+)`);
    }
    
    console.log(`🌸 Initialized flower system with ${TOTAL_FLOWERS} flowers`);
  } catch (error) {
    console.error('🌸 Error initializing flower rarities:', error);
    
    // Fallback: assign common rarity to all available flowers
    for (const flowerId of AVAILABLE_FLOWER_IDS) {
      FLOWER_RARITY_MAP.set(flowerId, 'common');
    }
  }
}

export async function initializeCreatureSystems(): Promise<void> {
  await Promise.all([
    initializeFishRarities(),
    initializeCaterpillarRarities(),
    initializeFlowerRarities()
  ]);
  console.log(`🌊 Creature systems initialized: ${TOTAL_FISH} fish, ${TOTAL_CATERPILLARS} caterpillars, ${TOTAL_FLOWERS} flowers`);
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

// Generate random flower of specific rarity
export async function generateRandomFlower(rarity: RarityTier): Promise<FlowerData> {
  // Get all flower IDs that match the requested rarity
  const matchingIds = Array.from(FLOWER_RARITY_MAP.entries())
    .filter(([id, assignedRarity]) => assignedRarity === rarity)
    .map(([id]) => id);
  
  // If no flowers of this rarity, fall back to any available ID
  const availableIds = matchingIds.length > 0 ? matchingIds : AVAILABLE_FLOWER_IDS;
  const flowerId = availableIds[Math.floor(Math.random() * availableIds.length)];
  
  // Generate consistent Latin name using flowerId as seed
  const { generateLatinFlowerName } = await import('../shared/rarity');
  const name = generateLatinFlowerName(flowerId);

  return {
    id: flowerId,
    name,
    imageUrl: `/Blumen/${getFlowerImageFilename(flowerId)}`
  };
}

// Get flower rarity for specific flower ID
export function getFlowerRarity(flowerId: number): RarityTier {
  return FLOWER_RARITY_MAP.get(flowerId) || 'common';
}

// Export available flower IDs for external use
export function getAvailableFlowerIds(): number[] {
  return [...AVAILABLE_FLOWER_IDS];
}

// FlowerData interface to match other creature interfaces
interface FlowerData {
  id: number;
  name: string;
  imageUrl: string;
}