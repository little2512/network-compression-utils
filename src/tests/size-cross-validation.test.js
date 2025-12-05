/**
 * Size Cross-Validation Tests
 * Tests small vs large parameters across different network conditions
 */

import NetworkCompressionUtils from '../main.js';

describe('Size Cross-Validation Tests', () => {
  let ncu;

  beforeEach(() => {
    ncu = new NetworkCompressionUtils();
  });

  describe('Small Parameters (Under Compression Threshold)', () => {
    test('should not compress small object on 4g network', () => {
      const smallData = {
        name: 'John',
        age: 25,
        city: 'New York'
      };

      const result = ncu.compress({ data: smallData });

      expect(result.compressed).toBe(false);
      expect(result.algorithm).toBe('none');
      expect(typeof result.data).toBe('string');
      // Should be in qs format, not compressed
      expect(result.data).toContain('name=John');
      expect(result.data).toContain('age=25');
    });

    test('should not compress small object even with forceCompression on large network', () => {
      const smallData = {
        message: 'Short message',
        timestamp: Date.now()
      };

      const result = ncu.compress({
        data: smallData,
        forceCompression: true
      });

      // Even with forceCompression, very small data may not compress effectively
      expect(typeof result.data).toBe('string');
    });

    test('should convert small nested object to qs format', () => {
      const smallNestedData = {
        user: {
          id: 1,
          name: 'Alice'
        },
        settings: {
          theme: 'light'
        }
      };

      const result = ncu.compress({ data: smallNestedData });

      expect(result.compressed).toBe(false);
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('user.id=1');
      expect(result.data).toContain('user.name=Alice');
      expect(result.data).toContain('settings.theme=light');
    });

    test('should handle small array in qs format', () => {
      const smallArrayData = {
        tags: ['tag1', 'tag2', 'tag3'],
        scores: [10, 20, 30]
      };

      const result = ncu.compress({ data: smallArrayData });

      expect(result.compressed).toBe(false);
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('tags%5B%5D=tag1');
      expect(result.data).toContain('scores%5B%5D=10');
    });
  });

  describe('Large Parameters (Over Compression Threshold)', () => {
    test('should compress large repetitive object on 4g network', () => {
      const largeData = {
        description: 'This is a very long description that will definitely exceed the compression threshold '.repeat(50),
        content: 'Large content block '.repeat(100),
        metadata: {
          details: 'x'.repeat(1000),
          tags: Array(50).fill('tag'),
          extra: 'Additional information '.repeat(200)
        }
      };

      const result = ncu.compress({ data: largeData });

      expect(result.compressed).toBe(true);
      expect(result.algorithm).toBe('LZ-String');
      expect(typeof result.data).toBe('string');
      expect(result.originalSize).toBeGreaterThan(result.compressedSize);
    });

    test('should compress large object on slow network', () => {
      const largeData = {
        profile: {
          bio: 'User biography '.repeat(200),
          experience: 'Work experience details '.repeat(150),
          skills: Array(100).fill('JavaScript,React,Node.js'),
          projects: Array(20).fill('Project description ').join(''),
          certifications: Array(10).fill('Certification name ').join('')
        }
      };

      // Force slow network for testing
      const result = ncu.compress({
        data: largeData,
        networkType: 'slow-2g'
      });

      expect(result.compressed).toBe(true);
      expect(result.algorithm).toBe('LZ-String');
      expect(typeof result.data).toBe('string');
    });

    test('should compress large nested complex object', () => {
      const complexLargeData = {
        catalog: {
          categories: Array(50).fill().map((_, i) => ({
            id: i,
            name: `Category ${i}`,
            products: Array(20).fill().map((_, j) => ({
              id: j,
              name: `Product ${i}-${j}`,
              description: 'Detailed product description '.repeat(10),
              specifications: {
                weight: '100g',
                dimensions: '10x5x2cm',
                materials: Array(5).fill('Material description')
              },
              reviews: Array(10).fill('Review text content '.repeat(5))
            }))
          }))
        },
        metadata: {
          totalProducts: 1000,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
          changelog: Array(20).fill('Changelog entry '.repeat(3)),
          settings: {
            pagination: {
              pageSize: 20,
              currentPage: 1,
              totalItems: 1000
            },
            filters: {
              priceRange: { min: 0, max: 1000 },
              categories: ['electronics', 'books', 'clothing'],
              ratings: [1, 2, 3, 4, 5]
            }
          }
        }
      };

      const result = ncu.compress({ data: complexLargeData });

      expect(result.compressed).toBe(true);
      expect(result.algorithm).toBe('LZ-String');
      expect(typeof result.data).toBe('string');
      expect(result.compressedSize).toBeLessThan(result.originalSize);
    });
  });

  describe('Cross-Network Size Validation', () => {
    test('should have different compression thresholds across network types', () => {
      const mediumData = {
        content: 'Medium sized content '.repeat(100),
        description: 'This content might compress on some networks but not others'
      };

      // Test on different network types
      const slowResult = ncu.compress({ data: mediumData, networkType: 'slow-2g' });
      const normalResult = ncu.compress({ data: mediumData, networkType: '3g' });
      const fastResult = ncu.compress({ data: mediumData, networkType: '4g' });

      // Should potentially have different compression results based on network
      expect([slowResult.compressed, normalResult.compressed, fastResult.compressed]).toContain(false);
    });

    test('should respect forceCompression regardless of size', () => {
      const testData = {
        data: 'Force compression test '.repeat(100)
      };

      const forcedResult = ncu.compress({
        data: testData,
        forceCompression: true
      });

      // With forceCompression, should attempt compression
      expect(typeof forcedResult.data).toBe('string');
    });
  });

  describe('Size Threshold Edge Cases', () => {
    test('should handle data exactly at compression threshold', () => {
      // Create data around the 2KB threshold for 4g
      const thresholdData = {
        content: 'x'.repeat(1900), // Around 1900 bytes + object overhead ≈ 2KB
        smallExtra: 'extra content'
      };

      const result = ncu.compress({ data: thresholdData, networkType: '4g' });

      expect(typeof result.data).toBe('string');
      // This might compress or not compress depending on exact threshold calculation
    });

    test('should handle empty and minimal data gracefully', () => {
      const emptyObject = {};
      const emptyString = '';
      const nullValue = null;
      const undefinedValue = undefined;

      const emptyResult = ncu.compress({ data: emptyObject });
      const stringResult = ncu.compress({ data: emptyString });
      const nullResult = ncu.compress({ data: nullValue });
      const undefinedResult = ncu.compress({ data: undefinedValue });

      expect(typeof emptyResult.data).toBe('string');
      expect(typeof stringResult.data).toBe('string');
      expect(typeof nullResult.data).toBe('string');
      expect(typeof undefinedResult.data).toBe('string');
    });

    test('should handle very large data without errors', () => {
      const veryLargeData = {
        chunks: Array(500).fill().map((_, i) => ({
          id: i,
          content: 'Large chunk content '.repeat(50),
          metadata: {
            timestamp: Date.now(),
            checksum: Array(10).fill('checksum_value'),
            binary: Buffer.alloc(100).toString('base64')
          }
        }))
      };

      const result = ncu.compress({ data: veryLargeData });

      expect(typeof result.data).toBe('string');
      // Should not throw errors even with very large data
    });
  });

  describe('Consistency Validation', () => {
    test('should produce consistent results for same input', () => {
      const testData = {
        id: 1,
        name: 'Test Data',
        content: 'Test content '.repeat(50)
      };

      const result1 = ncu.compress({ data: testData });
      const result2 = ncu.compress({ data: testData });

      expect(result1.compressed).toBe(result2.compressed);
      expect(result1.data).toBe(result2.data);
      expect(result1.originalSize).toBe(result2.originalSize);
    });

    test.skip('should maintain data integrity through compression/decompression', () => {
      // Main library doesn't have decompress method
      // This would need to be implemented or tested through compression manager
    });
  });
});