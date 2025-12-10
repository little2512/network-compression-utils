/**
 * Performance Analyzer - Real-time network performance analysis for intelligent compression
 * Analyzes actual transmission performance and provides dynamic compression recommendations
 */

import ConfigManager from './config-manager.js';

/**
 * Network speed sample for performance analysis
 * @typedef {Object} SpeedSample
 * @property {number} speedKbps - Measured speed in kilobits per second
 * @property {number} timestamp - Timestamp of the measurement
 * @property {number} dataSize - Size of test data in bytes
 * @property {number} duration - Actual transmission duration in milliseconds
 */

/**
 * Performance analysis result
 * @typedef {Object} PerformanceResult
 * @property {boolean} shouldCompress - Whether data should be compressed
 * @property {number} estimatedTransmissionTime - Estimated transmission time in ms
 * @property {number} compressionBenefit - Estimated time saved by compression in ms
 * @property {string} recommendation - Compression recommendation with reasoning
 * @property {Object} metrics - Detailed performance metrics
 */

/**
 * Performance Analyzer Class
 * Provides intelligent compression decisions based on real network performance
 */
class PerformanceAnalyzer {
  constructor(config = {}) {
    this.configManager = new ConfigManager(config);
    this.speedSamples = [];
    this.lastSpeedTest = 0;
    this.averageSpeedKbps = null;
    this.performanceThreshold =
      this.configManager.config.performanceOptimization?.performanceThreshold ||
      1;

    // Network type speed estimates (Kbps) - fallback values
    this.networkSpeedEstimates = {
      '4g': 10000, // 10 Mbps typical
      '3g': 2000, // 2 Mbps typical
      '2g': 100, // 0.1 Mbps typical
      'slow-2g': 30, // 30 Kbps typical
    };

    // Real-world weak network scenarios
    this.weakNetworkProfiles = {
      'very-slow': { min: 1, max: 2, multiplier: 0.1 }, // 1-2 Kbps
      'extremely-slow': { min: 0.5, max: 1, multiplier: 0.05 }, // 0.5-1 Kbps
      critical: { min: 0.1, max: 0.5, multiplier: 0.02 }, // 0.1-0.5 Kbps
    };
  }

