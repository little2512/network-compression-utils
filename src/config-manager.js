/**
 * Configuration Manager Module
 * Handles user configuration and network-based compression settings
 */

/**
 * Configuration thresholds for different network types
 * @typedef {Object} CompressionThresholds
 * @property {number} slow-2g - Minimum data size to compress for slow-2g (bytes)
 * @property {number} 2g - Minimum data size to compress for 2g (bytes)
 * @property {number} 3g - Minimum data size to compress for 3g (bytes)
 * @property {number} 4g - Minimum data size to compress for 4g (bytes)
 */

/**
 * Complete configuration object
 * @typedef {Object} CompressionConfig
 * @property {CompressionThresholds} thresholds - Network-based compression thresholds
 * @property {string} defaultFormat - Default output format ('urlsearch', 'formdata', 'string')
 * @property {boolean} enableAutoCompression - Enable automatic compression based on network
 * @property {number} maxCompressionSize - Maximum size to attempt compression (bytes)
 * @property {boolean} enableLogging - Enable debug logging
 * @property {number} compressionTimeout - Compression operation timeout (ms)
 * @property {boolean} preferSmallest - Always prefer smaller result (compressed vs original)
 */

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  thresholds: {
    'slow-2g': 100, // Compress data larger than 100 bytes on very slow networks
    '2g': 500, // Compress data larger than 500 bytes on 2g networks
    '3g': 700, // Compress data larger than 700 bytes on 3g networks
    '4g': 2048, // Compress data larger than 2KB on 4g networks
  },
  defaultFormat: 'urlsearch',
  enableAutoCompression: true,
  maxCompressionSize: 1024 * 1024, // 1MB max size for compression
  enableLogging: false,
  compressionTimeout: 5000, // 5 second timeout
  preferSmallest: true, // Always prefer the smaller of compressed/original
};

/**
 * Valid output formats
 */
const VALID_FORMATS = ['urlsearch', 'formdata', 'string'];

/**
 * Network types that require compression
 */
const COMPRESSION_NETWORK_TYPES = ['slow-2g', '2g', '3g', '4g'];

export default class ConfigManager {
  constructor(userConfig = {}) {
    this.config = this.mergeWithDefaults(userConfig);
    this.validationErrors = [];
    this.validateConfiguration();

    if (this.validationErrors.length > 0) {
      console.warn('Configuration validation warnings:', this.validationErrors);
    }
  }

  /**
   * Merge user configuration with defaults
   * @param {Partial<CompressionConfig>} userConfig - User provided configuration
   * @returns {CompressionConfig} - Merged configuration
   */
  mergeWithDefaults(userConfig) {
    // Handle null/undefined config
    if (!userConfig || typeof userConfig !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Deep clone defaults only
    }

    const merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Deep clone

    // Merge thresholds if provided
    if (userConfig.thresholds) {
      merged.thresholds = {
        ...merged.thresholds,
        ...userConfig.thresholds,
      };
    }

    // Merge other properties
    Object.keys(userConfig).forEach((key) => {
      if (key !== 'thresholds') {
        merged[key] = userConfig[key];
      }
    });

    return merged;
  }

