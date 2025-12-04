/**
 * Basic test for the library structure
 */

import {
  NetworkDetector,
  CompressionManager,
  NetworkCompressionUtils,
} from '../index.js';

describe('Library Structure', () => {
  test('should export all main classes', () => {
    expect(NetworkDetector).toBeDefined();
    expect(CompressionManager).toBeDefined();
    expect(NetworkCompressionUtils).toBeDefined();
  });

  test('should be able to instantiate classes', () => {
    expect(() => new NetworkDetector()).not.toThrow();
    expect(() => new CompressionManager()).not.toThrow();
    expect(() => new NetworkCompressionUtils()).not.toThrow();
  });
});
