/**
 * Main Network Compression Utils Class
 * Integrates network detection, configuration management, compression, and format conversion
 */

import NetworkDetector from './network-detector.js';
import ConfigManager from './config-manager.js';
import CompressionManager from './compression-manager.js';
import FormatConverter from './format-converter.js';
import BrowserCompatibilityManager from './browser-compatibility.js';
import PerformanceAnalyzer from './performance-analyzer.js';
import NetworkSpeedTester from './network-speed-tester.js';
import qs from 'qs';
import {
  NetworkAdapterFactory,
  CompressionAdapterFactory,
} from './network-adapters.js';

/**
 * Main compression options
 * @typedef {Object} CompressionOptions
 * @property {any} data - Data to compress
 * @property {string} [outputFormat] - Desired output format ('urlsearch', 'formdata', 'string')
 * @property {Partial<import('./config-manager.js').CompressionConfig>} [config] - Override configuration
 * @property {string} [networkType] - Force specific network type
 * @property {boolean} [forceCompression] - Force compression regardless of network
 */

/**
 * Main compression result
 * @typedef {Object} MainCompressionResult
 * @property {boolean} compressed - Whether compression was applied
 * @property {string|URLSearchParams|FormData} data - Result data in requested format
 * @property {number} originalSize - Original data size in bytes
 * @property {number} [compressedSize] - Compressed data size in bytes
 * @property {number} [compressionRatio] - Compression ratio (0-1)
 * @property {string} networkType - Network type used for decision
 * @property {string} outputFormat - Format of output data
 * @property {string} algorithm - Compression algorithm used
 * @property {number} processingTime - Total processing time in milliseconds
 * @property {string} [error] - Error message if compression failed
 */

