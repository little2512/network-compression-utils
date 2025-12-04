# Configuration Management

This document describes the configuration management system implemented in Stage 3.

## Overview

The `ConfigManager` class provides comprehensive configuration management for network-based data compression. It handles user settings, validates configurations, and determines when compression should be applied based on network conditions and data size.

## Features

### Core Configuration Options

#### Network Thresholds
Define minimum data sizes for compression based on network type:
- **slow-2g**: 100 bytes (default) - Very slow connections
- **2g**: 500 bytes (default) - Slow connections
- **3g**: 1,024 bytes (default) - Medium connections
- **4g**: 2,048 bytes (default) - Fast connections

#### Output Formats
Supported data output formats:
- **urlsearch**: URLSearchParams format (default)
- **formdata**: FormData format for form submissions
- **string**: Plain string format

#### Compression Settings
- **enableAutoCompression**: Enable/disable automatic compression (default: true)
- **maxCompressionSize**: Maximum data size to attempt compression (default: 1MB)
- **compressionTimeout**: Compression operation timeout in milliseconds (default: 5000ms)
- **preferSmallest**: Always prefer smaller result between compressed and original (default: true)

#### Debug Options
- **enableLogging**: Enable debug logging for troubleshooting (default: false)

## API Reference

### Constructor

```javascript
const config = new ConfigManager(userConfig);
```

Creates a new configuration manager with optional user configuration that merges with defaults.

### Configuration Management

#### `getConfig(): CompressionConfig`
Returns current configuration object.

#### `updateConfig(newConfig: Partial<CompressionConfig>): boolean`
Updates configuration with new values. Returns `true` if successful, `false` if validation fails.

#### `resetToDefaults(): void`
Resets all configuration values to defaults.

#### `exportConfig(): string`
Exports current configuration as JSON string.

#### `importConfig(configJson: string): boolean`
Imports configuration from JSON string. Returns `true` if successful.

### Network Thresholds

#### `getThresholdForNetwork(networkType: string): number`
Gets compression threshold for specific network type.

#### `setNetworkThreshold(networkType: string, threshold: number): boolean`
Sets compression threshold for network type. Returns `true` if successful.

#### `getAllThresholds(): CompressionThresholds`
Returns all network thresholds as object.

### Compression Logic

#### `shouldCompressData(dataSize: number, networkType: string): boolean`
Determines if data should be compressed based on size, network type, and configuration.

#### `getOptimalFormat(requestedFormat: string, data?: any): string`
Returns the best output format to use based on user request and defaults.

### Utility Methods

#### `getConfigSummary(): Object`
Returns human-readable configuration summary.

#### `formatBytes(bytes: number): string`
Formats bytes to human-readable string (e.g., "1.5 KB").

#### `setLogging(enabled: boolean): void`
Enables or disables debug logging.

#### `getValidationErrors(): Array<string>`
Returns list of configuration validation errors.

#### `isValid(): boolean`
Returns `true` if configuration has no validation errors.

## Usage Examples

### Basic Configuration

```javascript
import { ConfigManager } from 'network-compression-utils';

// Create with defaults
const config = new ConfigManager();

// Create with custom configuration
const customConfig = new ConfigManager({
  thresholds: {
    'slow-2g': 50,    // Compress smaller data on very slow networks
    '4g': 4096,       // Only compress larger data on fast networks
  },
  defaultFormat: 'formdata',
  enableLogging: true,
});
```

### Network-Based Compression Logic

```javascript
const config = new ConfigManager();

// Check if data should be compressed
const dataSize = 1500; // bytes
const networkType = '3g';

if (config.shouldCompressData(dataSize, networkType)) {
  console.log('Data should be compressed');
  // Apply compression logic
} else {
  console.log('Data should not be compressed');
  // Use original data
}
```

### Dynamic Configuration Updates

```javascript
const config = new ConfigManager();

// Update configuration based on user preferences
config.updateConfig({
  defaultFormat: 'string',
  enableAutoCompression: false,
  maxCompressionSize: 512 * 1024, // 512KB
});

// Validate configuration
if (!config.isValid()) {
  console.error('Configuration errors:', config.getValidationErrors());
}
```

### Network Threshold Management

```javascript
const config = new ConfigManager();

// Get current threshold for 4G
const threshold4g = config.getThresholdForNetwork('4g');
console.log(`4G compression threshold: ${threshold4g} bytes`);

// Update threshold based on analytics
config.setNetworkThreshold('3g', 800); // Compress data > 800 bytes on 3G

// Get all thresholds
const allThresholds = config.getAllThresholds();
console.log('All thresholds:', allThresholds);
```

### Configuration Import/Export

