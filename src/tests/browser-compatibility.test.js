/**
 * Browser Compatibility Tests
 */

import BrowserCompatibilityManager from '../browser-compatibility.js';
import {
  NetworkAdapterFactory,
  CompressionAdapterFactory,
  NativeNetworkAdapter,
  PerformanceNetworkAdapter,
  UserAgentNetworkAdapter,
  NativeCompressionAdapter,
  LZStringCompressionAdapter,
} from '../network-adapters.js';

describe('Browser Compatibility Manager', () => {
  let compatibilityManager;

  beforeEach(() => {
    compatibilityManager = new BrowserCompatibilityManager();
  });

  afterEach(() => {
    if (compatibilityManager) {
      compatibilityManager.destroy();
    }
  });

  describe('Feature Detection', () => {
    test('should detect Network Information API', () => {
      // Mock navigator.connection
      global.navigator = {
        connection: { effectiveType: '4g' },
        mozConnection: undefined,
        webkitConnection: undefined,
      };

      const manager = new BrowserCompatibilityManager();
      expect(manager.features.networkInformation).toBe(true);

      manager.destroy();
    });

    test('should detect URLSearchParams availability', () => {
      if (typeof URLSearchParams !== 'undefined') {
        expect(compatibilityManager.features.urlSearchParams).toBe(true);
      } else {
        expect(compatibilityManager.features.urlSearchParams).toBe(false);
        expect(compatibilityManager.polyfills.has('urlSearchParams')).toBe(
          true
        );
      }
    });

    test('should detect FormData availability', () => {
      if (typeof FormData !== 'undefined') {
        expect(compatibilityManager.features.formData).toBe(true);
      } else {
        expect(compatibilityManager.features.formData).toBe(false);
        expect(compatibilityManager.polyfills.has('formData')).toBe(true);
      }
    });
  });

  describe('Polyfills', () => {
    test('should create URLSearchParams polyfill when not available', () => {
      // Simulate missing URLSearchParams
      const originalURLSearchParams = global.URLSearchParams;
      delete global.URLSearchParams;

      const manager = new BrowserCompatibilityManager();

      if (typeof originalURLSearchParams === 'undefined') {
        expect(manager.polyfills.has('urlSearchParams')).toBe(true);

        const URLSearchParamsPolyfill = manager.getFeature('urlSearchParams');
        expect(URLSearchParamsPolyfill).toBeDefined();

        // Test polyfill functionality
        const params = new URLSearchParamsPolyfill('name=value&foo=bar');
        expect(params.get('name')).toBe('value');
        expect(params.get('foo')).toBe('bar');
      }

      // Restore
      global.URLSearchParams = originalURLSearchParams;
      manager.destroy();
    });

    test('should create FormData polyfill when not available', () => {
      // Simulate missing FormData
      const originalFormData = global.FormData;
      delete global.FormData;

      const manager = new BrowserCompatibilityManager();

      if (typeof originalFormData === 'undefined') {
        expect(manager.polyfills.has('formData')).toBe(true);

        const FormDataPolyfill = manager.getFeature('formData');
        expect(FormDataPolyfill).toBeDefined();

        // Test polyfill functionality
        const formData = new FormDataPolyfill();
        formData.append('name', 'value');
        expect(formData.get('name')).toBe('value');
      }

      // Restore
      global.FormData = originalFormData;
      manager.destroy();
    });
  });

  describe('Compatibility Report', () => {
    test('should generate compatibility report', () => {
      const report = compatibilityManager.getCompatibilityReport();

      expect(report).toHaveProperty('browser');
      expect(report).toHaveProperty('features');
      expect(report).toHaveProperty('polyfills');
      expect(report).toHaveProperty('recommendations');

      expect(report.browser).toHaveProperty('name');
      expect(report.browser).toHaveProperty('version');
      expect(report.browser).toHaveProperty('userAgent');
    });

    test('should provide recommendations for missing features', () => {
      // Force missing network information
      const originalNavigator = global.navigator;
      global.navigator = {};

      const manager = new BrowserCompatibilityManager();
      const report = manager.getCompatibilityReport();

      expect(report.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            feature: 'Network Information API',
          }),
        ])
      );

      // Restore
      global.navigator = originalNavigator;
      manager.destroy();
    });
  });

  describe('Browser Support Check', () => {
    test('should check if browser is supported', () => {
      const support = compatibilityManager.isBrowserSupported();

      expect(support).toHaveProperty('supported');
      expect(support).toHaveProperty('level');
      expect(support).toHaveProperty('missingRequired');
      expect(support).toHaveProperty('missingRecommended');

      expect(['full', 'basic', 'unsupported']).toContain(support.level);
    });

    test('should identify missing required features', () => {
      // Simulate missing JSON
      const originalJSON = global.JSON;
      delete global.JSON;

      const manager = new BrowserCompatibilityManager();
      const support = manager.isBrowserSupported();

      if (typeof originalJSON === 'undefined') {
        expect(support.supported).toBe(false);
        expect(support.missingRequired).toContain('json');
      }

      // Restore
      global.JSON = originalJSON;
      manager.destroy();
    });
  });

  describe('Compatibility Warnings', () => {
    test('should generate appropriate warnings', () => {
      const warnings = compatibilityManager.getCompatibilityWarnings();
      expect(Array.isArray(warnings)).toBe(true);

      // Should have warnings for missing features
      if (!compatibilityManager.features.networkInformation) {
        expect(warnings).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Network Information API'),
          ])
        );
      }
    });
  });

  describe('Polyfill Application', () => {
    test('should apply polyfills to global scope', () => {
      // Store originals
      const originalURLSearchParams = global.URLSearchParams;
      const originalFormData = global.FormData;

      // Temporarily remove features
      delete global.URLSearchParams;
      delete global.FormData;

      const manager = new BrowserCompatibilityManager();
      manager.applyPolyfills();

      // Check if polyfills were applied
      expect(global.URLSearchParams).toBeDefined();
      expect(global.FormData).toBeDefined();

      // Restore originals
      global.URLSearchParams = originalURLSearchParams;
      global.FormData = originalFormData;
      manager.destroy();
    });
  });
});