  /**
   * Validate configuration values
   */
  validateConfiguration() {
    const {
      thresholds,
      defaultFormat,
      maxCompressionSize,
      compressionTimeout,
    } = this.config;

    // Validate thresholds
    Object.entries(thresholds).forEach(([networkType, threshold]) => {
      if (!COMPRESSION_NETWORK_TYPES.includes(networkType)) {
        this.validationErrors.push(
          `Unknown network type in thresholds: ${networkType}`
        );
      }

      if (typeof threshold !== 'number' || threshold < 0) {
        this.validationErrors.push(
          `Invalid threshold for ${networkType}: must be positive number`
        );
        // Fix invalid threshold by using default
        if (DEFAULT_CONFIG.thresholds[networkType]) {
          thresholds[networkType] = DEFAULT_CONFIG.thresholds[networkType];
        }
      }
    });

    // Validate default format
    if (!VALID_FORMATS.includes(defaultFormat)) {
      this.validationErrors.push(
        `Invalid defaultFormat: ${defaultFormat}. Valid formats: ${VALID_FORMATS.join(
          ', '
        )}`
      );
      this.config.defaultFormat = 'urlsearch'; // Fallback to safe default
    }

    // Validate max compression size
    if (typeof maxCompressionSize !== 'number' || maxCompressionSize <= 0) {
      this.validationErrors.push(
        'Invalid maxCompressionSize: must be positive number'
      );
      this.config.maxCompressionSize = DEFAULT_CONFIG.maxCompressionSize;
    }

    // Validate compression timeout
    if (typeof compressionTimeout !== 'number' || compressionTimeout <= 0) {
      this.validationErrors.push(
        'Invalid compressionTimeout: must be positive number'
      );
      this.config.compressionTimeout = DEFAULT_CONFIG.compressionTimeout;
    }

    // Validate threshold ordering (should increase with network speed)
    const slow2g = thresholds['slow-2g'];
    const twoG = thresholds['2g'];
    const threeG = thresholds['3g'];
    const fourG = thresholds['4g'];

    if (slow2g > twoG || twoG > threeG || threeG > fourG) {
      this.validationErrors.push(
        'Compression thresholds should increase with network speed (slow-2g <= 2g <= 3g <= 4g)'
      );
    }
  }

