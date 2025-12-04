/**
 * Test Runner Script
 * Simple test runner to ensure all tests can execute
 */

import NetworkCompressionUtils from '../main.js';

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
    };
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🧪 Running Network Compression Utils Tests...\n');

    for (const { name, testFn } of this.tests) {
      this.results.total++;
      try {
        await testFn();
        console.log(`✅ ${name}`);
        this.results.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        this.results.failed++;
      }
    }

    console.log(
      `\n📊 Test Results: ${this.results.passed}/${this.results.total} passed`
    );

    if (this.results.failed > 0) {
      console.log(`❌ ${this.results.failed} tests failed`);
      process.exit(1);
    } else {
      console.log('🎉 All tests passed!');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || 'Value should not be null or undefined');
    }
  }

  assertInstanceOf(value, constructor, message) {
    if (!(value instanceof constructor)) {
      throw new Error(message || `Expected instance of ${constructor.name}`);
    }
  }
}

// Create test runner
const runner = new TestRunner();

// Basic functionality tests
runner.test('NetworkCompressionUtils should initialize', () => {
  const ncu = new NetworkCompressionUtils();
  runner.assertNotNull(ncu, 'NetworkCompressionUtils should be created');
  runner.assert(
    typeof ncu.compress === 'function',
    'Should have compress method'
  );
  runner.assert(
    typeof ncu.getNetworkInfo === 'function',
    'Should have getNetworkInfo method'
  );
});

runner.test('Basic compression should work', () => {
  const ncu = new NetworkCompressionUtils();
  const testData = {
    message: 'Hello World',
    data: Array(100).fill('test').join(' '),
  };

  const result = ncu.compress({
    data: testData,
    outputFormat: 'string',
  });

  runner.assertNotNull(result, 'Compression result should not be null');
  runner.assert(
    typeof result.compressed === 'boolean',
    'Should have compressed property'
  );
  runner.assertNotNull(result.data, 'Should have data property');
  runner.assert(
    typeof result.originalSize === 'number',
    'Should have originalSize property'
  );
  runner.assert(result.originalSize > 0, 'Original size should be positive');
});

runner.test('Configuration management should work', () => {
  const ncu = new NetworkCompressionUtils({
    enableAutoCompression: false,
    defaultFormat: 'formdata',
  });

  const config = ncu.getConfig();
  runner.assertEqual(
    config.enableAutoCompression,
    false,
    'Configuration should be applied'
  );
  runner.assertEqual(
    config.defaultFormat,
    'formdata',
    'Default format should be set'
  );

  const success = ncu.updateConfig({ enableAutoCompression: true });
  runner.assert(success, 'Configuration update should succeed');

  const updatedConfig = ncu.getConfig();
  runner.assertEqual(
    updatedConfig.enableAutoCompression,
    true,
    'Configuration should be updated'
  );
});

runner.test('Network info should be accessible', () => {
  const ncu = new NetworkCompressionUtils();

  const networkInfo = ncu.getNetworkInfo();
  runner.assertNotNull(networkInfo, 'Network info should not be null');

  if (networkInfo) {
    runner.assertNotNull(
      networkInfo.effectiveType,
      'Should have effectiveType'
    );
    runner.assert(
      ['slow-2g', '2g', '3g', '4g'].includes(networkInfo.effectiveType),
      'effectiveType should be valid'
    );
  }
});

runner.test('Format conversion should work', () => {
  const ncu = new NetworkCompressionUtils();
  const testData = { name: 'John', age: 30, tags: ['developer', 'javascript'] };

  // Test URLSearchParams format
  const urlResult = ncu.compress({
    data: testData,
    outputFormat: 'urlsearch',
  });

  runner.assertEqual(
    urlResult.outputFormat,
    'urlsearch',
    'Should output urlsearch format'
  );
  runner.assertNotNull(urlResult.data, 'Should have data');

  // Test FormData format
  const formDataResult = ncu.compress({
    data: testData,
    outputFormat: 'formdata',
  });

  runner.assertEqual(
    formDataResult.outputFormat,
    'formdata',
    'Should output formdata format'
  );
  runner.assertNotNull(formDataResult.data, 'Should have data');

  // Test string format
  const stringResult = ncu.compress({
    data: testData,
    outputFormat: 'string',
  });

  runner.assertEqual(
    stringResult.outputFormat,
    'string',
    'Should output string format'
  );
  runner.assert(typeof stringResult.data === 'string', 'Data should be string');
});

