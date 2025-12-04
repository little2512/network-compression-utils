 /**
 * Network Detector Tests
 */

import NetworkDetector from '../network-detector.js';

// Mock navigator and connection API
const mockNavigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onchange: null,
  },
};

const mockNavigatorNoConnection = {
  // No connection object
};

const mockNavigatorLowQuality = {
  connection: {
    effectiveType: '2g',
    downlink: 0.5,
    rtt: 800,
    saveData: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onchange: null,
  },
};

describe('NetworkDetector', () => {
  let originalNavigator;

  beforeEach(() => {
    // Store original navigator
    originalNavigator = global.navigator;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('Constructor', () => {
    test('should initialize with empty listeners', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      expect(detector.listeners.size).toBe(0);
      expect(detector.lastKnownNetworkInfo).toBeNull();
    });

    test('should setup network listeners when API is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      new NetworkDetector();
      expect(mockNavigator.connection.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test('should handle missing connection object gracefully', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigatorNoConnection,
        writable: true,
      });

      expect(() => new NetworkDetector()).not.toThrow();
    });
  });

  describe('Network Information API Detection', () => {
    test('should detect when Network Information API is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      expect(detector.isNetworkInformationAPIAvailable()).toBe(true);
    });

    test('should detect when Network Information API is not available', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigatorNoConnection,
        writable: true,
      });

      const detector = new NetworkDetector();
      expect(detector.isNetworkInformationAPIAvailable()).toBe(false);
    });
  });

  describe('getNetworkInfo', () => {
    test('should return network info when API is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      const networkInfo = detector.getNetworkInfo();

      expect(networkInfo).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });

    test('should return fallback network info when API is not available', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigatorNoConnection,
        writable: true,
      });

      const detector = new NetworkDetector();
      const networkInfo = detector.getNetworkInfo();

      expect(networkInfo).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });

    test('should cache last known network info', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      const networkInfo1 = detector.getNetworkInfo();

      // Mock connection removal
      Object.defineProperty(global, 'navigator', {
        value: mockNavigatorNoConnection,
        writable: true,
      });

      const networkInfo2 = detector.getNetworkInfo();

      expect(networkInfo1).toEqual(networkInfo2);
      expect(detector.lastKnownNetworkInfo).toEqual(networkInfo1);
    });

    test('should handle errors gracefully', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          connection: {
            get effectiveType() {
              throw new Error('API error');
            },
          },
        },
        writable: true,
      });

      const detector = new NetworkDetector();
      const networkInfo = detector.getNetworkInfo();

      expect(networkInfo).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });
  });

  describe('Network Quality Assessment', () => {
    test('should identify slow networks correctly', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigatorLowQuality,
        writable: true,
      });

      const detector = new NetworkDetector();
      expect(detector.isSlowNetwork()).toBe(true);
      expect(detector.isFastNetwork()).toBe(false);
    });

    test('should identify fast networks correctly', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      expect(detector.isSlowNetwork()).toBe(false);
      expect(detector.isFastNetwork()).toBe(true);
    });

    test('should calculate network quality score correctly', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      const score = detector.getNetworkQualityScore();

      expect(score).toBeGreaterThan(80); // 4g with good downlink should have high score
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should give lower score for low quality networks', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigatorLowQuality,
        writable: true,
      });

      const detector = new NetworkDetector();
      const score = detector.getNetworkQualityScore();

      expect(score).toBeLessThan(40); // 2g with data saver should have low score
    });
  });

  describe('Event Listeners', () => {
    test('should add and remove event listeners', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      const callback = jest.fn();

      detector.addEventListener(callback);
      expect(detector.listeners.size).toBe(1);

      detector.removeEventListener(callback);
      expect(detector.listeners.size).toBe(0);
    });

    test('should throw error when adding non-function callback', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();

      expect(() => detector.addEventListener('not a function')).toThrow(
        'Callback must be a function'
      );
    });

    test('should handle listener errors gracefully', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalCallback = jest.fn();

      detector.addEventListener(errorCallback);
      detector.addEventListener(normalCallback);

      // Mock console.error to avoid test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();

      detector.notifyListeners({
        effectiveType: '3g',
        downlink: 2,
        rtt: 200,
        saveData: false,
      });

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error in network change listener:',
        expect.any(Error)
      );

      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('Utility Methods', () => {
    test('should normalize effective types correctly', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();

      expect(detector.normalizeEffectiveType('4g')).toBe('4g');
      expect(detector.normalizeEffectiveType('3g')).toBe('3g');
      expect(detector.normalizeEffectiveType('2g')).toBe('2g');
      expect(detector.normalizeEffectiveType('slow-2g')).toBe('slow-2g');
      expect(detector.normalizeEffectiveType('unknown')).toBe('4g');
    });

    test('should provide network descriptions', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();

      expect(
        detector.getNetworkDescription({
          effectiveType: '4g',
          saveData: false,
        })
      ).toBe('Fast connection (4G)');

      expect(
        detector.getNetworkDescription({
          effectiveType: '2g',
          saveData: true,
        })
      ).toBe('Slow connection (2G) (Data saver mode)');
    });

    test('should clean up resources properly', () => {
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const detector = new NetworkDetector();
      const callback = jest.fn();

      detector.addEventListener(callback);
      expect(detector.listeners.size).toBe(1);
      expect(detector.lastKnownNetworkInfo).toBeDefined();

      detector.destroy();

      expect(detector.listeners.size).toBe(0);
      expect(detector.lastKnownNetworkInfo).toBeNull();
    });
  });
});
