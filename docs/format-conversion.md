# String Output Format

This document describes the string-based output format implemented in the network compression library.

## Overview

The `NetworkCompressionUtils` class provides optimized string-based data compression, specifically designed for network transmission. The library focuses on string output format that integrates seamlessly with compression and network detection systems.

## Output Format

### String (JSON Format)
- **Use Case**: API responses, data storage, network transmission, general purpose
- **Browser Support**: Universal (native JSON support)
- **Encoding**: Plain text with optional compression
- **Size Limit**: Large (limited only by memory)
- **Best For**: Complex data structures, API communication, network optimization

## API Reference

### Core Method

#### `compress(options): CompressionResult`
Compresses data to optimized string format with network-aware decision making.

**Options:**
- `data` (any): The data to compress
- `forceCompression` (boolean): Force compression regardless of network conditions
- `networkType` (string): Override network type detection
- `algorithm` (string): Override algorithm selection

**Returns:**
```javascript
{
  compressed: boolean,
  data: string,           // Always string format
  originalSize: number,
  compressedSize?: number,
  compressionRatio?: number,
  algorithm: string,
  networkType: string,
  processingTime: number
}
```

### Utility Methods

#### `getDataSize(data): number`
Calculates the estimated size of data in bytes.

#### `recommendFormat(data): string`
Recommends the best compression approach for given data.

#### `getSupportedFormats(): string[]`
Returns list of supported compression algorithms.

## Usage Examples

### Basic Compression

```javascript
import { NetworkCompressionUtils } from 'network-compression-utils';

const ncu = new NetworkCompressionUtils();

// Compress data to string format
const data = {
  user: 'John',
  preferences: ['email', 'sms'],
  metadata: { timestamp: Date.now() }
};

const result = ncu.compress({ data });

console.log(result.data); // Compressed string
console.log(typeof result.data); // 'string'
console.log(result.compressed); // true/false based on compression decision
```

### Force Compression

```javascript
// Force compression even for small data
const result = ncu.compress({
  data: { message: 'Hello World' },
  forceCompression: true
});

console.log(result.compressed); // true
console.log(result.algorithm); // 'LZ-String'
```

### Network-Aware Compression

```javascript
// Override network type for testing
const slowResult = ncu.compress({
  data: largeDataObject,
  networkType: '2g'
});

const fastResult = ncu.compress({
  data: largeDataObject,
  networkType: '4g'
});

// Compression thresholds adapt to network conditions
```

## Compression Algorithms

### LZ-String (Default)
- **Use Case**: General purpose compression
- **Browser Support**: Universal with polyfill
- **Performance**: Good balance of speed and ratio
- **Best For**: Text data, JSON objects, repetitive content

### Algorithm Selection

The library automatically selects the best algorithm based on:

1. **Network Conditions**: Slower networks get more aggressive compression
2. **Data Characteristics**: Repetitive data compresses better
3. **Performance Thresholds**: Compression must save >1ms transmission time

```javascript
// Get available algorithms
const algorithms = ncu.getSupportedFormats();
console.log(algorithms); // ['LZ-String']

// Get algorithm information
const info = ncu.getFormatInfo('lzstring');
console.log(info.name); // 'LZ-String'
```

## Network Optimization

### Performance-Based Compression

The library uses intelligent compression based on network analysis:

```javascript
// Get current network information
const networkInfo = ncu.getNetworkInfo();
console.log(networkInfo);
// {
//   effectiveType: '4g',
//   downlink: 10,
//   rtt: 100,
//   saveData: false
// }

// Get network performance status
const perfStatus = ncu.getNetworkPerformanceStatus();
console.log(perfStatus);
// {
//   currentSpeed: '4g',
//   speedCategory: 'fast',
//   isOptimalForCompression: true,
//   recommendation: 'use_default_thresholds'
// }
```

### Weak Network Optimization

For slow connections (<5 Kbps), the library provides specialized optimization:

```javascript
// Simulate slow network
const result = ncu.compress({
  data: largeData,
  networkType: 'slow-2g'
});

// Library applies ultra-aggressive compression for very slow networks
```

## Data Size and Performance

### Size Calculation

```javascript
const data = {
  user: 'John',
  items: Array(100).fill('test data')
};

// Get estimated size
const size = ncu.getDataSize(data);
console.log(`Estimated size: ${size} bytes`);

// After compression
const result = ncu.compress({ data });
if (result.compressed) {
  const savings = result.originalSize - result.compressedSize;
  const ratio = (savings / result.originalSize * 100).toFixed(1);
  console.log(`Compression savings: ${savings} bytes (${ratio}%)`);
}
```

### Performance Metrics

```javascript
// Get compression statistics
const stats = ncu.getCompressionStats();
console.log(stats);
// {
//   totalCompressions: 150,
//   successfulCompressions: 120,
//   totalDataProcessed: 1024000,
//   totalDataSaved: 256000,
//   averageCompressionRatio: 0.25,
//   averageProcessingTime: 5.2
// }

// Get detailed performance analysis
const analysis = ncu.getPerformanceAnalysis();
console.log(analysis);
// {
//   algorithmPerformance: { 'LZ-String': { ... } },
//   networkTypePerformance: { '4g': { ... }, '3g': { ... } },
//   compressionThresholds: { '4g': 1024, '3g': 512, '2g': 256 },
//   recommendations: [...]
// }
```

## Configuration Management

### Custom Configuration

