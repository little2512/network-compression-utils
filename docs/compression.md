# Data Compression

This document describes the data compression functionality implemented in Stage 4.

## Overview

The `CompressionManager` class provides comprehensive data compression capabilities using multiple algorithms. It handles various data types, provides detailed compression statistics, and integrates seamlessly with the network detection and configuration management systems.

## Features

### Compression Algorithms

#### LZ-String
- **Type**: String-based compression using LZ-77 algorithm
- **Best for**: Text data, JSON objects, repetitive strings
- **Advantages**: Good compression ratio, fast compression/decompression
- **Browser Support**: Universal (pure JavaScript implementation)

#### None (No Compression)
- **Type**: No compression applied
- **Use Case**: When compression overhead exceeds benefits
- **Advantages**: Zero processing overhead
- **Fallback**: Automatically used when compression is not beneficial

### Smart Compression Logic

The compression manager includes intelligent heuristics:

1. **Size Thresholds**: Doesn't compress very small data (< 50 bytes)
2. **Compression Ratio**: Only uses compression if it provides meaningful benefits
3. **Content Analysis**: Detects already-compressed data to avoid double compression
4. **Performance Optimization**: Balances compression ratio with processing time

### Data Type Support

- **Strings**: Direct compression with no serialization overhead
- **Objects**: JSON serialization before compression
- **Arrays**: JSON serialization before compression
- **Numbers**: Converted to string for processing
- **Mixed Data**: Automatic type detection and handling

## API Reference

### Constructor

```javascript
const manager = new CompressionManager(config);
```

Creates a new compression manager with optional configuration.

### Core Methods

#### `compress(data: any): CompressionResult`
Compresses data using the configured algorithm.

#### `decompress(compressedData: string, algorithm?: string): any`
Decompresses data using the specified algorithm.

#### `shouldCompress(data: any): boolean`
Analyzes data and determines if compression would be beneficial.

### Configuration

#### `updateConfig(newConfig: Object): void`
Updates compression configuration.

#### `getConfig(): Object`
Returns current compression configuration.

### Performance Testing

#### `testCompression(sampleData: any, iterations?: number): Object`
Tests compression performance on sample data.

#### `compareAlgorithms(testData: any): Object`
Compares performance of different compression algorithms.

### Statistics

#### `getCompressionStats(): Object`
Returns detailed compression statistics.

#### `resetStats(): void`
Resets compression statistics.

## Usage Examples

### Basic Compression

```javascript
import { CompressionManager } from 'network-compression-utils';

const manager = new CompressionManager();

// Compress a string
const text = 'This is a sample text that will be compressed '.repeat(50);
const result = manager.compress(text);

console.log('Original size:', result.originalSize, 'bytes');
console.log('Compressed size:', result.compressedSize, 'bytes');
console.log('Compression ratio:', (result.compressionRatio * 100).toFixed(1) + '%');
console.log('Algorithm:', result.algorithm);

if (result.success) {
  const decompressed = manager.decompress(result.data, result.algorithm);
  console.log('Decompressed matches original:', decompressed === text);
}
```

### Object Compression

```javascript
const manager = new CompressionManager();

const largeObject = {
  users: new Array(100).fill().map((_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    profile: {
      bio: `This is user ${i}'s biography with detailed information`,
      interests: ['coding', 'music', 'travel'].slice(0, Math.random() * 3 + 1)
    }
  })),
  metadata: {
    version: '1.0.0',
    created: new Date().toISOString(),
    totalRecords: 100
  }
};

const result = manager.compress(largeObject);

if (result.success) {
  const compressedString = result.data; // Can be stored or transmitted
  const decompressed = manager.decompress(compressedString, result.algorithm);

  console.log('Compression saved:', result.originalSize - result.compressedSize, 'bytes');
}
```

### Algorithm Selection

```javascript
const manager = new CompressionManager({
  algorithm: 'lz-string',
  minCompressionRatio: 0.2, // Require at least 20% compression
  preferSmallest: true,     // Always return smaller result
  enableFallback: true       // Fall back to original if compression fails
});