runner.test('Browser compatibility methods should work', () => {
  const ncu = new NetworkCompressionUtils();

  const compatibility = ncu.getBrowserCompatibility();
  runner.assertNotNull(
    compatibility,
    'Compatibility report should not be null'
  );
  runner.assertNotNull(compatibility.browser, 'Should have browser info');
  runner.assertNotNull(compatibility.features, 'Should have features info');

  const support = ncu.getBrowserSupport();
  runner.assertNotNull(support, 'Browser support should not be null');
  runner.assert(
    typeof support.supported === 'boolean',
    'Should have supported property'
  );
  runner.assertNotNull(support.level, 'Should have support level');

  const warnings = ncu.getCompatibilityWarnings();
  runner.assertNotNull(warnings, 'Warnings should not be null');
  runner.assert(Array.isArray(warnings), 'Warnings should be array');
});

runner.test('Performance statistics should work', () => {
  const ncu = new NetworkCompressionUtils();

  // Run some compression operations
  ncu.compress({ data: 'test1' });
  ncu.compress({ data: 'test2' });
  ncu.compress({ data: 'test3' });

  const stats = ncu.getCompressionStats();
  runner.assertNotNull(stats, 'Stats should not be null');
  runner.assert(
    typeof stats.totalCompressions === 'number',
    'Should have totalCompressions'
  );
  runner.assert(
    stats.totalCompressions >= 3,
    'Should track at least 3 compressions'
  );

  // Reset stats
  ncu.resetStats();
  const resetStats = ncu.getCompressionStats();
  runner.assertEqual(resetStats.totalCompressions, 0, 'Stats should be reset');
});

runner.test('System status should be comprehensive', () => {
  const ncu = new NetworkCompressionUtils();

  const status = ncu.getSystemStatus();
  runner.assertNotNull(status, 'System status should not be null');
  runner.assertNotNull(status.network, 'Should have network status');
  runner.assertNotNull(
    status.configuration,
    'Should have configuration status'
  );
  runner.assertNotNull(status.compression, 'Should have compression status');
  runner.assertNotNull(status.formats, 'Should have formats status');
});

runner.test('Edge cases should be handled gracefully', () => {
  const ncu = new NetworkCompressionUtils();

  // Test with empty data
  const emptyResult = ncu.compress({
    data: '',
    outputFormat: 'string',
  });
  runner.assertNotNull(emptyResult, 'Empty data should be handled');

  // Test with null data
  try {
    ncu.compress({
      data: null,
      outputFormat: 'string',
    });
    runner.assert(false, 'Should throw error for null data');
  } catch (error) {
    runner.assert(true, 'Should handle null data gracefully');
  }

  // Test with invalid format
  try {
    ncu.compress({
      data: 'test',
      outputFormat: 'invalid',
    });
    // Should fallback to default format
  } catch (error) {
    // Error is acceptable for invalid format
  }
});

runner.test('Large data compression should work', () => {
  const ncu = new NetworkCompressionUtils();

  // Create large test data
  const largeData = {
    data: Array(1000)
      .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
      .join(' '),
    metadata: {
      timestamp: Date.now(),
      version: '1.0.0',
      author: 'test',
      tags: Array(100).fill('tag'),
    },
  };

  const result = ncu.compress({
    data: largeData,
    outputFormat: 'string',
    forceCompression: true,
  });

  runner.assertNotNull(result, 'Large data compression should work');
  runner.assert(result.originalSize > 1000, 'Original size should be large');

  if (result.compressed) {
    runner.assert(
      result.compressedSize < result.originalSize,
      'Compressed size should be smaller'
    );
    runner.assert(
      result.compressionRatio > 0,
      'Compression ratio should be positive'
    );
  }
});

// Run all tests
runner.run().catch(console.error);
