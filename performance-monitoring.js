/**
 * Performance Monitoring Script
 * Monitors MyMariposa server performance in real-time
 */

const API_BASE = 'http://localhost:7893/api';

async function testApiPerformance() {
  console.log('🔍 Testing API Performance...\n');
  
  const endpoints = [
    { name: 'User Credits', url: '/user/4/credits', expectMs: 100 },
    { name: 'Exhibition Butterflies', url: '/user/4/exhibition-butterflies', expectMs: 200 },
    { name: 'User Butterflies', url: '/user/4/butterflies', expectMs: 200 },
    { name: 'Sell Status', url: '/exhibition/butterfly/55/sell-status', expectMs: 150, headers: { 'X-User-Id': '4' } },
    { name: 'Weekly Challenge', url: '/weekly-challenge/current', expectMs: 300 },
    { name: 'Bouquet Recipes', url: '/bouquets/recipes', expectMs: 500 }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      
      const response = await fetch(`${API_BASE}${endpoint.url}`, {
        headers: endpoint.headers || {}
      });
      
      const duration = Date.now() - start;
      const status = response.ok ? '✅' : '❌';
      const performance = duration < endpoint.expectMs ? '🚀' : duration < endpoint.expectMs * 2 ? '⚠️' : '🐌';
      
      console.log(`${status} ${performance} ${endpoint.name}: ${duration}ms (target: <${endpoint.expectMs}ms)`);
      
      results.push({
        name: endpoint.name,
        duration,
        target: endpoint.expectMs,
        status: response.status,
        success: response.ok
      });
      
    } catch (error) {
      console.log(`❌ 💥 ${endpoint.name}: ERROR - ${error.message}`);
      results.push({
        name: endpoint.name,
        duration: 999999,
        target: endpoint.expectMs,
        status: 'ERROR',
        success: false
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Performance summary
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const successRate = (results.filter(r => r.success).length / results.length * 100).toFixed(1);
  
  console.log(`\n📊 Performance Summary:`);
  console.log(`   Average Response Time: ${avgDuration.toFixed(1)}ms`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Endpoints Tested: ${results.length}`);
  
  // Performance grade
  if (avgDuration < 150 && successRate > 95) {
    console.log(`🏆 Grade: EXCELLENT - Professional performance!`);
  } else if (avgDuration < 300 && successRate > 90) {
    console.log(`🥈 Grade: GOOD - Solid performance`);
  } else if (avgDuration < 500 && successRate > 80) {
    console.log(`🥉 Grade: ACCEPTABLE - Room for improvement`);
  } else {
    console.log(`🚨 Grade: NEEDS WORK - Performance issues detected`);
  }
}

// Run the test
testApiPerformance().catch(console.error);
