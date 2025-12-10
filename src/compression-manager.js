/**
 * Compression Manager Module
 * Handles data compression using various algorithms
 */

import LZString from 'lz-string';

/**
 * Compression result object
 * @typedef {Object} CompressionResult
 * @property {boolean} success - Whether compression was successful
 * @property {string} data - Compressed data or original data if compression failed
 * @property {number} originalSize - Size of original data in bytes
 * @property {number} compressedSize - Size of compressed data in bytes
 * @property {number} compressionRatio - Compression ratio (0-1, lower is better)
 * @property {number} compressionTime - Time taken to compress in milliseconds
 * @property {string} algorithm - Compression algorithm used
 * @property {string} error - Error message if compression failed
 */

/**
 * Available compression algorithms
 */
const COMPRESSION_ALGORITHMS = {
  LZ_STRING: 'lz-string',
  NONE: 'none',
};

/**
 * Default compression settings
 */
const DEFAULT_COMPRESSION_CONFIG = {
  algorithm: COMPRESSION_ALGORITHMS.LZ_STRING,
  timeout: 5000, // 5 seconds
  minCompressionRatio: 0.1, // Minimum 10% compression to be considered useful
  enableFallback: true, // Fall back to original data if compression fails
  preferSmallest: true, // Always return smaller of compressed/original
};

export default class CompressionManager {
  constructor(config = {}, compressionAdapter = null) {
    this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
    this.compressionStats = {
      totalCompressions: 0,
      successfulCompressions: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionTime: 0,
    };
    this.compressionAdapter = compressionAdapter;
  }

  /**
   * Compress data using configured algorithm
   * @param {any} data - Data to compress
   * @param {boolean} forceCompression - Force compression regardless of compression ratio
   * @returns {CompressionResult} - Compression result
   */
  compress(data, forceCompression = false) {
    const startTime = performance.now();
    const originalData = this.serializeData(data);
    const originalSize = this.getDataSize(originalData);

    try {
      this.compressionStats.totalCompressions++;
      this.compressionStats.totalOriginalSize += originalSize;

      // Check if data is too small to be worth compressing (unless forced)
      if (originalSize < 50 && !forceCompression) {
        return this.createResult(
          false,
          originalData,
          originalSize,
          originalSize,
          0,
          performance.now() - startTime,
          COMPRESSION_ALGORITHMS.NONE,
          'Data too small for compression'
        );
      }

      // Compress based on algorithm or adapter
      let compressedData;
      let algorithm = this.config.algorithm;

      // Use adapter if available
      if (this.compressionAdapter) {
        try {
          const compressionResult =
            this.compressionAdapter.compress(originalData);

          // Handle both synchronous and asynchronous compression adapters
          if (
            compressionResult &&
            typeof compressionResult.then === 'function'
          ) {
            // It's a Promise, but we're in sync context - this shouldn't happen in tests
            throw new Error(
              'Async compression adapter not supported in synchronous context'
            );
          }

          compressedData = compressionResult;
          algorithm = this.compressionAdapter.getAlgorithmName();
        } catch (error) {
          if (this.config.enableFallback) {
            compressedData = originalData;
            algorithm = COMPRESSION_ALGORITHMS.NONE;
          } else {
            throw error;
          }
        }
      } else {
        // Use built-in algorithms
        switch (algorithm) {
          case COMPRESSION_ALGORITHMS.LZ_STRING:
            compressedData = this.compressWithLZString(originalData);
            break;
          case COMPRESSION_ALGORITHMS.NONE:
          default:
            compressedData = originalData;
            algorithm = COMPRESSION_ALGORITHMS.NONE;
            break;
        }
      }

      // Ensure compressedData is never undefined
      if (compressedData === undefined || compressedData === null) {
        compressedData = originalData;
        algorithm = COMPRESSION_ALGORITHMS.NONE;
      }

      const compressedSize = this.getDataSize(compressedData);

      // Handle cases where performance.now() might not work properly (test environments)
      let compressionTime;
      try {
        const endTime = performance.now();
        compressionTime = endTime - startTime;
        if (!isFinite(compressionTime) || compressionTime < 0) {
          compressionTime = 0; // Fallback for test environments
        }
      } catch (e) {
        compressionTime = 0; // Fallback for environments without performance.now
      }

      const compressionRatio = 1 - compressedSize / originalSize;

      // Check if compression is beneficial
      const isCompressedSmaller = compressedSize < originalSize;
      const meetsCompressionRatio =
        compressionRatio >= this.config.minCompressionRatio;

      let finalData = compressedData;
      let finalAlgorithm = algorithm;
      let finalSize = compressedSize;
      let success = true;

      // Skip compression ratio checks if force compression is enabled
      if (
        !forceCompression &&
        (!isCompressedSmaller || !meetsCompressionRatio)
      ) {
        if (this.config.preferSmallest || !meetsCompressionRatio) {
          // Use original data if it's smaller or compression isn't significant
          finalData = originalData;
          finalAlgorithm = COMPRESSION_ALGORITHMS.NONE;
          finalSize = originalSize;
          success = false;
        }
      }

      // Update stats
      if (success) {
        this.compressionStats.successfulCompressions++;
        this.compressionStats.totalCompressedSize += finalSize;
      }

      this.updateAverageCompressionTime(compressionTime);

      return this.createResult(
        success,
        finalData,
        originalSize,
        finalSize,
        1 - finalSize / originalSize,
        compressionTime,
        finalAlgorithm
      );
    } catch (error) {
      const compressionTime = performance.now() - startTime;

      // Fallback to original data if enabled
      if (this.config.enableFallback) {
        return this.createResult(
          false,
          originalData,
          originalSize,
          originalSize,
          0,
          compressionTime,
          COMPRESSION_ALGORITHMS.NONE,
          `Compression failed: ${error.message}`
        );
      }

      throw error;
    }
  }

