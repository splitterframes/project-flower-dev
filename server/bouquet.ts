import OpenAI from "openai";
import { getRarityTierIndex, type RarityTier } from "@shared/rarity";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ButterflyData {
  id: number;
  name: string;
  imageUrl: string;
}

// Generate a unique bouquet name using AI
export async function generateBouquetName(rarity: RarityTier): Promise<string> {
  try {
    const rarityDescriptions = {
      common: "einfach und bescheiden",
      uncommon: "charmant und ansprechend", 
      rare: "elegant und außergewöhnlich",
      "super-rare": "prächtig und beeindruckend",
      epic: "majestätisch und kraftvoll",
      legendary: "mythisch und ehrfurchtgebietend",
      mythical: "göttlich und transzendent"
    };

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für Blumenbouquets und erstellst einzigartige, poetische Namen. 
          Erstelle kreative deutsche Bouquet-Namen, die ${rarityDescriptions[rarity]} klingen.
          
          Verwende Muster wie:
          - [Adjektiv] + [Blumen-/Natur-Substantiv] (z.B. "Strahlende Morgenröte", "Sanfte Brise")
          - [Poetisches Wort] + der/des + [Natur-Element] (z.B. "Symphonie der Blüten", "Hauch des Frühlings")
          - [Emotional] + [Naturphänomen] (z.B. "Verzauberte Dämmerung", "Träumende Wiese")
          
          Antworte nur mit dem Namen, keine Erklärung. Maximal 3-4 Wörter.`
        },
        {
          role: "user", 
          content: `Erstelle einen ${rarityDescriptions[rarity]} Bouquet-Namen der Seltenheitsstufe ${rarity}.`
        }
      ],
      max_tokens: 30,
      temperature: 0.9
    });

    const generatedName = response.choices[0].message.content?.trim() || "Unbenanntes Bouquet";
    
    // Clean up the name (remove quotes, ensure proper formatting)
    return generatedName.replace(/"/g, '').replace(/\.$/, '');
    
  } catch (error) {
    console.error('Failed to generate bouquet name:', error);
    
    // Fallback names based on rarity
    const fallbackNames = {
      common: ["Schlichte Schönheit", "Einfache Freude", "Bescheidene Blüte"],
      uncommon: ["Sanfte Harmonie", "Liebliche Melodie", "Charmante Komposition"],
      rare: ["Elegante Symphonie", "Seltene Pracht", "Edle Komposition"],
      "super-rare": ["Prächtige Verzauberung", "Glanzvolle Erscheinung", "Strahlende Vollendung"],
      epic: ["Majestätische Offenbarung", "Kraftvolle Schönheit", "Epische Blütenpracht"],
      legendary: ["Legendäre Verzauberung", "Mythische Schönheit", "Ewige Vollendung"],
      mythical: ["Göttliche Perfektion", "Transzendente Pracht", "Mystische Offenbarung"]
    };
    
    const options = fallbackNames[rarity];
    return options[Math.floor(Math.random() * options.length)];
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

// Total butterfly count (user has 819 butterflies)
const TOTAL_BUTTERFLIES = 819;

// Generate butterfly IDs from 1 to 819
function getAllButterflyIds(): number[] {
  const ids: number[] = [];
  for (let i = 1; i <= TOTAL_BUTTERFLIES; i++) {
    ids.push(i);
  }
  return ids;
}

// All available butterfly IDs based on actual image files (82 total images)
const AVAILABLE_BUTTERFLY_IDS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 69, 70, 71, 72, 73, 74, 75, 76, 78, 79, 113, 232, 369, 659
];

// Get proper filename for butterfly ID (handles both numbered and zero-padded formats)
function getButterflyImageFilename(id: number): string {
  // Special cases for zero-padded files
  if (id === 1 && AVAILABLE_BUTTERFLY_IDS.includes(1)) return '01.png';
  if (id === 2 && AVAILABLE_BUTTERFLY_IDS.includes(2)) return '02.png';
  
  // Standard three-digit padding for higher numbers
  if (id >= 100) return `${id}.jpg`;
  
  // Regular format for most files
  return `${id}.jpg`;
}

// Rarity distribution for all 82 available butterflies
const RARITY_DISTRIBUTION = {
  common: Math.floor(82 * 0.443),      // 36 butterflies (44.3%)
  uncommon: Math.floor(82 * 0.30),     // 25 butterflies (30%)
  rare: Math.floor(82 * 0.15),         // 12 butterflies (15%)
  'super-rare': Math.floor(82 * 0.07), // 6 butterflies (7%)
  epic: Math.floor(82 * 0.025),        // 2 butterflies (2.5%)
  legendary: Math.floor(82 * 0.004),   // 0-1 butterfly (0.4%)
  mythical: Math.floor(82 * 0.001)     // 0-1 butterfly (0.1%)
};

// Ensure we use all 82 butterflies by adjusting the last tier
const totalAssigned = Object.values(RARITY_DISTRIBUTION).reduce((sum, count) => sum + count, 0);
RARITY_DISTRIBUTION.common += (82 - totalAssigned); // Add remaining to common

// Create rarity assignments for each butterfly ID
const BUTTERFLY_RARITY_MAP = new Map<number, RarityTier>();
let currentIndex = 0;

// Assign rarities to available IDs (excluding 0 which is fallback)
const usableIds = AVAILABLE_BUTTERFLY_IDS.filter(id => id > 0);

for (const [rarity, count] of Object.entries(RARITY_DISTRIBUTION) as [RarityTier, number][]) {
  for (let i = 0; i < count && currentIndex < usableIds.length; i++) {
    BUTTERFLY_RARITY_MAP.set(usableIds[currentIndex], rarity);
    currentIndex++;
  }
}

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
export function shouldSpawnButterfly(rarity: RarityTier): boolean {
  const probability = getButterflySpawnProbability(rarity);
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