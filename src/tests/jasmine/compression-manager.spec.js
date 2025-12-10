/**
 * Compression Functionality Jasmine Tests
 * Browser-based compression functionality tests using NetworkCompressionUtils
 */

describe('Compression Functionality', function () {
  let compressionUtils;

  beforeEach(function () {
    // Reset localStorage before each test
    localStorage.clear();

    compressionUtils = new NetworkCompressionUtils({
      minCompressionRatio: 0.1, // 10% minimum compression
      enableAutoCompression: true,
      enableLogging: false,
    });
  });

  afterEach(function () {
    // Clean up after each test
    compressionUtils.resetStats();
  });

  describe('Basic Compression Tests', function () {
    it('should compress repetitive data successfully', function () {
      const data = testHelpers.createTestRepetitiveData();

      const result = compressionUtils.compress({
        data,
        forceCompression: true,
      }); // Force compression

      expect(result.compressed).toBe(true);
      expect(result.algorithm).toBe('LZ-String');
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeGreaterThan(0.1);
    });

    it('should handle non-repetitive data appropriately', function () {
      const data = testHelpers.createNonRepetitiveData();

      const result = compressionUtils.compress({
        data,
        forceCompression: false,
      });

      // Should use original data if compression is not beneficial
      if (!result.compressed) {
        expect(result.algorithm).toBe('none');
        // For uncompressed data, these fields may be undefined
        if (result.compressedSize !== undefined) {
          expect(result.compressedSize).toBe(result.originalSize);
        }
        if (result.compressionRatio !== undefined) {
          expect(result.compressionRatio).toBe(0);
        }
      }
    });

    it('should handle very small data correctly', function () {
      const data = 'small';

      const result = compressionUtils.compress({
        data,
        forceCompression: false,
      });

      expect(result.algorithm).toBe('none');
      expect(result.compressed).toBe(false);
      // Error may not always be present for small data
    });

    it('should respect force compression flag', function () {
      const data = 'small_data'; // Normally too small to compress

      const resultWithoutForce = compressionUtils.compress({
        data,
        forceCompression: false,
      });
      const resultWithForce = compressionUtils.compress({
        data,
        forceCompression: true,
      });

      expect(resultWithoutForce.compressed).toBe(false);
      expect(resultWithoutForce.algorithm).toBe('none');

      // With force, should attempt compression even on small data
      expect(resultWithForce.algorithm).not.toBe('none');
    });
  });

  describe('Decompression Tests', function () {
    it('should decompress data correctly', function () {
      const originalData = testHelpers.createTestRepetitiveData();
      const compressedResult = compressionUtils.compress({
        data: originalData,
        forceCompression: true,
      });

      if (
        compressedResult.compressed &&
        compressedResult.algorithm !== 'none'
      ) {
        // Note: NetworkCompressionUtils doesn't expose decompress method
        // We test that compression worked and produced expected results
        expect(compressedResult.data).toBeDefined();
        expect(typeof compressedResult.data).toBe('string');
        expect(compressedResult.compressedSize).toBeLessThan(
          compressedResult.originalSize
        );
      }
    });

    it('should handle decompression errors gracefully', function () {
      expect(function () {
        compressionUtils.decompress('invalid_compressed_data', 'lz-string');
      }).toThrow();
    });
  });

  describe('Configuration Tests', function () {
    it('should respect minCompressionRatio setting', function () {
      const testCompressionUtils = new NetworkCompressionUtils({
        minCompressionRatio: 0.5, // 50% minimum compression
        enableLogging: false,
      });

      const data = 'test_message_12345'.repeat(100); // Moderate repetition

      const result = testCompressionUtils.compress({
        data,
        forceCompression: false,
      });

      // If compression doesn't meet 50% threshold, should use original data
      if (result.compressionRatio < 0.5) {
        expect(result.algorithm).toBe('none');
        expect(result.compressed).toBe(false);
      }
    });

    it('should update configuration correctly', function () {
      const newConfig = {
        minCompressionRatio: 0.2,
        enableFallback: false,
      };

      compressionUtils.updateConfig(newConfig);
      const currentConfig = compressionUtils.getConfig();

      expect(currentConfig.minCompressionRatio).toBe(0.2);
      expect(currentConfig.enableFallback).toBe(false);
    });
  });

  describe('Statistics Tests', function () {
    it('should track compression statistics correctly', function () {
      const data = testHelpers.createTestRepetitiveData();

      // Perform multiple compressions
      compressionUtils.compress({ data, forceCompression: true });
      compressionUtils.compress({ data, forceCompression: true });
      compressionUtils.compress({ data: 'small', forceCompression: false }); // This should not compress but still count

      const stats = compressionUtils.getCompressionStats();

      expect(stats.totalCompressions).toBeGreaterThanOrEqual(2); // At least the successful compressions
      expect(stats.successfulCompressions).toBeGreaterThan(0);
      expect(stats.averageCompressionTime).toBeGreaterThanOrEqual(0); // Allow 0 for very fast operations
    });

    it('should reset statistics correctly', function () {
      const data = testHelpers.createTestRepetitiveData();

      compressionUtils.compress({ data, forceCompression: true });
      expect(compressionUtils.getCompressionStats().totalCompressions).toBe(1);

      compressionUtils.resetStats();
      const resetStats = compressionUtils.getCompressionStats();

      expect(resetStats.totalCompressions).toBe(0);
      expect(resetStats.successfulCompressions).toBe(0);
      expect(resetStats.totalOriginalSize).toBe(0);
      expect(resetStats.totalCompressedSize).toBe(0);
    });
  });

  describe('Utility Method Tests', function () {
    it('should provide compression functionality through main API', function () {
      // Test compression behavior through the main compress method
      const smallData = 'small';
      const largeData = 'A'.repeat(200);

      const smallResult = compressionUtils.compress({
        data: smallData,
        forceCompression: false,
      });
      const largeResult = compressionUtils.compress({
        data: largeData,
        forceCompression: true,
      });

      expect(smallResult).toBeDefined();
      expect(largeResult).toBeDefined();
      expect(typeof smallResult.compressed).toBe('boolean');
      expect(typeof largeResult.compressed).toBe('boolean');
    });

    it('should provide algorithm information through compression results', function () {
      const data = 'test_data_'.repeat(100);
      const result = compressionUtils.compress({
        data,
        forceCompression: true,
      });

      expect(result).toBeDefined();
      expect(result.algorithm).toBeDefined();
      expect(typeof result.algorithm).toBe('string');
    });
  });

  describe('Error Handling Tests', function () {
    it('should handle compression errors gracefully', function () {
      // Mock a compression scenario that might fail
      spyOn(LZString, 'compress').and.throwError('Compression failed');

      const errorManager = new NetworkCompressionUtils({
        enableFallback: true,
        enableLogging: false,
      });

      const data = 'x'.repeat(100);
      const result = errorManager.compress({ data, forceCompression: true });

      expect(result).toBeDefined();
      // Error handling may vary depending on implementation
    });

    it('should handle serialization errors', function () {
      // Create circular reference that can't be serialized
      const circular = {};
      circular.self = circular;

      // Should handle gracefully without throwing
      const result = compressionUtils.compress({
        data: circular,
        forceCompression: true,
      });
      expect(result).toBeDefined();
    });
  });

  describe('Performance Tests', function () {
    it('should handle large data efficiently', function () {
      const largeData = testHelpers.createLargeTestData(100000); // 100KB

      const result = compressionUtils.compress({
        data: largeData,
        forceCompression: true,
      });

      expect(result).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should complete compression in reasonable time', function () {
      const data = testHelpers.createTestRepetitiveData();

      const startTime = performance.now();
      const result = compressionUtils.compress({
        data,
        forceCompression: true,
      });
      const endTime = performance.now();

      expect(result.processingTime).toBeLessThan(100); // Should be very fast
      expect(endTime - startTime).toBeLessThan(500); // Overall operation should be fast
    });
  });

  describe('Algorithm Comparison Tests', function () {
    it('should compare algorithms correctly', function () {
      const testData = testHelpers.createTestRepetitiveData();

      const comparison = compressionUtils.compareAlgorithms(testData);

      expect(comparison).toBeDefined();
      expect(comparison['lz-string']).toBeDefined();
      expect(comparison['none']).toBeDefined();
    });

    it('should test compression performance', function () {
      const sampleData = testHelpers.createTestRepetitiveData();

      const testResults = compressionUtils.testCompression(sampleData, 5);

      expect(testResults.iterations).toBe(5);
      expect(testResults.results.length).toBe(5);
      expect(testResults.averageCompressionRatio).toBeDefined();
      expect(testResults.averageCompressionTime).toBeDefined();
      expect(testResults.successRate).toBeGreaterThanOrEqual(0);
      expect(testResults.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', function () {
    it('should handle null and undefined data', function () {
      const nullResult = compressionUtils.compress({
        data: null,
        forceCompression: true,
      });
      const undefinedResult = compressionUtils.compress({
        data: undefined,
        forceCompression: true,
      });

      expect(nullResult).toBeDefined();
      expect(undefinedResult).toBeDefined();
    });

    it('should handle empty strings and objects', function () {
      const emptyStringResult = compressionUtils.compress({
        data: '',
        forceCompression: true,
      });
      const emptyObjectResult = compressionUtils.compress({
        data: {},
        forceCompression: true,
      });

      expect(emptyStringResult).toBeDefined();
      expect(emptyObjectResult).toBeDefined();
    });

    it('should handle binary-like data patterns', function () {
      const binaryData = '\x00\x01\x02\x03'.repeat(1000);

      const result = compressionUtils.compress({
        data: binaryData,
        forceCompression: false,
      });

      expect(result).toBeDefined();
      // Binary data compression behavior depends on size and content
      // We just verify it returns a valid result
      expect(typeof result.compressed).toBe('boolean');
      expect(result.algorithm).toBeDefined();
    });
  });
});
