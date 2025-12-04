# Network Compression Utils

A JavaScript library for network-aware data compression that automatically adapts compression behavior based on network conditions and browser capabilities.

## Features

- **Network Detection**: Automatically detects network conditions using Network Information API
- **Smart Compression**: Intelligent compression decisions based on network speed and data size
- **Multiple Output Formats**: Support for URLSearchParams, FormData, and String formats
- **Browser Compatibility**: Works across all modern browsers with graceful fallbacks
- **Performance Monitoring**: Built-in compression statistics and performance metrics
- **Configurable**: Flexible configuration system for different use cases

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
  },
  outputFormat: 'urlsearch'
});

console.log(result);
// {
//   compressed: true,
//   data: URLSearchParams('user=john&email=john%40example.com&preferences=...'),
//   originalSize: 156,
//   compressedSize: 89,
//   compressionRatio: 0.43,
//   networkType: '4g',
//   outputFormat: 'urlsearch',
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
  thresholds: {
    'slow-2g': 100,    // bytes
    '2g': 500,         // bytes
    '3g': 1024,        // bytes
    '4g': 2048         // bytes
  },
  defaultFormat: 'urlsearch',     // 'urlsearch', 'formdata', 'string'
  enableAutoCompression: true,
  maxCompressionSize: 10240,      // 10KB
  compressionTimeout: 1000,       // 1 second
  preferSmallest: true,
  enableLogging: false
};
```

### Main Methods

#### `compress(options)`

Compress data based on network conditions and return in specified format.

```javascript
const result = ncu.compress({
  data: any,                    // Data to compress
  outputFormat?: 'urlsearch' | 'formdata' | 'string',
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
//   saveData: false
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

Convert between different formats:

```javascript
// Convert to URLSearchParams (for HTTP GET requests)
const urlParams = ncu.formatConverter.toUrlSearchParams({
  name: 'John',
  tags: ['developer', 'javascript']
});
// name=John&tags%5B%5D=developer&tags%5B%5D=javascript

// Convert to FormData (for HTTP POST requests with files)
const formData = ncu.formatConverter.toFormData(data);

// Convert to string (for storage or transmission)
const stringData = ncu.formatConverter.toString(data);
```

## Browser Support

The library supports all modern browsers with automatic fallbacks:

- ✅ Chrome 61+
- ✅ Firefox 50+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Internet Explorer 11+ (with polyfills)

### Polyfills

The library automatically provides polyfills for:
- `URLSearchParams` (IE 11)
- `FormData` (older browsers)
- `Promise` (IE 11)
- `Performance API` (older browsers)

## Configuration Examples

### Mobile-First Configuration

```javascript
const mobileConfig = new NetworkCompressionUtils({
  thresholds: {
    'slow-2g': 50,
    '2g': 200,
    '3g': 800,
    '4g': 2048
  },
  defaultFormat: 'string',
  enableAutoCompression: true,
  maxCompressionSize: 5120
});
```

### Desktop Configuration

```javascript
const desktopConfig = new NetworkCompressionUtils({
  thresholds: {
    'slow-2g': 100,
    '2g': 500,
    '3g': 1024,
    '4g': 4096
  },
  defaultFormat: 'urlsearch',
  enableAutoCompression: false,  // Don't compress on desktop by default
  maxCompressionSize: 10240
});
```

## Examples

### HTTP Request Optimization

```javascript
// Optimizing API calls
function makeApiRequest(data) {
  const ncu = new NetworkCompressionUtils();
  const compressed = ncu.compress({
    data: data,
    outputFormat: networkInfo.effectiveType === '4g' ? 'formdata' : 'string'
  });

  if (compressed.compressed) {
    console.log(`Saved ${compressed.originalSize - compressed.compressedSize} bytes`);
  }

  // Send compressed data
  return fetch('/api/data', {
    method: 'POST',
    body: compressed.data
  });
}
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
    data: data,
    outputFormat: 'formdata'
  });

  return result.data;
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
//   formats: { supported: ['urlsearch', 'formdata', 'string'] }
// }
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

### v1.0.0
- Initial release
- Network-aware compression
- Multiple output format support
- Browser compatibility layer
- Performance monitoring
- Comprehensive test suite