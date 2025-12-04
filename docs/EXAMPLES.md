# Usage Examples

## Basic Usage

```javascript
import NetworkCompressionUtils from 'network-compression-utils';

// Initialize with default settings
const ncu = new NetworkCompressionUtils();

// Compress data automatically
const result = ncu.compress({
  data: { user: 'john', email: 'john@example.com' },
  outputFormat: 'urlsearch'
});

console.log(result);
```

## HTTP Request Optimization

```javascript
// Optimizing API calls
async function makeApiRequest(endpoint, data) {
  const ncu = new NetworkCompressionUtils();

  // Compress data based on network conditions
  const compressed = ncu.compress({
    data: data,
    outputFormat: 'formdata'
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    body: compressed.data,
    headers: {
      'X-Compression-Info': JSON.stringify({
        compressed: compressed.compressed,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize
      })
    }
  });

  return response.json();
}

// Usage
makeApiRequest('/api/user', {
  name: 'John Doe',
  preferences: { theme: 'dark', notifications: true },
  history: Array(100).fill('sample data')
});
```

## Form Data Optimization

```javascript
// Optimizing form submissions
function optimizeFormData(formElement) {
  const formData = new FormData(formElement);
  const ncu = new NetworkCompressionUtils();

  // Convert FormData to object for compression
  const data = {};
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }

  // Compress if beneficial
  const result = ncu.compress({
    data: data,
    outputFormat: 'formdata',
    forceCompression: true  // Force compression for demo
  });

  if (result.compressed) {
    console.log(`Compressed form data from ${result.originalSize} to ${result.compressedSize} bytes`);
  }

  return result.data;
}

// Usage
document.getElementById('myForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const optimizedData = optimizeFormData(e.target);

  fetch('/submit', {
    method: 'POST',
    body: optimizedData
  });
});
```

## Network-Aware Configuration

```javascript
// Configure based on expected usage
const mobileConfig = new NetworkCompressionUtils({
  thresholds: {
    'slow-2g': 50,    // Lower threshold for mobile
    '2g': 200,
    '3g': 800,
    '4g': 2048
  },
  defaultFormat: 'string',  // More compatible with mobile
  enableAutoCompression: true,
  maxCompressionSize: 5120,  // 5KB limit for mobile
  enableLogging: true
});

const desktopConfig = new NetworkCompressionUtils({
  thresholds: {
    'slow-2g': 100,
    '2g': 500,
    '3g': 1024,
    '4g': 4096   // Higher threshold for desktop
  },
  defaultFormat: 'urlsearch',
  enableAutoCompression: false,  // Optional on desktop
  maxCompressionSize: 10240,     // 10KB limit
  enableLogging: false
});

// Choose configuration based on device
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const ncu = isMobile ? mobileConfig : desktopConfig;
```

## Real-time Network Monitoring

```javascript
// Monitor network changes and adapt behavior
const ncu = new NetworkCompressionUtils({
  enableLogging: true,
  enableAutoCompression: true
});

// Add network change listener
ncu.addNetworkListener((networkInfo) => {
  console.log('Network changed:', networkInfo.effectiveType);

  // Adapt behavior based on new network type
  switch (networkInfo.effectiveType) {
    case 'slow-2g':
    case '2g':
      // Enable aggressive compression on slow networks
      ncu.updateConfig({
        thresholds: { '4g': 100 },  // Lower threshold
        enableAutoCompression: true
      });
      break;

    case '4g':
      // Relax compression on fast networks
      ncu.updateConfig({
        thresholds: { '4g': 2048 },
        enableAutoCompression: false
      });
      break;
  }
});

// Example adaptive API call
function adaptiveApiCall(data) {
  const networkInfo = ncu.getNetworkInfo();
  const isSlowNetwork = ncu.isSlowNetwork();

  let options = {
    data: data,
    outputFormat: 'urlsearch'
  };

  // Force compression on slow networks
  if (isSlowNetwork) {
    options.forceCompression = true;
    options.outputFormat = 'string';  // More efficient
  }

  return ncu.compress(options);
}
```

## Performance Testing

