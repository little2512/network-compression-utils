import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load the built UMD bundle for browser testing
const umdBundle = readFileSync(join(__dirname, '../../../dist/index.umd.js'), 'utf8');

test.describe('Network Compression Utils - Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a simple HTML page with our library
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Network Compression Utils Test</title>
        </head>
        <body>
          <div id="test-container"></div>
          <script>
            ${umdBundle}
            // Make the library available globally for tests
            window.NetworkCompressionUtils = NetworkCompressionUtils;
          </script>
        </body>
      </html>
    `);
  });

  test('library loads correctly in browser', async ({ page }) => {
    const libraryExists = await page.evaluate(() => {
      return typeof window.NetworkCompressionUtils !== 'undefined';
    });

    expect(libraryExists).toBe(true);
  });

  test('can compress and decompress data in browser', async ({ page }) => {
    const testData = 'Hello, World! This is a test string for compression.';

    const result = await page.evaluate((data) => {
      const { compress, decompress } = window.NetworkCompressionUtils;
      const compressed = compress(data);
      const decompressed = decompress(compressed);
      return {
        original: data,
        compressed: compressed,
        decompressed: decompressed,
        compressionWorked: compressed !== data && decompressed === data
      };
    }, testData);

    expect(result.compressionWorked).toBe(true);
    expect(result.compressed).not.toBe(result.original);
    expect(result.decompressed).toBe(result.original);
  });

  test('handles network simulation in browser', async ({ page }) => {
    const testSpeeds = [
      { type: 'slow', downlink: 0.5, rtt: 500 },
      { type: 'fast', downlink: 10, rtt: 50 }
    ];

    for (const speed of testSpeeds) {
      const result = await page.evaluate((networkInfo) => {
        // Mock network conditions
        Object.defineProperty(navigator, 'connection', {
          value: {
            effectiveType: networkInfo.type === 'slow' ? '2g' : '4g',
            downlink: networkInfo.downlink,
            rtt: networkInfo.rtt
          },
          writable: true
        });

        const { getOptimalCompression } = window.NetworkCompressionUtils;
        const strategy = getOptimalCompression();

        return {
          networkType: networkInfo.type,
          strategy: strategy
        };
      }, speed);

      expect(result.networkType).toBe(speed.type);
      expect(result.strategy).toBeTruthy();
    }
  });

  test('handles large data compression in browser', async ({ page }) => {
    const largeData = 'x'.repeat(10000); // 10KB of data

    const result = await page.evaluate((data) => {
      const { compress, decompress, estimateSavings } = window.NetworkCompressionUtils;
      const startTime = performance.now();
      const compressed = compress(data);
      const compressionTime = performance.now() - startTime;
      const decompressed = decompress(compressed);
      const decompressionTime = performance.now() - compressionTime - startTime;
      const savings = estimateSavings(data);

      return {
        originalSize: data.length,
        compressedSize: compressed.length,
        compressionRatio: compressed.length / data.length,
        compressionTime,
        decompressionTime,
        savings: savings.compressedSize,
        integrity: decompressed === data
      };
    }, largeData);

    expect(result.integrity).toBe(true);
    expect(result.compressionRatio).toBeLessThan(1); // Should be compressed
    expect(result.compressionTime).toBeLessThan(1000); // Should be fast
    expect(result.decompressionTime).toBeLessThan(100); // Decompression should be very fast
  });

  test('error handling in browser environment', async ({ page }) => {
    const testCases = [
      { input: null, description: 'null input' },
      { input: undefined, description: 'undefined input' },
      { input: '', description: 'empty string' },
      { input: 123, description: 'number input' }
    ];

    for (const testCase of testCases) {
      const result = await page.evaluate((test) => {
        try {
          const { compress } = window.NetworkCompressionUtils;
          const result = compress(test.input);
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, testCase);

      if (testCase.input === null || testCase.input === undefined || testCase.input === 123) {
        expect(result.success).toBe(false);
      } else {
        expect(result.success).toBe(true);
      }
    }
  });
});