const data = { message: 'Hello, compression test!'.repeat(100) };
const result = manager.compress(data);

if (result.success) {
  console.log(`Successfully compressed with ${result.algorithm}`);
} else {
  console.log('Compression not beneficial, using original data');
}
```

### Performance Testing

```javascript
const manager = new CompressionManager();

// Test compression performance
const testData = {
  items: new Array(500).fill().map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`.repeat(10)
  }))
};

const performanceTest = manager.testCompression(testData, 20);
console.log('Average compression ratio:', (performanceTest.averageCompressionRatio * 100).toFixed(1) + '%');
console.log('Average compression time:', performanceTest.averageCompressionTime.toFixed(2) + 'ms');
console.log('Success rate:', (performanceTest.successRate * 100).toFixed(1) + '%');

// Compare algorithms
const comparison = manager.compareAlgorithms(testData);
Object.entries(comparison).forEach(([algorithm, results]) => {
  console.log(`${algorithm}: ${(results.averageCompressionRatio * 100).toFixed(1)}% compression, ${results.averageCompressionTime.toFixed(2)}ms average`);
});
```

### Statistics Monitoring

```javascript
const manager = new CompressionManager();

// Perform various compressions
manager.compress({ data: 'test1'.repeat(100) });
manager.compress({ data: 'test2'.repeat(200) });
manager.compress('Simple string data');

// Get comprehensive statistics
const stats = manager.getCompressionStats();
console.log('Total compressions:', stats.totalCompressions);
console.log('Success rate:', (stats.successRate * 100).toFixed(1) + '%');
console.log('Total space saved:', manager.formatBytes(stats.spaceSaved));
console.log('Average compression time:', stats.averageCompressionTime.toFixed(2) + 'ms');
console.log('Overall compression ratio:', (stats.overallCompressionRatio * 100).toFixed(1) + '%');
```

## Configuration Options

### Default Configuration

```javascript
{
  algorithm: 'lz-string',           // Compression algorithm to use
  timeout: 5000,                    // Maximum compression time (ms)
  minCompressionRatio: 0.1,         // Minimum compression ratio (10%)
  enableFallback: true,             // Fall back to original data on failure
  preferSmallest: true,             // Always return smaller of compressed/original
}
```

### Algorithm Selection

```javascript
const config = {
  algorithm: 'lz-string',  // or 'none'
};

const manager = new CompressionManager(config);
```

### Performance Tuning

```javascript
const performanceConfig = {
  minCompressionRatio: 0.15,  // Require 15% compression minimum
  timeout: 3000,              // 3 second timeout
  preferSmallest: true,       // Always prefer smaller result
};

const manager = new CompressionManager(performanceConfig);
```

## Compression Result Structure

```javascript
{
  success: true,                    // Whether compression was applied
  data: "compressed-string-data",  // Result data (compressed or original)
  originalSize: 2048,             // Original data size in bytes
  compressedSize: 512,            // Compressed data size in bytes
  compressionRatio: 0.75,         // Compression ratio (0-1, lower is better)
  compressionTime: 15.2,          // Time taken in milliseconds
  algorithm: 'lz-string',        // Algorithm used
  error: null                      // Error message if compression failed
}
```

## Integration with Other Systems

### With Network Detection

```javascript
import { NetworkDetector, CompressionManager, ConfigManager } from 'network-compression-utils';

const detector = new NetworkDetector();
const compressionManager = new CompressionManager();
const configManager = new ConfigManager();

// Get current network information
const networkInfo = detector.getNetworkInfo();

// Check if data should be compressed based on network
const data = { large: 'dataset'.repeat(100) };
const dataSize = JSON.stringify(data).length;
const shouldCompress = configManager.shouldCompressData(dataSize, networkInfo.effectiveType);

if (shouldCompress) {
  const result = compressionManager.compress(data);
  console.log(`Compressed for ${networkInfo.effectiveType} network`);
} else {
  console.log('Network is fast enough, no compression needed');
}
```

### With Configuration Management

```javascript
import { ConfigManager, CompressionManager } from 'network-compression-utils';

const config = new ConfigManager({
  thresholds: {
    'slow-2g': 50,    // Compress data > 50 bytes on very slow networks
    '2g': 200,        // Compress data > 200 bytes on 2g
    '3g': 800,        // Compress data > 800 bytes on 3g
    '4g': 2000,       // Compress data > 2KB on 4g
  }
});

const compressionManager = new CompressionManager();

// Network-aware compression decision
function shouldCompressForNetwork(dataSize, networkType) {
  return config.shouldCompressData(dataSize, networkType);
}
```

## Performance Considerations

### Memory Usage
- Compression manager maintains minimal internal state
- Large data is processed in chunks when possible
- Statistics are kept as simple numeric values

### Processing Time
- LZ-String compression is fast for most text data
- Algorithm selection impacts performance significantly
- Timeout protection prevents hanging on problematic data

### Compression Ratio
- Text and JSON typically achieve 30-70% compression
- Already compressed data (images, videos) won't benefit
- Small data may actually increase in size

### Optimization Tips
1. **Data Size**: Avoid compressing very small data (< 100 bytes)
2. **Content Type**: Skip compression for binary media (images, videos)
3. **Network Speed**: Only compress on slower network connections
4. **CPU Performance**: Consider device capabilities for compression

## Browser Compatibility

### Supported Browsers
- **Chrome**: All versions (pure JavaScript implementation)
- **Firefox**: All versions
- **Safari**: All versions
- **Edge**: All versions
- **Mobile Browsers**: iOS Safari, Android Chrome

### Performance Characteristics
- **Desktop**: Excellent compression performance
- **Mobile**: Good performance, may need timeout adjustments
- **Low-end Devices**: Consider higher thresholds for compression

## Error Handling

### Common Error Scenarios

```javascript
const manager = new CompressionManager({
  enableFallback: true  // Return original data on compression failure
});

try {
  const result = manager.compress(problematicData);

  if (!result.success) {
    console.log('Compression failed:', result.error);
    console.log('Using original data instead');
  }
} catch (error) {
  console.log('Critical compression error:', error.message);
}
```

### Fallback Strategies

1. **Algorithm Fallback**: Try different algorithms if primary fails
2. **Size Fallback**: Return original data if compression increases size
3. **Timeout Fallback**: Abort compression if it takes too long
4. **Data Fallback**: Handle serialization errors gracefully

## Testing and Validation

### Unit Testing
- Comprehensive test coverage in `src/compression-manager.test.js`
- Tests for all algorithms and edge cases
- Performance and memory leak testing

### Integration Testing
- Integration with network detection and configuration systems
- Real-world data scenarios and usage patterns
- Cross-browser compatibility testing

### Manual Testing
- Interactive demo in `examples/compression-demo.html`
- Performance comparison tools
- Real-time compression statistics

## Best Practices

### When to Compress
1. **Network Conditions**: On slow or metered connections
2. **Data Size**: For data larger than network thresholds
3. **Data Type**: Text, JSON, and structured data benefit most
4. **Frequency**: For frequently transmitted data

### When NOT to Compress
1. **Small Data**: Data smaller than compression overhead
2. **Already Compressed**: Images, videos, zip files
3. **Fast Networks**: When network bandwidth is plentiful
4. **Real-time Requirements**: When latency is critical

### Configuration Recommendations

```javascript
// Mobile/Slow Network Configuration
const mobileConfig = {
  thresholds: { 'slow-2g': 50, '2g': 200, '3g': 500, '4g': 1000 },
  compression: { minCompressionRatio: 0.1, preferSmallest: true }
};

// Desktop/Fast Network Configuration
const desktopConfig = {
  thresholds: { 'slow-2g': 500, '2g': 1000, '3g': 2000, '4g': 5000 },
  compression: { minCompressionRatio: 0.2, timeout: 3000 }
};
```