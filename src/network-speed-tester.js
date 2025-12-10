/**
 * Network Speed Tester - Real-time network speed measurement
 * Provides accurate speed testing for intelligent compression decisions
 */

import PerformanceAnalyzer from './performance-analyzer.js';

/**
 * Speed test result
 * @typedef {Object} SpeedTestResult
 * @property {number} speedKbps - Measured speed in kilobits per second
 * @property {number} latency - Network latency in milliseconds
 * @property {number} jitter - Network jitter in milliseconds
 * @property {number} packetLoss - Packet loss percentage (0-100)
 * @property {number} testDuration - Duration of the test in milliseconds
 * @property {string} quality - Network quality assessment
 */

/**
 * Network Speed Tester Class
 * Performs real-time network speed measurements
 */
class NetworkSpeedTester {
  constructor(options = {}) {
    this.options = {
      testUrl: options.testUrl || '/api/speed-test',
      testSize: options.testSize || 1024, // 1KB test data
      maxTestTime: options.maxTestTime || 5000, // 5 seconds max
      minTestTime: options.minTestTime || 100, // 100ms minimum
      concurrentTests: options.concurrentTests || 3,
      timeout: options.timeout || 10000, // 10 seconds timeout
      ...options,
    };

    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.isRunning = false;
    this.testHistory = [];
  }

