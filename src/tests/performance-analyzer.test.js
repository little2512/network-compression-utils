/**
 * Performance Analyzer Tests
 * Tests for intelligent compression decisions based on real network performance
 */

import PerformanceAnalyzer from '../performance-analyzer.js';

describe('PerformanceAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer({
      performanceOptimization: {
        enabled: true,
        performanceThreshold: 1,
        aggressiveModeThreshold: 5
      }
    });
  });

  describe('Transmission Time Calculation', () => {
    test('should calculate transmission time correctly', () => {
      const dataSize = 1024; // 1KB
      const speedKbps = 1000; // 1 Mbps

      const time = analyzer.calculateTransmissionTime(dataSize, speedKbps);

      expect(time).toBeCloseTo(8.192, 3); // 1024 bytes at 1000 Kbps = 8.192ms
    });

    test('should handle very slow speeds', () => {
      const dataSize = 4096; // 4KB
      const speedKbps = 1; // 1 Kbps

      const time = analyzer.calculateTransmissionTime(dataSize, speedKbps);

      expect(time).toBeCloseTo(32768, 0); // 4096 bytes at 1 Kbps = 32768ms (32.768 seconds)
    });

    test('should handle zero or invalid speeds', () => {
      const dataSize = 1024;

      expect(analyzer.calculateTransmissionTime(dataSize, 0)).toBe(Infinity);
      expect(analyzer.calculateTransmissionTime(dataSize, -1)).toBe(Infinity);
      expect(analyzer.calculateTransmissionTime(dataSize, null)).toBe(Infinity);
    });
  });

  describe('Compression Benefit Estimation', () => {
    test('should estimate compression benefit correctly', () => {
      const originalSize = 4096; // 4KB
      const speedKbps = 2; // 2 Kbps
      const compressionRatio = 0.5; // 50% compression

      const benefit = analyzer.estimateCompressionBenefit(originalSize, speedKbps, compressionRatio);

      // Using the actual algorithm calculation
      const dataBits = originalSize * 8; // 32768 bits
      const speedBitsPerSecond = speedKbps * 1000; // 2000 bits/s
      const timeInSeconds = dataBits / speedBitsPerSecond; // 16.384s
      const originalTime = timeInSeconds * 1000; // 16384ms

      const compressedSize = originalSize * compressionRatio; // 2048 bytes
      const compressedBits = compressedSize * 8; // 16384 bits
      const compressedTimeInSeconds = compressedBits / speedBitsPerSecond; // 8.192s
      const compressedTime = compressedTimeInSeconds * 1000; // 8192ms

      const expectedBenefit = originalTime - compressedTime; // 8192ms

      expect(benefit).toBeCloseTo(expectedBenefit, 0); // Should match exactly
    });

    test('should use default compression ratio', () => {
      const originalSize = 1024;
      const speedKbps = 1000;

      const benefit = analyzer.estimateCompressionBenefit(originalSize, speedKbps);

      expect(benefit).toBeGreaterThan(0);
    });
  });

  describe('Weak Network Detection', () => {
    test('should detect very slow network', () => {
      // Add speed samples indicating very slow network
      analyzer.addSpeedSample({
        speedKbps: 1.5,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 1000
      });

      const weakCondition = analyzer.detectWeakNetworkCondition();

      expect(weakCondition).toBeTruthy();
      expect(weakCondition.name).toBe('very-slow');
      expect(weakCondition.multiplier).toBe(0.1);
    });

    test('should detect extremely slow network', () => {
      analyzer.addSpeedSample({
        speedKbps: 0.8,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 2000
      });

      const weakCondition = analyzer.detectWeakNetworkCondition();

      expect(weakCondition).toBeTruthy();
      expect(weakCondition.name).toBe('extremely-slow');
      expect(weakCondition.multiplier).toBe(0.05);
    });

    test('should detect critical network', () => {
      analyzer.addSpeedSample({
        speedKbps: 0.3,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 5000
      });

      const weakCondition = analyzer.detectWeakNetworkCondition();

      expect(weakCondition).toBeTruthy();
      expect(weakCondition.name).toBe('critical');
      expect(weakCondition.multiplier).toBe(0.02);
    });

    test('should return null for normal networks', () => {
      analyzer.addSpeedSample({
        speedKbps: 1000,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 10
      });

      const weakCondition = analyzer.detectWeakNetworkCondition();

      expect(weakCondition).toBeNull();
    });

    test('should return null with no speed data', () => {
      const weakCondition = analyzer.detectWeakNetworkCondition();
      expect(weakCondition).toBeNull();
    });
  });

  describe('Dynamic Threshold Calculation', () => {
    test('should calculate dynamic threshold based on performance', () => {
      const baseThreshold = 2048;
      const actualSpeedKbps = 5; // 5 Kbps - very slow
      const networkType = '4g';

      const dynamicThreshold = analyzer.getDynamicThreshold(networkType);

      // For very slow network, threshold should be much lower
      expect(dynamicThreshold).toBeLessThan(baseThreshold);
      expect(dynamicThreshold).toBeGreaterThan(0);
    });

    test('should return base threshold when no speed data available', () => {
      const networkType = '3g';

      const threshold = analyzer.getDynamicThreshold(networkType);

      expect(threshold).toBe(600); // Should be the default 3g threshold
    });
  });

  describe('Performance-Based Compression Decision', () => {
    test('should recommend compression for slow transmission times', () => {
      const dataSize = 4096; // 4KB
      const networkType = '4g';

      // Simulate slow network
      analyzer.addSpeedSample({
        speedKbps: 2,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 1000
      });

      const result = analyzer.analyzeCompressionDecision(dataSize, networkType);

      expect(result.shouldCompress).toBe(true);
      expect(result.estimatedTransmissionTime).toBeGreaterThan(1);
      expect(result.compressionBenefit).toBeGreaterThan(0);
      expect(result.recommendation).toContain('CRITICAL');
    });

    test('should not recommend compression for fast transmission times', () => {
      const dataSize = 512; // Small data
      const networkType = '4g';

      // Simulate fast network
      analyzer.addSpeedSample({
        speedKbps: 10000,
        timestamp: Date.now(),
        dataSize: 512,
        duration: 1
      });

      const result = analyzer.analyzeCompressionDecision(dataSize, networkType);

      expect(result.shouldCompress).toBe(false);
      expect(result.estimatedTransmissionTime).toBeLessThan(1);
      expect(result.recommendation).toContain('EFFICIENT');
    });

    test('should handle forced compression', () => {
      const dataSize = 100;
      const networkType = '4g';

      const result = analyzer.analyzeCompressionDecision(dataSize, networkType, {
        forceCompression: true
      });

      expect(result.shouldCompress).toBe(true);
      expect(result.recommendation).toContain('FORCED');
    });

    test('should fall back to threshold analysis when performance optimization disabled', () => {
      analyzer = new PerformanceAnalyzer({
        performanceOptimization: {
          enabled: false
        }
      });

      const dataSize = 100;
      const networkType = '4g';

      const result = analyzer.analyzeCompressionDecision(dataSize, networkType);

      expect(result.shouldCompress).toBe(false);
      expect(result.metrics.usePerformanceOptimization).toBe(false);
    });
  });

  describe('Speed Sample Management', () => {
    test('should add speed samples correctly', () => {
      const sample = {
        speedKbps: 1000,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 10
      };

      analyzer.addSpeedSample(sample);

      expect(analyzer.speedSamples.length).toBe(1);
      expect(analyzer.speedSamples[0]).toMatchObject(sample);
    });

    test('should calculate average speed correctly', () => {
      // Add multiple samples
      analyzer.addSpeedSample({ speedKbps: 1000, timestamp: Date.now(), dataSize: 1024, duration: 10 });
      analyzer.addSpeedSample({ speedKbps: 2000, timestamp: Date.now(), dataSize: 1024, duration: 5 });
      analyzer.addSpeedSample({ speedKbps: 1500, timestamp: Date.now(), dataSize: 1024, duration: 7 });

      const avgSpeed = analyzer.getAverageSpeed();

      expect(avgSpeed).toBeCloseTo(1500, 0);
    });

    test('should handle empty samples', () => {
      const avgSpeed = analyzer.getAverageSpeed();
      expect(avgSpeed).toBeNull();
    });

    test('should clean old samples', () => {
      const oldTimestamp = Date.now() - (15 * 60 * 1000); // 15 minutes ago
      analyzer.addSpeedSample({
        speedKbps: 1000,
        timestamp: oldTimestamp,
        dataSize: 1024,
        duration: 10
      });

      analyzer.addSpeedSample({
        speedKbps: 2000,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 5
      });

      // Old sample should be removed
      expect(analyzer.speedSamples.length).toBe(1);
      expect(analyzer.speedSamples[0].speedKbps).toBe(2000);
    });
  });

  describe('Performance Status', () => {
    test('should return performance status correctly', () => {
      analyzer.addSpeedSample({
        speedKbps: 1000,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 10
      });

      const status = analyzer.getPerformanceStatus();

      expect(status.hasRealData).toBe(true);
      expect(status.averageSpeedKbps).toBe(1000);
      expect(status.sampleCount).toBe(1);
      expect(status.weakNetworkCondition).toBeNull();
      expect(status.performanceThreshold).toBe(1);
    });

    test('should return status without real data', () => {
      const status = analyzer.getPerformanceStatus();

      expect(status.hasRealData).toBe(false);
      expect(status.averageSpeedKbps).toBeNull();
      expect(status.sampleCount).toBe(0);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset analyzer state', () => {
      analyzer.addSpeedSample({
        speedKbps: 1000,
        timestamp: Date.now(),
        dataSize: 1024,
        duration: 10
      });

      analyzer.reset();

      expect(analyzer.speedSamples.length).toBe(0);
      expect(analyzer.averageSpeedKbps).toBeNull();
      expect(analyzer.lastSpeedTest).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large data sizes', () => {
      const dataSize = 1024 * 1024; // 1MB
      const speedKbps = 1000;

      const time = analyzer.calculateTransmissionTime(dataSize, speedKbps);

      expect(time).toBeCloseTo(8388.608, 3); // 1MB (8,388,608 bits) at 1000 Kbps = 8388.608ms
    });

    test('should handle very small data sizes', () => {
      const dataSize = 1;
      const speedKbps = 1;

      const time = analyzer.calculateTransmissionTime(dataSize, speedKbps);

      expect(time).toBeCloseTo(8, 1); // 1 byte at 1 Kbps = 8ms
    });

    test('should handle invalid network types', () => {
      const dataSize = 1024;
      const networkType = 'invalid-network';

      const threshold = analyzer.getDynamicThreshold(networkType);

      // Should fall back to a reasonable threshold
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThan(10000);
    });
  });
});