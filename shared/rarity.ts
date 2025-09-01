// === MARIPOSA RARITY SYSTEM ===

export const RARITY_CONFIG = {
  1: { name: 'Common', color: '#FFD700', weight: 45, growthTime: 75 * 1000 }, // 75s, gelb/yellow
  2: { name: 'Uncommon', color: '#32CD32', weight: 30, growthTime: 120 * 1000 }, // 120s, grün/green
  3: { name: 'Rare', color: '#1E90FF', weight: 15, growthTime: 180 * 1000 }, // 180s, blau/blue
  4: { name: 'Super-rare', color: '#40E0D0', weight: 7, growthTime: 300 * 1000 }, // 300s, türkis/turquoise
  5: { name: 'Epic', color: '#9370DB', weight: 2.5, growthTime: 450 * 1000 }, // 450s, lila/purple
  6: { name: 'Legendary', color: '#FF8C00', weight: 0.4, growthTime: 540 * 1000 }, // 540s, orange
  7: { name: 'Mythical', color: '#DC143C', weight: 0.1, growthTime: 600 * 1000 }, // 600s, rot/red
} as const;

// === ASSET DISTRIBUTION ===
export const FLOWER_RANGES = {
  1: { start: 1, end: 55 }, // Common: 55 flowers
  2: { start: 56, end: 100 }, // Uncommon: 45 flowers
  3: { start: 101, end: 135 }, // Rare: 35 flowers
  4: { start: 136, end: 160 }, // Super-rare: 25 flowers
  5: { start: 161, end: 180 }, // Epic: 20 flowers
  6: { start: 181, end: 195 }, // Legendary: 15 flowers
  7: { start: 196, end: 200 }, // Mythical: 5 flowers
} as const;

export const BUTTERFLY_RANGES = {
  1: { start: 1, end: 443 }, // Common: 443 butterflies
  2: { start: 444, end: 743 }, // Uncommon: 300 butterflies
  3: { start: 744, end: 843 }, // Rare: 100 butterflies
  4: { start: 844, end: 918 }, // Super-rare: 75 butterflies
  5: { start: 919, end: 963 }, // Epic: 45 butterflies
  6: { start: 964, end: 988 }, // Legendary: 25 butterflies
  7: { start: 989, end: 1000 }, // Mythical: 12 butterflies
} as const;

// === UTILITY FUNCTIONS ===
export function getRandomRarity(): number {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
    cumulative += config.weight;
    if (rand <= cumulative) {
      return parseInt(rarity);
    }
  }
  return 1; // fallback to common
}

export function getRandomFlowerId(rarity: number): number {
  const range = FLOWER_RANGES[rarity as keyof typeof FLOWER_RANGES];
  return Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
}

export function getRandomButterflyId(rarity: number): number {
  const range = BUTTERFLY_RANGES[rarity as keyof typeof BUTTERFLY_RANGES];
  return Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
}

export function getRarityConfig(rarity: number) {
  return RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG[1];
}