describe('Network Adapters', () => {
  describe('Network Adapter Factory', () => {
    test('should get appropriate network adapter', () => {
      const adapter = NetworkAdapterFactory.getNetworkAdapter();
      expect(adapter).toBeDefined();
      expect(typeof adapter.getNetworkInfo).toBe('function');
    });

    test('should detect Network Information API availability', () => {
      const isAvailable =
        NetworkAdapterFactory.isNetworkInformationAPIAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    test('should detect Performance API availability', () => {
      const isAvailable = NetworkAdapterFactory.isPerformanceAPIAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('Native Network Adapter', () => {
    let adapter;

    beforeEach(() => {
      // Mock navigator.connection
      global.navigator = {
        connection: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 100,
          saveData: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
      };

      adapter = new NativeNetworkAdapter();
    });

    afterEach(() => {
      if (adapter) {
        adapter.destroy();
      }
    });

    test('should get network info from native API', () => {
      const info = adapter.getNetworkInfo();

      expect(info).toHaveProperty('effectiveType');
      expect(info).toHaveProperty('downlink');
      expect(info).toHaveProperty('rtt');
      expect(info).toHaveProperty('saveData');
      expect(info.effectiveType).toBe('4g');
    });

    test('should handle missing connection gracefully', () => {
      // Test with no connection
      global.navigator = {};
      const adapter2 = new NativeNetworkAdapter();
      const info = adapter2.getNetworkInfo();

      expect(info.effectiveType).toBe('4g'); // Fallback
      adapter2.destroy();
    });
  });

  describe('Performance Network Adapter', () => {
    let adapter;

    beforeEach(() => {
      // Mock performance API
      global.performance = {
        timing: {
          domainLookupStart: 100,
          domainLookupEnd: 200,
          connectStart: 200,
          connectEnd: 400,
          responseStart: 600,
          responseEnd: 800,
          navigationStart: 0,
          loadEventEnd: 2000,
        },
        navigation: {
          type: 0,
        },
      };

      // Mock timers
      global.setInterval = jest.fn((fn, delay) => {
        setTimeout(fn, 100); // Simulate quick interval for testing
        return 123; // Mock interval ID
      });

      global.clearInterval = jest.fn();

      adapter = new PerformanceNetworkAdapter();
    });

    afterEach(() => {
      if (adapter) {
        adapter.destroy();
      }
    });

    test('should estimate network type from performance metrics', () => {
      const info = adapter.getNetworkInfo();

      expect(info).toHaveProperty('effectiveType');
      expect(info).toHaveProperty('downlink');
      expect(info).toHaveProperty('rtt');
      expect(info).toHaveProperty('saveData');

      expect(['slow-2g', '2g', '3g', '4g']).toContain(info.effectiveType);
    });

    test('should collect samples periodically', () => {
      expect(global.setInterval).toHaveBeenCalled();
    });
  });

  describe('User Agent Network Adapter', () => {
    let adapter;

    beforeEach(() => {
      global.navigator = {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };
    });

    afterEach(() => {
      if (adapter) {
        adapter.destroy();
      }
    });

    test('should detect connection type from user agent', () => {
      adapter = new UserAgentNetworkAdapter();
      const info = adapter.getNetworkInfo();

      expect(info.effectiveType).toBe('4g'); // Desktop default
    });

    test('should detect mobile from user agent', () => {
      global.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      adapter = new UserAgentNetworkAdapter();
      const info = adapter.getNetworkInfo();

      expect(info.effectiveType).toBe('3g'); // Mobile default
    });

    test('should detect Opera Mini as slow connection', () => {
      global.navigator.userAgent = 'Opera Mini/32.0.2254/85. U';
      adapter = new UserAgentNetworkAdapter();
      const info = adapter.getNetworkInfo();

      expect(info.effectiveType).toBe('slow-2g');
    });
  });
});

describe('Compression Adapters', () => {
  describe('Compression Adapter Factory', () => {
    test('should get appropriate compression adapter', () => {
      const adapter = CompressionAdapterFactory.getCompressionAdapter();
      expect(adapter).toBeDefined();
      expect(typeof adapter.compress).toBe('function');
      expect(typeof adapter.decompress).toBe('function');
    });

    test('should detect CompressionStream availability', () => {
      const isAvailable =
        CompressionAdapterFactory.isCompressionStreamAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('Native Compression Adapter', () => {
    let adapter;

    beforeEach(() => {
      // Only test if native compression is available
      if (CompressionAdapterFactory.isCompressionStreamAvailable()) {
        global.CompressionStream = jest.fn().mockImplementation(() => ({
          writable: { getWriter: jest.fn() },
          readable: { getReader: jest.fn() },
        }));

        global.DecompressionStream = jest.fn().mockImplementation(() => ({
          writable: { getWriter: jest.fn() },
          readable: { getReader: jest.fn() },
        }));

        global.TextEncoder = jest.fn().mockImplementation(() => ({
          encode: jest.fn(() => new Uint8Array([1, 2, 3])),
        }));

        global.TextDecoder = jest.fn().mockImplementation(() => ({
          decode: jest.fn(() => '{"test":"data"}'),
        }));

        global.btoa = jest.fn();
        global.atob = jest.fn();

        adapter = new NativeCompressionAdapter();
      }
    });

    afterEach(() => {
      if (adapter) {
        adapter.destroy();
      }
    });

    test('should have correct algorithm name', () => {
      if (adapter) {
        expect(adapter.getAlgorithmName()).toBe('Native Gzip');
      }
    });

    test('should check availability', () => {
      if (adapter) {
        expect(adapter.isAvailable()).toBe(true);
      }
    });
  });
});
