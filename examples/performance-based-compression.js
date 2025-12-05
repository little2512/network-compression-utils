/**
 * Performance-Based Compression Examples
 * Demonstrates how to use the intelligent compression features
 */

import NetworkCompressionUtils from '../src/main.js';

// Example 1: Basic Usage with Performance Optimization
async function basicPerformanceCompression() {
  console.log('=== Basic Performance-Based Compression ===');

  // Initialize with performance optimization enabled
  const ncu = new NetworkCompressionUtils({
    performanceOptimization: {
      enabled: true,
      performanceThreshold: 1, // 1ms threshold
      speedTestInterval: 30000, // Test every 30 seconds
      aggressiveModeThreshold: 5 // Enable aggressive mode for < 5 Kbps
    },
    enableLogging: true
  });

  // Test with different data sizes
  const testDataSizes = [
    { size: 100, name: '100 bytes (tiny)' },
    { size: 1024, name: '1KB (small)' },
    { size: 4096, name: '4KB (medium)' },
    { size: 16384, name: '16KB (large)' }
  ];

  for (const { size, name } of testDataSizes) {
    const data = 'x'.repeat(size);
    const analysis = ncu.getPerformanceAnalysis(size);

    console.log(`\n${name}:`);
    console.log(`  Should compress: ${analysis.shouldCompress}`);
    console.log(`  Estimated transmission time: ${analysis.estimatedTransmissionTime.toFixed(2)}ms`);
    console.log(`  Compression benefit: ${analysis.compressionBenefit.toFixed(2)}ms`);
    console.log(`  Recommendation: ${analysis.recommendation}`);

    // Actually compress
    const result = ncu.compress({ data });
    console.log(`  Actually compressed: ${result.compressed}`);
  }
}

// Example 2: Simulating Different Network Conditions
async function simulateNetworkConditions() {
  console.log('\n=== Simulating Different Network Conditions ===');

  const ncu = new NetworkCompressionUtils({
    performanceOptimization: { enabled: true },
    enableLogging: false
  });

  // Simulate different network speeds
  const networkScenarios = [
    { speedKbps: 10000, name: '4G (Fast)', type: '4g' },
    { speedKbps: 2000, name: '3G (Medium)', type: '3g' },
    { speedKbps: 100, name: '2G (Slow)', type: '2g' },
    { speedKbps: 2, name: 'Very Slow Network', type: 'slow-2g' },
    { speedKbps: 0.5, name: 'Extremely Poor Network', type: 'slow-2g' }
  ];

  const testData = { message: 'test data'.repeat(100) }; // ~2KB
  const dataSize = JSON.stringify(testData).length;

  console.log(`\nTesting with ${dataSize} bytes of data:`);

  for (const scenario of networkScenarios) {
    // Simulate network speed by adding speed sample
    ncu.performanceAnalyzer.addSpeedSample({
      speedKbps: scenario.speedKbps,
      timestamp: Date.now(),
      dataSize: dataSize,
      duration: (dataSize * 8) / (scenario.speedKbps * 1000)
    });

    const analysis = ncu.getPerformanceAnalysis(dataSize, scenario.type);

    console.log(`\n${scenario.name} (${scenario.speedKbps} Kbps):`);
    console.log(`  Transmission time: ${analysis.estimatedTransmissionTime.toFixed(2)}ms`);
    console.log(`  Should compress: ${analysis.shouldCompress}`);
    console.log(`  Compression saves: ${analysis.compressionBenefit.toFixed(2)}ms`);
    console.log(`  Performance threshold exceeded: ${analysis.estimatedTransmissionTime > 1}`);
  }
}

// Example 3: Real-Time Network Monitoring
async function realTimeNetworkMonitoring() {
  console.log('\n=== Real-Time Network Monitoring ===');

  const ncu = new NetworkCompressionUtils({
    performanceOptimization: {
      enabled: true,
      speedTestInterval: 5000, // Test every 5 seconds for demo
      performanceThreshold: 1
    },
    enableLogging: true
  });

  // Monitor network performance for a period
  console.log('Starting network monitoring...');

  // Simulate changing network conditions
  const networkProgression = [
    { speedKbps: 10000, duration: 2000, name: 'Good 4G' },
    { speedKbps: 1000, duration: 3000, name: 'Degraded 3G' },
    { speedKbps: 50, duration: 4000, name: 'Poor 2G' },
    { speedKbps: 2, duration: 5000, name: 'Very Slow' },
    { speedKbps: 10000, duration: 2000, name: 'Recovered 4G' }
  ];

  for (const phase of networkProgression) {
    console.log(`\n--- ${phase.name} (${phase.speedKbps} Kbps) ---`);

    // Add speed sample to simulate current network
    ncu.performanceAnalyzer.addSpeedSample({
      speedKbps: phase.speedKbps,
      timestamp: Date.now()
    });

    // Get current performance status
    const status = ncu.getNetworkPerformanceStatus();
    console.log(`Average speed: ${status.averageSpeedKbps?.toFixed(2)} Kbps`);
    console.log(`Weak network condition: ${status.weakNetworkCondition?.name || 'None'}`);

    // Test compression decision for 1KB data
    const analysis = ncu.getPerformanceAnalysis(1024);
    console.log(`1KB compression decision: ${analysis.shouldCompress ? 'COMPRESS' : 'NO COMPRESS'}`);
    console.log(`Transmission time: ${analysis.estimatedTransmissionTime.toFixed(2)}ms`);

    // Wait for this phase duration
    await new Promise(resolve => setTimeout(resolve, phase.duration));
  }
}

