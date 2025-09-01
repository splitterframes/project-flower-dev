// Rarity system utilities for Mariposa game

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'super-rare' | 'epic' | 'legendary' | 'mythical';

export interface RarityConfig {
  tier: RarityTier;
  weight: number;
  flowerRange: [number, number] | null;
  butterflyRange: [number, number] | null;
  growthTimeSeconds: number;
}

// Weighted distribution configuration - NEW DISTRIBUTION  
export const RARITY_CONFIG: RarityConfig[] = [
  {
    tier: 'common',
    weight: 45,
    flowerRange: [1, 55],          // 55 flowers
    butterflyRange: [1, 443],      // 443 butterflies
    growthTimeSeconds: 75 // 1:15 min
  },
  {
    tier: 'uncommon', 
    weight: 30,
    flowerRange: [56, 100],        // 45 flowers  
    butterflyRange: [444, 743],    // 300 butterflies
    growthTimeSeconds: 150 // 2:30 min
  },
  {
    tier: 'rare',
    weight: 15,
    flowerRange: [101, 135],       // 35 flowers
    butterflyRange: [744, 843],    // 100 butterflies
    growthTimeSeconds: 240 // 4:00 min
  },
  {
    tier: 'super-rare',
    weight: 7,
    flowerRange: [136, 160],       // 25 flowers
    butterflyRange: [844, 918],    // 75 butterflies
    growthTimeSeconds: 330 // 5:30 min
  },
  {
    tier: 'epic',
    weight: 2.5,
    flowerRange: [161, 180],       // 20 flowers
    butterflyRange: [919, 963],    // 45 butterflies
    growthTimeSeconds: 420 // 7:00 min
  },
  {
    tier: 'legendary',
    weight: 0.4,
    flowerRange: [181, 195],       // 15 flowers
    butterflyRange: [964, 988],    // 25 butterflies
    growthTimeSeconds: 510 // 8:30 min
  },
  {
    tier: 'mythical',
    weight: 0.1,
    flowerRange: [196, 200],       // 5 flowers
    butterflyRange: [989, 1000],   // 12 butterflies
    growthTimeSeconds: 600 // 10:00 min
  }
];

/**
 * Get a random rarity tier based on weighted distribution
 */
export function getRandomRarity(): RarityTier {
  const totalWeight = RARITY_CONFIG.reduce((sum, config) => sum + config.weight, 0);
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (const config of RARITY_CONFIG) {
    currentWeight += config.weight;
    if (random <= currentWeight) {
      return config.tier;
    }
  }
  
  return 'common'; // Fallback
}

/**
 * Get a random asset ID for a specific rarity and type
 */