  /**
   * Calculate estimated transmission time based on data size and network speed
   * @param {number} dataSizeBytes - Data size in bytes
   * @param {number} speedKbps - Network speed in kilobits per second
   * @returns {number} Estimated transmission time in milliseconds
   */
  calculateTransmissionTime(dataSizeBytes, speedKbps) {
    if (!speedKbps || speedKbps <= 0) {
      return Infinity;
    }

    const dataBits = dataSizeBytes * 8;
    const speedBitsPerSecond = speedKbps * 1000;
    const timeInSeconds = dataBits / speedBitsPerSecond;
    return timeInSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Estimate compression benefit
   * @param {number} originalSize - Original data size in bytes
   * @param {number} speedKbps - Network speed in Kbps
   * @param {number} estimatedCompressionRatio - Expected compression ratio (0-1)
   * @returns {number} Estimated time saved in milliseconds
   */
  estimateCompressionBenefit(
    originalSize,
    speedKbps,
    estimatedCompressionRatio = 0.5
  ) {
    const originalTime = this.calculateTransmissionTime(
      originalSize,
      speedKbps
    );
    const compressedSize = originalSize * estimatedCompressionRatio;
    const compressedTime = this.calculateTransmissionTime(
      compressedSize,
      speedKbps
    );

    return originalTime - compressedTime;
  }

  /**
   * Detect weak network conditions based on recent speed samples
   * @returns {Object|null} Weak network profile or null
   */
  detectWeakNetworkCondition() {
    if (this.speedSamples.length === 0) {
      return null;
    }

    const recentSpeed = this.getAverageSpeed();

    for (const [profileName, profile] of Object.entries(
      this.weakNetworkProfiles
    )) {
      if (recentSpeed >= profile.min && recentSpeed <= profile.max) {
        return { name: profileName, ...profile };
      }
    }

    return null;
  }

  /**
   * Get dynamic compression threshold based on actual network performance
   * @param {string} networkType - Standard network type (4g, 3g, 2g, slow-2g)
   * @returns {number} Dynamic compression threshold in bytes
   */
  getDynamicThreshold(networkType) {
    const baseThreshold =
      this.configManager.getThresholdForNetwork(networkType);
    const actualSpeed = this.getAverageSpeed();
    const weakCondition = this.detectWeakNetworkCondition();

    // If we have real speed data, use it for dynamic adjustment
    if (actualSpeed) {
      return this.calculateDynamicThreshold(
        baseThreshold,
        actualSpeed,
        networkType
      );
    }

    // Apply weak network multipliers if detected
    if (weakCondition) {
      return baseThreshold * weakCondition.multiplier;
    }

    return baseThreshold;
  }

  /**
   * Calculate dynamic threshold based on performance analysis
   * @param {number} baseThreshold - Base threshold from network type
   * @param {number} actualSpeedKbps - Measured actual speed
   * @param {string} networkType - Standard network type
   * @returns {number} Dynamic threshold in bytes
   */
  calculateDynamicThreshold(baseThreshold, actualSpeedKbps, _networkType) {
    // Calculate threshold that would result in 1ms transmission time
    const performanceThreshold =
      this.configManager.config.performanceOptimization?.performanceThreshold ||
      1;
    const maxDataFor1ms = (performanceThreshold * actualSpeedKbps * 1000) / 8;

    // Use 50% of the 1ms threshold as compression trigger
    const dynamicThreshold = Math.max(10, Math.floor(maxDataFor1ms * 0.5));

    // Blend with base threshold (30% base, 70% performance-based)
    const blendedThreshold = Math.floor(
      baseThreshold * 0.3 + dynamicThreshold * 0.7
    );

    return Math.min(blendedThreshold, baseThreshold);
  }

  /**
   * Intelligent compression decision based on performance analysis
   * @param {number} dataSize - Data size in bytes
   * @param {string} networkType - Standard network type
   * @param {Object} options - Additional options
   * @returns {PerformanceResult} Performance analysis and recommendation
   */
  analyzeCompressionDecision(dataSize, networkType, options = {}) {
    const {
      forceCompression = false,
      estimatedCompressionRatio = 0.5,
      usePerformanceOptimization = this.configManager.config
        .performanceOptimization?.enabled ?? true,
    } = options;

    const actualSpeed = this.getAverageSpeed();

    // Use performance-based analysis if we have valid speed data and performance optimization is enabled
    if (usePerformanceOptimization && actualSpeed && actualSpeed > 0) {
      return this.performPerformanceAnalysis(
        dataSize,
        networkType,
        actualSpeed,
        estimatedCompressionRatio
      );
    }

    // Fallback to standard threshold-based analysis
    return this.performThresholdAnalysis(
      dataSize,
      networkType,
      forceCompression
    );
  }

  /**
   * Perform performance-based compression analysis
   * @param {number} dataSize - Data size in bytes
   * @param {string} networkType - Standard network type
   * @param {number} actualSpeedKbps - Measured actual speed
   * @param {number} estimatedCompressionRatio - Expected compression ratio
   * @returns {PerformanceResult} Performance analysis result
   */
  performPerformanceAnalysis(
    dataSize,
    networkType,
    actualSpeedKbps,
    estimatedCompressionRatio
  ) {
    const estimatedTime = this.calculateTransmissionTime(
      dataSize,
      actualSpeedKbps
    );
    const compressionBenefit = this.estimateCompressionBenefit(
      dataSize,
      actualSpeedKbps,
      estimatedCompressionRatio
    );
    const dynamicThreshold = this.getDynamicThreshold(networkType);

    const shouldCompress =
      dataSize > dynamicThreshold || estimatedTime > this.performanceThreshold;

    let recommendation;
    if (estimatedTime > 10) {
      recommendation = `CRITICAL: Transmission will take ${estimatedTime.toFixed(2)}ms (${(actualSpeedKbps / 1000).toFixed(2)} Mbps). Compression recommended - could save ${compressionBenefit.toFixed(2)}ms`;
    } else if (estimatedTime > this.performanceThreshold) {
      recommendation = `PERFORMANCE: Transmission will take ${estimatedTime.toFixed(2)}ms, exceeding ${this.performanceThreshold}ms threshold. Compression recommended - could save ${compressionBenefit.toFixed(2)}ms`;
    } else if (shouldCompress) {
      recommendation = `OPTIMIZATION: Data size (${dataSize} bytes) exceeds dynamic threshold (${dynamicThreshold} bytes). Optional compression - could save ${compressionBenefit.toFixed(2)}ms`;
    } else {
      recommendation = `EFFICIENT: Transmission estimated at ${estimatedTime.toFixed(2)}ms, within performance threshold. No compression needed`;
    }

    return {
      shouldCompress,
      estimatedTransmissionTime: estimatedTime,
      compressionBenefit,
      recommendation,
      metrics: {
        dataSize,
        actualSpeedKbps,
        dynamicThreshold,
        estimatedCompressionRatio,
        networkType,
        performanceThreshold: this.performanceThreshold,
      },
    };
  }

  /**
   * Perform traditional threshold-based analysis (fallback)
   * @param {number} dataSize - Data size in bytes
   * @param {string} networkType - Standard network type
   * @param {boolean} forceCompression - Force compression regardless
   * @returns {PerformanceResult} Threshold-based analysis result
   */
  performThresholdAnalysis(dataSize, networkType, forceCompression) {
    const threshold = this.configManager.getThresholdForNetwork(networkType);
    const estimatedSpeed = this.networkSpeedEstimates[networkType];
    const estimatedTime = this.calculateTransmissionTime(
      dataSize,
      estimatedSpeed
    );

    const shouldCompress =
      forceCompression ||
      this.configManager.shouldCompressData(dataSize, networkType);

    let recommendation;
    if (forceCompression) {
      recommendation = `FORCED: Compression forced by user request`;
    } else if (shouldCompress) {
      recommendation = `THRESHOLD: Data size (${dataSize} bytes) exceeds ${networkType} threshold (${threshold} bytes). Compression recommended`;
    } else {
      recommendation = `THRESHOLD: Data size (${dataSize} bytes) within ${networkType} threshold (${threshold} bytes). No compression needed`;
    }

    return {
      shouldCompress,
      estimatedTransmissionTime: estimatedTime,
      compressionBenefit: this.estimateCompressionBenefit(
        dataSize,
        estimatedSpeed
      ),
      recommendation,
      metrics: {
        dataSize,
        estimatedSpeedKbps: estimatedSpeed,
        threshold,
        networkType,
        usePerformanceOptimization: false,
      },
    };
  }

  /**
   * Add speed measurement sample
   * @param {SpeedSample} sample - Speed measurement sample
   */
  addSpeedSample(sample) {
    this.speedSamples.push({
      ...sample,
      timestamp: sample.timestamp || Date.now(),
    });

    // Keep only recent samples (last 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    this.speedSamples = this.speedSamples.filter(
      (s) => s.timestamp > tenMinutesAgo
    );

    // Update average speed
    this.updateAverageSpeed();
  }

