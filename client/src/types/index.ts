// === MARIPOSA TYPE DEFINITIONS ===

export interface User {
  id: number;
  username: string;
  credits: number;
}

export interface Seed {
  id: number;
  userId: number;
  seedId: number; // 1-7 for rarity
  quantity: number;
  createdAt: string;
}

export interface PlantedField {
  id: number;
  userId: number;
  fieldIndex: number; // 0-24
  seedId: number;
  plantedAt: string;
  harvestAt: string;
  isReady: boolean;
}

export interface UserFlower {
  id: number;
  userId: number;
  flowerId: number; // 1-200
  rarity: number; // 1-7
  quantity: number;
  createdAt: string;
}

export interface FieldButterfly {
  id: number;
  userId: number;
  fieldIndex: number;
  butterflyId: number; // 1-1000
  rarity: number;
  spawnedAt: string;
  despawnAt: string;
}

export interface UserButterfly {
  id: number;
  userId: number;
  butterflyId: number;
  rarity: number;
  quantity: number;
  collectedAt: string;
}

export interface Bouquet {
  id: number;
  userId: number;
  name: string;
  flower1Id: number;
  flower2Id?: number;
  flower3Id?: number;
  totalRarity: number;
  createdAt: string;
}

export interface PlacedBouquet {
  id: number;
  userId: number;
  bouquetId: number;
  fieldIndex: number;
  placedAt: string;
  expiresAt: string;
}

export interface ExhibitionFrame {
  id: number;
  userId: number;
  frameIndex: number; // 0-24
  butterflyId?: number;
  rarity?: number;
  placedAt?: string;
}

export interface UnlockedField {
  id: number;
  userId: number;
  fieldIndex: number; // 0-49
  unlockedAt: string;
  unlockCost: number;
}

// === RARITY SYSTEM ===
export const RARITY_CONFIG = {
  1: { name: 'Common', color: '#FFD700', weight: 45, growthTime: 75 }, // gelb/yellow
  2: { name: 'Uncommon', color: '#32CD32', weight: 30, growthTime: 120 }, // grün/green
  3: { name: 'Rare', color: '#1E90FF', weight: 15, growthTime: 180 }, // blau/blue
  4: { name: 'Super-rare', color: '#40E0D0', weight: 7, growthTime: 300 }, // türkis/turquoise
  5: { name: 'Epic', color: '#9370DB', weight: 2.5, growthTime: 450 }, // lila/purple
  6: { name: 'Legendary', color: '#FF8C00', weight: 0.4, growthTime: 540 }, // orange
  7: { name: 'Mythical', color: '#DC143C', weight: 0.1, growthTime: 600 }, // rot/red
} as const;