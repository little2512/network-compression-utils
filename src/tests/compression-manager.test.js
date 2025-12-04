/**
 * Compression Manager Tests
 */

import CompressionManager from '../compression-manager.js';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

describe('CompressionManager', () => {
  beforeEach(() => {
    // Reset performance mock
    let time = 0;
    mockPerformanceNow.mockImplementation(() => {
      time += 10; // Simulate 10ms per call
      return time;
    });
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      const manager = new CompressionManager();
      const config = manager.getConfig();

      expect(config.algorithm).toBe('lz-string');
      expect(config.timeout).toBe(5000);
      expect(config.minCompressionRatio).toBe(0.1);
      expect(config.enableFallback).toBe(true);
      expect(config.preferSmallest).toBe(true);
    });

    test('should merge user configuration with defaults', () => {
      const customConfig = {
        algorithm: 'none',
        minCompressionRatio: 0.2,
        enableFallback: false,
      };

      const manager = new CompressionManager(customConfig);
      const config = manager.getConfig();

      expect(config.algorithm).toBe('none');
      expect(config.minCompressionRatio).toBe(0.2);
      expect(config.enableFallback).toBe(false);
      expect(config.timeout).toBe(5000); // Default preserved
    });
  });

  describe('Basic Compression', () => {
    test('should compress string data successfully', () => {
      const manager = new CompressionManager();
      const testData = 'Hello, World! '.repeat(100); // Create larger string
      const result = manager.compress(testData);

      expect(result.success).toBe(true);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.algorithm).toBe('lz-string');
      expect(result.compressionTime).toBeGreaterThan(0);
    });

    test('should handle object data compression', () => {
      const manager = new CompressionManager();
      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        data: new Array(100).fill('test data'),
      };

      const result = manager.compress(testData);

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.originalSize).toBeGreaterThan(0);
    });

    test('should handle array data compression', () => {
      const manager = new CompressionManager();
      const testData = new Array(50).fill().map((_, i) => ({
        id: i,
        value: `item-${i}`,
        description: `This is item number ${i} with some additional text`,
      }));

      const result = manager.compress(testData);

      expect(result.success).toBe(true);
      expect(result.compressionRatio).toBeGreaterThan(0);
    });

    test('should not compress very small data', () => {
      const manager = new CompressionManager();
      const testData = 'small';

      const result = manager.compress(testData);

      expect(result.success).toBe(false);
      expect(result.algorithm).toBe('none');
      expect(result.error).toBe('Data too small for compression');
    });
  });

  describe('Compression Algorithms', () => {
    test('should support lz-string algorithm', () => {
      const manager = new CompressionManager({ algorithm: 'lz-string' });
      const testData = 'test data '.repeat(50);

      const result = manager.compress(testData);

      expect(result.algorithm).toBe('lz-string');
      expect(result.success).toBe(true);
    });

    test('should support none algorithm (no compression)', () => {
      const manager = new CompressionManager({ algorithm: 'none' });
      const testData = 'test data '.repeat(50);

      const result = manager.compress(testData);

      expect(result.algorithm).toBe('none');
      expect(result.compressedSize).toBe(result.originalSize);
      expect(result.compressionRatio).toBe(0);
    });

    test('should handle compression when compressed data is larger', () => {
      const manager = new CompressionManager({
        algorithm: 'lz-string',
        preferSmallest: true,
      });

      // Use data that might not compress well
      const testData = new Array(10).fill('random string').join('');

      const result = manager.compress(testData);

      // Should prefer smaller of compressed/original
      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    });
  });

  describe('Decompression', () => {
    test('should decompress lz-string compressed data', () => {
      const manager = new CompressionManager();
      const originalData = 'test data for decompression '.repeat(20);

      const compressedResult = manager.compress(originalData);
      expect(compressedResult.success).toBe(true);

      const decompressedData = manager.decompress(
        compressedResult.data,
        compressedResult.algorithm
      );

      expect(decompressedData).toEqual(JSON.parse(originalData));
    });

    test('should decompress uncompressed data', () => {
      const manager = new CompressionManager({ algorithm: 'none' });
      const originalData = 'test data';

      const compressedResult = manager.compress(originalData);
      const decompressedData = manager.decompress(
        compressedResult.data,
        compressedResult.algorithm
      );

      expect(decompressedData).toBe(originalData);
    });

    test('should handle decompression errors', () => {
      const manager = new CompressionManager();

      expect(() => {
        manager.decompress('invalid compressed data', 'lz-string');
      }).toThrow('Decompression failed');
    });
  });

  describe('Data Handling', () => {
    test('should serialize different data types correctly', () => {
      const manager = new CompressionManager();

      // Test string
      const stringData = 'test string';
      expect(manager.serializeData(stringData)).toBe(stringData);

      // Test object
      const objectData = { key: 'value', number: 42 };
      expect(manager.serializeData(objectData)).toBe(
        JSON.stringify(objectData)
      );

      // Test array
      const arrayData = [1, 2, 3];
      expect(manager.serializeData(arrayData)).toBe(JSON.stringify(arrayData));
    });

    test('should deserialize data correctly', () => {
      const manager = new CompressionManager();

      // Test valid JSON
      const jsonData = '{"key": "value"}';
      expect(manager.deserializeData(jsonData)).toEqual({ key: 'value' });

      // Test invalid JSON (should return as string)
      const invalidJson = 'not json data';
      expect(manager.deserializeData(invalidJson)).toBe(invalidJson);
    });

    test('should calculate data size correctly', () => {
      const manager = new CompressionManager();
      const testData = 'test string';

      const size = manager.getDataSize(testData);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
  });

  describe('Compression Heuristics', () => {
    test('should identify data that should be compressed', () => {
      const manager = new CompressionManager();

      // Large object should be compressible
      const largeObject = {
        data: new Array(100).fill('some text data'),
        metadata: { type: 'test', version: '1.0' },
      };
      expect(manager.shouldCompress(largeObject)).toBe(true);

      // Large string should be compressible
      const largeString = 'test data '.repeat(50);
      expect(manager.shouldCompress(largeString)).toBe(true);

      // Small string should not be compressible
      expect(manager.shouldCompress('small')).toBe(false);
    });

    test('should detect already compressed data', () => {
      const manager = new CompressionManager();

      // Mock compressed data signatures
      const zipData = 'PK\x03\x04';
      const gzipData = '\x1f\x8b\x08\x00';
      const pngData = '\x89PNG\r\n\x1a\n';

      expect(manager.isLikelyCompressed(zipData)).toBe(true);
      expect(manager.isLikelyCompressed(gzipData)).toBe(true);
      expect(manager.isLikelyCompressed(pngData)).toBe(true);
      expect(manager.isLikelyCompressed('regular text')).toBe(false);
    });
  });

  describe('Statistics', () => {
    test('should track compression statistics', () => {
      const manager = new CompressionManager();

      // Perform several compressions
      for (let i = 0; i < 5; i++) {
        manager.compress(`test data ${i} `.repeat(20));
      }

      const stats = manager.getCompressionStats();

      expect(stats.totalCompressions).toBe(5);
      expect(stats.successfulCompressions).toBeGreaterThan(0);
      expect(stats.totalOriginalSize).toBeGreaterThan(0);
      expect(stats.averageCompressionTime).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.spaceSaved).toBeGreaterThanOrEqual(0);
    });

    test('should reset statistics', () => {
      const manager = new CompressionManager();

      // Perform some compressions
      manager.compress('test data '.repeat(20));
      manager.compress('more test data '.repeat(15));

      // Reset stats
      manager.resetStats();

      const stats = manager.getCompressionStats();

      expect(stats.totalCompressions).toBe(0);
      expect(stats.successfulCompressions).toBe(0);
      expect(stats.totalOriginalSize).toBe(0);
      expect(stats.totalCompressedSize).toBe(0);
      expect(stats.averageCompressionTime).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const manager = new CompressionManager();

      manager.updateConfig({
        algorithm: 'none',
        minCompressionRatio: 0.3,
      });

      const config = manager.getConfig();
      expect(config.algorithm).toBe('none');
      expect(config.minCompressionRatio).toBe(0.3);
    });

    test('should get available algorithms', () => {
      const manager = new CompressionManager();
      const algorithms = manager.getAvailableAlgorithms();

      expect(algorithms).toContain('lz-string');
      expect(algorithms).toContain('none');
    });

    test('should check algorithm support', () => {
      const manager = new CompressionManager();

      expect(manager.isAlgorithmSupported('lz-string')).toBe(true);
      expect(manager.isAlgorithmSupported('none')).toBe(true);
      expect(manager.isAlgorithmSupported('invalid')).toBe(false);
    });
  });

  describe('Performance Testing', () => {
    test('should test compression performance', () => {
      const manager = new CompressionManager();
      const testData = {
        items: new Array(100).fill().map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is the description for item ${i}`,
        })),
      };

      const testResults = manager.testCompression(testData, 5);

      expect(testResults.algorithm).toBe('lz-string');
      expect(testResults.iterations).toBe(5);
      expect(testResults.results).toHaveLength(5);
      expect(testResults.averageCompressionRatio).toBeGreaterThanOrEqual(0);
      expect(testResults.averageCompressionTime).toBeGreaterThan(0);
      expect(testResults.successRate).toBeGreaterThanOrEqual(0);
      expect(testResults.successRate).toBeLessThanOrEqual(1);
    });

    test('should compare algorithms', () => {
      const manager = new CompressionManager();
      const testData = new Array(50).fill('test data for comparison ');

      const comparison = manager.compareAlgorithms(testData);

      expect(comparison).toHaveProperty('lz-string');
      expect(comparison).toHaveProperty('none');

      expect(comparison['lz-string'].successRate).toBeGreaterThanOrEqual(0);
      expect(comparison['none'].successRate).toBe(0); // 'none' algorithm doesn't compress
    });
  });

  describe('Error Handling', () => {
    test('should handle circular reference objects', () => {
      const manager = new CompressionManager();
      const circularData = { name: 'test' };
      circularData.self = circularData; // Create circular reference

      const result = manager.compress(circularData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Data serialization failed');
    });

    test('should handle compression failures with fallback', () => {
      const manager = new CompressionManager({
        enableFallback: true,
      });

      // Mock LZ-String to throw an error
      const originalCompress = manager.compressWithLZString;
      manager.compressWithLZString = jest.fn().mockImplementation(() => {
        throw new Error('Mock compression error');
      });

      const result = manager.compress('test data '.repeat(50));

      expect(result.success).toBe(false);
      expect(result.algorithm).toBe('none');
      expect(result.error).toContain('Compression failed');

      // Restore original method
      manager.compressWithLZString = originalCompress;
    });

    test('should handle compression failures without fallback', () => {
      const manager = new CompressionManager({
        enableFallback: false,
      });

      // Mock LZ-String to throw an error
      manager.compressWithLZString = jest.fn().mockImplementation(() => {
        throw new Error('Mock compression error');
      });

      expect(() => {
        manager.compress('test data '.repeat(50));
      }).toThrow('Mock compression error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined data', () => {
      const manager = new CompressionManager();

      const nullResult = manager.compress(null);
      expect(nullResult.success).toBe(true);
      expect(typeof nullResult.data).toBe('string');
    });

    test('should handle empty data', () => {
      const manager = new CompressionManager();

      const emptyStringResult = manager.compress('');
      expect(emptyStringResult.success).toBe(false);
      expect(emptyStringResult.error).toBe('Data too small for compression');

      const emptyObjectResult = manager.compress({});
      expect(emptyObjectResult.success).toBe(false);
    });

    test('should handle special characters', () => {
      const manager = new CompressionManager();
      const specialData =
        'Special chars: \n\t\r\f\\' + '\u00a9\u20ac\u00e9\u00f1';

      const result = manager.compress(specialData);

      expect(result.success).toBe(true);

      const decompressed = manager.decompress(result.data, result.algorithm);
      expect(decompressed).toEqual(specialData);
    });

    test('should handle very large data', () => {
      const manager = new CompressionManager();
      const largeData = new Array(1000).fill('Large data chunk ').join('');

      const result = manager.compress(largeData);

      expect(result.success).toBe(true);
      expect(result.originalSize).toBeGreaterThan(0);
    });
  });
});
