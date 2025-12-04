/**
 * Network Detector Module
 * Detects network information using Network Information API
 */

/**
 * Network information object
 * @typedef {Object} NetworkInfo
 * @property {string} effectiveType - Network type: 'slow-2g', '2g', '3g', '4g'
 * @property {number} [downlink] - Downlink speed in Mbps
 * @property {number} [rtt] - Round-trip time in ms
 * @property {boolean} [saveData] - Data saver mode
 */

export default class NetworkDetector {
  constructor(networkAdapter = null) {
    this.adapter = networkAdapter;
    this.listeners = new Set();
    this.lastKnownNetworkInfo = null;
    this.initializeNetworkDetection();
  }

  /**
   * Initialize network detection and event listeners
   */
  initializeNetworkDetection() {
    if (this.isNetworkInformationAPIAvailable()) {
      this.setupNetworkListeners();
    }
  }

  /**
   * Check if Network Information API is available
   * @returns {boolean}
   */
  isNetworkInformationAPIAvailable() {
    try {
      return (
        typeof navigator !== 'undefined' &&
        navigator.connection &&
        typeof navigator.connection.effectiveType === 'string'
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current network information
   * @returns {NetworkInfo|null}
   */
  getNetworkInfo() {
    // Use adapter if available
    if (this.adapter) {
      const networkInfo = this.adapter.getNetworkInfo();
      this.lastKnownNetworkInfo = networkInfo;
      return networkInfo;
    }

    // Fallback to original implementation
    if (!this.isNetworkInformationAPIAvailable()) {
      return this.getFallbackNetworkInfo();
    }

    try {
      const connection = navigator.connection;
      const networkInfo = {
        effectiveType: this.normalizeEffectiveType(connection.effectiveType),
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };

      this.lastKnownNetworkInfo = networkInfo;
      return networkInfo;
    } catch (error) {
      console.warn('Network detection failed:', error);
      return this.getFallbackNetworkInfo();
    }
  }

  /**
   * Normalize effective type to standard values
   * @param {string} effectiveType - Raw effective type from browser
   * @returns {string}
   */
  normalizeEffectiveType(effectiveType) {
    const normalizedTypes = ['slow-2g', '2g', '3g', '4g'];
    return normalizedTypes.includes(effectiveType) ? effectiveType : '4g';
  }

  /**
   * Get fallback network information when API is not available
   * @returns {NetworkInfo}
   */
  getFallbackNetworkInfo() {
    // Try to infer network type from other sources or provide default
    if (this.lastKnownNetworkInfo) {
      return this.lastKnownNetworkInfo;
    }

    // Default fallback
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
    };
  }

  /**
   * Check if current network is considered slow
   * @param {NetworkInfo} [networkInfo] - Network info to check (uses current if not provided)
   * @returns {boolean}
   */
  isSlowNetwork(networkInfo = null) {
    const info = networkInfo || this.getNetworkInfo();
    if (!info) return false;

    return ['slow-2g', '2g'].includes(info.effectiveType);
  }

  /**
   * Check if current network is fast
   * @param {NetworkInfo} [networkInfo] - Network info to check (uses current if not provided)
   * @returns {boolean}
   */
  isFastNetwork(networkInfo = null) {
    const info = networkInfo || this.getNetworkInfo();
    if (!info) return true;

    return info.effectiveType === '4g';
  }

  /**
   * Get network quality score (0-100, higher is better)
   * @param {NetworkInfo} [networkInfo] - Network info to score
   * @returns {number}
   */
  getNetworkQualityScore(networkInfo = null) {
    const info = networkInfo || this.getNetworkInfo();
    if (!info) return 50;

    const typeScores = {
      'slow-2g': 10,
      '2g': 30,
      '3g': 60,
      '4g': 90,
    };

    let score = typeScores[info.effectiveType] || 50;

    // Adjust based on downlink speed if available
    if (info.downlink) {
      if (info.downlink >= 10) score = Math.min(100, score + 10);
      else if (info.downlink < 1) score = Math.max(0, score - 10);
    }

    // Adjust based on RTT if available
    if (info.rtt) {
      if (info.rtt <= 100) score = Math.min(100, score + 5);
      else if (info.rtt >= 500) score = Math.max(0, score - 10);
    }

    // Reduce score if data saver is enabled
    if (info.saveData) {
      score = Math.max(0, score - 20);
    }

    return score;
  }

  /**
   * Setup network change event listeners
   */
  setupNetworkListeners() {
    if (!navigator.connection) return;

    const handleNetworkChange = () => {
      const newNetworkInfo = this.getNetworkInfo();
      this.notifyListeners(newNetworkInfo);
    };

    // Network Information API uses 'change' event
    if (typeof navigator.connection.addEventListener === 'function') {
      navigator.connection.addEventListener('change', handleNetworkChange);
    } else if (typeof navigator.connection.onchange === 'object') {
      // Fallback for older browsers
      navigator.connection.onchange = handleNetworkChange;
    }
  }

  /**
   * Add network change listener
   * @param {Function} callback - Callback function called when network changes
   */
  addEventListener(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }
    this.listeners.add(callback);
  }

  /**
   * Remove network change listener
   * @param {Function} callback - Callback function to remove
   */
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of network changes
   * @param {NetworkInfo} networkInfo
   */
  notifyListeners(networkInfo) {
    this.listeners.forEach((callback) => {
      try {
        callback(networkInfo);
      } catch (error) {
        console.error('Error in network change listener:', error);
      }
    });
  }

  /**
   * Get network type description
   * @param {NetworkInfo} [networkInfo] - Network info to describe
   * @returns {string}
   */
  getNetworkDescription(networkInfo = null) {
    const info = networkInfo || this.getNetworkInfo();
    if (!info) return 'Unknown network';

    const descriptions = {
      'slow-2g': 'Very slow connection (2G)',
      '2g': 'Slow connection (2G)',
      '3g': 'Medium speed connection (3G)',
      '4g': 'Fast connection (4G)',
    };

    let description =
      descriptions[info.effectiveType] || 'Unknown network type';

    if (info.saveData) {
      description += ' (Data saver mode)';
    }

    return description;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.listeners.clear();
    this.lastKnownNetworkInfo = null;
  }
}
