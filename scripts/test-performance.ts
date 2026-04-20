// scripts/test-performance.ts
// Performance testing script to measure API response times before/after optimizations

import { performance } from 'perf_hooks';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  samples: number;
}

async function testEndpoint(
  endpoint: string,
  authToken?: string,
  iterations = 5
): Promise<TestResult> {
  const times: number[] = [];
  
  console.log(`Testing ${endpoint}...`);
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      
      if (!response.ok) {
        console.warn(`  Warning: ${endpoint} returned ${response.status}`);
      }
      
      await response.json();
    } catch (error) {
      console.error(`  Error testing ${endpoint}:`, error);
      continue;
    }
    
    const end = performance.now();
    const duration = end - start;
    times.push(duration);
    
    console.log(`  Sample ${i + 1}: ${duration.toFixed(2)}ms`);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    endpoint,
    averageTime,
    minTime,
    maxTime,
    samples: times.length,
  };
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests\n');
  console.log('=' .repeat(60));
  
  const results: TestResult[] = [];
  
  // Test critical endpoints (note: these require authentication in production)
  const endpoints = [
    '/api/hr/dashboard',
    '/api/sales/leads',
    '/api/sales/clients',
    '/api/admin/users',
    '/api/hr/employees',
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint, undefined, 5);
      results.push(result);
      console.log(`✅ ${endpoint}: ${result.averageTime.toFixed(2)}ms (avg)\n`);
    } catch (error) {
      console.error(`❌ Failed to test ${endpoint}:`, error);
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n📊 Performance Summary:\n');
  
  results.forEach(result => {
    console.log(`${result.endpoint}`);
    console.log(`  Average: ${result.averageTime.toFixed(2)}ms`);
    console.log(`  Min: ${result.minTime.toFixed(2)}ms`);
    console.log(`  Max: ${result.maxTime.toFixed(2)}ms`);
    console.log(`  Samples: ${result.samples}`);
    console.log();
  });
  
  const totalAverage = results.reduce((sum, r) => sum + r.averageTime, 0) / results.length;
  console.log(`Total Average: ${totalAverage.toFixed(2)}ms`);
}

// Run tests
runPerformanceTests().catch(console.error);
