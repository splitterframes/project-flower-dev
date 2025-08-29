// Rarity system utilities for Mariposa game

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'super-rare' | 'epic' | 'legendary' | 'mythical';

export interface RarityConfig {
  tier: RarityTier;
  weight: number;
  flowerRange: [number, number] | null;
  butterflyRange: [number, number] | null;
  growthTimeSeconds: number;
}

// Weighted distribution configuration
export const RARITY_CONFIG: RarityConfig[] = [
  {
    tier: 'common',
    weight: 45,
    flowerRange: [1, 90],
    butterflyRange: [1, 450],
    growthTimeSeconds: 75 // 1:15 min
  },
  {
    tier: 'uncommon', 
    weight: 30,
    flowerRange: [91, 150],
    butterflyRange: [451, 750],
    growthTimeSeconds: 150 // 2:30 min
  },
  {
    tier: 'rare',
    weight: 15,
    flowerRange: [151, 180],
    butterflyRange: [751, 900],
    growthTimeSeconds: 240 // 4:00 min
  },
  {
    tier: 'super-rare',
    weight: 7,
    flowerRange: [181, 194],
    butterflyRange: [901, 970],
    growthTimeSeconds: 330 // 5:30 min
  },
  {
    tier: 'epic',
    weight: 2.5,
    flowerRange: [195, 199],
    butterflyRange: [971, 995],
    growthTimeSeconds: 420 // 7:00 min
  },
  {
    tier: 'legendary',
    weight: 0.4,
    flowerRange: [200, 200],
    butterflyRange: [996, 999],
    growthTimeSeconds: 510 // 8:30 min
  },
  {
    tier: 'mythical',
    weight: 0.1,
    flowerRange: null, // No mythical flowers (reserved for events)
    butterflyRange: [1000, 1000],
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