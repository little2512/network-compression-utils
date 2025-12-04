/**
 * Network Adapters
 * Provides alternative implementations for network detection in different environments
 */

class NetworkAdapterFactory {
  /**
   * Get the best available network adapter
   */
  static getNetworkAdapter() {
    // Try native Network Information API first
    if (this.isNetworkInformationAPIAvailable()) {
      return new NativeNetworkAdapter();
    }

    // Try connection estimation via performance metrics
    if (this.isPerformanceAPIAvailable()) {
      return new PerformanceNetworkAdapter();
    }

    // Fallback to user agent and basic detection
    return new UserAgentNetworkAdapter();
  }

  /**
   * Check if Network Information API is available
   */
  static isNetworkInformationAPIAvailable() {
    return !!(
      typeof navigator !== 'undefined' &&
      (navigator.connection ||
       navigator.mozConnection ||
       navigator.webkitConnection)
    );
  }

  /**
   * Check if Performance API is available for network estimation
   */
  static isPerformanceAPIAvailable() {
    return !!(
      typeof performance !== 'undefined' &&
      performance.timing &&
      performance.navigation
    );
  }
}

/**
 * Native Network Information API Adapter
 */
class NativeNetworkAdapter {
  constructor() {
    this.connection = this.getConnection();
    this.setupEventListeners();
  }

  getConnection() {
    if (!navigator.connection) return null;

    const conn = navigator.connection;

    return {
      effectiveType: conn.effectiveType || '4g',
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData || false,
      type: conn.type || 'unknown'
    };
  }

  setupEventListeners() {
    if (!this.connection) return;

    // Store the original connection object reference for event handling
    this.connection.addEventListener = this.connection.addEventListener || function() {};
    this.connection.removeEventListener = this.connection.removeEventListener || function() {};
  }

  getNetworkInfo() {
    if (!this.connection) {
      return this.createFallbackInfo();
    }

    return {
      effectiveType: this.connection.effectiveType || '4g',
      downlink: this.connection.downlink,
      rtt: this.connection.rtt,
      saveData: this.connection.saveData || false
    };
  }

  addEventListener(callback) {
    if (!this.connection || typeof this.connection.addEventListener !== 'function') {
      return;
    }

    const wrappedCallback = () => {
      callback(this.getNetworkInfo());
    };

    this.connection.addEventListener('change', wrappedCallback);
    return wrappedCallback;
  }

  removeEventListener(callback) {
    if (!this.connection || typeof this.connection.removeEventListener !== 'function') {
      return;
    }

    this.connection.removeEventListener('change', callback);
  }

  createFallbackInfo() {
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    };
  }

  destroy() {
    this.connection = null;
  }
}

/**
 * Performance API Network Adapter
 * Estimates network quality based on page load performance
 */
class PerformanceNetworkAdapter {
  constructor() {
    this.samples = [];
    this.lastSampleTime = 0;
    this.sampleInterval = 5000; // 5 seconds
    this.startSampling();
  }

  startSampling() {
    if (typeof setInterval === 'function') {
      this.samplingInterval = setInterval(() => {
        this.collectSample();
      }, this.sampleInterval);
    }
  }

  collectSample() {
    const now = Date.now();
    if (now - this.lastSampleTime < this.sampleInterval) {
      return;
    }

    const timing = performance.timing;
    const navigation = performance.navigation;

    if (!timing || !navigation) {
      return;
    }

    // Calculate network quality metrics
    const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
    const connectTime = timing.connectEnd - timing.connectStart;
    const responseTime = timing.responseEnd - timing.responseStart;
    const totalTime = timing.loadEventEnd - timing.navigationStart;

    const sample = {
      dnsTime,
      connectTime,
      responseTime,
      totalTime,
      timestamp: now
    };

    this.samples.push(sample);
    this.lastSampleTime = now;

    // Keep only last 10 samples
    if (this.samples.length > 10) {
      this.samples.shift();
    }
  }