```javascript
// Test compression performance
function testCompressionPerformance() {
  const ncu = new NetworkCompressionUtils();

  // Create test data
  const testData = {
    user: 'test_user',
    data: Array(1000).fill('Lorem ipsum dolor sit amet').join(' '),
    metadata: {
      timestamp: Date.now(),
      version: '1.0.0',
      tags: ['test', 'performance', 'compression']
    }
  };

  // Run compression test
  const testResult = ncu.testCompression(testData, 100);  // 100 iterations

  console.log('Compression Performance Test:');
  console.log(`Average time: ${testResult.averageTime.toFixed(2)}ms`);
  console.log(`Success rate: ${(testResult.successRate * 100).toFixed(1)}%`);
  console.log(`Average compression ratio: ${(testResult.averageRatio * 100).toFixed(1)}%`);

  // Compare algorithms
  const comparison = ncu.compareAlgorithms(testData);
  console.log('Algorithm Comparison:', comparison);

  return { testResult, comparison };
}

// Usage
testCompressionPerformance();
```

## Browser Compatibility Check

```javascript
// Check browser compatibility before using advanced features
function initializeWithCompatibilityCheck() {
  const ncu = new NetworkCompressionUtils();

  // Get compatibility report
  const compatibility = ncu.getBrowserCompatibility();
  console.log('Browser Compatibility:', compatibility);

  // Check support level
  const support = ncu.getBrowserSupport();

  if (support.level === 'unsupported') {
    console.error('Browser not supported. Missing required features:', support.missingRequired);
    return null;
  }

  if (support.level === 'basic') {
    console.warn('Limited browser support. Missing recommended features:', support.missingRecommended);

    // Use conservative settings for limited support
    ncu.updateConfig({
      enableAutoCompression: false,
      defaultFormat: 'string'
    });
  }

  // Show any compatibility warnings
  const warnings = ncu.getCompatibilityWarnings();
  warnings.forEach(warning => console.warn('Compatibility:', warning));

  return ncu;
}

// Usage
const ncu = initializeWithCompatibilityCheck();
if (ncu) {
  // Proceed with compression
  const result = ncu.compress({ data: 'example' });
}
```

## Custom Network Adapter

```javascript
// Create custom network adapter for specific needs
import { NetworkAdapterFactory, UserAgentNetworkAdapter } from 'network-compression-utils';

class CustomNetworkAdapter extends UserAgentNetworkAdapter {
  constructor() {
    super();
    this.customMetrics = {};
  }

  getNetworkInfo() {
    const baseInfo = super.getNetworkInfo();

    // Add custom logic
    if (navigator.connection && navigator.connection.effectiveType === '4g') {
      // Fast network - upgrade to 4g with better metrics
      baseInfo.downlink = 50;  // 50 Mbps
      baseInfo.rtt = 20;       // 20ms
    }

    return baseInfo;
  }
}

// Use custom adapter
const customAdapter = new CustomNetworkAdapter();
const ncu = new NetworkCompressionUtils();
ncu.networkDetector.adapter = customAdapter;
```

## Error Handling

```javascript
// Robust error handling for production use
function robustCompression(data, options = {}) {
  const ncu = new NetworkCompressionUtils({
    enableLogging: true,
    enableFallback: true
  });

  try {
    const result = ncu.compress({
      data: data,
      outputFormat: options.outputFormat || 'urlsearch',
      forceCompression: options.forceCompression || false
    });

    if (result.error) {
      console.warn('Compression failed:', result.error);
      // Return original data as fallback
      return {
        compressed: false,
        data: typeof data === 'string' ? data : JSON.stringify(data),
        originalSize: JSON.stringify(data).length,
        networkType: result.networkType,
        outputFormat: 'string',
        algorithm: 'none',
        processingTime: result.processingTime
      };
    }

    return result;

  } catch (error) {
    console.error('Compression error:', error);

    // Ultimate fallback
    return {
      compressed: false,
      data: JSON.stringify(data),
      originalSize: JSON.stringify(data).length,
      networkType: 'unknown',
      outputFormat: 'string',
      algorithm: 'none',
      processingTime: 0,
      error: error.message
    };
  }
}

// Usage
const result = robustCompression({ user: 'test', data: 'example' });
```