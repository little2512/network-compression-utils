# API Reference

Complete API documentation for Network Compression Utils v1.0.2

## Table of Contents

- [NetworkCompressionUtils Class](#networkcompressionutils-class)
- [Configuration](#configuration)
- [Core Methods](#core-methods)
- [Performance Analysis Methods](#performance-analysis-methods)
- [Network Methods](#network-methods)
- [Browser Compatibility Methods](#browser-compatibility-methods)
- [Statistics and Monitoring](#statistics-and-monitoring)
- [Configuration Management](#configuration-management)
- [Types and Interfaces](#types-and-interfaces)

---

## NetworkCompressionUtils Class

The main class that provides network-aware compression functionality.

### Constructor

```typescript
new NetworkCompressionUtils(config?: Partial<CompressionConfig>)
```

Creates a new instance with optional configuration.

**Parameters:**
- `config` - Optional configuration object to override defaults

**Example:**
```javascript
const ncu = new NetworkCompressionUtils({
  performanceOptimization: {
    enabled: true,
    performanceThreshold: 1
  },
  thresholds: {
    '4g': 2048
  }
});
```

---

## Configuration

### CompressionConfig

```typescript
interface CompressionConfig {
  thresholds: {
    'slow-2g': number;    // Default: 50 bytes
    '2g': number;         // Default: 300 bytes
    '3g': number;         // Default: 600 bytes
    '4g': number;         // Default: 1800 bytes
  };
  defaultFormat: 'string';               // Only 'string' is supported
  enableAutoCompression: boolean;        // Default: true
  maxCompressionSize: number;            // Default: 1048576 (1MB)
  enableLogging: boolean;                // Default: false
  compressionTimeout: number;            // Default: 5000 (5 seconds)
  preferSmallest: boolean;               // Default: true

  // Performance optimization settings
  performanceOptimization: {
    enabled: boolean;                     // Default: true
    performanceThreshold: number;        // Default: 1 (1ms)
    speedTestInterval: number;            // Default: 30000 (30 seconds)
    minSpeedTestSamples: number;          // Default: 3
    aggressiveModeThreshold: number;      // Default: 5 (5 Kbps)
  };
}
```

### PerformanceOptimizationConfig

```typescript
interface PerformanceOptimizationConfig {
  enabled: boolean;           // Enable performance-based compression
  performanceThreshold: number; // Target transmission time in milliseconds
  speedTestInterval: number;     // How often to test network speed (ms)
  minSpeedTestSamples: number;   // Minimum samples before making decisions
  aggressiveModeThreshold: number; // Speed threshold for aggressive mode (Kbps)
}
```

---

## Core Methods

### compress()

Compresses data based on network conditions and configuration.

```typescript
compress(options: CompressionOptions): MainCompressionResult
```

**Parameters:**
```typescript
interface CompressionOptions {
  data: any;                           // Data to compress
  outputFormat?: 'string';            // Output format (default: 'string')
  networkType?: NetworkType;          // Force specific network type
  forceCompression?: boolean;         // Force compression regardless of conditions
  config?: Partial<CompressionConfig>; // Override configuration
}
```

**Returns:**
```typescript
interface MainCompressionResult {
  compressed: boolean;                 // Whether compression was applied
  data: string | URLSearchParams | FormData; // Result data
  originalSize: number;                // Original data size in bytes
  compressedSize?: number;             // Compressed data size in bytes
  compressionRatio?: number;           // Compression ratio (0-1)
  networkType: string;                 // Network type used for decision
  outputFormat: string;                // Format of output data
  algorithm: string;                   // Compression algorithm used
  processingTime: number;              // Processing time in milliseconds
  error?: string;                      // Error message if compression failed
}
```

**Example:**
```javascript
const result = ncu.compress({
  data: { user: 'john', age: 30 },
  outputFormat: 'string'
});

console.log(result);
// {
//   compressed: true,
//   data: "compressed_data_string",
//   originalSize: 45,
//   compressedSize: 28,
//   compressionRatio: 0.62,
//   networkType: '4g',
//   outputFormat: 'string',
//   algorithm: 'LZ-String',
//   processingTime: 2.3
// }
```

---

## Performance Analysis Methods

### getPerformanceAnalysis()

Get detailed performance analysis for compression decisions.

```typescript
getPerformanceAnalysis(dataSize: number, networkType?: NetworkType): PerformanceAnalysisResult
```

**Parameters:**
- `dataSize` - Size of data in bytes
- `networkType` - Optional network type override

**Returns:**
```typescript
interface PerformanceAnalysisResult {
  shouldCompress: boolean;           // Whether compression is recommended
  estimatedTransmissionTime: number;  // Estimated transmission time in ms
  compressionBenefit: number;         // Estimated time saved by compression
  recommendation: string;             // Detailed recommendation
  metrics: {
    dataSize: number;                 // Data size analyzed
    networkType: string;              // Network type used
    dynamicThreshold: number;         // Calculated threshold
    actualSpeedKbps?: number;         // Measured network speed
    usePerformanceOptimization: boolean; // Using performance-based analysis
    performanceThreshold: number;     // Performance threshold used
  };
}
```

**Example:**
```javascript
const analysis = ncu.getPerformanceAnalysis(4096, '4g');
console.log(analysis.recommendation);
// "PERFORMANCE: Transmission will take 3.28ms, exceeding 1ms threshold. Compression recommended..."
```

### getNetworkPerformanceStatus()

Get current network performance status with real speed measurements.

```typescript
getNetworkPerformanceStatus(): NetworkPerformanceStatus
```

**Returns:**
```typescript
interface NetworkPerformanceStatus {
  hasPerformanceData: boolean;        // Whether performance data is available
  averageSpeedKbps: number | null;    // Average measured speed in Kbps
  sampleCount: number;                // Number of speed samples
  weakNetworkCondition: WeakNetworkCondition | null; // Weak network detection
  lastSpeedTest: number;              // Timestamp of last speed test
  performanceThreshold: number;       // Current performance threshold
  speedTestSummary?: SpeedTestSummary; // Summary of speed tests
  networkInfo: NetworkInfo;           // Current network information
}
```

**Weak Network Conditions:**
- `very-slow`: 1-2 Kbps (0.1x multiplier)
- `extremely-slow`: 0.5-1 Kbps (0.05x multiplier)
- `critical`: 0.1-0.5 Kbps (0.02x multiplier)

### updateNetworkSpeed()

Force update network speed measurement.

```typescript
updateNetworkSpeed(options?: SpeedTestOptions): Promise<SpeedUpdateResult>
```

**Parameters:**
```typescript
interface SpeedTestOptions {
  concurrentRequests?: number;  // Number of concurrent requests (default: 3)
  testSize?: number;           // Test data size in bytes (default: 1024)
  timeout?: number;            // Test timeout in ms (default: 5000)
}
```

**Returns:**
```typescript
interface SpeedUpdateResult {
  success: boolean;
  speedTestResult?: SpeedTestResult;
  performanceStatus: NetworkPerformanceStatus;
  error?: string;
}
```

**Example:**
```javascript
const result = await ncu.updateNetworkSpeed();
if (result.success) {
  console.log(`Current speed: ${result.speedTestResult.speedKbps} Kbps`);
}
```

---

## Network Methods

### getNetworkInfo()

Get current network information.

```typescript
getNetworkInfo(): NetworkInfo
```

**Returns:**
```typescript
interface NetworkInfo {
  effectiveType: NetworkType;   // 'slow-2g', '2g', '3g', '4g'
  downlink?: number;            // Downlink speed in Mbps
  rtt?: number;                 // Round-trip time in ms
  saveData?: boolean;           // Data saver mode status
  type?: string;                // Connection type
  quality?: number;             // Network quality score (0-100)
}
```

### getNetworkQualityScore()

Calculate network quality score.

```typescript
getNetworkQualityScore(networkInfo: NetworkInfo): number
```

**Parameters:**
- `networkInfo` - Network information object

**Returns:** `number` - Quality score from 0-100

### isNetworkSlow()

Check if current network is considered slow.

```typescript
isNetworkSlow(networkInfo?: NetworkInfo): boolean
```

### getNetworkDescription()

Get human-readable network description.

```typescript
getNetworkDescription(networkInfo?: NetworkInfo): string
```

### addNetworkListener()

Add network change event listener.

```typescript
addNetworkListener(callback: (networkInfo: NetworkInfo) => void): void
```

### removeNetworkListener()

Remove network change event listener.

```typescript
removeNetworkListener(callback: (networkInfo: NetworkInfo) => void): void
```

---

## Browser Compatibility Methods

### getBrowserCompatibility()

Get comprehensive browser compatibility report.

```typescript
getBrowserCompatibility(): CompatibilityReport
```

**Returns:**
```typescript
interface CompatibilityReport {
  browser: {
    name: string;
    version: string;
    userAgent: string;
  };
  features: {
    networkInformation: boolean;
    compressionStream: boolean;
    urlSearchParams: boolean;
    formData: boolean;
    performance: boolean;
  };
  polyfills: string[];
  recommendations: string[];
  supported: boolean;
}
```

### getBrowserSupport()

Check browser support level.

```typescript
getBrowserSupport(): BrowserSupport
```

**Returns:**
```typescript
interface BrowserSupport {
  supported: boolean;
  level: 'full' | 'basic' | 'unsupported';
  missingRequired: string[];
  missingRecommended: string[];
}
```

---

## Statistics and Monitoring

### getCompressionStats()

Get compression statistics.

```typescript
getCompressionStats(): CompressionStats
```

**Returns:**
```typescript
interface CompressionStats {
  totalCompressions: number;
  successfulCompressions: number;
  failedCompressions: number;
  averageCompressionTime: number;
  spaceSaved: number;
  successRate: number;
}
```

### resetStats()

Reset compression statistics.

```typescript
resetStats(): void
```

### getSystemStatus()

Get comprehensive system status.

```typescript
getSystemStatus(): SystemStatus
```

**Returns:**
```typescript
interface SystemStatus {
  network: {
    type: string;
    quality: number;
    connected: boolean;
  };
  configuration: {
    autoCompressionEnabled: boolean;
    isValid: boolean;
  };
  compression: {
    totalOperations: number;
    successRate: number;
  };
  formats: {
    supported: string[];
  };
}
```

---

## Configuration Management

### updateConfig()

Update configuration at runtime.

```typescript
updateConfig(newConfig: Partial<CompressionConfig>): boolean
```

**Parameters:**
- `newConfig` - Partial configuration to merge

**Returns:** `boolean` - Whether update was successful

### getConfig()

Get current configuration.

```typescript
getConfig(): CompressionConfig
```

### resetToDefaults()

Reset configuration to defaults.

```typescript
resetToDefaults(): void
```

### exportConfig()

Export configuration as JSON string.

```typescript
exportConfig(): string
```

### importConfig()

Import configuration from JSON string.

```typescript
importConfig(configJson: string): boolean
```

---

## Format Utilities

### getSupportedFormats()

Get list of supported output formats.

```typescript
getSupportedFormats(): string[]
```

### getFormatInformation()

Get information about a specific format.

```typescript
getFormatInformation(format: string): FormatInfo | null
```

### recommendFormat()

Recommend format for specific data.

```typescript
recommendFormat(data: any): string
```

### validateFormatCompatibility()

Check if format is compatible with data.

```typescript
validateFormatCompatibility(data: any, format: string): boolean
```

---

## Types and Interfaces

### NetworkType

```typescript
type NetworkType = 'slow-2g' | '2g' | '3g' | '4g';
```

### WeakNetworkCondition

```typescript
interface WeakNetworkCondition {
  name: 'very-slow' | 'extremely-slow' | 'critical';
  min: number;
  max: number;
  multiplier: number;
}
```

### SpeedTestResult

```typescript
interface SpeedTestResult {
  speedKbps: number;        // Measured speed in Kbps
  latency: number;          // Latency in ms
  jitter: number;           // Jitter in ms
  packetLoss: number;      // Packet loss percentage
  quality: string;         // 'excellent' | 'good' | 'fair' | 'poor'
  timestamp: number;       // Test timestamp
}
```

## Error Handling

The library provides comprehensive error handling:

```typescript
try {
  const result = ncu.compress({ data: largeObject });
  if (result.error) {
    console.error('Compression error:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error.message);
}
```

## Browser Support Matrix

| Feature | Chrome | Firefox | Safari | Edge | IE11 |
|---------|--------|---------|--------|------|------|
| Core Compression | ✅ 61+ | ✅ 50+ | ✅ 11+ | ✅ 79+ | ⚠️¹ |
| Network Detection | ✅ 61+ | ✅ 50+ | ✅ 11+ | ✅ 79+ | ❌ |
| Performance Analysis | ✅ 61+ | ✅ 50+ | ✅ 11+ | ✅ 79+ | ⚠️² |
| Real-Time Speed Testing | ✅ 61+ | ✅ 50+ | ✅ 11+ | ✅ 79+ | ⚠️² |

*¹: IE11 requires polyfills
*²: Limited functionality without Performance API

---

## Migration Guide

### From v1.0.0 to v1.0.2

**Breaking Changes:**
- Default thresholds have been updated for better real-world performance
- `performanceOptimization` configuration added

**Recommended Actions:**
1. Review your threshold configurations
2. Enable performance optimization for better results

**Example Migration:**
```javascript
// Old configuration
const oldConfig = {
  thresholds: {
    'slow-2g': 100,
    '2g': 500,
    '3g': 1024,
    '4g': 2048
  }
};

// New configuration (recommended)
const newConfig = {
  thresholds: {
    'slow-2g': 50,   // Updated
    '2g': 300,       // Updated
    '3g': 600,       // Updated
    '4g': 1800       // Updated
  },
  performanceOptimization: {
    enabled: true,
    performanceThreshold: 1
  }
};
```

---

## Support

For bugs, feature requests, or questions:
- Create an issue on [GitHub](https://github.com/little2512/network-compression-utils/issues)
- Check the [documentation](https://github.com/little2512/network-compression-utils#readme)
- Review the [examples](https://github.com/little2512/network-compression-utils/tree/main/examples)