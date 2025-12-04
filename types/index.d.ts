/**
 * Network Compression Utils TypeScript Definitions
 */

export interface NetworkInfo {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface CompressionConfig {
  thresholds: {
    'slow-2g': number;
    '2g': number;
    '3g': number;
    '4g': number;
  };
  defaultFormat: 'urlsearch' | 'formdata' | 'string';
  enableAutoCompression: boolean;
  maxCompressionSize: number;
  compressionTimeout: number;
  preferSmallest: boolean;
  enableLogging: boolean;
}

export interface CompressionOptions {
  data: any;
  outputFormat?: 'urlsearch' | 'formdata' | 'string';
  config?: Partial<CompressionConfig>;
  networkType?: string;
  forceCompression?: boolean;
}

export interface CompressionResult {
  compressed: boolean;
  data: string | URLSearchParams | FormData;
  originalSize: number;
  compressedSize?: number;
  networkType: string;
}

export interface MainCompressionResult {
  compressed: boolean;
  data: string | URLSearchParams | FormData;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  networkType: string;
  outputFormat: string;
  algorithm: string;
  processingTime: number;
  error?: string;
}

export interface FormatResult {
  success: boolean;
  data: string | URLSearchParams | FormData | null;
  format: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface FormatInfo {
  name: string;
  description: string;
  useCase: string;
  browserSupport: string;
  maxSize: string;
}

export declare class NetworkDetector {
  constructor();
  getNetworkInfo(): NetworkInfo | null;
  isSlowNetwork(networkInfo?: NetworkInfo): boolean;
  isFastNetwork(networkInfo?: NetworkInfo): boolean;
  getNetworkQualityScore(networkInfo?: NetworkInfo): number;
  addEventListener(callback: (networkInfo: NetworkInfo) => void): void;
  removeEventListener(callback: (networkInfo: NetworkInfo) => void): void;
  getNetworkDescription(networkInfo?: NetworkInfo): string;
  destroy(): void;
}

export declare class ConfigManager {
  constructor(userConfig?: Partial<CompressionConfig>);
  getConfig(): CompressionConfig;
  updateConfig(newConfig: Partial<CompressionConfig>): boolean;
  resetToDefaults(): void;
  exportConfig(): string;
  importConfig(configJson: string): boolean;
  getThresholdForNetwork(networkType: string): number;
  setNetworkThreshold(networkType: string, threshold: number): boolean;
  shouldCompressData(dataSize: number, networkType: string): boolean;
  getOptimalFormat(requestedFormat: string, data?: any): string;
  getAllThresholds(): { 'slow-2g': number; '2g': number; '3g': number; '4g': number; };
  getConfigSummary(): Object;
  formatBytes(bytes: number): string;
  setLogging(enabled: boolean): void;
  getValidationErrors(): string[];
  isValid(): boolean;
}

export declare class FormatConverter {
  constructor();
  convertToFormat(data: any, targetFormat: string, options?: any): FormatResult;
  convertBetweenFormats(
    data: any,
    sourceFormat: string,
    targetFormat: string,
    options?: any
  ): FormatResult;
  toString(data: any, options?: any): string;
  toUrlSearchParams(data: any, options?: any): URLSearchParams;
  toFormData(data: any, options?: any): FormData;
  getDataSize(data: any, format: string): number;
  validateFormat(data: any, format: string): ValidationResult;
  recommendFormat(data: any, context?: any): string;
  getSupportedFormats(): string[];
  isFormatSupported(format: string): boolean;
  getFormatInfo(format: string): FormatInfo | null;
}

export declare class CompressionManager {
  constructor(config?: CompressionConfig);
  compress(data: any): string;
  decompress(compressedData: string): any;
  shouldCompress(dataSize: number, networkType: string): boolean;
}

export declare class NetworkCompressionUtils {
  constructor(config?: Partial<CompressionConfig>);
  compress(options: CompressionOptions): MainCompressionResult;
  getNetworkInfo(): NetworkInfo | null;
  getNetworkQualityScore(networkInfo?: NetworkInfo): number;
  isSlowNetwork(networkInfo?: NetworkInfo): boolean;
  updateConfig(newConfig: Partial<CompressionConfig>): boolean;
  getConfig(): CompressionConfig;
  getConfigSummary(): Object;
  getCompressionStats(): Object;
  resetStats(): void;
  testCompression(sampleData: any, iterations?: number): Object;
  compareAlgorithms(testData: any): Object;
  getSupportedFormats(): string[];
  getFormatInfo(format: string): FormatInfo | null;
  recommendFormat(data: any, context?: any): string;
  validateFormat(data: any, format: string): ValidationResult;
  addNetworkListener(callback: (networkInfo: NetworkInfo) => void): void;
  removeNetworkListener(callback: (networkInfo: NetworkInfo) => void);
  getNetworkDescription(networkInfo?: NetworkInfo): string;
  setLogging(enabled: boolean): void;
  getSystemStatus(): Object;
  getBrowserCompatibility(): Object;
  getBrowserSupport(): Object;
  getCompatibilityWarnings(): string[];
  isFeatureAvailable(feature: string): boolean;
  getPolyfillStatus(): Object;
  destroy(): void;
}

export declare class BrowserCompatibilityManager {
  constructor();
  getCompatibilityReport(): Object;
  isBrowserSupported(): Object;
  getCompatibilityWarnings(): string[];
  getFeature(featureName: string): any;
  applyPolyfills(): void;
  destroy(): void;
}

export declare class NetworkAdapterFactory {
  static getNetworkAdapter(): any;
  static isNetworkInformationAPIAvailable(): boolean;
  static isPerformanceAPIAvailable(): boolean;
}

export declare class CompressionAdapterFactory {
  static getCompressionAdapter(): any;
  static isCompressionStreamAvailable(): boolean;
}

export declare class NativeNetworkAdapter {
  constructor();
  getNetworkInfo(): any;
  addEventListener(callback: Function): Function;
  removeEventListener(callback: Function): void;
  destroy(): void;
}

export declare class PerformanceNetworkAdapter {
  constructor();
  getNetworkInfo(): any;
  addEventListener(callback: Function): Function;
  removeEventListener(callback: Function): void;
  destroy(): void;
}

export declare class UserAgentNetworkAdapter {
  constructor();
  getNetworkInfo(): any;
  addEventListener(callback: Function): Function;
  removeEventListener(callback: Function): void;
  destroy(): void;
}