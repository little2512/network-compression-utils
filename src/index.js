/**
 * Network Compression Utils
 * A JavaScript library for network-aware data compression
 */

export { default as NetworkDetector } from './network-detector.js';
export { default as ConfigManager } from './config-manager.js';
export { default as CompressionManager } from './compression-manager.js';
export { default as FormatConverter } from './format-converter.js';
export { default as NetworkCompressionUtils } from './main.js';
export { default as BrowserCompatibilityManager } from './browser-compatibility.js';
export {
  NetworkAdapterFactory,
  CompressionAdapterFactory,
  NativeNetworkAdapter,
  PerformanceNetworkAdapter,
  UserAgentNetworkAdapter,
  NativeCompressionAdapter,
  LZStringCompressionAdapter,
} from './network-adapters.js';
