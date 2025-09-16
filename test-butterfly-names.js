// Test script to verify Latin butterfly name generation
import { generateLatinButterflyName } from './shared/rarity.js';

console.log('🦋 Testing Latin Butterfly Name Generation...');

// Test with different seeds and rarities
for (let i = 1; i <= 10; i++) {
  const rarities = ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'];
  
  console.log(`\nButterfly ID ${i}:`);
  rarities.forEach(rarity => {
    const name = generateLatinButterflyName(i, rarity);
    console.log(`  ${rarity}: ${name}`);
  });
}

console.log('\n🔬 Testing consistency (same seed should give same name):');
for (let i = 0; i < 3; i++) {
  const name1 = generateLatinButterflyName(999, 'rare');
  const name2 = generateLatinButterflyName(999, 'rare');
  console.log(`Test ${i+1}: ${name1} === ${name2} ? ${name1 === name2}`);
}
