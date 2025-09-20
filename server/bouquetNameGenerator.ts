import { type RarityTier } from "@shared/rarity";

// Comprehensive English bouquet name generator
// Can generate 200,000+ unique combinations

interface NameComponents {
  adjectives: string[];
  nouns: string[];
  prefixes: string[];
  suffixes: string[];
}

const rarityComponents: Record<RarityTier, NameComponents> = {
  common: {
    adjectives: [
      "Sweet", "Gentle", "Simple", "Fresh", "Lovely", "Pretty", "Soft", "Pure", "Bright",
      "Cheerful", "Pleasant", "Charming", "Tender", "Graceful", "Peaceful", "Quiet",
      "Sunny", "Happy", "Light", "Warm", "Cozy", "Natural", "Garden", "Country",
      "Morning", "Spring", "Summer", "Meadow", "Field", "Cottage", "Village",
      "Homey", "Rustic", "Classic", "Traditional", "Wholesome", "Innocent", "Clean"
    ],
    nouns: [
      "Blossoms", "Petals", "Flowers", "Blooms", "Garden", "Meadow", "Bouquet",
      "Bunch", "Posy", "Spray", "Collection", "Gathering", "Arrangement",
      "Morning", "Afternoon", "Sunshine", "Breeze", "Whisper", "Song", "Dance",
      "Dream", "Memory", "Moment", "Smile", "Joy", "Peace", "Harmony",
      "Field", "Valley", "Hill", "Stream", "Path", "Walk", "Stroll"
    ],
    prefixes: ["Little", "Tiny", "Small", "Mini", "Baby", "Young"],
    suffixes: ["Bundle", "Mix", "Blend", "Touch", "Hint", "Kiss"]
  },
  
  uncommon: {
    adjectives: [
      "Enchanted", "Delicate", "Elegant", "Gracious", "Refined", "Sophisticated",
      "Beautiful", "Wonderful", "Marvelous", "Splendid", "Exquisite", "Lovely",
      "Captivating", "Alluring", "Fascinating", "Intriguing", "Mysterious",
      "Romantic", "Dreamy", "Whimsical", "Artistic", "Creative", "Inspired",
      "Golden", "Silver", "Crystal", "Pearl", "Silk", "Velvet", "Satin",
      "Autumn", "Winter", "Twilight", "Dawn", "Sunset", "Moonlit", "Starlit"
    ],
    nouns: [
      "Symphony", "Melody", "Harmony", "Rhapsody", "Serenade", "Lullaby",
      "Romance", "Fantasy", "Dream", "Vision", "Wonder", "Magic", "Spell",
      "Treasure", "Jewel", "Gem", "Crown", "Tiara", "Necklace", "Ring",
      "Gallery", "Painting", "Portrait", "Masterpiece", "Creation", "Work",
      "Ocean", "River", "Lake", "Forest", "Woods", "Grove", "Glade"
    ],
    prefixes: ["Royal", "Noble", "Grand", "Fine", "Fair", "Sweet"],
    suffixes: ["Collection", "Selection", "Assembly", "Medley", "Array", "Display"]
  },

  rare: {
    adjectives: [
      "Magnificent", "Spectacular", "Extraordinary", "Remarkable", "Outstanding",
      "Exceptional", "Prestigious", "Distinguished", "Illustrious", "Renowned",
      "Brilliant", "Radiant", "Luminous", "Glorious", "Resplendent", "Dazzling",
      "Majestic", "Imperial", "Regal", "Noble", "Aristocratic", "Elite",
      "Precious", "Rare", "Unique", "Special", "Exclusive", "Select",
      "Celestial", "Heavenly", "Divine", "Sacred", "Blessed", "Hallowed"
    ],
    nouns: [
      "Constellation", "Galaxy", "Universe", "Cosmos", "Infinity", "Eternity",
      "Paradise", "Haven", "Sanctuary", "Temple", "Cathedral", "Palace",
      "Empire", "Kingdom", "Realm", "Domain", "Dynasty", "Legacy",
      "Phoenix", "Dragon", "Unicorn", "Griffin", "Pegasus", "Angel",
      "Crown", "Scepter", "Throne", "Castle", "Tower", "Fortress"
    ],
    prefixes: ["Ancient", "Eternal", "Timeless", "Legendary", "Epic", "Heroic"],
    suffixes: ["Dynasty", "Legacy", "Heritage", "Tradition", "Legend", "Saga"]
  },

  "super-rare": {
    adjectives: [
      "Transcendent", "Sublime", "Ethereal", "Celestial", "Mystical", "Arcane",
      "Enigmatic", "Esoteric", "Phenomenal", "Supernatural", "Otherworldly",
      "Primordial", "Ancient", "Timeless", "Eternal", "Infinite", "Boundless",
      "Omnipotent", "Omniscient", "Supreme", "Ultimate", "Absolute", "Perfect",
      "Flawless", "Immaculate", "Pristine", "Pure", "Sacred", "Holy",
      "Blessed", "Sanctified", "Consecrated", "Hallowed", "Revered", "Venerable"
    ],
    nouns: [
      "Apotheosis", "Epiphany", "Revelation", "Ascension", "Transcendence",
      "Enlightenment", "Nirvana", "Utopia", "Elysium", "Valhalla", "Olympus",
      "Avalon", "Shangri-La", "Eden", "Genesis", "Alpha", "Omega",
      "Nexus", "Vortex", "Portal", "Gateway", "Threshold", "Passage",
      "Seraphim", "Cherubim", "Archangel", "Guardian", "Protector", "Sentinel"
    ],
    prefixes: ["Divine", "Sacred", "Holy", "Blessed", "Celestial", "Angelic"],
    suffixes: ["Ascension", "Transcendence", "Enlightenment", "Revelation", "Epiphany", "Apotheosis"]
  },

  epic: {
    adjectives: [
      "Omnipotent", "Omniscient", "Omnipresent", "Almighty", "All-Powerful",
      "Invincible", "Indomitable", "Unstoppable", "Unbreakable", "Unshakeable",
      "Legendary", "Mythical", "Fabled", "Storied", "Celebrated", "Immortal",
      "Godlike", "Titanic", "Colossal", "Monumental", "Epic", "Heroic",
      "Apocalyptic", "Cataclysmic", "Earth-Shaking", "World-Changing", "Reality-Bending",
      "Time-Transcending", "Space-Warping", "Dimension-Crossing", "Multiverse-Spanning"
    ],
    nouns: [
      "Armageddon", "Apocalypse", "Ragnarok", "Gotterdammerung", "Eschaton",
      "Singularity", "Big Bang", "Genesis", "Creation", "Universe", "Multiverse",
      "Reality", "Existence", "Being", "Consciousness", "Awareness", "Mind",
      "Soul", "Spirit", "Essence", "Core", "Heart", "Center", "Source",
      "Origin", "Beginning", "End", "Alpha", "Omega", "Infinity", "Eternity"
    ],
    prefixes: ["Cosmic", "Universal", "Galactic", "Stellar", "Solar", "Lunar"],
    suffixes: ["Genesis", "Apocalypse", "Revelation", "Judgment", "Reckoning", "Destiny"]
  },

  legendary: {
    adjectives: [
      "Primordial", "Pre-Cosmic", "Pre-Universal", "Pre-Reality", "Pre-Existence",
      "Meta-Physical", "Meta-Cosmic", "Meta-Universal", "Trans-Dimensional",
      "Hyper-Spatial", "Ultra-Temporal", "Supra-Natural", "Beyond-Mortal",
      "Above-Divine", "Greater-Than-God", "Source-Of-All", "Creator-Of-Creators",
      "Destroyer-Of-Destroyers", "Alpha-Of-Alphas", "Omega-Of-Omegas"
    ],
    nouns: [
      "Architects", "Builders", "Creators", "Makers", "Shapers", "Molders",
      "Designers", "Engineers", "Constructors", "Fabricators", "Craftsmen",
      "Artisans", "Masters", "Grandmasters", "Overlords", "Sovereigns",
      "Emperors", "Gods", "Deities", "Divinities", "Immortals", "Eternals",
      "Ancients", "Elders", "Primarchs", "Patriarchs", "Forefathers", "Ancestors"
    ],
    prefixes: ["First", "Original", "Primary", "Prime", "Principal", "Chief"],
    suffixes: ["Primarch", "Patriarch", "Ancestor", "Forefather", "Progenitor", "Origin"]
  },

  mythical: {
    adjectives: [
      "Inconceivable", "Incomprehensible", "Unimaginable", "Indescribable",
      "Unspeakable", "Ineffable", "Inexpressible", "Unutterable", "Nameless",
      "Wordless", "Speechless", "Silent", "Void", "Null", "Nothing",
      "Everything", "All", "None", "Zero", "One", "Unity", "Singularity",
      "Duality", "Trinity", "Infinity", "Eternity", "Forever", "Always",
      "Never", "Beyond", "Above", "Below", "Within", "Without", "Between"
    ],
    nouns: [
      "Void", "Nothingness", "Everything", "All-That-Is", "All-That-Was",
      "All-That-Will-Be", "All-That-Could-Be", "All-That-Cannot-Be",
      "Possibility", "Impossibility", "Reality", "Unreality", "Truth",
      "Lie", "Light", "Dark", "Shadow", "Reflection", "Echo", "Whisper",
      "Silence", "Sound", "Music", "Harmony", "Discord", "Chaos", "Order",
      "Balance", "Imbalance", "Perfection", "Imperfection", "Completion"
    ],
    prefixes: ["Ultimate", "Final", "Last", "First", "Only", "Pure"],
    suffixes: ["Absolute", "Ultimate", "Final", "Complete", "Perfect", "Pure"]
  }
};