export default class NetworkCompressionUtils {
  constructor(config = {}) {
    // Initialize browser compatibility first
    this.compatibilityManager = new BrowserCompatibilityManager();
    this.compatibilityManager.applyPolyfills();

    // Check browser compatibility
    const browserSupport = this.compatibilityManager.isBrowserSupported();
    if (!browserSupport.supported) {
      console.warn(
        'Browser may not be fully supported:',
        browserSupport.missingRequired
      );
    }

    // Show compatibility warnings if any
    const warnings = this.compatibilityManager.getCompatibilityWarnings();
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        if (config.enableLogging !== false) {
          console.warn('Compatibility:', warning);
        }
      });
    }

    // Use adaptive network detection
    this.networkDetector = this.createNetworkDetector();
    this.configManager = new ConfigManager(config);
    this.compressionManager = this.createCompressionManager();
    this.formatConverter = this.createFormatConverter();

    // Initialize performance analysis components
    this.performanceAnalyzer = new PerformanceAnalyzer(config);
    this.networkSpeedTester = new NetworkSpeedTester({
      testUrl: config.speedTestUrl || '/api/network-speed-test',
      testSize: config.speedTestSize || 1024,
    });

    this.setupNetworkListener();
    this.setupPerformanceTesting();
  }

  /**
   * Create appropriate network detector based on browser capabilities
   */
  createNetworkDetector() {
    const adapter = NetworkAdapterFactory.getNetworkAdapter();
    return new NetworkDetector(adapter);
  }

  /**
   * Create appropriate compression manager based on browser capabilities
   */
  createCompressionManager() {
    const adapter = CompressionAdapterFactory.getCompressionAdapter();
    return new CompressionManager(this.configManager.getConfig(), adapter);
  }

  /**
   * Create format converter with polyfill support
   */
  createFormatConverter() {
    const URLSearchParamsClass =
      this.compatibilityManager.getFeature('urlSearchParams') ||
      URLSearchParams;
    const FormDataClass =
      this.compatibilityManager.getFeature('formData') || FormData;
    return new FormatConverter({
      URLSearchParams: URLSearchParamsClass,
      FormData: FormDataClass,
    });
  }

  /**
   * Setup network change listener
   */
  setupNetworkListener() {
    this.networkDetector.addEventListener((networkInfo) => {
      this.onNetworkChange(networkInfo);
    });
  }

  /**
   * Setup periodic performance testing
   */
  setupPerformanceTesting() {
    const config = this.configManager.config.performanceOptimization;
    if (!config?.enabled) {
      return;
    }

    const interval = config.speedTestInterval || 30000; // 30 seconds default

    // Perform initial speed test
    this.performSpeedTest().catch((error) => {
      if (this.configManager.config.enableLogging) {
        console.warn('Initial speed test failed:', error.message);
      }
    });

    // Set up periodic testing
    setInterval(() => {
      this.performSpeedTest().catch((error) => {
        // Silently fail periodic tests to avoid console spam
        if (this.configManager.config.enableLogging) {
          console.warn('Periodic speed test failed:', error.message);
        }
      });
    }, interval);
  }

  /**
   * Perform network speed test
   * @param {Object} options - Speed test options
   * @returns {Promise<Object>} Speed test results
   */
  async performSpeedTest(options = {}) {
    try {
      const result = await this.networkSpeedTester.performSpeedTest(options);

      if (this.configManager.config.enableLogging) {
        console.log('Speed test completed:', {
          speedKbps: result.speedKbps.toFixed(2),
          latency: result.latency.toFixed(2) + 'ms',
          quality: result.quality,
        });
      }

      return result;
    } catch (error) {
      if (this.configManager.config.enableLogging) {
        console.warn('Speed test failed:', error.message);
      }
      throw error;
    }
  }

  onNetworkChange(networkInfo) {
    // Log network change if logging is enabled
    if (this.configManager.getConfig().enableLogging) {
      console.log('Network changed:', networkInfo.effectiveType);
    }

    // Trigger speed test on network change
    if (this.configManager.config.performanceOptimization?.enabled) {
      setTimeout(() => {
        this.performSpeedTest().catch(() => {
          // Silently fail to avoid console spam during network changes
        });
      }, 1000); // Wait 1 second for network to stabilize
    }
  }

  /**
   * Main compression method
   * @param {CompressionOptions} options - Compression options
   * @returns {MainCompressionResult} - Compression result
   */
  compress(options) {
    const startTime = performance.now();

    try {
      // Validate input
      if (!options || options.data === undefined) {
        return this.createErrorResult(
          'No data provided for compression',
          options.outputFormat
        );
      }

      // Get current network info or use provided network type
      const networkInfo = options.networkType
        ? { effectiveType: options.networkType }
        : this.networkDetector.getNetworkInfo();

      const networkType = networkInfo?.effectiveType || '4g';

      // Determine if compression should be applied
      const shouldCompress = this.shouldCompressData(
        options.data,
        networkType,
        options.forceCompression
      );

      let compressionResult;
      let finalData = options.data;
      let originalSize = this.getDataSize(options.data);
      let compressedSize = originalSize;
      let compressionRatio = 0;
      let algorithm = 'none';

      if (shouldCompress) {
        // Apply compression
        compressionResult = this.compressionManager.compress(
          options.data,
          options.forceCompression
        );

        if (compressionResult.success) {
          finalData = compressionResult.data;
          compressedSize = compressionResult.compressedSize;
          compressionRatio = compressionResult.compressionRatio;
          algorithm = compressionResult.algorithm;
          originalSize = compressionResult.originalSize;
        } else {
          // Compression failed, use original data
          if (this.configManager.getConfig().enableLogging) {
            console.warn('Compression failed:', compressionResult.error);
          }
          // Ensure finalData is properly set to original data when compression fails
          finalData = options.data;
        }
      }

      // Convert to final output format (always string)
      let finalOutputData;

      if (shouldCompress && compressionResult?.success) {
        // If compressed, data should already be a string from the compression manager
        // Ensure it's converted to string if it's not already
        finalOutputData =
          typeof finalData === 'string' ? finalData : String(finalData);
      } else {
        // If not compressed, convert to URL parameter string using qs
        let processedData = finalData;

        // If finalData is a string, try to parse as JSON, otherwise use as-is
        if (typeof finalData === 'string') {
          try {
            processedData = JSON.parse(finalData);
          } catch (parseError) {
            // If it's not valid JSON, use the string directly
            processedData = finalData;
          }
        }

        try {
          finalOutputData = qs.stringify(processedData, {
            arrayFormat: 'brackets',
            allowDots: true,
            encode: true,
          });
        } catch (error) {
          // Fallback to JSON.stringify if qs fails
          try {
            finalOutputData = JSON.stringify(processedData);
          } catch (stringifyError) {
            // If both fail, convert to string directly
            finalOutputData = String(processedData);
          }
        }
      }

      const processingTime = performance.now() - startTime;

      return {
        compressed: shouldCompress && compressionResult?.success,
        data: finalOutputData, // Always a string
        originalSize,
        compressedSize:
          compressedSize !== originalSize ? compressedSize : undefined,
        compressionRatio: compressionRatio > 0 ? compressionRatio : undefined,
        networkType,
        outputFormat: 'string', // Always string output
        algorithm,
        processingTime,
      };
    } catch (error) {
      return this.createErrorResult(
        `Compression process failed: ${error.message}`,
        options.outputFormat
      );
    }
  }

  /**
   * Determine if data should be compressed
   * @param {any} data - Data to check
   * @param {string} networkType - Network type
   * @param {boolean} forceCompression - Force compression regardless of network
   * @returns {boolean} - Whether to compress
   */
  shouldCompressData(data, networkType, forceCompression = false) {
    if (forceCompression) {
      return true;
    }

    // Check if compression is enabled in configuration
    if (!this.configManager.getConfig().enableAutoCompression) {
      return false;
    }

    // Get data size
    const dataSize = this.getDataSize(data);

    // Use performance-based compression decision if available
    const config = this.configManager.config.performanceOptimization;
    if (config?.enabled && this.performanceAnalyzer) {
      const performanceResult =
        this.performanceAnalyzer.analyzeCompressionDecision(
          dataSize,
          networkType,
          { forceCompression }
        );

      // Log performance-based decision if logging is enabled
      if (
        this.configManager.getConfig().enableLogging &&
        performanceResult.recommendation
      ) {
        console.log(
          'Performance-based compression decision:',
          performanceResult.recommendation
        );
      }

      return performanceResult.shouldCompress;
    }

    // Fallback to traditional threshold-based decision
    return this.configManager.shouldCompressData(dataSize, networkType);
  }

  /**
   * Get data size in bytes
   * @param {any} data - Data to measure
   * @returns {number} - Size in bytes
   */
  getDataSize(data) {
    try {
      if (typeof data === 'string') {
        return new Blob([data]).size;
      }

      if (data instanceof URLSearchParams || data instanceof FormData) {
        return this.formatConverter.getDataSize(
          data,
          data.constructor.name.toLowerCase()
        );
      }

      // Convert to JSON string for objects/arrays
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create error result
   * @param {string} error - Error message
   * @param {string} outputFormat - Requested output format
   * @returns {MainCompressionResult} - Error result
   */
  createErrorResult(error, outputFormat = 'string') {
    return {
      compressed: false,
      data: '',
      originalSize: 0,
      networkType: 'unknown',
      outputFormat: outputFormat || 'string',
      algorithm: 'none',
      processingTime: 0,
      error,
    };
  }

  /**
   * Get current network information
   * @returns {Object|null} - Network information
   */
  getNetworkInfo() {
    return this.networkDetector.getNetworkInfo();
  }

  /**
   * Get network quality score
   * @param {Object} networkInfo - Network info (optional)
   * @returns {number} - Quality score (0-100)
   */
  getNetworkQualityScore(networkInfo = null) {
    return this.networkDetector.getNetworkQualityScore(networkInfo);
  }

  /**
   * Check if current network is slow
   * @param {Object} networkInfo - Network info (optional)
   * @returns {boolean} - True if network is slow
   */
  isSlowNetwork(networkInfo = null) {
    return this.networkDetector.isSlowNetwork(networkInfo);
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   * @returns {boolean} - True if update was successful
   */
  updateConfig(newConfig) {
    return this.configManager.updateConfig(newConfig);
  }

  /**
   * Get current configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return this.configManager.getConfig();
  }

  /**
   * Get configuration summary
   * @returns {Object} - Configuration summary
   */
  getConfigSummary() {
    return this.configManager.getConfigSummary();
  }

  /**
   * Get compression statistics
   * @returns {Object} - Compression statistics
   */
  getCompressionStats() {
    return this.compressionManager.getCompressionStats();
  }

  /**
   * Reset compression statistics
   */
  resetStats() {
    this.compressionManager.resetStats();
  }

  /**
   * Test compression on sample data
   * @param {any} sampleData - Sample data to test
   * @param {number} iterations - Number of test iterations
   * @returns {Object} - Test results
   */
  testCompression(sampleData, iterations = 10) {
    return this.compressionManager.testCompression(sampleData, iterations);
  }

  /**
   * Compare compression algorithms
   * @param {any} testData - Data to test with
   * @returns {Object} - Comparison results
   */
  compareAlgorithms(testData) {
    return this.compressionManager.compareAlgorithms(testData);
  }

  /**
   * Get supported output formats
   * @returns {string[]} - Supported formats
   */
  getSupportedFormats() {
    return this.formatConverter.getSupportedFormats();
  }

  /**
   * Get format information
   * @param {string} format - Format to query
   * @returns {Object} - Format information
   */
  getFormatInfo(format) {
    return this.formatConverter.getFormatInfo(format);
  }

  /**
   * Recommend output format for data
   * @param {any} data - Data to analyze
   * @param {Object} context - Usage context
   * @returns {string} - Recommended format
   */
  recommendFormat(data, context = {}) {
    return this.formatConverter.recommendFormat(data, context);
  }

  /**
   * Validate format compatibility
   * @param {any} data - Data to validate
   * @param {string} format - Target format
   * @returns {Object} - Validation result
   */
  validateFormat(data, format) {
    return this.formatConverter.validateFormat(data, format);
  }

  /**
   * Add network change listener
   * @param {Function} callback - Callback function
   */
  addNetworkListener(callback) {
    this.networkDetector.addEventListener(callback);
  }

  /**
   * Remove network change listener
   * @param {Function} callback - Callback function to remove
   */
  removeNetworkListener(callback) {
    this.networkDetector.removeEventListener(callback);
  }

  /**
   * Get network description
   * @param {Object} networkInfo - Network info (optional)
   * @returns {string} - Human-readable description
   */
  getNetworkDescription(networkInfo = null) {
    return this.networkDetector.getNetworkDescription(networkInfo);
  }

  /**
   * Enable or disable logging
   * @param {boolean} enabled - Enable logging
   */
  setLogging(enabled) {
    this.configManager.setLogging(enabled);
  }

  /**
   * Get comprehensive system status
   * @returns {Object} - System status
   */
  getSystemStatus() {
    const networkInfo = this.networkDetector.getNetworkInfo();
    const config = this.configManager.getConfig();
    const compressionStats = this.compressionManager.getCompressionStats();

    return {
      network: {
        connected: !!networkInfo,
        type: networkInfo?.effectiveType || 'unknown',
        quality: this.networkDetector.getNetworkQualityScore(networkInfo),
        description: this.networkDetector.getNetworkDescription(networkInfo),
      },
      configuration: {
        autoCompressionEnabled: config.enableAutoCompression,
        thresholds: config.thresholds,
        defaultFormat: config.defaultFormat,
        isValid: this.configManager.isValid(),
        validationErrors: this.configManager.getValidationErrors(),
      },
      compression: {
        totalOperations: compressionStats.totalCompressions,
        successRate: compressionStats.successRate,
        spaceSaved: compressionStats.spaceSaved,
        averageTime: compressionStats.averageCompressionTime,
      },
      formats: {
        supported: this.formatConverter.getSupportedFormats(),
        recommended: config.defaultFormat,
      },
    };
  }

  /**
   * Get browser compatibility information
   * @returns {Object} - Compatibility information
   */
  getBrowserCompatibility() {
    return this.compatibilityManager.getCompatibilityReport();
  }

  /**
   * Get browser support level
   * @returns {Object} - Support information
   */
  getBrowserSupport() {
    return this.compatibilityManager.isBrowserSupported();
  }

  /**
   * Get compatibility warnings
   * @returns {string[]} - List of warnings
   */
  getCompatibilityWarnings() {
    return this.compatibilityManager.getCompatibilityWarnings();
  }

  /**
   * Get performance analysis for a specific data size
   * @param {number} dataSize - Data size in bytes
   * @param {string} networkType - Network type (optional, will use detected if not provided)
   * @returns {Object} - Performance analysis result
   */
  getPerformanceAnalysis(dataSize, networkType = null) {
    const actualNetworkType =
      networkType ||
      this.networkDetector.getNetworkInfo()?.effectiveType ||
      '4g';

    if (this.performanceAnalyzer) {
      return this.performanceAnalyzer.analyzeCompressionDecision(
        dataSize,
        actualNetworkType
      );
    }

    // Fallback analysis without performance data
    const threshold =
      this.configManager.getThresholdForNetwork(actualNetworkType);
    const estimatedSpeed =
      this.performanceAnalyzer?.networkSpeedEstimates[actualNetworkType] ||
      10000;
    const estimatedTime =
      this.performanceAnalyzer?.calculateTransmissionTime?.(
        dataSize,
        estimatedSpeed
      ) || (dataSize * 8) / (estimatedSpeed * 1000);

    return {
      shouldCompress: dataSize > threshold,
      estimatedTransmissionTime: estimatedTime,
      compressionBenefit: Math.max(0, estimatedTime - estimatedTime * 0.5), // Assume 50% compression
      recommendation:
        dataSize > threshold
          ? `Data size (${dataSize} bytes) exceeds ${actualNetworkType} threshold (${threshold} bytes). Compression recommended.`
          : `Data size (${dataSize} bytes) within ${actualNetworkType} threshold (${threshold} bytes). No compression needed.`,
      metrics: {
        dataSize,
        threshold,
        networkType: actualNetworkType,
        usePerformanceOptimization: false,
      },
    };
  }

  /**
   * Get network performance status
   * @returns {Object} - Current network performance status
   */
  getNetworkPerformanceStatus() {
    if (!this.performanceAnalyzer) {
      return {
        hasPerformanceData: false,
        message: 'Performance analyzer not available',
      };
    }

    const performanceStatus = this.performanceAnalyzer.getPerformanceStatus();
    const speedTestSummary = this.networkSpeedTester?.getPerformanceSummary();

    return {
      hasPerformanceData: performanceStatus.hasRealData,
      averageSpeedKbps: performanceStatus.averageSpeedKbps,
      sampleCount: performanceStatus.sampleCount,
      weakNetworkCondition: performanceStatus.weakNetworkCondition,
      lastSpeedTest: performanceStatus.lastSpeedTest,
      performanceThreshold: performanceStatus.performanceThreshold,
      speedTestSummary,
      networkInfo: this.networkDetector.getNetworkInfo(),
    };
  }

  /**
   * Force update network speed measurement
   * @param {Object} options - Speed test options
   * @returns {Promise<Object>} - Speed test results
   */
  async updateNetworkSpeed(options = {}) {
    try {
      const result = await this.performSpeedTest(options);

      return {
        success: true,
        speedTestResult: result,
        performanceStatus: this.getNetworkPerformanceStatus(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        performanceStatus: this.getNetworkPerformanceStatus(),
      };
    }
  }

  /**
   * Check if specific feature is available
   * @param {string} feature - Feature name to check
   * @returns {boolean} - Whether feature is available
   */
  isFeatureAvailable(feature) {
    return this.compatibilityManager.features[feature] || false;
  }

  /**
   * Get polyfill status
   * @returns {Object} - Polyfill information
   */
  getPolyfillStatus() {
    return {
      applied: this.compatibilityManager.polyfills.size,
      features: Array.from(this.compatibilityManager.polyfills.keys()),
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.networkDetector.destroy();
    this.compressionManager.resetStats();
    this.compatibilityManager.destroy();
  }
}