  estimateNetworkType() {
    if (this.samples.length === 0) {
      return '4g'; // Default assumption
    }

    const avgResponseTime = this.samples.reduce((sum, sample) =>
      sum + sample.responseTime, 0) / this.samples.length;

    const avgTotalTime = this.samples.reduce((sum, sample) =>
      sum + sample.totalTime, 0) / this.samples.length;

    // Simple heuristic based on response times
    if (avgResponseTime > 2000 || avgTotalTime > 10000) {
      return 'slow-2g';
    } else if (avgResponseTime > 1000 || avgTotalTime > 5000) {
      return '2g';
    } else if (avgResponseTime > 500 || avgTotalTime > 3000) {
      return '3g';
    } else {
      return '4g';
    }
  }

  estimateDownlink() {
    const networkType = this.estimateNetworkType();

    switch (networkType) {
      case 'slow-2g': return 0.05;  // 50 Kbps
      case '2g': return 0.1;       // 100 Kbps
      case '3g': return 1.0;       // 1 Mbps
      case '4g': return 10.0;      // 10 Mbps
      default: return 1.0;
    }
  }

  estimateRTT() {
    if (this.samples.length === 0) {
      return 100; // Default RTT
    }

    const avgResponseTime = this.samples.reduce((sum, sample) =>
      sum + sample.responseTime, 0) / this.samples.length;

    return Math.round(avgResponseTime / 2); // Approximate RTT
  }

  getNetworkInfo() {
    return {
      effectiveType: this.estimateNetworkType(),
      downlink: this.estimateDownlink(),
      rtt: this.estimateRTT(),
      saveData: false
    };
  }

  addEventListener(callback) {
    // Performance adapter doesn't support real-time events
    // We'll simulate periodic updates
    if (typeof setInterval === 'function') {
      const interval = setInterval(() => {
        callback(this.getNetworkInfo());
      }, 10000); // Update every 10 seconds

      return interval;
    }
    return null;
  }

  removeEventListener(intervalId) {
    if (intervalId && typeof clearInterval === 'function') {
      clearInterval(intervalId);
    }
  }

  destroy() {
    if (this.samplingInterval && typeof clearInterval === 'function') {
      clearInterval(this.samplingInterval);
    }
    this.samples = [];
  }
}

/**
 * User Agent Network Adapter
 * Basic network detection based on browser and device information
 */
class UserAgentNetworkAdapter {
  constructor() {
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    this.connectionType = this.detectConnectionType();
  }

  detectConnectionType() {
    const ua = this.userAgent.toLowerCase();

    // Check for mobile indicators
    const isMobile = /mobile|android|iphone|ipad|phone|tablet/i.test(ua);

    // Check for specific browsers that might indicate network capabilities
    const isOldBrowser = /msie [6-9]|firefox\/[2-9]|chrome\/[1-20]/i.test(ua);

    // Check for Opera Mini (common in developing countries)
    const isOperaMini = /opera mini/i.test(ua);

    if (isOperaMini) {
      return 'slow-2g';
    } else if (isMobile && isOldBrowser) {
      return '2g';
    } else if (isMobile) {
      return '3g';
    } else {
      return '4g';
    }
  }

  getNetworkInfo() {
    return {
      effectiveType: this.connectionType,
      downlink: this.estimateDownlink(),
      rtt: this.estimateRTT(),
      saveData: false
    };
  }

  estimateDownlink() {
    switch (this.connectionType) {
      case 'slow-2g': return 0.05;
      case '2g': return 0.1;
      case '3g': return 1.0;
      case '4g': return 5.0; // Conservative estimate for desktop
      default: return 1.0;
    }
  }

  estimateRTT() {
    switch (this.connectionType) {
      case 'slow-2g': return 2000;
      case '2g': return 1200;
      case '3g': return 300;
      case '4g': return 100;
      default: return 300;
    }
  }