```javascript
const config = new ConfigManager({
  defaultFormat: 'formdata',
  thresholds: { 'slow-2g': 200, '2g': 800 },
});

// Export configuration
const configJson = config.exportConfig();
localStorage.setItem('network-compression-config', configJson);

// Import configuration later
const savedConfig = localStorage.getItem('network-compression-config');
if (savedConfig) {
  const newConfig = new ConfigManager();
  newConfig.importConfig(savedConfig);
}
```

### Output Format Selection

```javascript
const config = new ConfigManager({ defaultFormat: 'urlsearch' });

// Get optimal format
const format1 = config.getOptimalFormat('formdata'); // 'formdata' (valid request)
const format2 = config.getOptimalFormat('invalid');  // 'urlsearch' (fallback to default)
const format3 = config.getOptimalFormat('string');   // 'string' (valid request)
```

## Default Configuration

```javascript
const DEFAULT_CONFIG = {
  thresholds: {
    'slow-2g': 100,    // bytes
    '2g': 500,         // bytes
    '3g': 1024,        // bytes
    '4g': 2048,        // bytes
  },
  defaultFormat: 'urlsearch',
  enableAutoCompression: true,
  maxCompressionSize: 1048576,    // 1MB
  compressionTimeout: 5000,       // 5 seconds
  preferSmallest: true,
  enableLogging: false,
};
```

## Configuration Validation

The configuration manager validates:

1. **Network Types**: Ensures threshold keys are valid network types
2. **Threshold Values**: Must be positive numbers
3. **Format Values**: Must be from valid format list
4. **Size Values**: Must be positive numbers
5. **Threshold Ordering**: Should increase with network speed (slow-2g ≤ 2g ≤ 3g ≤ 4g)

### Validation Examples

```javascript
// This will cause validation errors
const invalidConfig = new ConfigManager({
  thresholds: {
    'invalid-network': 100,  // Unknown network type
    'slow-2g': -50,          // Negative value
    '4g': 100,               // Lower than 3g threshold (ordering violation)
  },
  defaultFormat: 'invalid',  // Unknown format
  maxCompressionSize: -1000, // Negative size
});

console.log(invalidConfig.getValidationErrors());
// [
//   "Unknown network type in thresholds: invalid-network",
//   "Invalid threshold for slow-2g: must be positive number",
//   "Compression thresholds should increase with network speed...",
//   "Invalid defaultFormat: invalid. Valid formats: urlsearch, formdata, string",
//   "Invalid maxCompressionSize: must be positive number"
// ]
```

## Preset Configurations

### Mobile-Friendly
```javascript
{
  thresholds: { 'slow-2g': 50, '2g': 200, '3g': 500, '4g': 1000 },
  defaultFormat: 'urlsearch',
  enableAutoCompression: true,
  maxCompressionSize: 512 * 1024, // 512KB
}
```

### Performance-First
```javascript
{
  thresholds: { 'slow-2g': 10, '2g': 50, '3g': 100, '4g': 200 },
  defaultFormat: 'string',
  enableAutoCompression: true,
  maxCompressionSize: 1024 * 1024, // 1MB
}
```

### Bandwidth-Saver
```javascript
{
  thresholds: { 'slow-2g': 1, '2g': 10, '3g': 50, '4g': 100 },
  defaultFormat: 'urlsearch',
  enableAutoCompression: true,
  maxCompressionSize: 2 * 1024 * 1024, // 2MB
}
```

## Integration with Network Detection

The configuration manager works seamlessly with the network detection system:

```javascript
import { NetworkDetector, ConfigManager } from 'network-compression-utils';

const detector = new NetworkDetector();
const config = new ConfigManager();

// Get current network info
const networkInfo = detector.getNetworkInfo();

// Make compression decision
const shouldCompress = config.shouldCompressData(
  data.length,
  networkInfo.effectiveType
);

// Listen for network changes and adjust compression strategy
detector.addEventListener((newNetworkInfo) => {
  const newDecision = config.shouldCompressData(
    data.length,
    newNetworkInfo.effectiveType
  );

  if (newDecision !== shouldCompress) {
    console.log('Compression strategy changed due to network change');
    // Update UI or data handling
  }
});
```

## Performance Considerations

- Configuration validation only occurs during initialization and updates
- Threshold lookups are O(1) operations
- Deep cloning prevents accidental configuration mutation
- Logging can be disabled in production to avoid console overhead
- Configuration objects are immutable from outside

## Browser Compatibility

The configuration manager has no external dependencies and works in all browsers that support ES6+ features:
- Chrome 49+
- Firefox 45+
- Safari 10+
- Edge 14+

## Testing

Comprehensive tests are provided in `src/config-manager.test.js` covering:
- Configuration initialization and merging
- Validation logic and error handling
- Network threshold management
- Compression decision logic
- Format selection and fallbacks
- Configuration import/export
- Edge cases and error conditions