// Generate a random bouquet name based on rarity
export function generateBouquetName(rarity: RarityTier, existingNames: string[] = []): string {
  const components = rarityComponents[rarity];
  let attempts = 0;
  let name = "";
  
  while (attempts < 100) { // Prevent infinite loops
    // Choose random generation pattern
    const patterns = [
      () => {
        // [Adjective] [Noun]
        const adj = components.adjectives[Math.floor(Math.random() * components.adjectives.length)];
        const noun = components.nouns[Math.floor(Math.random() * components.nouns.length)];
        return `${adj} ${noun}`;
      },
      () => {
        // [Prefix] [Adjective] [Noun]
        const prefix = components.prefixes[Math.floor(Math.random() * components.prefixes.length)];
        const adj = components.adjectives[Math.floor(Math.random() * components.adjectives.length)];
        const noun = components.nouns[Math.floor(Math.random() * components.nouns.length)];
        return `${prefix} ${adj} ${noun}`;
      },
      () => {
        // [Adjective] [Noun] [Suffix]
        const adj = components.adjectives[Math.floor(Math.random() * components.adjectives.length)];
        const noun = components.nouns[Math.floor(Math.random() * components.nouns.length)];
        const suffix = components.suffixes[Math.floor(Math.random() * components.suffixes.length)];
        return `${adj} ${noun} ${suffix}`;
      },
      () => {
        // [Noun] of [Adjective] [Noun]
        const noun1 = components.nouns[Math.floor(Math.random() * components.nouns.length)];
        const adj = components.adjectives[Math.floor(Math.random() * components.adjectives.length)];
        const noun2 = components.nouns[Math.floor(Math.random() * components.nouns.length)];
        return `${noun1} of ${adj} ${noun2}`;
      },
      () => {
        // The [Adjective] [Noun]
        const adj = components.adjectives[Math.floor(Math.random() * components.adjectives.length)];
        const noun = components.nouns[Math.floor(Math.random() * components.nouns.length)];
        return `The ${adj} ${noun}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    name = pattern();
    
    // Check if name already exists
    if (!existingNames.includes(name)) {
      break;
    }
    
    attempts++;
  }
  
  return name || `Unique ${rarity} Bouquet`;
}

// Calculate total possible combinations for verification
export function calculatePossibleCombinations(): number {
  let total = 0;
  
  for (const rarity of Object.keys(rarityComponents) as RarityTier[]) {
    const comp = rarityComponents[rarity];
    const patterns = 5; // Number of different name patterns
    const combinations = 
      (comp.adjectives.length * comp.nouns.length) + // Pattern 1
      (comp.prefixes.length * comp.adjectives.length * comp.nouns.length) + // Pattern 2
      (comp.adjectives.length * comp.nouns.length * comp.suffixes.length) + // Pattern 3
      (comp.nouns.length * comp.adjectives.length * comp.nouns.length) + // Pattern 4
      (comp.adjectives.length * comp.nouns.length); // Pattern 5
    
    total += combinations;
  }
  
  return total;
}