export function getRandomAssetId(rarity: RarityTier, type: 'flower' | 'butterfly'): number | null {
  const config = RARITY_CONFIG.find(c => c.tier === rarity);
  if (!config) return null;
  
  const range = type === 'flower' ? config.flowerRange : config.butterflyRange;
  if (!range) return null;
  
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get asset path for given type and ID
 */
export function getAssetPath(type: 'flower' | 'butterfly', id: number): string {
  if (type === 'flower') {
    return `/Blumen/${id.toString().padStart(2, '0')}.png`;
  } else {
    return `/Schmetterlinge/${id.toString().padStart(3, '0')}.png`;
  }
}

/**
 * Get rarity tier from asset ID
 */
export function getRarityFromAssetId(type: 'flower' | 'butterfly', id: number): RarityTier {
  for (const config of RARITY_CONFIG) {
    const range = type === 'flower' ? config.flowerRange : config.butterflyRange;
    if (range && id >= range[0] && id <= range[1]) {
      return config.tier;
    }
  }
  return 'common'; // Fallback
}

/**
 * Get all available asset IDs for a specific rarity and type
 */
export function getAssetIdsForRarity(rarity: RarityTier, type: 'flower' | 'butterfly'): number[] {
  const config = RARITY_CONFIG.find(c => c.tier === rarity);
  if (!config) return [];
  
  const range = type === 'flower' ? config.flowerRange : config.butterflyRange;
  if (!range) return [];
  
  const [min, max] = range;
  const ids: number[] = [];
  for (let i = min; i <= max; i++) {
    ids.push(i);
  }
  return ids;
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: RarityTier): string {
  switch (rarity) {
    case 'common': return 'text-yellow-400';
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'super-rare': return 'text-cyan-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-orange-400';
    case 'mythical': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

/**
 * Get rarity border color for UI display
 */
export function getRarityBorder(rarity: RarityTier): string {
  switch (rarity) {
    case 'common': return 'border-yellow-400';
    case 'uncommon': return 'border-green-400';
    case 'rare': return 'border-blue-400';
    case 'super-rare': return 'border-cyan-400';
    case 'epic': return 'border-purple-400';
    case 'legendary': return 'border-orange-400';
    case 'mythical': return 'border-red-400';
    default: return 'border-gray-400';
  }
}

/**
 * Get growth time in seconds for a rarity tier
 */
export function getGrowthTime(rarity: RarityTier): number {
  const config = RARITY_CONFIG.find(c => c.tier === rarity);
  return config?.growthTimeSeconds || 75;
}

/**
 * Format time in seconds to MM:SS display
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Get German display name for rarity tier
 */
export function getRarityDisplayName(rarity: RarityTier): string {
  switch (rarity) {
    case 'common': return 'Gewöhnlich';
    case 'uncommon': return 'Ungewöhnlich';
    case 'rare': return 'Selten';
    case 'super-rare': return 'Super-Rare';
    case 'epic': return 'Episch';
    case 'legendary': return 'Legendär';
    case 'mythical': return 'Mythisch';
    default: return 'Unbekannt';
  }
}

/**
 * Generate a random flower from a specific rarity tier
 */
export function generateRandomFlower(rarity: RarityTier): { id: number; name: string; imageUrl: string } | null {
  const config = RARITY_CONFIG.find(c => c.tier === rarity);
  if (!config || !config.flowerRange) {
    return null;
  }
  
  const [min, max] = config.flowerRange;
  const flowerId = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return {
    id: flowerId,
    name: generateLatinFlowerName(flowerId), // Use flowerId as seed for consistent naming
    imageUrl: `/Blumen/${flowerId}.jpg`
  };
}

/**
 * Generate a random butterfly from a specific rarity tier  
 */
export function generateRandomButterfly(rarity: RarityTier): { id: number; name: string; imageUrl: string } | null {
  const config = RARITY_CONFIG.find(c => c.tier === rarity);
  if (!config || !config.butterflyRange) {
    return null;
  }
  
  const [min, max] = config.butterflyRange;
  const butterflyId = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return {
    id: butterflyId,
    name: generateLatinButterflyName(butterflyId), // Use butterflyId as seed for consistent naming
    imageUrl: `/Schmetterlinge/${butterflyId.toString().padStart(3, '0')}.jpg`
  };
}

/**
 * Create a seeded random number generator for consistent results
 */
function createSeededRandom(seed: number) {
  return function() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * Generate Latin-sounding flower names (2 words)
 * @param seed - Optional seed for consistent naming based on ID
 */
export function generateLatinFlowerName(seed?: number): string {
  const prefixes = [
    'Rosa', 'Flos', 'Petala', 'Corona', 'Stella', 'Luna', 'Aurora', 'Viola', 'Iris', 'Bella',
    'Magna', 'Alba', 'Rubra', 'Purpura', 'Aurea', 'Celeste', 'Divina', 'Mystica', 'Splendida', 'Elegans'
  ];
  
  const suffixes = [
    'magnificus', 'splendidus', 'elegantia', 'celestis', 'mysticus', 'divinus', 'imperialis', 'regalis',
    'luminous', 'radiatus', 'gloriosus', 'mirabilis', 'spectabilis', 'nobilis', 'perfectus', 'eternus',
    'crystallinus', 'argenteus', 'aureus', 'diamanteus'
  ];
  
  if (seed !== undefined) {
    // Use seeded random for consistent names
    const seededRandom = createSeededRandom(seed * 31);
    const prefix = prefixes[Math.floor(seededRandom() * prefixes.length)];
    const suffix = suffixes[Math.floor(seededRandom() * suffixes.length)];
    return `${prefix} ${suffix}`;
  } else {
    // Fallback to regular random for backwards compatibility
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix}`;
  }
}

/**
 * Generate Latin-sounding butterfly names (2 words)
 * @param seed - Optional seed for consistent naming based on ID
 */
export function generateLatinButterflyName(seed?: number): string {
  const prefixes = [
    'Papilio', 'Lepidoptera', 'Morpho', 'Vanessa', 'Pieris', 'Monarch', 'Danaus', 'Heliconius', 'Nymphalis', 'Lycaena',
    'Colias', 'Pontia', 'Anthocharis', 'Gonepteryx', 'Callophrys', 'Celastrina', 'Cupido', 'Plebejus', 'Polyommatus', 'Aricia'
  ];
  
  const suffixes = [
    'magnificus', 'splendidus', 'elegantia', 'celestis', 'mysticus', 'divinus', 'imperialis', 'regalis',
    'luminous', 'radiatus', 'gloriosus', 'mirabilis', 'spectabilis', 'nobilis', 'perfectus', 'eternus',
    'crystallinus', 'argenteus', 'aureus', 'diamanteus', 'volans', 'gracilis', 'delicatus', 'aereus'
  ];
  
  if (seed !== undefined) {
    // Use seeded random for consistent names
    const seededRandom = createSeededRandom(seed * 37); // Different multiplier for butterflies
    const prefix = prefixes[Math.floor(seededRandom() * prefixes.length)];
    const suffix = suffixes[Math.floor(seededRandom() * suffixes.length)];
    return `${prefix} ${suffix}`;
  } else {
    // Fallback to regular random for backwards compatibility
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix}`;
  }
}

/**
 * Get numeric index for rarity tier (useful for calculations)
 */
export function getRarityTierIndex(rarity: RarityTier): number {
  switch (rarity) {
    case 'common': return 0;
    case 'uncommon': return 1;
    case 'rare': return 2;
    case 'super-rare': return 3;
    case 'epic': return 4;
    case 'legendary': return 5;
    case 'mythical': return 6;
    default: return 0;
  }
}

/**
 * Get flower rarity based on flower ID (maps to the same distribution as image ranges)
 */
export function getFlowerRarityById(flowerId: number): RarityTier {
  if (flowerId >= 1 && flowerId <= 55) return 'common';
  if (flowerId >= 56 && flowerId <= 100) return 'uncommon';
  if (flowerId >= 101 && flowerId <= 135) return 'rare';
  if (flowerId >= 136 && flowerId <= 160) return 'super-rare';
  if (flowerId >= 161 && flowerId <= 180) return 'epic';
  if (flowerId >= 181 && flowerId <= 195) return 'legendary';
  if (flowerId >= 196 && flowerId <= 200) return 'mythical';
  
  // Fallback for IDs outside the normal range
  return 'common';
}