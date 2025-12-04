# Network Detection Implementation

This document describes the network detection functionality implemented in Stage 2.

## Features

### Core Functionality

The `NetworkDetector` class provides comprehensive network information detection using the Network Information API:

- **Network Type Detection**: Identifies network types (slow-2g, 2g, 3g, 4g)
- **Connection Quality**: Measures downlink speed, round-trip time (RTT), and data saver mode
- **Fallback Support**: Provides sensible defaults when API is not available
- **Event Listeners**: Monitors network changes in real-time
- **Quality Scoring**: Calculates a 0-100 quality score for network assessment

### API Methods

#### `getNetworkInfo(): NetworkInfo|null`
Returns current network information with properties:
- `effectiveType`: Network type ('slow-2g', '2g', '3g', '4g')
- `downlink`: Downlink speed in Mbps (if available)
- `rtt`: Round-trip time in milliseconds (if available)
- `saveData`: Data saver mode status (if available)

#### `isSlowNetwork(networkInfo?: NetworkInfo): boolean`
Returns true if the network is considered slow (slow-2g or 2g).

#### `isFastNetwork(networkInfo?: NetworkInfo): boolean`
Returns true if the network is considered fast (4g).

#### `getNetworkQualityScore(networkInfo?: NetworkInfo): number`
Returns a quality score from 0-100 based on:
- Base network type score
- Downlink speed adjustments
- RTT adjustments
- Data saver mode penalty

#### `addEventListener(callback: Function): void`
Adds a listener for network changes.

#### `removeEventListener(callback: Function): void`
Removes a network change listener.

#### `getNetworkDescription(networkInfo?: NetworkInfo): string`
Returns a human-readable description of the network connection.

#### `destroy(): void`
Cleans up resources and removes all listeners.

### Browser Compatibility

#### Supported Browsers
- **Chrome 61+**: Full Network Information API support
- **Firefox 85+**: Full support
- **Edge 79+**: Full support
- **Safari 12.1+**: Limited support (may not have all properties)

#### Fallback Behavior
When the Network Information API is not available:
- Returns default network info (4g, 10 Mbps downlink, 100ms RTT)
- Caches last known network info for consistency
- Still provides all API methods with sensible defaults

### Usage Examples

#### Basic Usage
```javascript
import { NetworkDetector } from 'network-compression-utils';

const detector = new NetworkDetector();

// Get current network info
const networkInfo = detector.getNetworkInfo();
console.log('Network type:', networkInfo.effectiveType);
console.log('Quality score:', detector.getNetworkQualityScore(networkInfo));

// Check if network is slow
if (detector.isSlowNetwork()) {
  console.log('Using a slow network connection');
}
```

#### Network Change Monitoring
```javascript
const detector = new NetworkDetector();

// Add listener for network changes
detector.addEventListener((networkInfo) => {
  console.log('Network changed to:', networkInfo.effectiveType);

  if (detector.isSlowNetwork(networkInfo)) {
    // Enable data compression
    enableCompressionMode();
  } else {
    // Disable compression for fast networks
    disableCompressionMode();
  }
});

// Later, remove the listener
detector.removeEventListener(callback);
```

#### Quality-based Decisions
```javascript
const detector = new NetworkDetector();
const networkInfo = detector.getNetworkInfo();
const quality = detector.getNetworkQualityScore(networkInfo);

if (quality >= 80) {
  // High quality network - load high-resolution images
  loadHighResImages();
} else if (quality >= 50) {
  // Medium quality network - load medium resolution
  loadMediumResImages();
} else {
  // Low quality network - load minimal assets
  loadLowResImages();
}
```

## Testing

### Unit Tests
Comprehensive unit tests are provided in `src/network-detector.test.js` covering:
- Network Information API availability detection
- Network info retrieval and normalization
- Quality assessment calculations
- Event listener management
- Error handling and fallbacks
- Browser compatibility scenarios

### Manual Testing
A manual testing page is available at `test-manual.html` for:
- Real-time network monitoring
- Quality score verification
- Event listener demonstration
- Browser compatibility testing

### Browser Testing
To test in different browsers:
1. Open `test-manual.html` in target browser
2. Use browser developer tools to simulate network conditions
3. Verify network detection and quality scoring work correctly

## Integration

The network detection functionality integrates seamlessly with the compression system:
- Network type determines when compression should be applied
- Quality scores help optimize compression thresholds
- Real-time monitoring allows dynamic adjustment of compression settings

## Performance Considerations

- Network detection is lightweight and has minimal performance impact
- Event listeners are efficient and only trigger on actual changes
- Caching prevents unnecessary API calls
- Graceful fallbacks ensure consistent behavior across all browsers

## Browser Compatibility Notes

### Chrome/Edge
- Full Network Information API support
- All properties available and accurate
- Real-time change detection works perfectly

### Firefox
- Full support from version 85+
- Consistent behavior with Chrome/Edge
- Good real-time detection

### Safari
- Limited Network Information API support
- May not provide downlink/rtt values
- Still provides basic effectiveType detection
- Fallback behavior ensures functionality

### Legacy Browsers
- No Network Information API support
- Uses fallback network info
- Still provides all API methods with default values