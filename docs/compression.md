# Data Compression

This document describes the network-aware data compression functionality implemented in the library.

## Overview

The `NetworkCompressionUtils` class provides intelligent data compression with network-aware decision making. It automatically determines when to compress data based on network conditions, data characteristics, and performance thresholds. The library focuses on optimizing data transmission for real-world network scenarios.

## Features

### Network-Aware Compression

The library automatically adapts compression behavior based on network conditions:

- **4G Networks**: Compression threshold ~1KB data
- **3G Networks**: Compression threshold ~512 bytes
- **2G Networks**: Compression threshold ~256 bytes
- **Slow-2G Networks**: Ultra-aggressive compression for <50 byte data
- **Weak Networks** (<5 Kbps): Specialized optimization for very slow connections

### Smart Compression Logic

The compression system includes intelligent heuristics:

1. **Performance Thresholds**: Compression must save >1ms transmission time
2. **Network Analysis**: Real-time network speed and latency assessment
3. **Content Analysis**: Detects data that benefits from compression
4. **Dynamic Thresholds**: Adjusts based on current network conditions

### Algorithm Support

#### LZ-String (Default)
- **Type**: String-based compression using LZ-77 algorithm
- **Best for**: Text data, JSON objects, repetitive strings
- **Performance**: Good balance of compression ratio and speed
- **Browser Support**: Universal with polyfill support

## API Reference

### Core Method

#### `compress(options): CompressionResult`
Intelligently compresses data based on network conditions and performance analysis.

**Options Object:**
```javascript
{
  data: any,                    // Data to compress (required)
  forceCompression: boolean,    // Override network detection (optional)
  networkType: string,         // Override network type (optional)
  algorithm: string            // Override algorithm selection (optional)
}
```

**Returns:**
```javascript
{
  compressed: boolean,          // Whether compression was applied
  data: string,                // Result data (always string format)
  originalSize: number,        // Original data size in bytes
  compressedSize?: number,     // Compressed size if compressed
  compressionRatio?: number,   // Compression ratio if compressed
  algorithm: string,          // Algorithm used ('LZ-String' or 'none')
  networkType: string,        // Detected network type
  processingTime: number      // Processing time in milliseconds
}
```

### Network Analysis Methods

#### `getNetworkInfo(): NetworkInfo`
Returns current network connection information.

```javascript
{
  effectiveType: string,      // '4g', '3g', '2g', 'slow-2g'
  downlink: number,          // Downlink speed in Mbps
  rtt: number,              // Round-trip time in ms
  saveData: boolean         // Data saver mode
}
```

#### `getNetworkPerformanceStatus(): PerformanceStatus`
Returns detailed network performance analysis.

```javascript
{
  currentSpeed: string,           // Current network category
  speedCategory: string,          // 'slow', 'moderate', 'fast'
  isOptimalForCompression: boolean,
  recommendation: string          // Optimization recommendations
}
```

### Configuration Methods

#### `updateConfig(config): void`
Updates compression and performance settings.

**Configuration Options:**
```javascript
{
  minCompressionRatio: number,    // Minimum compression ratio (default: 0.1)
  enableFallback: boolean,        // Enable fallback on errors (default: true)
  preferSmallest: boolean,        // Always prefer smaller result (default: true)
  performanceThreshold: number    // Transmission time threshold in ms (default: 1)
}
```

#### `getConfig(): Object`
Returns current configuration settings.

#### `getConfigSummary(): string`
Returns human-readable configuration summary.

### Performance Analysis

#### `getCompressionStats(): CompressionStats`
Returns detailed compression statistics.

```javascript
{
  totalCompressions: number,
  successfulCompressions: number,
  totalDataProcessed: number,
  totalDataSaved: number,
  averageCompressionRatio: number,
  averageProcessingTime: number
}
```

#### `getPerformanceAnalysis(): PerformanceAnalysis`
Returns comprehensive performance analysis including algorithm performance, network type performance, compression thresholds, and optimization recommendations.

### Utility Methods

#### `getDataSize(data): number`
Calculates estimated data size in bytes.

#### `getSupportedFormats(): string[]`
Returns list of supported algorithms.

#### `getFormatInfo(algorithm): Object`
Returns information about specific algorithm.

## Usage Examples

### Basic Intelligent Compression

```javascript
import { NetworkCompressionUtils } from 'network-compression-utils';

const ncu = new NetworkCompressionUtils();

// Let library decide based on network conditions
const data = {
  user: 'John Doe',
  profile: 'Software engineer with extensive experience in web development'.repeat(10),
  skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  projects: Array(50).fill().map((_, i) => ({
    id: i,
    name: `Project ${i}`,
    description: `Project ${i} description with detailed information`.repeat(5)
  }))
};

const result = ncu.compress({ data });

console.log('Compressed:', result.compressed);
console.log('Algorithm:', result.algorithm);
console.log('Network type:', result.networkType);
console.log('Processing time:', result.processingTime + 'ms');

if (result.compressed) {
  const savings = result.originalSize - result.compressedSize;
  console.log(`Space saved: ${savings} bytes (${(result.compressionRatio * 100).toFixed(1)}%)`);
}
```