  /**
   * Decompress data
   * @param {string} compressedData - Compressed data
   * @param {string} [algorithm] - Algorithm used for compression
   * @returns {any} - Decompressed data
   */
  decompress(compressedData, algorithm = this.config.algorithm) {
    try {
      switch (algorithm) {
        case COMPRESSION_ALGORITHMS.LZ_STRING:
          return this.decompressWithLZString(compressedData);
        case COMPRESSION_ALGORITHMS.NONE:
        default:
          return this.deserializeData(compressedData);
      }
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }

  /**
   * Check if data should be compressed based on heuristics
   * @param {any} data - Data to check
   * @returns {boolean} - True if data is likely to benefit from compression
   */
  shouldCompress(data) {
    const serialized = this.serializeData(data);
    const size = this.getDataSize(serialized);

    // Don't compress very small data
    if (size < 100) return false;

    // Don't compress if it looks like already compressed
    if (this.isLikelyCompressed(serialized)) return false;

    // Check data type heuristics
    const dataType = this.getDataType(data);
    const compressibleTypes = ['object', 'array', 'string'];

    return compressibleTypes.includes(dataType);
  }

  /**
   * Compress data with LZ-String algorithm
   * @param {string} data - Data to compress
   * @returns {string} - Compressed data
   */
  compressWithLZString(data) {
    return LZString.compress(data);
  }

  /**
   * Decompress data with LZ-String algorithm
   * @param {string} compressedData - Compressed data
   * @returns {string} - Decompressed data
   */
  decompressWithLZString(compressedData) {
    const decompressed = LZString.decompress(compressedData);
    if (decompressed === null) {
      throw new Error('LZ-String decompression returned null');
    }
    return decompressed;
  }

  /**
   * Serialize data to string format
   * @param {any} data - Data to serialize
   * @returns {string} - Serialized data
   */
  serializeData(data) {
    if (typeof data === 'string') {
      return data;
    }

    try {
      return JSON.stringify(data);
    } catch (error) {
      throw new Error(`Data serialization failed: ${error.message}`);
    }
  }

  /**
   * Deserialize data from string format
   * @param {string} serializedData - Serialized data
   * @returns {any} - Deserialized data
   */
  deserializeData(serializedData) {
    try {
      return JSON.parse(serializedData);
    } catch (error) {
      // If JSON parsing fails, return as string
      return serializedData;
    }
  }

  /**
   * Get data size in bytes
   * @param {string} data - Data to measure
   * @returns {number} - Size in bytes
   */
  getDataSize(data) {
    return new Blob([data]).size;
  }

  /**
   * Get data type for heuristics
   * @param {any} data - Data to analyze
   * @returns {string} - Data type
   */
  getDataType(data) {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    return typeof data;
  }

  /**
   * Check if data is likely already compressed
   * @param {string} data - Data to check
   * @returns {boolean} - True if data appears compressed
   */
  isLikelyCompressed(data) {
    // Check for common compression signatures
    const compressionSignatures = [
      /^PK/, // ZIP
      /^GZIP/, // GZIP (simplified)
      /^PNG/, // PNG (simplified)
      /^JPEG/, // JPEG (simplified)
      /^GIF/, // GIF
      /^%PDF/, // PDF
      /^7ZIP/, // 7Z (simplified)
    ];

    return (
      compressionSignatures.some((signature) => signature.test(data)) ||
      // Check for binary data patterns
      data.includes('\x00') ||
      (data.length > 0 && data.charCodeAt(0) < 32)
    );
  }

  /**
   * Create compression result object
   * @param {boolean} success - Success status
   * @param {string} data - Result data
   * @param {number} originalSize - Original size
   * @param {number} compressedSize - Compressed size
   * @param {number} compressionRatio - Compression ratio
   * @param {number} compressionTime - Time taken
   * @param {string} algorithm - Algorithm used
   * @param {string} [error] - Error message
   * @returns {CompressionResult} - Result object
   */
  createResult(
    success,
    data,
    originalSize,
    compressedSize,
    compressionRatio,
    compressionTime,
    algorithm,
    error = null
  ) {
    return {
      success,
      data,
      originalSize,
      compressedSize,
      compressionRatio,
      compressionTime,
      algorithm,
      error,
    };
  }

  /**
   * Update average compression time
   * @param {number} compressionTime - Latest compression time
   */
  updateAverageCompressionTime(compressionTime) {
    const stats = this.compressionStats;
    const totalOperations = stats.totalCompressions;

    stats.averageCompressionTime =
      (stats.averageCompressionTime * (totalOperations - 1) + compressionTime) /
      totalOperations;
  }

  /**
   * Get compression statistics
   * @returns {Object} - Compression stats
   */
  getCompressionStats() {
    const stats = { ...this.compressionStats };

    // Calculate additional metrics
    if (stats.totalOriginalSize > 0) {
      stats.overallCompressionRatio =
        1 - stats.totalCompressedSize / stats.totalOriginalSize;
    } else {
      stats.overallCompressionRatio = 0;
    }

    stats.successRate =
      stats.totalCompressions > 0
        ? stats.successfulCompressions / stats.totalCompressions
        : 0;

    stats.spaceSaved = stats.totalOriginalSize - stats.totalCompressedSize;

    return stats;
  }

  /**
   * Reset compression statistics
   */
  resetStats() {
    this.compressionStats = {
      totalCompressions: 0,
      successfulCompressions: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionTime: 0,
    };
  }

  /**
   * Update compression configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Test compression on sample data
   * @param {any} sampleData - Sample data to test
   * @param {number} [iterations=10] - Number of test iterations
   * @returns {Object} - Test results
   */
  testCompression(sampleData, iterations = 10) {
    const results = {
      algorithm: this.config.algorithm,
      iterations,
      results: [],
      averageCompressionRatio: 0,
      averageCompressionTime: 0,
      successRate: 0,
    };

    let totalRatio = 0;
    let totalTime = 0;
    let successfulCompressions = 0;

    for (let i = 0; i < iterations; i++) {
      const result = this.compress(sampleData);
      results.results.push(result);

      if (result.success) {
        totalRatio += result.compressionRatio;
        totalTime += result.compressionTime;
        successfulCompressions++;
      }
    }

    results.averageCompressionRatio =
      successfulCompressions > 0 ? totalRatio / successfulCompressions : 0;
    results.averageCompressionTime =
      successfulCompressions > 0 ? totalTime / successfulCompressions : 0;
    results.successRate = successfulCompressions / iterations;

    return results;
  }

  /**
   * Compare different compression algorithms
   * @param {any} testData - Data to test with
   * @returns {Object} - Comparison results
   */
  compareAlgorithms(testData) {
    const algorithms = Object.values(COMPRESSION_ALGORITHMS);
    const results = {};

    for (const algorithm of algorithms) {
      const originalConfig = this.config;
      this.config = { ...originalConfig, algorithm };

      try {
        const testResult = this.testCompression(testData, 5);
        results[algorithm] = testResult;
      } catch (error) {
        results[algorithm] = {
          error: error.message,
          successRate: 0,
        };
      }

      this.config = originalConfig;
    }

    return results;
  }

  /**
   * Get available compression algorithms
   * @returns {string[]} - Available algorithms
   */
  getAvailableAlgorithms() {
    return Object.values(COMPRESSION_ALGORITHMS);
  }

  /**
   * Check if an algorithm is supported
   * @param {string} algorithm - Algorithm to check
   * @returns {boolean} - True if supported
   */
  isAlgorithmSupported(algorithm) {
    return Object.values(COMPRESSION_ALGORITHMS).includes(algorithm);
  }
}
