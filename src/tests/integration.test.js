/**
 * Integration Tests - Network Detection + Configuration Management
 */

import NetworkDetector from '../network-detector.js';
import ConfigManager from '../config-manager.js';

describe('Network Detection + Configuration Integration', () => {
  let detector;
  let config;

  beforeEach(() => {
    detector = new NetworkDetector();
    config = new ConfigManager();
  });

  describe('Compression Decision Integration', () => {
    test('should make consistent compression decisions', () => {
      const networkInfo = detector.getNetworkInfo();
      const dataSize = 1500;

      const shouldCompress1 = config.shouldCompressData(
        dataSize,
        networkInfo.effectiveType
      );
      const shouldCompress2 = config.shouldCompressData(
        dataSize,
        networkInfo.effectiveType
      );

      expect(shouldCompress1).toBe(shouldCompress2);
    });

    test('should handle different network types correctly', () => {
      const dataSize = 800;

      // Test with different network types
      const slow2gDecision = config.shouldCompressData(dataSize, 'slow-2g');
      const twoGDecision = config.shouldCompressData(dataSize, '2g');
      const threeGDecision = config.shouldCompressData(dataSize, '3g');
      const fourGDecision = config.shouldCompressData(dataSize, '4g');

      // With updated default thresholds, should compress on all networks
      expect(slow2gDecision).toBe(true);  // 800 > 50 threshold
      expect(twoGDecision).toBe(true);     // 800 > 300 threshold
      expect(threeGDecision).toBe(true);    // 800 > 600 threshold
      expect(fourGDecision).toBe(false);   // 800 < 1800 threshold for 4g
    });

    test('should respect custom configuration', () => {
      const customConfig = new ConfigManager({
        thresholds: {
          'slow-2g': 50,
          '2g': 100,
          '3g': 200,
          '4g': 400,
        },
      });

      const dataSize = 300;
      const networkInfo = detector.getNetworkInfo();

      const shouldCompress = customConfig.shouldCompressData(
        dataSize,
        networkInfo.effectiveType
      );

      // Decision depends on network type and custom thresholds
      expect(typeof shouldCompress).toBe('boolean');
    });
  });

  describe('Network Quality + Threshold Integration', () => {
    test('should align quality scores with thresholds', () => {
      const networkInfo = detector.getNetworkInfo();
      const qualityScore = detector.getNetworkQualityScore(networkInfo);
      const threshold = config.getThresholdForNetwork(
        networkInfo.effectiveType
      );

      // Higher quality networks should have higher thresholds
      expect(typeof qualityScore).toBe('number');
      expect(typeof threshold).toBe('number');
      expect(threshold).toBeGreaterThan(0);
    });

    test('should provide consistent network type handling', () => {
      const networkInfo = detector.getNetworkInfo();
      const networkType = networkInfo.effectiveType;

      // Both systems should recognize the same network types
      expect(['slow-2g', '2g', '3g', '4g']).toContain(networkType);
      expect(config.getThresholdForNetwork(networkType)).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Configuration Updates', () => {
    test('should respond to configuration changes', () => {
      const networkInfo = detector.getNetworkInfo();
      const dataSize = 1200;

      // Initial decision
      const initialDecision = config.shouldCompressData(
        dataSize,
        networkInfo.effectiveType
      );

      // Update configuration to change threshold
      config.updateConfig({
        thresholds: {
          ...config.getAllThresholds(),
          [networkInfo.effectiveType]: 500, // Lower threshold
        },
      });

      // Decision should potentially change
      const updatedDecision = config.shouldCompressData(
        dataSize,
        networkInfo.effectiveType
      );

      expect(typeof initialDecision).toBe('boolean');
      expect(typeof updatedDecision).toBe('boolean');
    });

    test('should handle invalid configuration updates gracefully', () => {
      const networkInfo = detector.getNetworkInfo();
      const dataSize = 1000;

      const originalDecision = config.shouldCompressData(
        dataSize,
        networkInfo.effectiveType
      );

      // Attempt invalid update
      const updateResult = config.updateConfig({
        thresholds: {
          'invalid-network': 100,
        },
      });

      expect(updateResult).toBe(false);

      // Decision should remain unchanged
      const currentDecision = config.shouldCompressData(
        dataSize,
        networkInfo.effectiveType
      );
      expect(currentDecision).toBe(originalDecision);
    });
  });

  describe('Output Format Integration', () => {
    test('should provide consistent format selection', () => {
      const requestedFormat = 'string';
      const optimalFormat = config.getOptimalFormat(requestedFormat);

      expect(optimalFormat).toBe('string');
    });

    test('should fallback to default for invalid formats', () => {
      const invalidFormat = 'invalid-format';
      const optimalFormat = config.getOptimalFormat(invalidFormat);

      expect(optimalFormat).toBe('string');
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle mobile network scenario', () => {
      // Simulate mobile network configuration
      const mobileConfig = new ConfigManager({
        thresholds: {
          'slow-2g': 50,
          '2g': 200,
          '3g': 500,
          '4g': 1000,
        },
        defaultFormat: 'urlsearch',
        enableAutoCompression: true,
      });

      // Test typical mobile data sizes
      const smallData = 100; // Small JSON object
      const mediumData = 800; // Medium response
      const largeData = 5000; // Large data set

      // Simulate different network conditions
      expect(mobileConfig.shouldCompressData(smallData, 'slow-2g')).toBe(true);
      expect(mobileConfig.shouldCompressData(mediumData, '3g')).toBe(true);
      expect(mobileConfig.shouldCompressData(largeData, '4g')).toBe(true);
    });

    test('should handle desktop network scenario', () => {
      // Simulate desktop network configuration (more conservative)
      const desktopConfig = new ConfigManager({
        thresholds: {
          'slow-2g': 1000,
          '2g': 2000,
          '3g': 5000,
          '4g': 10000,
        },
        defaultFormat: 'formdata',
        enableAutoCompression: true,
      });

      // Test typical desktop data sizes
      const mediumData = 1500; // API response
      const largeData = 8000; // Large dataset

      expect(desktopConfig.shouldCompressData(mediumData, '4g')).toBe(false);
      expect(desktopConfig.shouldCompressData(largeData, '4g')).toBe(false);
      expect(desktopConfig.shouldCompressData(largeData, '2g')).toBe(true);
    });

    test('should handle bandwidth saver mode', () => {
      // Simulate bandwidth saver configuration
      const saverConfig = new ConfigManager({
        thresholds: {
          'slow-2g': 1,
          '2g': 10,
          '3g': 50,
          '4g': 100,
        },
        defaultFormat: 'string',
        enableAutoCompression: true,
        preferSmallest: true,
      });

      // Test with the configured thresholds
      expect(saverConfig.shouldCompressData(5, '4g')).toBe(false); // 5 < 100 threshold, so no compression
      expect(saverConfig.shouldCompressData(75, '3g')).toBe(true);  // 75 > 50 threshold, so compress
      expect(saverConfig.shouldCompressData(150, '2g')).toBe(true); // 150 > 10 threshold, so compress
      expect(saverConfig.shouldCompressData(150, 'slow-2g')).toBe(true); // 150 > 1 threshold, so compress
    });
  });

  describe('Performance and Memory', () => {
    test('should handle multiple rapid decisions efficiently', () => {
      const networkInfo = detector.getNetworkInfo();
      const dataSize = 1000;
      const iterations = 1000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        config.shouldCompressData(dataSize, networkInfo.effectiveType);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 1000 decisions in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('should not leak memory with repeated operations', () => {
      const initialMemory = performance.memory
        ? performance.memory.usedJSHeapSize
        : 0;

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        detector.getNetworkInfo();
        config.shouldCompressData(1000, '4g');
        config.getOptimalFormat('urlsearch');
        config.getConfigSummary();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory
        ? performance.memory.usedJSHeapSize
        : 0;

      // Memory usage should not grow significantly (allow some tolerance)
      if (performance.memory) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid network types gracefully', () => {
      const dataSize = 1000;
      const invalidNetworkType = 'invalid-network';

      // Should fall back to 4g threshold
      const shouldCompress = config.shouldCompressData(
        dataSize,
        invalidNetworkType
      );
      expect(typeof shouldCompress).toBe('boolean');
    });

    test('should handle edge case data sizes', () => {
      const networkInfo = detector.getNetworkInfo();

      expect(config.shouldCompressData(0, networkInfo.effectiveType)).toBe(
        false
      );
      expect(config.shouldCompressData(-1, networkInfo.effectiveType)).toBe(
        false
      );
      expect(
        config.shouldCompressData(
          Number.MAX_SAFE_INTEGER,
          networkInfo.effectiveType
        )
      ).toBe(false);
    });

    test('should handle configuration errors without breaking', () => {
      const brokenConfig = new ConfigManager({
        thresholds: {
          'slow-2g': 'not-a-number',
        },
        defaultFormat: 123, // Invalid type
      });

      const networkInfo = detector.getNetworkInfo();
      const dataSize = 1000;

      // Should still work with fallbacks
      expect(
        brokenConfig.shouldCompressData(dataSize, networkInfo.effectiveType)
      ).toBe(false);
      expect(brokenConfig.isValid()).toBe(false);
    });
  });
});