### Force Compression

```javascript
// Force compression even for small data
const smallData = { message: 'Hello World' };
const result = ncu.compress({
  data: smallData,
  forceCompression: true
});

console.log('Force compressed:', result.compressed);
console.log('Result data type:', typeof result.data); // 'string'
```

### Network Type Override

```javascript
// Test compression behavior with different network types
const testData = { data: 'Large text content '.repeat(100) };

// Simulate slow network
const slowResult = ncu.compress({
  data: testData,
  networkType: '2g'
});

// Simulate fast network
const fastResult = ncu.compress({
  data: testData,
  networkType: '4g'
});

console.log('2G compression:', slowResult.compressed);
console.log('4G compression:', fastResult.compressed);
```

### Network Performance Analysis

```javascript
// Get current network information
const networkInfo = ncu.getNetworkInfo();
console.log('Network:', networkInfo.effectiveType);
console.log('Downlink:', networkInfo.downlink + 'Mbps');
console.log('RTT:', networkInfo.rtt + 'ms');

// Get network performance status
const perfStatus = ncu.getNetworkPerformanceStatus();
console.log('Performance status:', perfStatus.speedCategory);
console.log('Optimal for compression:', perfStatus.isOptimalForCompression);
console.log('Recommendation:', perfStatus.recommendation);
```

### Configuration Management

```javascript
// Configure for mobile optimization
ncu.updateConfig({
  minCompressionRatio: 0.2,        // Require 20% compression minimum
  enableFallback: true,           // Enable graceful fallback
  preferSmallest: true,           // Always use smaller result
  performanceThreshold: 2         // 2ms transmission time threshold
});

// Check configuration
const config = ncu.getConfig();
console.log('Min compression ratio:', config.minCompressionRatio);

// Get human-readable summary
const summary = ncu.getConfigSummary();
console.log('Configuration:', summary);
```

### Performance Monitoring

```javascript
// Perform multiple compressions
for (let i = 0; i < 10; i++) {
  const data = {
    id: i,
    content: `Sample content ${i} `.repeat(100)
  };
  ncu.compress({ data });
}

// Get compression statistics
const stats = ncu.getCompressionStats();
console.log('Total compressions:', stats.totalCompressions);
console.log('Success rate:', (stats.successfulCompressions / stats.totalCompressions * 100).toFixed(1) + '%');
console.log('Total data processed:', stats.totalDataProcessed + ' bytes');
console.log('Total space saved:', stats.totalDataSaved + ' bytes');
console.log('Average compression ratio:', (stats.averageCompressionRatio * 100).toFixed(1) + '%');
console.log('Average processing time:', stats.averageProcessingTime.toFixed(2) + 'ms');

// Get detailed performance analysis
const analysis = ncu.getPerformanceAnalysis();
console.log('Algorithm performance:', analysis.algorithmPerformance);
console.log('Network performance:', analysis.networkTypePerformance);
console.log('Recommendations:', analysis.recommendations);
```

### Weak Network Optimization

```javascript
// Test weak network handling (<5 Kbps)
const criticalData = {
  emergency: true,
  message: 'Critical system alert',
  timestamp: Date.now(),
  details: 'Critical system failure requires immediate attention'.repeat(20)
};

// Simulate very weak network
const weakResult = ncu.compress({
  data: criticalData,
  networkType: 'slow-2g'
});

console.log('Weak network compression:', weakResult.compressed);
console.log('Ultra-aggressive optimization applied for <5 Kbps networks');
```

### Error Handling

```javascript
// Handle circular references
const circularData = { name: 'test' };
circularData.self = circularData;

const result = ncu.compress({ data: circularData });
console.log('Circular data handled gracefully:', !result.compressed);
console.log('Data type:', typeof result.data); // 'string'

// Handle incompatible data types
const weirdData = new Map();
weirdData.set('key', 'value');

const weirdResult = ncu.compress({ data: weirdData });
console.log('Weird data handled:', weirdResult.compressed !== undefined);

// Get browser compatibility
const compat = ncu.getBrowserCompatibility();
console.log('Compression support:', compat.hasCompressionSupport);
console.log('Network detection:', compat.hasNetworkSupport);
```

## Advanced Configuration

### Performance Tuning

```javascript
// High-performance configuration for fast networks
const highPerfConfig = {
  minCompressionRatio: 0.3,        // Require 30% compression
  performanceThreshold: 0.5,       // 0.5ms threshold
  preferSmallest: true
};

// Conservative configuration for slow networks
const conservativeConfig = {
  minCompressionRatio: 0.1,        // Only 10% compression required
  performanceThreshold: 5,         // 5ms threshold
  enableFallback: true
};

// Apply configuration based on network conditions
const networkInfo = ncu.getNetworkInfo();
if (networkInfo.effectiveType === '4g') {
  ncu.updateConfig(highPerfConfig);
} else {
  ncu.updateConfig(conservativeConfig);
}
```

### Algorithm Selection

