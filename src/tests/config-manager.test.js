/**
 * Configuration Manager Tests
 */

import ConfigManager from '../config-manager.js';

describe('ConfigManager', () => {
  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      const manager = new ConfigManager();
      const config = manager.getConfig();

      expect(config.thresholds['slow-2g']).toBe(100);
      expect(config.thresholds['2g']).toBe(500);
      expect(config.thresholds['3g']).toBe(700);
      expect(config.thresholds['4g']).toBe(2048);
      expect(config.defaultFormat).toBe('string');
      expect(config.enableAutoCompression).toBe(true);
    });

    test('should merge user configuration with defaults', () => {
      const userConfig = {
        thresholds: {
          '4g': 4096,
        },
        defaultFormat: 'string',
        enableLogging: true,
      };

      const manager = new ConfigManager(userConfig);
      const config = manager.getConfig();

      expect(config.thresholds['slow-2g']).toBe(100); // Default preserved
      expect(config.thresholds['4g']).toBe(4096); // User value applied
      expect(config.defaultFormat).toBe('formdata'); // User value applied
      expect(config.enableLogging).toBe(true); // User value applied
      expect(config.enableAutoCompression).toBe(true); // Default preserved
    });

    test('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        thresholds: {
          'slow-2g': -100, // Invalid negative value
        },
        defaultFormat: 'invalid', // Invalid format
        maxCompressionSize: -1000, // Invalid size
      };

      const manager = new ConfigManager(invalidConfig);
      const errors = manager.getValidationErrors();

      expect(errors.length).toBeGreaterThan(0);
      expect(manager.isValid()).toBe(false);

      // Should fall back to defaults for invalid values
      const config = manager.getConfig();
      expect(config.thresholds['slow-2g']).toBe(100); // Default value
      expect(config.defaultFormat).toBe('string'); // Fallback format
      expect(config.maxCompressionSize).toBe(1024 * 1024); // Default size
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration successfully', () => {
      const manager = new ConfigManager();
      const newConfig = {
        defaultFormat: 'string',
        enableLogging: true,
      };

      const result = manager.updateConfig(newConfig);

      expect(result).toBe(true);
      expect(manager.getConfig().defaultFormat).toBe('formdata');
      expect(manager.getConfig().enableLogging).toBe(true);
    });

    test('should reject invalid configuration updates', () => {
      const manager = new ConfigManager();
      const invalidConfig = {
        thresholds: {
          'invalid-network': 100,
        },
      };

      const result = manager.updateConfig(invalidConfig);

      expect(result).toBe(false);
      expect(manager.isValid()).toBe(true); // Original config remains valid
    });

    test('should reset to defaults', () => {
      const manager = new ConfigManager({
        defaultFormat: 'string',
        enableLogging: true,
        thresholds: { '4g': 4096 },
      });

      manager.resetToDefaults();
      const config = manager.getConfig();

      expect(config.defaultFormat).toBe('string');
      expect(config.enableLogging).toBe(false);
      expect(config.thresholds['4g']).toBe(2048);
    });

    test('should export and import configuration', () => {
      const manager = new ConfigManager({
        defaultFormat: 'string',
        enableLogging: true,
      });

      const exported = manager.exportConfig();
      const newManager = new ConfigManager();
      const importResult = newManager.importConfig(exported);

      expect(importResult).toBe(true);
      expect(newManager.getConfig().defaultFormat).toBe('string');
      expect(newManager.getConfig().enableLogging).toBe(true);
    });

    test('should handle invalid import JSON', () => {
      const manager = new ConfigManager();
      const result = manager.importConfig('invalid json');

      expect(result).toBe(false);
    });
  });

  describe('Network Thresholds', () => {
    test('should get correct threshold for network type', () => {
      const manager = new ConfigManager({
        thresholds: {
          'slow-2g': 200,
          '2g': 600,
          '3g': 1200,
          '4g': 2500,
        },
      });

      expect(manager.getThresholdForNetwork('slow-2g')).toBe(200);
      expect(manager.getThresholdForNetwork('2g')).toBe(600);
      expect(manager.getThresholdForNetwork('3g')).toBe(1200);
      expect(manager.getThresholdForNetwork('4g')).toBe(2500);
    });

    test('should handle unknown network types', () => {
      const manager = new ConfigManager();

      expect(manager.getThresholdForNetwork('unknown')).toBe(2048); // Falls back to 4g
    });

    test('should set network threshold successfully', () => {
      const manager = new ConfigManager();
      const result = manager.setNetworkThreshold('4g', 4096);

      expect(result).toBe(true);
      expect(manager.getThresholdForNetwork('4g')).toBe(4096);
    });

    test('should reject invalid network threshold', () => {
      const manager = new ConfigManager();

      expect(manager.setNetworkThreshold('invalid', 100)).toBe(false);
      expect(manager.setNetworkThreshold('4g', -100)).toBe(false);
      expect(manager.setNetworkThreshold('4g', 'not a number')).toBe(false);
    });

    test('should validate threshold ordering', () => {
      const manager = new ConfigManager();

      // This should fail validation (threshold should increase with network speed)
      const result = manager.setNetworkThreshold('4g', 100); // Lower than 3g threshold

      expect(result).toBe(false);
      expect(manager.isValid()).toBe(true); // Original config remains valid
    });

    test('should determine compression necessity correctly', () => {
      const manager = new ConfigManager({
        thresholds: {
          'slow-2g': 100,
          '2g': 500,
          '3g': 1024,
          '4g': 2048,
        },
      });

      // Test various data sizes and network types
      expect(manager.shouldCompressData(50, 'slow-2g')).toBe(false); // Below threshold
      expect(manager.shouldCompressData(150, 'slow-2g')).toBe(true); // Above threshold
      expect(manager.shouldCompressData(400, '2g')).toBe(false); // Below threshold
      expect(manager.shouldCompressData(600, '2g')).toBe(true); // Above threshold
      expect(manager.shouldCompressData(1500, '4g')).toBe(false); // Below threshold
      expect(manager.shouldCompressData(2500, '4g')).toBe(true); // Above threshold
    });

    test('should respect auto compression setting', () => {
      const manager = new ConfigManager({
        enableAutoCompression: false,
      });

      expect(manager.shouldCompressData(5000, 'slow-2g')).toBe(false); // Auto compression disabled
    });

    test('should respect maximum compression size', () => {
      const manager = new ConfigManager({
        maxCompressionSize: 1000,
      });

      expect(manager.shouldCompressData(2000, 'slow-2g')).toBe(false); // Exceeds max size
    });
  });

  describe('Output Format Management', () => {
    test('should return requested format if valid', () => {
      const manager = new ConfigManager();

      expect(manager.getOptimalFormat('urlsearch')).toBe('urlsearch');
      expect(manager.getOptimalFormat('formdata')).toBe('formdata');
      expect(manager.getOptimalFormat('string')).toBe('string');
    });

    test('should fall back to default format for invalid requests', () => {
      const manager = new ConfigManager({
        defaultFormat: 'string',
      });

      expect(manager.getOptimalFormat('invalid')).toBe('formdata');
    });

    test('should have ultimate fallback format', () => {
      const manager = new ConfigManager({
        defaultFormat: 'invalid',
      });

      expect(manager.getOptimalFormat('also-invalid')).toBe('urlsearch');
    });
  });

  describe('Utility Methods', () => {
    test('should format bytes correctly', () => {
      const manager = new ConfigManager();

      expect(manager.formatBytes(0)).toBe('0 Bytes');
      expect(manager.formatBytes(512)).toBe('512 Bytes');
      expect(manager.formatBytes(1024)).toBe('1 KB');
      expect(manager.formatBytes(1536)).toBe('1.5 KB');
      expect(manager.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(manager.formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });

    test('should provide configuration summary', () => {
      const manager = new ConfigManager({
        defaultFormat: 'string',
        enableLogging: true,
        maxCompressionSize: 2048,
      });

      const summary = manager.getConfigSummary();

      expect(summary.defaultFormat).toBe('formdata');
      expect(summary.enableLogging).toBe(true);
      expect(summary.maxCompressionSize).toBe('2 KB');
      expect(summary.thresholds).toBeDefined();
      expect(summary.compressionTimeout).toBeDefined();
    });

    test('should handle logging toggle', () => {
      const manager = new ConfigManager();

      // Enable logging
      manager.setLogging(true);
      expect(manager.getConfig().enableLogging).toBe(true);

      // Disable logging
      manager.setLogging(false);
      expect(manager.getConfig().enableLogging).toBe(false);
    });

    test('should track validation errors', () => {
      const manager = new ConfigManager({
        thresholds: {
          'invalid-network': 100,
          'slow-2g': -100,
        },
        defaultFormat: 'invalid',
      });

      const errors = manager.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('unknown network type'))).toBe(true);
      expect(errors.some((e) => e.includes('positive number'))).toBe(true);
      expect(errors.some((e) => e.includes('defaultFormat'))).toBe(true);
    });

    test('should provide validation status', () => {
      const validManager = new ConfigManager();
      expect(validManager.isValid()).toBe(true);

      const invalidManager = new ConfigManager({
        defaultFormat: 'invalid',
      });
      expect(invalidManager.isValid()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty configuration object', () => {
      const manager = new ConfigManager({});
      expect(manager.isValid()).toBe(true);
    });

    test('should handle null/undefined configuration', () => {
      const manager1 = new ConfigManager(null);
      const manager2 = new ConfigManager(undefined);

      expect(manager1.isValid()).toBe(true);
      expect(manager2.isValid()).toBe(true);
    });

    test('should handle configuration with only partial thresholds', () => {
      const manager = new ConfigManager({
        thresholds: {
          '4g': 4096,
        },
      });

      const thresholds = manager.getAllThresholds();
      expect(thresholds['slow-2g']).toBe(100); // Default
      expect(thresholds['2g']).toBe(500); // Default
      expect(thresholds['3g']).toBe(700); // Default
      expect(thresholds['4g']).toBe(4096); // User value
    });

    test('should handle edge case data sizes', () => {
      const manager = new ConfigManager();

      expect(manager.shouldCompressData(0, '2g')).toBe(false); // Zero size
      expect(manager.shouldCompressData(-1, '2g')).toBe(false); // Negative size
      expect(manager.shouldCompressData(1, '2g')).toBe(false); // Below threshold
    });
  });

  describe('Deep Copy and Immutability', () => {
    test('should not allow modification of internal config', () => {
      const manager = new ConfigManager();
      const config = manager.getConfig();

      // Try to modify the returned config
      config.thresholds['4g'] = 9999;
      config.defaultFormat = 'modified';

      // Internal config should be unchanged
      expect(manager.getConfig().thresholds['4g']).toBe(2048);
      expect(manager.getConfig().defaultFormat).toBe('urlsearch');
    });

    test('should create deep copy of thresholds', () => {
      const manager = new ConfigManager();
      const thresholds1 = manager.getAllThresholds();
      const thresholds2 = manager.getAllThresholds();

      thresholds1['4g'] = 9999;

      expect(thresholds2['4g']).toBe(2048); // Should be independent
    });
  });
});