  /**
   * Perform a comprehensive network speed test
   * @param {Object} options - Test options
   * @returns {Promise<SpeedTestResult>} Speed test results
   */
  async performSpeedTest(options = {}) {
    const testOptions = { ...this.options, ...options };

    if (this.isRunning) {
      throw new Error('Speed test already in progress');
    }

    this.isRunning = true;
    const startTime = performance.now();

    try {
      // Phase 1: Latency test
      const latency = await this.measureLatency(testOptions);

      // Phase 2: Speed test
      const speedResult = await this.measureDownloadSpeed(testOptions);

      // Phase 3: Quality assessment
      const quality = this.assessNetworkQuality(speedResult, latency);

      const testDuration = performance.now() - startTime;

      const result = {
        speedKbps: speedResult.speedKbps,
        latency,
        jitter: speedResult.jitter || 0,
        packetLoss: speedResult.packetLoss || 0,
        testDuration,
        quality,
        timestamp: Date.now(),
      };

      // Store result and add to performance analyzer
      this.testHistory.push(result);
      this.performanceAnalyzer.addSpeedSample({
        speedKbps: result.speedKbps,
        timestamp: result.timestamp,
        dataSize: testOptions.testSize,
        duration: testDuration,
      });

      // Keep only last 50 tests
      if (this.testHistory.length > 50) {
        this.testHistory = this.testHistory.slice(-50);
      }

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Measure network latency using multiple small requests
   * @param {Object} options - Test options
   * @returns {Promise<number>} Average latency in milliseconds
   */
  async measureLatency(options = {}) {
    const measurements = [];
    const testCount = options.latencyTests || 5;

    for (let i = 0; i < testCount; i++) {
      const startTime = performance.now();

      try {
        await this.makeSpeedTestRequest({
          ...options,
          size: 64, // Very small request for latency
          method: 'HEAD',
        });

        const latency = performance.now() - startTime;
        measurements.push(latency);

        // Small delay between tests
        if (i < testCount - 1) {
          await this.delay(50);
        }
      } catch (error) {
        console.warn('Latency test failed:', error.message);
      }
    }

    if (measurements.length === 0) {
      return 100; // Default fallback
    }

    // Remove outliers and calculate average
    measurements.sort((a, b) => a - b);
    const trimmed = measurements.slice(1, -1); // Remove min and max

    return trimmed.length > 0
      ? trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length
      : measurements[0];
  }

  /**
   * Measure download speed using concurrent requests
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Speed measurement results
   */
  async measureDownloadSpeed(options = {}) {
    const concurrentTests = options.concurrentTests || 3;

    const promises = [];
    const startTime = performance.now();

    // Launch concurrent tests
    for (let i = 0; i < concurrentTests; i++) {
      promises.push(this.measureSingleDownloadSpeed(options));
    }

    try {
      // Wait for all tests to complete or timeout
      const results = await Promise.allSettled(promises);
      const testDuration = performance.now() - startTime;

      // Process results
      const successfulTests = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      if (successfulTests.length === 0) {
        throw new Error('All speed tests failed');
      }

      // Calculate average speed and jitter
      const speeds = successfulTests.map((r) => r.speedKbps);
      const avgSpeed =
        speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

      const jitter = this.calculateJitter(speeds);

      // Estimate packet loss based on failed tests
      const packetLoss =
        ((concurrentTests - successfulTests.length) / concurrentTests) * 100;

      return {
        speedKbps: avgSpeed,
        jitter,
        packetLoss,
        testDuration,
        sampleCount: successfulTests.length,
      };
    } catch (error) {
      // Fallback: try a single simple test
      return await this.measureSingleDownloadSpeed({
        ...options,
        fallback: true,
      });
    }
  }

  /**
   * Measure single download speed
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Single speed test result
   */
  async measureSingleDownloadSpeed(options = {}) {
    const testSize = options.testSize || 1024;
    const startTime = performance.now();

    try {
      await this.makeSpeedTestRequest(options);
      const duration = performance.now() - startTime;

      // Calculate speed based on actual data transferred
      const speedKbps = (testSize * 8) / duration; // bits/ms = Kbps

      return {
        speedKbps,
        duration,
        dataSize: testSize,
        success: true,
      };
    } catch (error) {
      if (options.fallback) {
        // Return very slow speed for fallback
        return {
          speedKbps: 1, // 1 Kbps - extremely slow
          duration: this.options.maxTestTime,
          dataSize: testSize,
          success: false,
        };
      }
      throw error;
    }
  }

  /**
   * Make an actual speed test request
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async makeSpeedTestRequest(options = {}) {
    const {
      testUrl = this.options.testUrl,
      size = this.options.testSize,
      method = 'GET',
      timeout = this.options.timeout,
    } = options;

    // Create test data URL with size parameter
    const url = `${testUrl}?size=${size}&timestamp=${Date.now()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For GET requests, actually read the response to measure transfer
      if (method === 'GET') {
        const reader = response.body.getReader();

        try {
          let reading = true;
          while (reading) {
            const { done } = await reader.read();
            if (done) {
              reading = false;
            }
          }
        } catch (error) {
          // If reading fails, continue with response
          console.warn('Failed to read response body:', error.message);
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Speed test timeout');
      }

      throw error;
    }
  }

  /**
   * Calculate jitter from speed measurements
   * @param {Array<number>} speeds - Array of speed measurements
   * @returns {number} Jitter in milliseconds
   */
  calculateJitter(speeds) {
    if (speeds.length < 2) return 0;

    const avg = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const variance =
      speeds.reduce((sum, speed) => sum + Math.pow(speed - avg, 2), 0) /
      speeds.length;

    return Math.sqrt(variance);
  }

  /**
   * Assess network quality based on speed and latency
   * @param {Object} speedResult - Speed test results
   * @param {number} latency - Network latency
   * @returns {string} Quality assessment
   */
  assessNetworkQuality(speedResult, latency) {
    const { speedKbps, packetLoss } = speedResult;

    // Quality scoring based on multiple factors
    let qualityScore = 100;

    // Speed factor (40% weight)
    if (speedKbps > 5000)
      qualityScore -= 0; // Excellent
    else if (speedKbps > 2000)
      qualityScore -= 10; // Good
    else if (speedKbps > 1000)
      qualityScore -= 20; // Fair
    else if (speedKbps > 100)
      qualityScore -= 40; // Poor
    else qualityScore -= 60; // Very poor

    // Latency factor (30% weight)
    if (latency > 1000)
      qualityScore -= 30; // Very high latency
    else if (latency > 500)
      qualityScore -= 20; // High latency
    else if (latency > 200)
      qualityScore -= 10; // Medium latency
    else qualityScore -= 0; // Low latency

    // Packet loss factor (30% weight)
    if (packetLoss > 10)
      qualityScore -= 30; // High packet loss
    else if (packetLoss > 5)
      qualityScore -= 20; // Medium packet loss
    else if (packetLoss > 1)
      qualityScore -= 10; // Low packet loss
    else qualityScore -= 0; // No packet loss

    // Determine quality category
    if (qualityScore >= 80) return 'excellent';
    if (qualityScore >= 60) return 'good';
    if (qualityScore >= 40) return 'fair';
    if (qualityScore >= 20) return 'poor';
    return 'very-poor';
  }

  /**
   * Get network performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    if (this.testHistory.length === 0) {
      return {
        hasData: false,
        message: 'No speed tests performed yet',
      };
    }

    const recentTests = this.testHistory.slice(-10); // Last 10 tests
    const speeds = recentTests.map((t) => t.speedKbps);
    const latencies = recentTests.map((t) => t.latency);

    return {
      hasData: true,
      testCount: this.testHistory.length,
      recentTests: recentTests.length,

      // Speed statistics
      averageSpeed:
        speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length,
      maxSpeed: Math.max(...speeds),
      minSpeed: Math.min(...speeds),

      // Latency statistics
      averageLatency:
        latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length,
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),

      // Quality distribution
      qualityDistribution: this.getQualityDistribution(recentTests),

      // Performance analyzer status
      performanceStatus: this.performanceAnalyzer.getPerformanceStatus(),

      lastTest: this.testHistory[this.testHistory.length - 1],
    };
  }

  /**
   * Get quality distribution from test history
   * @param {Array} tests - Array of test results
   * @returns {Object} Quality distribution
   */
  getQualityDistribution(tests) {
    const distribution = {};

    for (const test of tests) {
      distribution[test.quality] = (distribution[test.quality] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Clear test history and reset analyzer
   */
  reset() {
    this.testHistory = [];
    this.performanceAnalyzer.reset();
  }

  /**
   * Simple delay utility
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default NetworkSpeedTester;