// Example 4: Compression with Force Speed Test
async function compressionWithSpeedTest() {
  console.log('\n=== Compression with Forced Speed Test ===');

  const ncu = new NetworkCompressionUtils({
    performanceOptimization: { enabled: true },
    enableLogging: false
  });

  // Test data
  const largeData = {
    user: {
      name: 'John Doe',
      bio: 'Software developer with extensive experience in web technologies'.repeat(20),
      projects: Array(50).fill().map((_, i) => ({
        id: i,
        name: `Project ${i}`,
        description: 'Project description '.repeat(10)
      }))
    }
  };

  const dataSize = JSON.stringify(largeData).length;
  console.log(`Testing with ${dataSize} bytes of data`);

  // Get baseline performance analysis (without speed test)
  const baselineAnalysis = ncu.getPerformanceAnalysis(dataSize);
  console.log('\nBaseline analysis (no real speed data):');
  console.log(`Should compress: ${baselineAnalysis.shouldCompress}`);
  console.log(`Estimated time: ${baselineAnalysis.estimatedTransmissionTime.toFixed(2)}ms`);

  // Perform actual speed test
  console.log('\nPerforming speed test...');
  try {
    // Simulate speed test result (in real scenario, this would be actual network request)
    const speedTestResult = {
      speedKbps: 5, // Simulate slow network
      latency: 150,
      quality: 'poor'
    };

    ncu.performanceAnalyzer.addSpeedSample({
      speedKbps: speedTestResult.speedKbps,
      timestamp: Date.now()
    });

    console.log(`Speed test result: ${speedTestResult.speedKbps} Kbps, ${speedTestResult.quality} quality`);

    // Get updated performance analysis
    const updatedAnalysis = ncu.getPerformanceAnalysis(dataSize);
    console.log('\nUpdated analysis (with real speed data):');
    console.log(`Should compress: ${updatedAnalysis.shouldCompress}`);
    console.log(`Estimated time: ${updatedAnalysis.estimatedTransmissionTime.toFixed(2)}ms`);
    console.log(`Compression benefit: ${updatedAnalysis.compressionBenefit.toFixed(2)}ms`);
    console.log(`Recommendation: ${updatedAnalysis.recommendation}`);

    // Actually compress based on performance analysis
    const compressionResult = ncu.compress({ data: largeData });
    console.log('\nCompression result:');
    console.log(`Compressed: ${compressionResult.compressed}`);
    console.log(`Algorithm: ${compressionResult.algorithm}`);
    console.log(`Original size: ${compressionResult.originalSize} bytes`);
    if (compressionResult.compressed) {
      console.log(`Compressed size: ${compressionResult.compressedSize} bytes`);
      console.log(`Compression ratio: ${((1 - compressionResult.compressedSize / compressionResult.originalSize) * 100).toFixed(1)}%`);
    }

  } catch (error) {
    console.error('Speed test failed:', error.message);
  }
}

// Example 5: Advanced Configuration and Customization
function advancedConfiguration() {
  console.log('\n=== Advanced Configuration Examples ===');

  // Example 1: Aggressive compression for mobile apps
  const mobileNCU = new NetworkCompressionUtils({
    performanceOptimization: {
      enabled: true,
      performanceThreshold: 0.5, // More aggressive - 0.5ms threshold
      aggressiveModeThreshold: 10, // Earlier aggressive mode
      speedTestInterval: 15000 // More frequent testing
    },
    thresholds: {
      'slow-2g': 25,  // Very aggressive for slow networks
      '2g': 150,      // Aggressive
      '3g': 300,      // Moderate
      '4g': 1000      // Still conservative for 4G
    },
    enableAutoCompression: true,
    preferSmallest: true
  });

  console.log('Mobile-optimized configuration:');
  console.log(`  Performance threshold: 0.5ms`);
  console.log(`  Slow-2G threshold: 25 bytes`);
  console.log(`  Aggressive mode at: <10 Kbps`);

  // Example 2: Conservative compression for desktop applications
  const desktopNCU = new NetworkCompressionUtils({
    performanceOptimization: {
      enabled: true,
      performanceThreshold: 5, // More relaxed - 5ms threshold
      aggressiveModeThreshold: 1, // Only very slow networks
      speedTestInterval: 60000 // Less frequent testing
    },
    thresholds: {
      'slow-2g': 100,
      '2g': 500,
      '3g': 1000,
      '4g': 3000
    },
    enableAutoCompression: true,
    preferSmallest: false
  });

  console.log('\nDesktop-optimized configuration:');
  console.log(`  Performance threshold: 5ms`);
  console.log(`  4G threshold: 3000 bytes`);
  console.log(`  Aggressive mode at: <1 Kbps`);
}

// Run all examples
async function runAllExamples() {
  try {
    await basicPerformanceCompression();
    await simulateNetworkConditions();
    await realTimeNetworkMonitoring();
    await compressionWithSpeedTest();
    advancedConfiguration();

    console.log('\n=== All Examples Completed Successfully ===');

  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Export functions for individual testing
export {
  basicPerformanceCompression,
  simulateNetworkConditions,
  realTimeNetworkMonitoring,
  compressionWithSpeedTest,
  advancedConfiguration,
  runAllExamples
};

// Run examples if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runPerformanceExamples = runAllExamples;
  console.log('Performance examples loaded. Call runPerformanceExamples() to run all examples.');
} else if (typeof global !== 'undefined') {
  // Node.js environment
  runAllExamples();
}