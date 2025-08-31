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

// Generate random butterfly based on bouquet rarity (1-819 with rarity distribution)
export async function generateRandomButterfly(rarity: RarityTier): Promise<ButterflyData> {
  // Define rarity ranges based on the 1000 butterflies distribution from replit.md
  const butterflyRanges = {
    common: { start: 1, end: 443 },        // 443 butterflies
    uncommon: { start: 444, end: 743 },    // 300 butterflies
    rare: { start: 744, end: 843 },        // 100 butterflies
    "super-rare": { start: 844, end: 918 }, // 75 butterflies
    epic: { start: 919, end: 963 },        // 45 butterflies
    legendary: { start: 964, end: 988 },   // 25 butterflies
    mythical: { start: 989, end: 1000 }    // 12 butterflies
  };

  const range = butterflyRanges[rarity];
  const butterflyId = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
  
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