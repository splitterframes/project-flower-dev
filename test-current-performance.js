/**
 * Test current server performance and identify bottlenecks
 */

const API_BASE = 'http://localhost:7893/api';

async function testSequentialVsParallel() {
  console.log('🏃‍♂️ Testing Sequential vs Parallel API calls...\n');
  
  // Test data endpoints for user 4
  const endpoints = [
    '/user/4/suns',
    '/user/4/dna', 
    '/user/4/tickets',
    '/user/4/seeds',
    '/user/4/flowers'
  ];
  
  // Sequential test
  console.log('📚 Sequential calls:');
  const sequentialStart = Date.now();
  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      await fetch(`${API_BASE}${endpoint}`);
      console.log(`  ${endpoint}: ${Date.now() - start}ms`);
    } catch (error) {
      console.log(`  ${endpoint}: ERROR`);
    }
  }
  const sequentialTotal = Date.now() - sequentialStart;
  
  console.log(`\n⚡ Parallel calls:`);
  const parallelStart = Date.now();
  const promises = endpoints.map(async endpoint => {
    const start = Date.now();
    try {
      await fetch(`${API_BASE}${endpoint}`);
      const duration = Date.now() - start;
      console.log(`  ${endpoint}: ${duration}ms`);
      return duration;
    } catch (error) {
      console.log(`  ${endpoint}: ERROR`);
      return 999;
    }
  });
  
  await Promise.all(promises);
  const parallelTotal = Date.now() - parallelStart;
  
  console.log(`\n📊 Results:`);
  console.log(`   Sequential: ${sequentialTotal}ms`);
  console.log(`   Parallel: ${parallelTotal}ms`);
  console.log(`   Speedup: ${(sequentialTotal / parallelTotal).toFixed(1)}x faster`);
  console.log(`   Time saved: ${sequentialTotal - parallelTotal}ms`);
}

async function testCacheEffectiveness() {
  console.log('\n🎯 Testing Cache Effectiveness...\n');
  
  const endpoint = '/bouquets/recipes';
  
  // First call (should be slow - miss)
  console.log('First call (cache miss):');
  const start1 = Date.now();
  await fetch(`${API_BASE}${endpoint}`);
  const duration1 = Date.now() - start1;
  console.log(`  ${duration1}ms`);
  
  // Second call (should be fast - hit)
  console.log('Second call (cache hit):');
  const start2 = Date.now();
  await fetch(`${API_BASE}${endpoint}`);
  const duration2 = Date.now() - start2;
  console.log(`  ${duration2}ms`);
  
  const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(1);
  console.log(`\n💾 Cache improvement: ${improvement}% faster (${duration1 - duration2}ms saved)`);
}

// Run tests
async function runAllTests() {
  try {
    await testSequentialVsParallel();
    await testCacheEffectiveness();
    
    console.log('\n🎉 Performance testing complete!');
    console.log('💡 Tip: The server running on port 7893 has all optimizations active.');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

runAllTests();
