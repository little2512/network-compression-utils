# API Documentation

## NetworkCompressionUtils

The main class that integrates all network compression functionality.

### Constructor

```javascript
new NetworkCompressionUtils(config)
```

**Parameters:**
- `config` (Object, optional): Configuration object

**Example:**
```javascript
const ncu = new NetworkCompressionUtils({
  enableAutoCompression: true,
  thresholds: { '4g': 2048 }
});
```

### Methods

#### compress(options)

Compresses data based on network conditions.

**Parameters:**
- `options.data` (any): Data to compress
- `options.outputFormat` (string): 'urlsearch', 'formdata', or 'string'
- `options.config` (Object): Override configuration
- `options.networkType` (string): Force network type
- `options.forceCompression` (boolean): Force compression

**Returns:** CompressionResult object

#### getNetworkInfo()

Returns current network information.

**Returns:** NetworkInfo object

#### updateConfig(newConfig)

Updates configuration at runtime.

**Parameters:**
- `newConfig` (Object): New configuration properties

**Returns:** boolean - success status

#### getBrowserCompatibility()

Returns comprehensive browser compatibility report.

**Returns:** CompatibilityReport object

#### getCompressionStats()

Returns compression performance statistics.

**Returns:** CompressionStats object

## BrowserCompatibilityManager

Handles browser feature detection and polyfills.

### Methods

#### getCompatibilityReport()

Returns detailed compatibility information.

#### isBrowserSupported()

Checks if current browser is supported.

#### applyPolyfills()

Applies necessary polyfills to global scope.

## Network Adapters

### NetworkAdapterFactory

Factory for creating network detection adapters.

#### getNetworkAdapter()

Returns the best available network adapter.

#### isNetworkInformationAPIAvailable()

Checks if Network Information API is available.

### CompressionAdapterFactory

Factory for creating compression adapters.

#### getCompressionAdapter()

Returns the best available compression adapter.

## Format Converter

### FormatConverter

Handles conversion between different data formats.

#### toUrlSearchParams(data)

Converts data to URLSearchParams format.

#### toFormData(data)

Converts data to FormData format.

#### toString(data)

Converts data to string format.

## Network Detector

### NetworkDetector

Detects network conditions and changes.

#### getNetworkInfo()

Returns current network information.

#### addEventListener(callback)

Adds listener for network changes.

#### removeEventListener(callback)

Removes network change listener.

## Config Manager

### ConfigManager

Manages compression configuration.

#### getConfig()

Returns current configuration.

#### updateConfig(newConfig)

Updates configuration.

#### shouldCompressData(dataSize, networkType)

Determines if data should be compressed.

## Compression Manager

### CompressionManager

Handles data compression operations.

#### compress(data)

Compresses data using configured algorithm.

#### decompress(compressedData)

Decompresses previously compressed data.

#### getCompressionStats()

Returns compression statistics.

## Data Types

### NetworkInfo

```javascript
{
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g',
  downlink?: number,
  rtt?: number,
  saveData?: boolean
}
```

### CompressionResult

```javascript
{
  compressed: boolean,
  data: string | URLSearchParams | FormData,
  originalSize: number,
  compressedSize?: number,
  compressionRatio?: number,
  networkType: string,
  outputFormat: string,
  algorithm: string,
  processingTime: number,
  error?: string
}
```

### CompressionConfig

```javascript
{
  thresholds: {
    'slow-2g': number,
    '2g': number,
    '3g': number,
    '4g': number
  },
  defaultFormat: 'urlsearch' | 'formdata' | 'string',
  enableAutoCompression: boolean,
  maxCompressionSize: number,
  compressionTimeout: number,
  preferSmallest: boolean,
  enableLogging: boolean
}
```