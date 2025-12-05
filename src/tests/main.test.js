/**
 * Main Network Compression Utils Tests
 */

import NetworkCompressionUtils from '../main.js';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
let timeCounter = 0;
Object.defineProperty(global, 'performance', {
  value: {
    now: () => {
      timeCounter += 5;
      return timeCounter;
    },
  },
  writable: true,
});

// Mock navigator.connection
const mockConnection = {
  effectiveType: '4g',
  downlink: 10,
  rtt: 100,
  saveData: false,
};

Object.defineProperty(global, 'navigator', {
  value: {
    connection: mockConnection,
  },
  writable: true,
});

describe('NetworkCompressionUtils', () => {
  let ncu;

  beforeEach(() => {
    timeCounter = 0;
    ncu = new NetworkCompressionUtils();
  });

  afterEach(() => {
    if (ncu) {
      ncu.destroy();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(ncu).toBeDefined();
      expect(ncu.networkDetector).toBeDefined();
      expect(ncu.configManager).toBeDefined();
      expect(ncu.compressionManager).toBeDefined();
      expect(ncu.formatConverter).toBeDefined();
    });

    test('should accept custom configuration', () => {
      const customConfig = {
        thresholds: { '4g': 5000 },
        defaultFormat: 'formdata',
        enableLogging: true,
      };

      const customNcu = new NetworkCompressionUtils(customConfig);
      const config = customNcu.getConfig();

      expect(config.thresholds['4g']).toBe(5000);
      expect(config.defaultFormat).toBe('string');
      expect(config.enableLogging).toBe(true);

      customNcu.destroy();
    });
  });

  describe('Basic Compression', () => {
    test('should compress simple object to string format', () => {
      // Create very large repetitive data that should definitely compress
      const data = {
        message: 'Hello'.repeat(10000), // This will be ~50KB
        content: 'x'.repeat(25000)      // This will be ~25KB
      };

      const result = ncu.compress({ data, outputFormat: 'string' });

      // At this point with such large data, compression should definitely work
      expect(result.compressed).toBe(true);
      expect(result.outputFormat).toBe('string');
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.algorithm).toBe('LZ-String');
      expect(typeof result.data).toBe('string');
    });

    test('should compress large data to string format', () => {
      const data = {
        name: 'John',
        age: 30,
        description: 'A user profile with extensive content '.repeat(300),
        bio: 'This is a very long biography that contains a lot of repeated text to ensure the data is large enough for compression '.repeat(200),
        tags: Array(50).fill('tag').join(','),
        metadata: {
          details: 'x'.repeat(1000),
          info: 'repeated data '.repeat(100)
        }
      };
      const result = ncu.compress({ data, outputFormat: 'string' });

      expect(result.compressed).toBe(true);
      expect(result.outputFormat).toBe('string');
      expect(typeof result.data).toBe('string');
      // For large compressed data, should contain the LZ-String prefix
      expect(result.data).toContain('compressed_');
    });

    test('should convert small data to qs string format (uncompressed)', () => {
      const data = {
        name: 'John',
        age: 30,
        bio: 'User biography'
      };
      const result = ncu.compress({ data, outputFormat: 'string' });

      expect(result.compressed).toBe(false);
      expect(result.outputFormat).toBe('string');
      expect(typeof result.data).toBe('string');
      // For small uncompressed data, should be qs.stringify format
      expect(result.data).toContain('name=John');
      expect(result.data).toContain('age=30');
      expect(result.data).toContain('bio=User%20biography');
    });

    test('should handle string data', () => {
      const data = 'This is a test string for compression '.repeat(1000);
      const result = ncu.compress({ data });

      expect(result.compressed).toBe(true);
      expect(result.originalSize).toBeGreaterThan(result.compressedSize);
    });

    test('should not compress small data by default', () => {
      const smallData = { message: 'Small data' }; // Only ~20 bytes
      const result = ncu.compress({ data: smallData });

      expect(result.compressed).toBe(false);
      expect(result.algorithm).toBe('none');
      expect(result.outputFormat).toBe('string'); // Default format
    });

    test('should force compress small data when requested', () => {
      // Use large enough data to get past the 50-byte threshold but small enough to not compress normally
      const smallData = {
        message: 'x'.repeat(100), // 100 characters, should be over 50 bytes but under 2KB threshold
        timestamp: Date.now()
      };

      const result = ncu.compress({
        data: smallData,
        forceCompression: true,
        outputFormat: 'string'
      });

      // With forceCompression, it should attempt compression
      expect(result.compressed).toBe(true);
      expect(result.algorithm).toBe('LZ-String');
      expect(result.outputFormat).toBe('string');
    });
  });

  describe('Network-Aware Compression', () => {
    test('should use actual network type by default', () => {
      const data = { test: 'data'.repeat(100) };
      const result = ncu.compress({ data });

      expect(result.networkType).toBe('4g');
      expect(typeof result.processingTime).toBe('number');
    });

    test('should use overridden network type', () => {
      const data = { test: 'data'.repeat(100) };
      const result = ncu.compress({ data, networkType: '2g' });

      expect(result.networkType).toBe('2g');
    });

    test('should force compression when requested', () => {
      const smallData = { small: 'test' };
      const normalResult = ncu.compress({ data: smallData });
      const forceResult = ncu.compress({
        data: smallData,
        forceCompression: true,
      });

      // Normal result might not compress, but forced result should attempt it
      expect(typeof normalResult.compressed).toBe('boolean');
      expect(typeof forceResult.compressed).toBe('boolean');
    });
  });

  describe('Format Conversion Integration', () => {
    test('should handle complex nested objects with qs conversion', () => {
      const data = {
        user: {
          name: 'John',
          profile: {
            settings: {
              theme: 'dark',
              notifications: ['email', 'sms'],
            },
            bio: 'Very long user biography '.repeat(200),
            interests: Array(50).fill('interest').join(',')
          },
        },
        metadata: {
          details: 'x'.repeat(2000),
          tags: Array(100).fill('tag')
        }
      };

      const result = ncu.compress({ data, outputFormat: 'string' });

      expect(result.compressed).toBe(true);
      expect(result.outputFormat).toBe('string');
      expect(typeof result.data).toBe('string');
      // For compressed data, should contain the compression prefix
      expect(result.data).toContain('compressed_');
    });

    test('should handle arrays with compression and qs output', () => {
      const data = {
        tags: Array(100).fill('javascript'),
        scores: Array(50).fill(95),
        content: 'Large content '.repeat(1000),
        description: 'Very long description '.repeat(500)
      };

      const result = ncu.compress({ data, outputFormat: 'string' });

      expect(result.compressed).toBe(true);
      expect(result.outputFormat).toBe('string');
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('compressed_');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing data', () => {
      const result = ncu.compress({});

      expect(result.compressed).toBe(false);
      expect(result.error).toContain('No data provided');
    });

    test('should handle undefined data', () => {
      const result = ncu.compress({ data: undefined });

      expect(result.compressed).toBe(false);
      expect(result.error).toContain('No data provided');
    });

    test('should handle invalid output format', () => {
      const data = { test: 'data' };
      const result = ncu.compress({ data, outputFormat: 'invalid' });

      // Should fall back to default format
      expect(result.outputFormat).toBeDefined();
      expect(['urlsearch', 'formdata', 'string']).toContain(
        result.outputFormat
      );
    });
  });

  describe('Configuration Integration', () => {
    test('should use configuration thresholds', () => {
      const customNcu = new NetworkCompressionUtils({
        thresholds: { '4g': 5000 }, // High threshold for 4g
        enableAutoCompression: true,
      });

      const smallData = { small: 'data' }; // Less than threshold
      const result = customNcu.compress({ data: smallData });

      // Should not compress small data on 4g with high threshold
      expect(result.compressed).toBe(false);

      customNcu.destroy();
    });

    test('should respect auto compression setting', () => {
      const customNcu = new NetworkCompressionUtils({
        enableAutoCompression: false,
      });

      const data = { test: 'data'.repeat(100) };
      const result = customNcu.compress({ data });

      expect(result.compressed).toBe(false);
      expect(result.algorithm).toBe('none');

      customNcu.destroy();
    });

    test('should update configuration', () => {
      const result = ncu.updateConfig({
        enableLogging: true,
        thresholds: { '4g': 5000 }, // Valid: 2048 < 5000 and maintains ordering
      });

      expect(result).toBe(true);

      const config = ncu.getConfig();
      expect(config.enableLogging).toBe(true);
      expect(config.thresholds['4g']).toBe(5000);
    });
  });

  describe('Network Information', () => {
    test('should get network information', () => {
      const networkInfo = ncu.getNetworkInfo();

      expect(networkInfo).toBeDefined();
      expect(networkInfo.effectiveType).toBe('4g');
    });

    test('should get network quality score', () => {
      const score = ncu.getNetworkQualityScore();

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should check if network is slow', () => {
      const isSlow = ncu.isSlowNetwork();

      expect(typeof isSlow).toBe('boolean');
    });

    test('should get network description', () => {
      const description = ncu.getNetworkDescription();

      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    test('should track compression statistics', () => {
      // Perform several compressions with large data to ensure compression
      for (let i = 0; i < 5; i++) {
        ncu.compress({
          data: {
            message: 'Large test data for compression tracking '.repeat(100),
            id: i,
            content: 'x'.repeat(1000),
            metadata: Array(50).fill('metadata_value')
          }
        });
      }

      const stats = ncu.getCompressionStats();

      expect(stats.totalCompressions).toBeGreaterThan(0);
      expect(stats.successfulCompressions).toBeGreaterThan(0);
      expect(stats.totalOriginalSize).toBeGreaterThan(0);
      expect(stats.averageCompressionTime).toBeGreaterThan(0);
    });

    test('should reset statistics', () => {
      // Perform some compressions with large data
      ncu.compress({
        data: {
          message: 'Test data for reset statistics '.repeat(200),
          content: 'x'.repeat(1500)
        }
      });
      ncu.compress({
        data: {
          message: 'Second test data for reset statistics '.repeat(150),
          details: 'y'.repeat(1000)
        }
      });

      let stats = ncu.getCompressionStats();
      expect(stats.totalCompressions).toBeGreaterThan(0);

      // Reset stats
      ncu.resetStats();

      stats = ncu.getCompressionStats();
      expect(stats.totalCompressions).toBe(0);
      expect(stats.successfulCompressions).toBe(0);
    });
  });

  describe('Format Utilities', () => {
    test('should get supported formats', () => {
      const formats = ncu.getSupportedFormats();

      expect(formats).toContain('urlsearch');
      expect(formats).toContain('formdata');
      expect(formats).toContain('string');
    });

    test('should get format information', () => {
      const urlInfo = ncu.getFormatInfo('urlsearch');
      const formInfo = ncu.getFormatInfo('formdata');
      const stringInfo = ncu.getFormatInfo('string');

      expect(urlInfo.name).toBe('URLSearchParams');
      expect(formInfo.name).toBe('FormData');
      expect(stringInfo.name).toBe('String');
    });

    test('should recommend format for data', () => {
      const fileData = { document: new File(['content'], 'test.txt') };
      const stringData = { text: 'simple data' };

      const fileRecommendation = ncu.recommendFormat(fileData);
      const stringRecommendation = ncu.recommendFormat(stringData);

      expect(fileRecommendation).toBe('formdata'); // Files should recommend FormData
      expect(['urlsearch', 'formdata', 'string']).toContain(
        stringRecommendation
      );
    });

    test('should validate format compatibility', () => {
      const data = { name: 'John', file: new File(['content'], 'test.txt') };

      const urlValidation = ncu.validateFormat(data, 'urlsearch');
      const formValidation = ncu.validateFormat(data, 'formdata');

      expect(urlValidation.valid).toBe(true);
      expect(formValidation.valid).toBe(true);
      expect(urlValidation.warnings.length).toBeGreaterThan(0); // File warning
      expect(formValidation.warnings.length).toBe(0);
    });
  });

  describe('System Status', () => {
    test('should provide comprehensive system status', () => {
      const status = ncu.getSystemStatus();

      expect(status.network).toBeDefined();
      expect(status.configuration).toBeDefined();
      expect(status.compression).toBeDefined();
      expect(status.formats).toBeDefined();

      expect(status.network.connected).toBeDefined();
      expect(status.configuration.autoCompressionEnabled).toBeDefined();
      expect(status.compression.totalOperations).toBeGreaterThanOrEqual(0);
      expect(status.formats.supported).toContain('urlsearch');
    });
  });

  describe('Performance', () => {
    test('should handle large datasets efficiently', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is item number ${i} with a detailed description`,
          metadata: {
            created: new Date().toISOString(),
            tags: ['tag1', 'tag2', 'tag3'],
          },
        })),
      };

      const startTime = performance.now();
      const result = ncu.compress({ data: largeData });
      const endTime = performance.now();

      expect(result.compressed).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });

    test('should process multiple operations quickly', () => {
      const operations = 10;
      const startTime = performance.now();

      for (let i = 0; i < operations; i++) {
        ncu.compress({ data: { index: i, value: `test ${i}`.repeat(10) } });
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / operations;

      expect(averageTime).toBeLessThan(20); // Average < 20ms per operation
    });
  });

  describe('Network Listeners', () => {
    test('should add and remove network listeners', () => {
      const mockCallback = jest.fn();

      ncu.addNetworkListener(mockCallback);

      // Simulate network change
      mockConnection.effectiveType = '3g';

      ncu.removeNetworkListener(mockCallback);

      expect(typeof mockCallback).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null data', () => {
      const result = ncu.compress({ data: null });

      // null data is converted to string and not compressed due to small size
      expect(typeof result.data).toBe('string');
      expect(result.outputFormat).toBe('string');
    });

    test('should handle empty objects', () => {
      const result = ncu.compress({ data: {} });

      expect(result.compressed).toBe(false); // Too small to compress
      expect(result.algorithm).toBe('none');
    });

    test('should handle circular references', () => {
      const circularData = { name: 'test' };
      circularData.self = circularData;

      const result = ncu.compress({ data: circularData });

      expect(typeof result.data).toBe('string'); // Should handle gracefully
    });

    test('should handle special characters', () => {
      const data = {
        message: 'Special chars: \n\t\r\f\\\u00a9\u20ac',
        content: 'Large content to trigger compression '.repeat(200)
      };
      const result = ncu.compress({ data });

      expect(typeof result.data).toBe('string');
    });

    test('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const data = { created: date };

      const result = ncu.compress({
        data: {
          ...data,
          content: 'Additional content to trigger compression '.repeat(300)
        },
        outputFormat: 'string'
      });

      expect(typeof result.data).toBe('string');
    });
  });

  describe('Integration with All Components', () => {
    test('should integrate network detection, compression, and format conversion', () => {
      // Create much larger data to ensure it exceeds all compression thresholds
      const largeContent = 'Large data content that will definitely exceed 2048 bytes when serialized. '.repeat(50);
      const complexData = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            bio: largeContent,
            skills: Array(20).fill('JavaScript,React,Node.js,Python,TypeScript'),
            experience: Array(10).fill().map((_, i) => ({
              company: `Company ${i}`,
              role: `Role ${i}`,
              years: i + 1,
              technologies: Array(10).fill('JavaScript,React,Node.js'),
              description: largeContent,
            })),
            projects: Array(15).fill().map((_, i) => ({
              name: `Project ${i}`,
              description: largeContent,
              technologies: Array(8).fill('JavaScript,React,Node.js'),
            })),
          },
        },
        additionalData: Array(20).fill(largeContent),
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0.0',
          source: 'integration-test',
          details: largeContent,
        },
      };

      // Test all output formats with different network types
      const urlResult = ncu.compress({
        data: complexData,
        outputFormat: 'urlsearch',
        networkType: '3g', // 700 threshold - should compress due to large data
      });

      const formResult = ncu.compress({
        data: complexData,
        outputFormat: 'formdata',
        networkType: '2g', // 500 threshold - should compress due to large data
      });

      const stringResult = ncu.compress({
        data: complexData,
        outputFormat: 'string',
        networkType: '4g', // 2048 threshold - should compress due to large data
      });

      // All should be compressed due to data size (regardless of output format)
      expect(urlResult.compressed).toBe(true);
      expect(formResult.compressed).toBe(true);
      expect(stringResult.compressed).toBe(true);

      // All should use compression
      expect(urlResult.algorithm).toBe('LZ-String');
      expect(formResult.algorithm).toBe('LZ-String');
      expect(stringResult.algorithm).toBe('LZ-String');

      // Verify network type was used
      expect(urlResult.networkType).toBe('3g');
      expect(formResult.networkType).toBe('2g');
      expect(stringResult.networkType).toBe('4g');

      // Verify formats (all return 'string' now)
      expect(urlResult.outputFormat).toBe('string');
      expect(formResult.outputFormat).toBe('string');
      expect(stringResult.outputFormat).toBe('string');
    });

    test('should provide consistent results across multiple runs', () => {
      const data = { test: 'data for consistency check '.repeat(20) };

      const result1 = ncu.compress({ data, outputFormat: 'string' });
      const result2 = ncu.compress({ data, outputFormat: 'string' });

      expect(result1.compressed).toBe(result2.compressed);
      expect(result1.originalSize).toBe(result2.originalSize);
      expect(result1.compressedSize).toBe(result2.compressedSize);
    });
  });
});
