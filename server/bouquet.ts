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

// Available butterfly files mapping: [id, extension]
const AVAILABLE_BUTTERFLIES = [
  [1, 'png'], [2, 'png'], [1, 'jpg'], [2, 'jpg'], [3, 'jpg'], [4, 'jpg'], [5, 'jpg'], [6, 'jpg'],
  [7, 'jpg'], [8, 'jpg'], [9, 'jpg'], [10, 'jpg'], [11, 'jpg'], [12, 'jpg'], [13, 'jpg'], [14, 'jpg'],
  [15, 'jpg'], [16, 'jpg'], [17, 'jpg'], [18, 'jpg'], [19, 'jpg'], [20, 'jpg'], [21, 'jpg'], [22, 'jpg'],
  [23, 'jpg'], [24, 'jpg'], [25, 'jpg'], [26, 'jpg'], [27, 'jpg'], [28, 'jpg'], [29, 'jpg'], [30, 'jpg'],
  [31, 'jpg'], [32, 'jpg'], [33, 'jpg'], [34, 'jpg'], [35, 'jpg'], [36, 'jpg'], [37, 'jpg'], [38, 'jpg'],
  [39, 'jpg'], [40, 'jpg'], [41, 'jpg'], [42, 'jpg'], [43, 'jpg'], [44, 'jpg'], [45, 'jpg'], [46, 'jpg'],
  [47, 'jpg'], [48, 'jpg'], [49, 'jpg'], [50, 'jpg'], [51, 'jpg'], [52, 'jpg'], [54, 'jpg'], [55, 'jpg'],
  [56, 'jpg'], [57, 'jpg'], [58, 'jpg'], [59, 'jpg'], [60, 'jpg'], [61, 'jpg'], [62, 'jpg'], [63, 'jpg'],
  [64, 'jpg'], [65, 'jpg'], [67, 'jpg'], [69, 'jpg'], [70, 'jpg'], [71, 'jpg'], [72, 'jpg'], [73, 'jpg'],
  [74, 'jpg'], [75, 'jpg'], [76, 'jpg'], [78, 'jpg'], [79, 'jpg']
];

// Function to get file extension for a butterfly ID
function getButterflyExtension(id: number): string {
  // Check if jpg version exists first (preferred)
  const jpgExists = AVAILABLE_BUTTERFLIES.some(([butterflyId, ext]) => butterflyId === id && ext === 'jpg');
  if (jpgExists) return 'jpg';
  
  // Otherwise check for png
  const pngExists = AVAILABLE_BUTTERFLIES.some(([butterflyId, ext]) => butterflyId === id && ext === 'png');
  if (pngExists) return 'png';
  
  // Default fallback
  return 'jpg';
}

// Generate random butterfly based on bouquet rarity
export async function generateRandomButterfly(rarity: RarityTier): Promise<ButterflyData> {
  // Get unique butterfly IDs (remove duplicates, prefer jpg)
  const uniqueIds: number[] = Array.from(new Set(AVAILABLE_BUTTERFLIES.map(([id, ext]) => id as number)));
  
  // Create rarity tiers from available butterflies
  const shuffled: number[] = [...uniqueIds].sort(() => Math.random() - 0.5); // Randomize distribution
  const totalCount = shuffled.length;
  
  const tierSizes = {
    common: Math.floor(totalCount * 0.45),      // 45%
    uncommon: Math.floor(totalCount * 0.30),    // 30%
    rare: Math.floor(totalCount * 0.15),        // 15%
    "super-rare": Math.floor(totalCount * 0.07), // 7%
    epic: Math.floor(totalCount * 0.025),       // 2.5%
    legendary: Math.floor(totalCount * 0.004),  // 0.4%
    mythical: Math.max(1, Math.floor(totalCount * 0.001)) // 0.1% (at least 1)
  };
  
  let startIndex = 0;
  const tierRanges: Record<RarityTier, number[]> = {
    common: shuffled.slice(startIndex, startIndex += tierSizes.common),
    uncommon: shuffled.slice(startIndex, startIndex += tierSizes.uncommon),
    rare: shuffled.slice(startIndex, startIndex += tierSizes.rare),
    "super-rare": shuffled.slice(startIndex, startIndex += tierSizes["super-rare"]),
    epic: shuffled.slice(startIndex, startIndex += tierSizes.epic),
    legendary: shuffled.slice(startIndex, startIndex += tierSizes.legendary),
    mythical: shuffled.slice(startIndex)
  };
  
  // Get butterflies for this rarity tier
  let availableIds = tierRanges[rarity];
  
  // Fallback to common if no butterflies available for this rarity
  if (!availableIds || availableIds.length === 0) {
    availableIds = tierRanges.common.slice(0, 5); // Use first 5 common butterflies
  }
  
  // Select random butterfly from available IDs
  const butterflyId = availableIds[Math.floor(Math.random() * availableIds.length)];
  const extension = getButterflyExtension(butterflyId);
  
  // Generate consistent Latin name using butterflyId as seed
  const { generateLatinButterflyName } = await import('../shared/rarity');
  const name = generateLatinButterflyName(butterflyId);

  return {
    id: butterflyId,
    name,
    imageUrl: `/Schmetterlinge/${butterflyId.toString().padStart(3, '0')}.${extension}`
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