  addEventListener(callback) {
    // User agent adapter doesn't support dynamic network changes
    // Return a no-op function
    return () => {};
  }

  removeEventListener(callback) {
    // No-op
  }

  destroy() {
    // Clean up
    this.userAgent = '';
  }
}

/**
 * Compression Adapter Factory
 */
class CompressionAdapterFactory {
  /**
   * Get the best available compression adapter
   */
  static getCompressionAdapter() {
    // Try native CompressionStream API first
    if (this.isCompressionStreamAvailable()) {
      return new NativeCompressionAdapter();
    }

    // Fallback to LZ-String
    return new LZStringCompressionAdapter();
  }

  /**
   * Check if CompressionStream API is available
   */
  static isCompressionStreamAvailable() {
    return typeof CompressionStream !== 'undefined';
  }
}

/**
 * Native Compression Stream Adapter
 */
class NativeCompressionAdapter {
  async compress(data) {
    try {
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(stringData);

      const compressionStream = new CompressionStream('gzip');
      const writer = compressionStream.writable.getWriter();
      const reader = compressionStream.readable.getReader();

      // Write data to compression stream
      writer.write(uint8Array);
      writer.close();

      // Read compressed data
      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      // Combine chunks and convert to base64
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      throw new Error(`Native compression failed: ${error.message}`);
    }
  }

  async decompress(compressedData) {
    try {
      const buffer = this.base64ToArrayBuffer(compressedData);
      const uint8Array = new Uint8Array(buffer);

      const decompressionStream = new DecompressionStream('gzip');
      const writer = decompressionStream.writable.getWriter();
      const reader = decompressionStream.readable.getReader();

      // Write compressed data to decompression stream
      writer.write(uint8Array);
      writer.close();

      // Read decompressed data
      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      // Combine chunks and decode
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const decoder = new TextDecoder();
      return decoder.decode(combined);
    } catch (error) {
      throw new Error(`Native decompression failed: ${error.message}`);
    }
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary).toString('base64');
  }

  base64ToArrayBuffer(base64) {
    if (typeof atob !== 'undefined') {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } else {
      // Node.js environment
      return Buffer.from(base64, 'base64').buffer;
    }
  }

  getAlgorithmName() {
    return 'Native Gzip';
  }

  isAvailable() {
    return typeof CompressionStream !== 'undefined' &&
           typeof DecompressionStream !== 'undefined';
  }
}

/**
 * LZ-String Compression Adapter
 */
class LZStringCompressionAdapter {
  constructor() {
    this.lzString = this.loadLZString();
  }

  loadLZString() {
    // Check if LZ-String is already loaded
    if (typeof LZString !== 'undefined') {
      return LZString;
    }

    // Try to load from global scope (might be loaded separately)
    if (typeof window !== 'undefined' && window.LZString) {
      return window.LZString;
    }

    // For now, throw an error requiring LZ-String to be loaded
    throw new Error('LZ-String library not found. Please include lz-string.min.js before using this library.');
  }

  compress(data) {
    try {
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      return this.lzString.compressToUTF16(stringData);
    } catch (error) {
      throw new Error(`LZ-String compression failed: ${error.message}`);
    }
  }

  decompress(compressedData) {
    try {
      const decompressed = this.lzString.decompressFromUTF16(compressedData);
      if (decompressed === null) {
        throw new Error('Failed to decompress data');
      }
      return decompressed;
    } catch (error) {
      throw new Error(`LZ-String decompression failed: ${error.message}`);
    }
  }

  getAlgorithmName() {
    return 'LZ-String';
  }

  isAvailable() {
    try {
      this.loadLZString();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export {
  NetworkAdapterFactory,
  NativeNetworkAdapter,
  PerformanceNetworkAdapter,
  UserAgentNetworkAdapter,
  CompressionAdapterFactory,
  NativeCompressionAdapter,
  LZStringCompressionAdapter
};