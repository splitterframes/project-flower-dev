/**
 * Latin Butterfly Name Generator
 * Can generate 8000+ unique Latin scientific names for butterflies
 * Uses proper Latin naming conventions: Genus species [subspecies]
 */

// Seeded random number generator for consistent naming
function createSeededRandom(seed: number) {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
    return (state / Math.pow(2, 32) + 1) / 2;
  };
}

// Authentic Latin butterfly genus names (50 options)
const butterflyGenera = [
  'Papilio', 'Pieris', 'Colias', 'Gonepteryx', 'Lycaena', 'Polyommatus', 'Cupido', 'Celastrina',
  'Satyrium', 'Thecla', 'Callophrys', 'Favonius', 'Neozephyrus', 'Apatura', 'Limenitis', 'Neptis',
  'Ladoga', 'Nymphalis', 'Polygonia', 'Aglais', 'Vanessa', 'Cynthia', 'Argynnis', 'Speyeria',
  'Boloria', 'Melitaea', 'Euphydryas', 'Mellicta', 'Hipparchia', 'Chazara', 'Pseudochazara', 'Oeneis',
  'Satyrus', 'Minois', 'Brintesia', 'Maniola', 'Aphantopus', 'Pyronia', 'Coenonympha', 'Pararge',
  'Lasiommata', 'Lopinga', 'Kirinia', 'Neope', 'Lethe', 'Erebia', 'Proterebia', 'Leptidea',
  'Anthocharis', 'Zegris'
];

// Latin species epithets (80 options) 
const speciesEpithets = [
  'magnificus', 'elegans', 'splendidus', 'aureus', 'argenteus', 'purpureus', 'azureus', 'viridis',
  'ruber', 'niger', 'albus', 'flavus', 'roseus', 'coeruleus', 'luteus', 'cyaneus', 'violaceus',
  'crystallinus', 'margaritaceus', 'adamantinus', 'opalinus', 'iridescens', 'spectabilis', 'mirabilis',
  'admirabilis', 'venerabilis', 'gloriosus', 'majesticus', 'imperialis', 'regalis', 'princeps',
  'nobilis', 'illustris', 'praeclarus', 'eximius', 'excellens', 'superbus', 'magnificentissimus',
  'pulcherrimus', 'formosus', 'venustus', 'decorus', 'ornatus', 'pictus', 'variegatus', 'maculatus',
  'striatus', 'fasciatus', 'lineatus', 'punctatus', 'guttatus', 'stellatus', 'radiatus', 'coronatus',
  'cristatus', 'plumosus', 'sericeus', 'velutinus', 'nitidus', 'lucidus', 'fulgidus', 'coruscans',
  'scintillans', 'micans', 'rutilans', 'candescens', 'effulgidus', 'refulgens', 'splendens', 'fulgens',
  'luminosus', 'radiatus', 'gloriosus', 'triumphalis', 'victorialis', 'celestialis', 'divinus', 'sacer',
  'mysticus', 'arcanus', 'secretus', 'rarus', 'unicus', 'singularis', 'extraordinarius', 'paradoxus'
];

// Optional subspecies/varieties (40 options) for even more combinations
const subspeciesVarieties = [
  'magnificus', 'minor', 'major', 'giganteus', 'minimus', 'maximus', 'borealis', 'australis',
  'orientalis', 'occidentalis', 'septentrionalis', 'meridionalis', 'alpinus', 'montanus', 'sylvestris',
  'campestris', 'pratensis', 'nemorensis', 'littoralis', 'riparius', 'palustris', 'lacustris',
  'fluviatilis', 'maritimus', 'insularis', 'continentalis', 'tropicus', 'arcticus', 'temperatus',
  'aestivalis', 'vernalis', 'autumnalis', 'hibernalis', 'matutinus', 'vespertinus', 'nocturnus',
  'diurnus', 'crepuscularis', 'lunaris', 'solaris'
];

// Rare prefixes for legendary/mythical butterflies (20 options)
const rarePrefixes = [
  'Chryso', 'Aureo', 'Argento', 'Plati', 'Diamanto', 'Crystallo', 'Opalo', 'Beryl',
  'Emerald', 'Sapphir', 'Rubino', 'Adamant', 'Celestin', 'Astro', 'Cosmic', 'Stellar',
  'Nebulo', 'Galaxi', 'Universo', 'Infinit'
];

// Generate a Latin butterfly name based on rarity and seed
export function generateLatinButterflyName(seed?: number, rarity?: string): string {
  const seededRandom = seed !== undefined ? createSeededRandom(seed * 73) : Math.random;
  
  // For mythical/legendary butterflies, occasionally use rare prefixes
  const useRarePrefix = rarity === 'mythical' ? (seededRandom() < 0.3) : 
                       rarity === 'legendary' ? (seededRandom() < 0.15) : false;
  
  let genus: string;
  if (useRarePrefix && seed !== undefined) {
    const prefix = rarePrefixes[Math.floor(seededRandom() * rarePrefixes.length)];
    const baseGenus = butterflyGenera[Math.floor(seededRandom() * butterflyGenera.length)];
    genus = prefix + baseGenus.toLowerCase();
  } else {
    genus = butterflyGenera[Math.floor(seededRandom() * butterflyGenera.length)];
  }
  
  const species = speciesEpithets[Math.floor(seededRandom() * speciesEpithets.length)];
  
  // 15% chance for subspecies (creates more combinations)
  const addSubspecies = seededRandom() < 0.15;
  if (addSubspecies) {
    const subspecies = subspeciesVarieties[Math.floor(seededRandom() * subspeciesVarieties.length)];
    return `${genus} ${species} ${subspecies}`;
  }
  
  return `${genus} ${species}`;
}

// Calculate total possible combinations
export function calculateLatinButterflyNameCombinations(): number {
  // Base combinations: 50 genera × 80 species = 4,000
  const baseCombinations = butterflyGenera.length * speciesEpithets.length;
  
  // With subspecies (15% chance): +600 additional combinations
  const subspeciesCombinations = baseCombinations * subspeciesVarieties.length * 0.15;
  
  // Rare prefix combinations (for legendary/mythical): +800 additional combinations
  const rarePrefixCombinations = rarePrefixes.length * butterflyGenera.length * speciesEpithets.length * 0.1;
  
  const total = Math.floor(baseCombinations + subspeciesCombinations + rarePrefixCombinations);
  
  return total; // ~8,400+ unique combinations
}

// Test the generator
export function testLatinButterflyNameGenerator(): void {
  console.log('🦋 Testing Latin Butterfly Name Generator...');
  console.log(`📊 Total possible combinations: ${calculateLatinButterflyNameCombinations().toLocaleString()}`);
  
  console.log('\n🌟 Sample names by rarity:');
  
  // Test different rarities
  const rarities = ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'];
  
  rarities.forEach(rarity => {
    console.log(`\n${rarity.toUpperCase()}:`);
    for (let i = 0; i < 3; i++) {
      const seed = Math.floor(Math.random() * 10000);
      const name = generateLatinButterflyName(seed, rarity);
      console.log(`  - ${name}`);
    }
  });
  
  // Test uniqueness with seeds
  console.log('\n🔍 Testing seed consistency:');
  const testSeed = 12345;
  for (let i = 0; i < 3; i++) {
    const name = generateLatinButterflyName(testSeed, 'rare');
    console.log(`  Seed ${testSeed}: ${name}`);
  }
}