  /**
   * Update average speed calculation
   */
  updateAverageSpeed() {
    if (this.speedSamples.length === 0) {
      this.averageSpeedKbps = null;
      return;
    }

    // Weight recent samples more heavily
    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;

    for (const sample of this.speedSamples) {
      const age = now - sample.timestamp;
      const weight = Math.exp(-age / (5 * 60 * 1000)); // 5 minute half-life
      weightedSum += sample.speedKbps * weight;
      totalWeight += weight;
    }

    this.averageSpeedKbps = totalWeight > 0 ? weightedSum / totalWeight : null;
  }

  /**
   * Get current average network speed
   * @returns {number|null} Average speed in Kbps or null if no data
   */
  getAverageSpeed() {
    return this.averageSpeedKbps;
  }

  /**
   * Get performance status
   * @returns {Object} Current performance status
   */
  getPerformanceStatus() {
    const weakCondition = this.detectWeakNetworkCondition();
    const avgSpeed = this.getAverageSpeed();

    return {
      averageSpeedKbps: avgSpeed,
      sampleCount: this.speedSamples.length,
      lastSpeedTest: this.lastSpeedTest,
      weakNetworkCondition: weakCondition,
      performanceThreshold: this.performanceThreshold,
      hasRealData: this.speedSamples.length > 0,
    };
  }

  /**
   * Reset performance analyzer state
   */
  reset() {
    this.speedSamples = [];
    this.lastSpeedTest = 0;
    this.averageSpeedKbps = null;
  }
}

export default PerformanceAnalyzer;