```javascript
// Update compression settings
ncu.updateConfig({
  minCompressionRatio: 0.3,        // Require 30% compression
  enableFallback: true,           // Enable fallback for errors
  preferSmallest: true,           // Always prefer smallest result
  performanceThreshold: 2         // 2ms transmission time threshold
});

// Get current configuration
const config = ncu.getConfig();
console.log(config);
// {
//   minCompressionRatio: 0.3,
//   enableFallback: true,
//   preferSmallest: true,
//   performanceThreshold: 2,
//   maxDataSize: 1048576,
//   // ... other settings
// }
```

### Configuration Summary

```javascript
// Get human-readable configuration summary
const summary = ncu.getConfigSummary();
console.log(summary);
// "Network-aware compression enabled: minRatio=30%, threshold=2ms, fallback=enabled"
```

## Error Handling

The library provides robust error handling:

```javascript
// Handle circular references
const circularData = { name: 'test' };
circularData.self = circularData;

const result = ncu.compress({ data: circularData });
console.log(result.compressed); // false
console.log(result.data); // Original data as string

// Handle invalid data
const invalidResult = ncu.compress({ data: null });
console.log(invalidResult); // Valid result object

// Get browser compatibility information
const compat = ncu.getBrowserCompatibility();
console.log(compat);
// {
//   hasCompressionSupport: true,
//   hasNetworkSupport: true,
//   polyfillsNeeded: []
// }
```

## Integration Examples

### HTTP Requests

```javascript
// Send compressed data via fetch
async function sendCompressedData(data) {
  const ncu = new NetworkCompressionUtils();
  const result = ncu.compress({ data });

  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Compressed': result.compressed.toString()
    },
    body: result.data // Always string
  });

  return response.json();
}
```

### WebSockets

```javascript
// Send compressed data via WebSocket
const ws = new WebSocket('ws://example.com/socket');
const ncu = new NetworkCompressionUtils();

ws.onopen = () => {
  const message = {
    type: 'update',
    payload: largeDataObject
  };

  const compressed = ncu.compress({ data: message });
  ws.send(compressed.data); // Send compressed string
};
```

### Local Storage

```javascript
// Store compressed data in localStorage
const ncu = new NetworkCompressionUtils();

function saveData(key, data) {
  const result = ncu.compress({ data, forceCompression: true });
  localStorage.setItem(key, result.data);
}

function loadData(key) {
  const compressed = localStorage.getItem(key);
  if (compressed) {
    // Decompression would be handled by the receiving end
    return JSON.parse(compressed);
  }
  return null;
}
```

## Browser Compatibility

### Universal Support
The library works in all modern browsers:

- **Chrome**: Full support (v60+)
- **Firefox**: Full support (v55+)
- **Safari**: Full support (v12+)
- **Edge**: Full support (v79+)
- **Mobile**: Full support on iOS Safari and Android Chrome

### Polyfill Support
The library includes necessary polyfills:

```javascript
// Check polyfill status
const polyfillStatus = ncu.getPolyfillStatus();
console.log(polyfillStatus);
// {
//   needsLZString: false, // Built-in support or polyfill loaded
//   needsNetworkAPI: false,
//   loadedPolyfills: []
// }
```

## Best Practices

### Performance Optimization

1. **Reuse Instances**
   ```javascript
   const ncu = new NetworkCompressionUtils(); // Create once, reuse
   ```

2. **Let Network Detection Work**
   ```javascript
   // Good: Let library detect network
   const result = ncu.compress({ data });

   // Avoid: Manual override unless necessary
   // const result = ncu.compress({ data, networkType: '4g' });
   ```

3. **Monitor Performance**
   ```javascript
   // Check compression effectiveness
   const stats = ncu.getCompressionStats();
   if (stats.averageCompressionRatio < 0.1) {
     // Consider adjusting data or configuration
   }
   ```

### Data Optimization

1. **Structure Data for Compression**
   ```javascript
   // Good: Repetitive data compresses well
   const goodData = {
     type: 'user_profile',
     items: Array(100).fill('similar_item'),
     metadata: { category: 'test_category' }
   };

   // Poor: Random data compresses poorly
   const poorData = {
     random1: Math.random(),
     random2: Math.random().toString(36)
   };
   ```

2. **Size Considerations**
   ```javascript
   // Check data size before compression
   const size = ncu.getDataSize(data);
   if (size > 1024 * 1024) { // > 1MB
     // Consider chunking large data
   }
   ```

### Error Prevention

1. **Validate Input**
   ```javascript
   function safeCompress(data) {
     try {
       return ncu.compress({ data });
     } catch (error) {
       console.error('Compression failed:', error);
       return {
         compressed: false,
         data: JSON.stringify(data),
         error: error.message
       };
     }
   }
   ```

2. **Handle Network Changes**
   ```javascript
   // React to network condition changes
   function handleNetworkChange() {
     const status = ncu.getNetworkPerformanceStatus();
     if (status.recommendation === 'increase_compression') {
       ncu.updateConfig({ minCompressionRatio: 0.2 });
     }
   }
   ```

## Testing

Comprehensive tests are provided in the test suite:

- **Basic Compression**: String format compression with various data types
- **Network Awareness**: Compression behavior under different network conditions
- **Performance Analysis**: Compression statistics and performance metrics
- **Error Handling**: Invalid data, circular references, edge cases
- **Browser Compatibility**: Cross-browser functionality testing
- **Integration**: Real-world usage scenarios

Run tests with:
```bash
npm test
```