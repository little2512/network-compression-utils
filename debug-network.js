import NetworkDetector from './src/network-detector.js';

console.log('=== Debug Network Detection ===');

const mockNavigatorNoConnection = {
  // No connection object
};

console.log('Setting navigator to:', mockNavigatorNoConnection);
Object.defineProperty(global, 'navigator', {
  value: mockNavigatorNoConnection,
  writable: true,
  configurable: true,
});

console.log('Navigator is now:', global.navigator);

const detector = new NetworkDetector();

console.log('Detector created');
console.log('isNetworkInformationAPIAvailable method:', typeof detector.isNetworkInformationAPIAvailable);

const result = detector.isNetworkInformationAPIAvailable();
console.log('Method returned:', result);
console.log('Expected: false');