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

// Available butterfly IDs based on actual image files
const AVAILABLE_BUTTERFLY_IDS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 69, 70, 71, 72, 73, 74, 75, 76, 78, 79, 113, 232, 369, 659
];

// Generate random butterfly based on bouquet rarity using available IDs only
export async function generateRandomButterfly(rarity: RarityTier): Promise<ButterflyData> {
  // Define rarity groups from available IDs
  const availableIds = AVAILABLE_BUTTERFLY_IDS.filter(id => id > 0); // Exclude 0 as it's fallback
  const totalIds = availableIds.length;
  
  // Distribute available IDs across rarity tiers
  const rarityGroupSizes = {
    common: Math.floor(totalIds * 0.54),      // 54% = ~43 IDs
    uncommon: Math.floor(totalIds * 0.30),    // 30% = ~24 IDs
    rare: Math.floor(totalIds * 0.10),        // 10% = ~8 IDs
    "super-rare": Math.floor(totalIds * 0.04), // 4% = ~3 IDs
    epic: Math.floor(totalIds * 0.015),       // 1.5% = ~1 ID
    legendary: Math.floor(totalIds * 0.004),  // 0.4% = ~0-1 ID
    mythical: Math.floor(totalIds * 0.001)    // 0.1% = ~0-1 ID
  };
  
  // Create rarity pools
  let startIndex = 0;
  const rarityPools: Record<RarityTier, number[]> = {
    common: availableIds.slice(startIndex, startIndex + rarityGroupSizes.common),
    uncommon: availableIds.slice(startIndex += rarityGroupSizes.common, startIndex + rarityGroupSizes.uncommon),
    rare: availableIds.slice(startIndex += rarityGroupSizes.uncommon, startIndex + rarityGroupSizes.rare),
    "super-rare": availableIds.slice(startIndex += rarityGroupSizes.rare, startIndex + rarityGroupSizes["super-rare"]),
    epic: availableIds.slice(startIndex += rarityGroupSizes["super-rare"], startIndex + rarityGroupSizes.epic),
    legendary: availableIds.slice(startIndex += rarityGroupSizes.epic, startIndex + rarityGroupSizes.legendary),
    mythical: availableIds.slice(startIndex += rarityGroupSizes.legendary)
  };
  
  // Select random ID from the rarity pool
  const pool = rarityPools[rarity];
  const butterflyId = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : availableIds[Math.floor(Math.random() * availableIds.length)];
  
  // Generate consistent Latin name using butterflyId as seed
  const { generateLatinButterflyName } = await import('../shared/rarity');
  const name = generateLatinButterflyName(butterflyId);

  return {
    id: butterflyId,
    name,
    imageUrl: `/Schmetterlinge/${butterflyId.toString().padStart(3, '0')}.jpg`
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