  /**
   * Get current configuration
   * @returns {CompressionConfig} - Current configuration
   */
  getConfig() {
    // Return deep copy to prevent external modification
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Update configuration
   * @param {Partial<CompressionConfig>} newConfig - Configuration updates
   * @returns {boolean} - True if update was successful
   */
  updateConfig(newConfig) {
    try {
      const newValidationErrors = [];
      const oldConfig = { ...this.config };
      const oldValidationErrors = [...this.validationErrors];

      // Create temporary merged config for validation
      const tempConfig = this.mergeWithDefaults(newConfig);
      const tempManager = new ConfigManager(tempConfig);

      if (tempManager.validationErrors.length === 0) {
        this.config = tempConfig;
        this.validationErrors = tempManager.validationErrors;

        this.log('Configuration updated successfully', {
          oldConfig,
          newConfig,
        });
        return true;
      } else {
        this.log(
          'Configuration update failed validation',
          tempManager.validationErrors
        );
        return false;
      }
    } catch (error) {
      this.log('Error updating configuration', error);
      return false;
    }
  }

  /**
   * Get compression threshold for a specific network type
   * @param {string} networkType - Network type ('slow-2g', '2g', '3g', '4g')
   * @returns {number} - Compression threshold in bytes
   */
  getThresholdForNetwork(networkType) {
    if (!COMPRESSION_NETWORK_TYPES.includes(networkType)) {
      this.log(`Unknown network type: ${networkType}, using 4g threshold`);
      networkType = '4g';
    }

    return this.config.thresholds[networkType];
  }

  /**
   * Determine if data should be compressed based on size and network
   * @param {number} dataSize - Size of data in bytes
   * @param {string} networkType - Current network type
   * @returns {boolean} - True if compression should be applied
   */
  shouldCompressData(dataSize, networkType) {
    if (!this.config.enableAutoCompression) {
      this.log('Auto compression is disabled');
      return false;
    }

    if (dataSize <= 0) {
      this.log('Invalid data size for compression check', dataSize);
      return false;
    }

    if (dataSize > this.config.maxCompressionSize) {
      this.log(
        `Data size (${dataSize}) exceeds maximum compression size (${this.config.maxCompressionSize})`
      );
      return false;
    }

    const threshold = this.getThresholdForNetwork(networkType);
    const shouldCompress = dataSize >= threshold;

    this.log('Compression check result', {
      dataSize,
      networkType,
      threshold,
      shouldCompress,
    });

    return shouldCompress;
  }

  /**
   * Get optimal output format
   * @param {string} requestedFormat - User requested format
   * @param {any} data - Data to be processed
   * @returns {string} - Best format to use
   */
  getOptimalFormat(requestedFormat, data = null) {
    // Use requested format if valid
    if (VALID_FORMATS.includes(requestedFormat)) {
      return requestedFormat;
    }

    // Use default format
    if (VALID_FORMATS.includes(this.config.defaultFormat)) {
      this.log(
        `Using default format: ${this.config.defaultFormat} (requested: ${requestedFormat})`
      );
      return this.config.defaultFormat;
    }

    // Ultimate fallback
    this.log(
      `Invalid default format: ${this.config.defaultFormat}, using 'urlsearch'`
    );
    return 'urlsearch';
  }

  /**
   * Get all network thresholds
   * @returns {CompressionThresholds} - Network compression thresholds
   */
  getAllThresholds() {
    return { ...this.config.thresholds };
  }

  /**
   * Set threshold for specific network type
   * @param {string} networkType - Network type
   * @param {number} threshold - Threshold in bytes
   * @returns {boolean} - True if successful
   */
  setNetworkThreshold(networkType, threshold) {
    if (!COMPRESSION_NETWORK_TYPES.includes(networkType)) {
      this.log(`Cannot set threshold for unknown network type: ${networkType}`);
      return false;
    }

    if (typeof threshold !== 'number' || threshold < 0) {
      this.log(`Invalid threshold value: ${threshold}`);
      return false;
    }

    const oldThreshold = this.config.thresholds[networkType];
    this.config.thresholds[networkType] = threshold;

    // Validate threshold ordering
    this.validateConfiguration();

    if (this.validationErrors.length > 0) {
      // Revert if validation failed
      this.config.thresholds[networkType] = oldThreshold;
      this.log('Threshold set failed validation, reverting');
      return false;
    }

    this.log(
      `Updated threshold for ${networkType}: ${oldThreshold} -> ${threshold}`
    );
    return true;
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults() {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.validationErrors = [];
    this.log('Configuration reset to defaults');
  }

  /**
   * Export configuration to JSON
   * @returns {string} - JSON string of current configuration
   */
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   * @param {string} configJson - JSON configuration string
   * @returns {boolean} - True if import was successful
   */
  importConfig(configJson) {
    try {
      const parsedConfig = JSON.parse(configJson);
      return this.updateConfig(parsedConfig);
    } catch (error) {
      this.log('Failed to parse configuration JSON', error);
      return false;
    }
  }

  /**
   * Get configuration summary
   * @returns {Object} - Summary of current configuration
   */
  getConfigSummary() {
    const {
      thresholds,
      defaultFormat,
      enableAutoCompression,
      maxCompressionSize,
    } = this.config;

    return {
      thresholds: { ...thresholds },
      defaultFormat,
      enableAutoCompression,
      maxCompressionSize: this.formatBytes(maxCompressionSize),
      compressionTimeout: `${this.config.compressionTimeout}ms`,
      preferSmallest: this.config.preferSmallest,
      enableLogging: this.config.enableLogging,
    };
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if logging is enabled and log message
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  log(message, data = null) {
    if (this.config.enableLogging) {
      console.log(`[ConfigManager] ${message}`, data);
    }
  }

  /**
   * Enable or disable logging
   * @param {boolean} enabled - Enable logging
   */
  setLogging(enabled) {
    this.config.enableLogging = Boolean(enabled);
    this.log(`Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get validation errors
   * @returns {Array} - Array of validation error messages
   */
  getValidationErrors() {
    return [...this.validationErrors];
  }

  /**
   * Check if configuration is valid
   * @returns {boolean} - True if no validation errors
   */
  isValid() {
    return this.validationErrors.length === 0;
  }
}