```javascript
// Get available algorithms
const algorithms = ncu.getSupportedFormats();
console.log('Available algorithms:', algorithms); // ['LZ-String']

// Get algorithm information
const lzInfo = ncu.getFormatInfo('lzstring');
console.log('LZ-String info:', lzInfo.name, lzInfo.description);

// Force specific algorithm
const result = ncu.compress({
  data: largeData,
  algorithm: 'lzstring'
});
```

## Network Optimization Details

### Dynamic Thresholds

The library automatically adjusts compression thresholds based on:

1. **Network Speed**: Faster networks have higher thresholds
2. **Latency**: High latency networks favor compression
3. **Data Saver Mode**: Aggressive compression when enabled
4. **Historical Performance**: Learns from previous compressions

### Performance Calculation

```javascript
// The library uses this logic internally:
const transmissionTimeSavings = (originalSize - compressedSize) / networkSpeed;
const compressionOverhead = processingTime;
const netBenefit = transmissionTimeSavings - compressionOverhead;

// Compress only if netBenefit > performanceThreshold
```

### Real-Time Adaptation

```javascript
// Monitor network changes and adapt
function handleNetworkChange() {
  const perfStatus = ncu.getNetworkPerformanceStatus();

  if (perfStatus.recommendation === 'increase_compression') {
    ncu.updateConfig({ minCompressionRatio: 0.1 });
  } else if (perfStatus.recommendation === 'decrease_compression') {
    ncu.updateConfig({ minCompressionRatio: 0.3 });
  }
}

// Listen for network changes (if supported)
if ('connection' in navigator) {
  navigator.connection.addEventListener('change', handleNetworkChange);
}
```

## Integration Examples

### HTTP Requests with Network Awareness

```javascript
async function sendOptimizedData(data) {
  const ncu = new NetworkCompressionUtils();

  const result = ncu.compress({ data });

  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Network-Type': result.networkType,
      'X-Compressed': result.compressed.toString(),
      'X-Compression-Savings': result.compressed ?
        (result.compressionRatio * 100).toFixed(1) + '%' : '0%'
    },
    body: result.data
  });

  return response.json();
}
```

### WebSocket Real-Time Communication

```javascript
class OptimizedWebSocket {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.ncu = new NetworkCompressionUtils();
  }

  send(data) {
    const result = this.ncu.compress({ data });

    // Include compression metadata
    const metadata = {
      compressed: result.compressed,
      networkType: result.networkType,
      originalSize: result.originalSize
    };

    this.ws.send(JSON.stringify({
      metadata,
      payload: result.data
    }));
  }

  onMessage(callback) {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      callback(message.payload, message.metadata);
    };
  }
}
```

### Local Storage Optimization

```javascript
class OptimizedStorage {
  constructor() {
    this.ncu = new NetworkCompressionUtils();
  }

  setItem(key, data) {
    const result = this.ncu.compress({
      data,
      forceCompression: true
    });

    localStorage.setItem(key, JSON.stringify({
      compressed: result.compressed,
      algorithm: result.algorithm,
      data: result.data,
      timestamp: Date.now()
    }));
  }

  getItem(key) {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      // Note: Decompression would be handled by receiving end
      return parsed.data;
    }
    return null;
  }
}
```

## Performance Considerations

### Memory Usage
- Minimal internal state maintenance
- Efficient string processing
- Automatic garbage collection friendly

### Processing Time
- LZ-String compression: ~1-5ms for typical data
- Network detection: <1ms
- Performance analysis: <1ms

### Network Optimization
- Real-time network assessment
- Adaptive compression thresholds
- Performance-based decision making

### Best Practices

1. **Reuse Instances**: Create one NetworkCompressionUtils instance per application
2. **Let Network Detection Work**: Avoid manual network type overrides unless necessary
3. **Monitor Performance**: Regularly check compression statistics
4. **Handle Edge Cases**: Always check the `compressed` flag in results
5. **Test on Real Networks**: Validate performance under various network conditions

## Browser Compatibility

### Universal Support
- **Chrome**: v60+ (full support)
- **Firefox**: v55+ (full support)
- **Safari**: v12+ (full support)
- **Edge**: v79+ (full support)
- **Mobile**: iOS Safari 12+, Android Chrome 60+

### Polyfill Support
- Automatic LZ-String polyfill loading when needed
- Network API polyfills for older browsers
- Graceful degradation when APIs are unavailable

### Performance Characteristics
- **Desktop**: Excellent performance across all browsers
- **Mobile**: Good performance with automatic timeout adjustments
- **Low-end Devices**: Conservative compression thresholds applied

## Testing and Validation

### Comprehensive Test Suite
The library includes extensive tests covering:

- Network-aware compression behavior
- Performance analysis and statistics
- Error handling and edge cases
- Browser compatibility
- Integration scenarios

### Running Tests
```bash
npm test                    # Run all tests
npm run test:chrome        # Run in Chrome
npm run test:firefox       # Run in Firefox
npm run coverage           # Generate coverage report
```

### Manual Testing
Use the browser-based examples for real-world testing:

- `examples/network-aware-demo.html` - Network-aware compression demo
- `examples/performance-analysis.html` - Performance monitoring
- `examples/real-time-compression.html` - Real-time compression visualization