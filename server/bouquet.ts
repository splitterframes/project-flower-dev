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

// Generate random butterfly based on bouquet rarity
export function generateRandomButterfly(rarity: RarityTier): ButterflyData {
  // Butterfly ID ranges based on rarity (from replit.md)
  const butterflyRanges = {
    common: { start: 1, end: 443 },
    uncommon: { start: 444, end: 743 },
    rare: { start: 744, end: 843 },
    "super-rare": { start: 844, end: 918 },
    epic: { start: 919, end: 963 },
    legendary: { start: 964, end: 988 },
    mythical: { start: 989, end: 1000 }
  };

  const range = butterflyRanges[rarity];
  const butterflyId = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
  
  // Generate Latin-sounding name
  const prefixes = ["Lepido", "Papilio", "Macro", "Micro", "Helio", "Chryso", "Morpho", "Caligo", "Ithomia", "Parides"];
  const suffixes = ["pteryx", "morpha", "glossa", "soma", "phanes", "chrome", "melos", "nympha", "thalassa", "aureus"];
  const name = prefixes[Math.floor(Math.random() * prefixes.length)] + " " + 
               suffixes[Math.floor(Math.random() * suffixes.length)];

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
  
  // 70% chance same rarity, 30% chance one tier lower
  const shouldDowngrade = Math.random() < 0.3;
  
  if (shouldDowngrade) {
    const rarityIndex = getRarityTierIndex(rarity);
    const downgradedIndex = Math.max(0, rarityIndex - 1);
    const rarities: RarityTier[] = ["common", "uncommon", "rare", "super-rare", "epic", "legendary", "mythical"];
    const downgradedRarity = rarities[downgradedIndex];
    return { rarity: downgradedRarity, quantity };
  }
  
  return { rarity, quantity };
}