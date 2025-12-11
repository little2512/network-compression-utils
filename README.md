# Network Compression Utils

[![npm version](https://badge.fury.io/js/network-compression-utils.svg)](https://badge.fury.io/js/network-compression-utils)
[![CI Status](https://github.com/little2512/network-compression-utils/workflows/Test%20Suite/badge.svg)](https://github.com/little2512/network-compression-utils/actions)
[![codecov](https://codecov.io/gh/little2512/network-compression-utils/branch/main/graph/badge.svg)](https://codecov.io/gh/little2512/network-compression-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Browser Support](https://badges.aleen42.com/src/chrome.svg)](https://www.google.com/chrome/)
[![Browser Support](https://badges.aleen42.com/src/edge.svg)](https://www.microsoft.com/edge/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/network-compression-utils)](https://bundlephobia.com/result?p=network-compression-utils)

A JavaScript library for intelligent network-aware data compression that automatically adapts compression behavior based on real network performance and browser capabilities.

## ✨ Key Features

- **🚀 Performance-Based Compression**: Real-time network performance analysis with 1ms transmission time thresholds
- **Network Detection**: Automatically detects network conditions using Network Information API
- **Weak Network Optimization**: Special handling for extremely slow connections (<5 Kbps) with three-tier detection
- **Dynamic Thresholds**: Adaptive compression thresholds based on actual transmission performance, not just network labels
- **Smart Compression Decisions**: AI-powered compression analysis considering data size, network speed, and transmission time
- **Real-Time Speed Testing**: Built-in network speed measurement with concurrent requests and jitter analysis
- **String-Only Output**: Optimized for JSON/object to string compression scenarios with multiple format support
- **Browser Compatibility**: Works across all modern browsers with automatic polyfills and graceful fallbacks
- **Performance Monitoring**: Comprehensive compression statistics and performance metrics
- **Configurable**: Flexible configuration system with mobile/desktop optimization profiles

## Installation

### NPM
```bash
npm install network-compression-utils
```

### CDN
```html
<script src="https://unpkg.com/network-compression-utils/dist/index.umd.js"></script>
```

## Quick Start

```javascript
import NetworkCompressionUtils from 'network-compression-utils';

// Initialize with default configuration
const ncu = new NetworkCompressionUtils();

// Compress data automatically based on network conditions
const result = ncu.compress({
  data: {
    user: 'john',
    email: 'john@example.com',
    preferences: { theme: 'dark', notifications: true }
  }
});

console.log(result);
// {
//   compressed: true,
//   data: "compressed_string_data",
//   originalSize: 156,
//   compressedSize: 89,
//   compressionRatio: 0.43,
//   networkType: '4g',
//   outputFormat: 'string',
//   algorithm: 'LZ-String',
//   processingTime: 12.5
// }
```

## API Reference

### Constructor

```javascript
const ncu = new NetworkCompressionUtils(config);
```

#### Configuration Options

```javascript
const config = {
  // Updated default thresholds for real-world weak networks
  thresholds: {
    'slow-2g': 50,    // bytes - more aggressive for real weak networks
    '2g': 300,        // bytes - proactive compression
    '3g': 600,        // bytes - more responsive
    '4g': 1800        // bytes - slight adjustment for better performance
  },
  defaultFormat: 'string',        // 'string' - optimized for JSON/object compression (only format supported)
  enableAutoCompression: true,
  maxCompressionSize: 1048576,     // 1MB max size for compression
  compressionTimeout: 5000,        // 5 second timeout
  preferSmallest: true,
  enableLogging: false,

  // 🚀 NEW: Performance-based compression settings
  performanceOptimization: {
    enabled: true,                    // Enable performance-based compression
    performanceThreshold: 1,         // 1ms performance threshold
    speedTestInterval: 30000,        // Test actual speed every 30 seconds
    minSpeedTestSamples: 3,          // Minimum samples for speed estimation
    aggressiveModeThreshold: 5,      // Enable aggressive mode if speed < 5 Kbps
  }
};
```

### Main Methods

#### `compress(options)`

Compress data based on network conditions and return in specified format.

```javascript
const result = ncu.compress({
  data: any,                    // Data to compress
  config?: Partial<Config>,     // Override configuration
  networkType?: 'slow-2g' | '2g' | '3g' | '4g',  // Force network type
  forceCompression?: boolean    // Force compression regardless of conditions
});
```

#### `getNetworkInfo()`

Get current network information.

```javascript
const networkInfo = ncu.getNetworkInfo();
// {
//   effectiveType: '4g',
//   downlink: 10,
//   rtt: 50,
//   saveData: false,
//   type: 'cellular',  // Additional connection type info
//   quality: 85        // Network quality score (0-100)
// }
```

#### `getPerformanceAnalysis(dataSize, networkType?)`

Get detailed performance analysis for compression decisions based on real network data.

```javascript
const analysis = ncu.getPerformanceAnalysis(4096, '4g');
// {
//   shouldCompress: true,
//   estimatedTransmissionTime: 3.28,
//   compressionBenefit: 1.64,
//   recommendation: "PERFORMANCE: Transmission will take 3.28ms, exceeding 1ms threshold...",
//   metrics: {
//     dataSize: 4096,
//     networkType: '4g',
//     dynamicThreshold: 512,
//     usePerformanceOptimization: true,
//     performanceThreshold: 1
//   }
// }
```

#### `getNetworkPerformanceStatus()`

Get current network performance status with real speed measurements and weak network detection.

```javascript
const perfStatus = ncu.getNetworkPerformanceStatus();
// {
//   hasPerformanceData: true,
//   averageSpeedKbps: 1250.5,
//   sampleCount: 15,
//   weakNetworkCondition: null,  // 'very-slow', 'extremely-slow', 'critical' or null
//   lastSpeedTest: 1640995200000,
//   performanceThreshold: 1,
//   speedTestSummary: {
//     testCount: 10,
//     averageSpeed: 1250.5,
//     qualityDistribution: {
//       excellent: 6, good: 3, poor: 1
//     }
//   },
//   networkInfo: { effectiveType: '4g', downlink: 10, quality: 85 }
// }
```

#### `updateNetworkSpeed(options?)`

Force update network speed measurement with concurrent testing.

```javascript
const speedResult = await ncu.updateNetworkSpeed();
// {
//   success: true,
//   speedTestResult: {
//     speedKbps: 1500,
//     latency: 45,
//     jitter: 2.3,
//     packetLoss: 0.1,
//     quality: 'good'
//   },
//   performanceStatus: { hasPerformanceData: true, averageSpeedKbps: 1500 }
// }
```

#### `updateConfig(newConfig)`

Update configuration at runtime.

```javascript
const success = ncu.updateConfig({
  enableAutoCompression: false,
  thresholds: { '4g': 4096 }
});
```

### Browser Compatibility Methods

#### `getBrowserCompatibility()`

Get comprehensive browser compatibility report.

```javascript
const report = ncu.getBrowserCompatibility();
// {
//   browser: { name: 'Chrome', version: '91', userAgent: '...' },
//   features: { networkInformation: true, compressionStream: false, ... },
//   polyfills: ['urlSearchParams'],
//   recommendations: [...]
// }
```

#### `getBrowserSupport()`

Check browser support level.

```javascript
const support = ncu.getBrowserSupport();
// {
//   supported: true,
//   level: 'full',  // 'full', 'basic', 'unsupported'
//   missingRequired: [],
//   missingRecommended: ['compressionStream']
// }
```

## Advanced Usage

### Network Listeners

Monitor network changes in real-time:

```javascript
// Add network change listener
ncu.addNetworkListener((networkInfo) => {
  console.log('Network changed to:', networkInfo.effectiveType);
});

// Remove listener
ncu.removeNetworkListener(callback);
```

### Performance Testing

Test compression performance:

```javascript
// Test compression on sample data
const testResult = ncu.testCompression({
  message: "test",
  data: Array(1000).fill("sample data")
}, 100); // 100 iterations

console.log(testResult);
// { averageTime: 5.2, successRate: 1.0, averageRatio: 0.67 }

// Compare different algorithms
const comparison = ncu.compareAlgorithms(testData);
console.log(comparison);
```

### Format Conversion

The library focuses on string-based compression optimized for JSON/object data:

```javascript
// All compression outputs are in string format
const result = ncu.compress({
  data: {
    name: 'John',
    tags: ['developer', 'javascript']
  }
});

// Result contains compressed string data
console.log(result.data); // "compressed_string_data"

// For URL encoding, you can use standard browser APIs
const urlParams = new URLSearchParams({
  compressed: result.data,
  metadata: JSON.stringify({
    originalSize: result.originalSize,
    compressedSize: result.compressedSize
  })
});
```

## Browser Support

The library is optimized for and thoroughly tested on modern browsers:

- ✅ Chrome 61+ (Primary testing environment)
- ✅ Edge 79+ (CI tested)
- ✅ Safari 11+ (Compatible)
- ✅ Firefox 50+ (Compatible, manual testing)
- ✅ Internet Explorer 11+ (with polyfills)

**Note**: Our CI/CD pipeline focuses on Chrome and Edge for automated testing to ensure reliable and stable releases.

### Polyfills

The library automatically provides polyfills for:
- `URLSearchParams` (IE 11)
- `FormData` (older browsers)
- `Promise` (IE 11)
- `Performance API` (older browsers)

## Configuration Examples

### 🚀 Performance-Optimized Mobile Configuration

```javascript
const mobileNCU = new NetworkCompressionUtils({
  // More aggressive thresholds for mobile networks
  thresholds: {
    'slow-2g': 25,  // Very aggressive for 2G
    '2g': 150,       // Proactive compression
    '3g': 300,       // More responsive
    '4g': 1000       // Conservative but reasonable
  },

  // Performance optimization for mobile
  performanceOptimization: {
    enabled: true,
    performanceThreshold: 0.5,      // 0.5ms target for mobile
    aggressiveModeThreshold: 10,     // Earlier aggressive mode
    speedTestInterval: 15000,        // Test more frequently
  },

  defaultFormat: 'string',
  enableAutoCompression: true,
  maxCompressionSize: 5120,          // 5KB limit for mobile
  enableLogging: true                // Monitor mobile performance
});
```

### Performance-Optimized Desktop Configuration

```javascript
const desktopNCU = new NetworkCompressionUtils({
  // Conservative thresholds for desktop
  thresholds: {
    'slow-2g': 100,
    '2g': 500,
    '3g': 1000,
    '4g': 3000       // Higher threshold for desktop
  },

  // Performance optimization for desktop
  performanceOptimization: {
    enabled: true,
    performanceThreshold: 5,        // 5ms target for desktop
    aggressiveModeThreshold: 1,     // Only very slow networks
    speedTestInterval: 60000,        // Test less frequently
  },

  defaultFormat: 'string',
  enableAutoCompression: false,      // Conservative by default
  maxCompressionSize: 10240,         // 10KB limit for desktop
  enableLogging: false
});
```

### Real-World Weak Network Configuration

```javascript
const weakNetworkNCU = new NetworkCompressionUtils({
  // Extremely aggressive for very poor connections
  thresholds: {
    'slow-2g': 10,   // 10 bytes - compress almost everything
    '2g': 50,        // Very aggressive
    '3g': 200,       // Still aggressive
    '4g': 800        // Lower than default
  },

  // Maximum performance optimization
  performanceOptimization: {
    enabled: true,
    performanceThreshold: 0.1,     // 0.1ms - ultra aggressive
    aggressiveModeThreshold: 50,    // Detect weak networks earlier
    speedTestInterval: 10000,       // Test very frequently
    minSpeedTestSamples: 1,         // Respond quickly to changes
  },

  defaultFormat: 'string',
  enableAutoCompression: true,
  preferSmallest: true,             // Always choose smallest result
  maxCompressionSize: 5120,
  enableLogging: true
});
```

## Examples

### 🚀 Performance-Driven API Optimization

```javascript
// Intelligent API optimization with performance analysis
async function makeOptimizedApiRequest(data) {
  const ncu = new NetworkCompressionUtils({
    performanceOptimization: {
      enabled: true,
      performanceThreshold: 1
    }
  });

  // Get performance analysis before compression
  const analysis = ncu.getPerformanceAnalysis(JSON.stringify(data).length);
  console.log('Performance Analysis:', analysis.recommendation);

  // Compress with performance awareness
  const compressed = ncu.compress({
    data: data,
    outputFormat: 'string',
    forceCompression: analysis.shouldCompress
  });

  // Monitor transmission performance
  const startTime = performance.now();
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Compression-Info': JSON.stringify({
        compressed: compressed.compressed,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        networkType: compressed.networkType
      })
    },
    body: compressed.data
  });

  const transmissionTime = performance.now() - startTime;
  console.log(`Actual transmission time: ${transmissionTime.toFixed(2)}ms`);

  return response;
}
```

### 🚀 Real-Time Network Monitoring

```javascript
// Advanced network monitoring and adaptive behavior
class NetworkOptimizedApp {
  constructor() {
    this.ncu = new NetworkCompressionUtils({
      performanceOptimization: {
        enabled: true,
        speedTestInterval: 15000  // Test every 15 seconds
      },
      enableLogging: true
    });

    this.startNetworkMonitoring();
  }

  startNetworkMonitoring() {
    // Monitor network changes
    this.ncu.addNetworkListener((networkInfo) => {
      console.log('Network changed:', networkInfo);
      this.adaptToNetwork(networkInfo);
    });

    // Periodically update performance data
    setInterval(async () => {
      await this.ncu.updateNetworkSpeed();
      this.logPerformanceStatus();
    }, 30000);
  }

  adaptToNetwork(networkInfo) {
    const perfStatus = this.ncu.getNetworkPerformanceStatus();

    if (perfStatus.weakNetworkCondition) {
      console.log(`Weak network detected: ${perfStatus.weakNetworkCondition.name}`);
      // Enable aggressive mode
      this.enableUltraCompression();
    } else {
      // Normal mode
      this.enableNormalCompression();
    }
  }

  enableUltraCompression() {
    this.ncu.updateConfig({
      thresholds: {
        'slow-2g': 10,
        '2g': 50,
        '3g': 200,
        '4g': 500
      },
      preferSmallest: true
    });
  }

  logPerformanceStatus() {
    const status = this.ncu.getNetworkPerformanceStatus();
    console.log('Network Performance:', {
      speed: status.averageSpeedKbps,
      quality: status.weakNetworkCondition || 'good',
      samples: status.sampleCount
    });
  }
}

// Usage
const app = new NetworkOptimizedApp();
```

### 🚀 Smart Compression Decision Making

```javascript
// Smart compression based on data characteristics and network conditions
function smartCompress(data, options = {}) {
  const ncu = new NetworkCompressionUtils(options.config);

  // Analyze data characteristics
  const dataSize = JSON.stringify(data).length;
  const analysis = ncu.getPerformanceAnalysis(dataSize);

  // Smart decision making
  const compressionStrategy = {
    shouldCompress: analysis.shouldCompress,
    reason: analysis.recommendation,
    expectedSavings: analysis.compressionBenefit,
    networkOptimal: analysis.metrics.usePerformanceOptimization
  };

  console.log('Compression Strategy:', compressionStrategy);

  // Execute compression with strategy
  const result = ncu.compress({
    data: data,
    forceCompression: compressionStrategy.shouldCompress,
    outputFormat: 'string'
  });

  return {
    ...result,
    strategy: compressionStrategy,
    performanceAnalysis: analysis
  };
}

// Example usage
const largeObject = {
  // ... large data object
};

const compressionResult = smartCompress(largeObject, {
  config: {
    performanceOptimization: {
      performanceThreshold: 0.5  // Ultra-fast for mobile
    }
  }
});
```

### Form Data Optimization

```javascript
// Optimizing form submissions
function optimizeForm(form) {
  const formData = new FormData(form);
  const ncu = new NetworkCompressionUtils();

  // Convert form data to object for compression
  const data = {};
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }

  const result = ncu.compress({
    data: data
  });

  // Result contains compressed string data
  return result.data; // Compressed string that can be sent in requests
}

// Usage in fetch requests
async function submitCompressedForm(form) {
  const compressedData = optimizeForm(form);

  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Compression-Info': JSON.stringify({
        compressed: true,
        format: 'string'
      })
    },
    body: JSON.stringify({
      data: compressedData
    })
  });

  return response;
}
```

## Performance Metrics

Monitor library performance:

```javascript
// Get compression statistics
const stats = ncu.getCompressionStats();
// {
//   totalCompressions: 45,
//   successfulCompressions: 42,
//   averageCompressionTime: 8.3,
//   spaceSaved: 15420,
//   successRate: 0.93
// }

// Get system status
const status = ncu.getSystemStatus();
// {
//   network: { type: '4g', quality: 85, connected: true },
//   configuration: { autoCompressionEnabled: true, isValid: true },
//   compression: { totalOperations: 45, successRate: 0.93 },
//   formats: { supported: ['string'] }
// }
```

### 🚀 Performance-Based Compression Methods

#### `getPerformanceAnalysis(dataSize, networkType?)`

Get detailed performance analysis for compression decisions.

```javascript
const analysis = ncu.getPerformanceAnalysis(4096, '4g');
// {
//   shouldCompress: true,
//   estimatedTransmissionTime: 3.28,
//   compressionBenefit: 1.64,
//   recommendation: "PERFORMANCE: Transmission will take 3.28ms, exceeding 1ms threshold...",
//   metrics: {
//     dataSize: 4096,
//     networkType: '4g',
//     dynamicThreshold: 512,
//     usePerformanceOptimization: true
//   }
// }
```

#### `getNetworkPerformanceStatus()`

Get current network performance status with real speed data.

```javascript
const perfStatus = ncu.getNetworkPerformanceStatus();
// {
//   hasPerformanceData: true,
//   averageSpeedKbps: 1250.5,
//   sampleCount: 15,
//   weakNetworkCondition: null,
//   lastSpeedTest: 1640995200000,
//   performanceThreshold: 1,
//   speedTestSummary: { testCount: 10, averageSpeed: 1250.5, qualityDistribution: {...} },
//   networkInfo: { effectiveType: '4g', downlink: 10 }
// }
```

#### `updateNetworkSpeed(options?)`

Force update network speed measurement.

```javascript
const speedResult = await ncu.updateNetworkSpeed();
// {
//   success: true,
//   speedTestResult: { speedKbps: 1500, latency: 45, quality: 'good' },
//   performanceStatus: { hasPerformanceData: true, averageSpeedKbps: 1500 }
// }
```

## Advanced Usage

### Performance-Optimized Configuration

```javascript
const ncu = new NetworkCompressionUtils({
  // Enable performance-based compression
  performanceOptimization: {
    enabled: true,
    performanceThreshold: 1,        // 1ms performance target
    speedTestInterval: 30000,       // Test speed every 30 seconds
    aggressiveModeThreshold: 5,     // Aggressive mode for <5 Kbps
    minSpeedTestSamples: 3
  },

  // Optimized thresholds for real-world weak networks
  thresholds: {
    'slow-2g': 50,  // Reduced from 100 - more aggressive
    '2g': 300,      // Reduced from 500 - proactive compression
    '3g': 600,      // Reduced from 700 - more responsive
    '4g': 1800      // Reduced from 2048 - slight adjustment
  },

  enableLogging: true
});
```

### Real-World Weak Network Scenarios

The library automatically detects and handles extreme network conditions:

```javascript
// Example: Extremely slow network (0.5 Kbps)
ncu.performanceAnalyzer.addSpeedSample({
  speedKbps: 0.5,
  timestamp: Date.now()
});

// Automatically triggers aggressive compression
const result = ncu.compress({ data: largeObject });
// Will compress even small data due to critical network conditions

// Get detailed analysis
const analysis = ncu.getPerformanceAnalysis(dataSize);
console.log(analysis.recommendation);
// "CRITICAL: Transmission will take 65.54ms (0.004 Mbps). Compression recommended..."
```

### Mobile vs Desktop Optimization

```javascript
// Mobile-optimized (more aggressive)
const mobileNCU = new NetworkCompressionUtils({
  performanceOptimization: {
    performanceThreshold: 0.5,      // 0.5ms target for mobile
    aggressiveModeThreshold: 10,     // Earlier aggressive mode
  },
  thresholds: {
    'slow-2g': 25,  // Very aggressive
    '2g': 150,
    '3g': 300,
    '4g': 1000
  }
});

// Desktop-optimized (more conservative)
const desktopNCU = new NetworkCompressionUtils({
  performanceOptimization: {
    performanceThreshold: 5,        // 5ms target for desktop
    aggressiveModeThreshold: 1,     // Only very slow networks
  },
  thresholds: {
    'slow-2g': 100,
    '2g': 500,
    '3g': 1000,
    '4g': 3000
  }
});
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Development mode with watch
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### v1.0.3 🔧 CI/CD Optimization
- **IMPROVED**: Simplified GitHub Actions workflow to focus on browser testing
- **IMPROVED**: Removed unstable Firefox testing from CI to improve reliability
- **FIXED**: Fixed npm publish syntax error in GitHub Actions
- **OPTIMIZED**: Reduced CI execution time by removing unnecessary multi-node testing
- **MAINTAINED**: Continued comprehensive browser testing with Chrome and Edge
- **UPDATED**: Added npm version badge and CI status indicators to README

### v1.0.2 🚀 Production Release
- **NEW**: Real-time network performance analysis with 1ms transmission time thresholds
- **NEW**: Intelligent weak network detection with three-tier classification (very-slow, extremely-slow, critical)
- **NEW**: Dynamic compression thresholds based on actual network performance, not just network types
- **NEW**: Built-in network speed testing with concurrent requests and jitter analysis
- **ENHANCED**: Updated default compression thresholds for real-world weak networks
  - slow-2g: 50 bytes (reduced from 100)
  - 2g: 300 bytes (reduced from 500)
  - 3g: 600 bytes (reduced from 700)
  - 4g: 1800 bytes (reduced from 2048)
- **ENHANCED**: Performance optimization configuration system
- **ENHANCED**: Mobile and desktop optimization profiles
- **ENHANCED**: String-only output format optimized for JSON/object compression
- **ENHANCED**: Simplified API with automatic format selection
- **IMPROVED**: 100% test coverage (47 tests, 0 failures)
- **IMPROVED**: Better browser compatibility and polyfill management
- **FIXED**: Corrected API method names and return types for consistency
- **FIXED**: Updated documentation to match actual implementation

### v1.0.0
- Initial release
- Network-aware compression
- Multiple output format support
- Browser compatibility layer
- Performance monitoring
- Comprehensive test suite