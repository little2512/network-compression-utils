/**
 * JSDOM-based browser tests - lighter alternative to Playwright
 * These tests run faster and are good for basic browser compatibility
 */

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the built UMD bundle
const umdBundle = readFileSync(join(__dirname, '../../../dist/index.umd.js'), 'utf8');

describe('Browser Compatibility Tests (JSDOM)', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Create a new DOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="test-container"></div></body></html>', {
      runScripts: 'dangerously',
      url: 'http://localhost'
    });

    window = dom.window;
    document = dom.window.document;

    // Execute the UMD bundle in the DOM context
    window.eval(umdBundle);

    // Make globals available for tests
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
  });

  afterEach(() => {
    dom.window.close();
  });

  test('library loads correctly in JSDOM environment', () => {
    expect(typeof window.NetworkCompressionUtils).toBe('object');
    expect(typeof window.NetworkCompressionUtils.compress).toBe('function');
    expect(typeof window.NetworkCompressionUtils.decompress).toBe('function');
  });

  test('compression and decompression works', () => {
    const { compress, decompress } = window.NetworkCompressionUtils;
    const testData = 'Hello, World! This is a test.';

    const compressed = compress(testData);
    const decompressed = decompress(compressed);

    expect(compressed).not.toBe(testData);
    expect(decompressed).toBe(testData);
  });

  test('handles Unicode characters', () => {
    const { compress, decompress } = window.NetworkCompressionUtils;
    const unicodeData = '测试中文 🚀 Test ñáéíóú';

    const compressed = compress(unicodeData);
    const decompressed = decompress(compressed);

    expect(decompressed).toBe(unicodeData);
  });

  test('network condition detection works', () => {
    // Mock different network conditions
    const mockConnections = [
      { effectiveType: '2g', downlink: 0.1, rtt: 1000 },
      { effectiveType: '3g', downlink: 1.0, rtt: 300 },
      { effectiveType: '4g', downlink: 10, rtt: 50 }
    ];

    mockConnections.forEach(connection => {
      Object.defineProperty(window.navigator, 'connection', {
        value: connection,
        writable: true
      });

      const { getOptimalCompression } = window.NetworkCompressionUtils;
      const strategy = getOptimalCompression();

      expect(strategy).toBeDefined();
      expect(typeof strategy).toBe('object');
    });
  });

  test('DOM manipulation works with compression', () => {
    const { compress, decompress } = window.NetworkCompressionUtils;
    const container = document.getElementById('test-container');

    // Test data compression and DOM insertion
    const originalData = 'Sample data for DOM testing';
    const compressed = compress(originalData);

    container.setAttribute('data-compressed', compressed);
    expect(container.getAttribute('data-compressed')).toBe(compressed);

    // Test decompression and DOM content setting
    const decompressed = decompress(container.getAttribute('data-compressed'));
    container.textContent = decompressed;

    expect(container.textContent).toBe(originalData);
  });

  test('localStorage integration', () => {
    const { compress, decompress } = window.NetworkCompressionUtils;
    const testData = 'Data to be stored in localStorage';

    // Compress and store
    const compressed = compress(testData);
    window.localStorage.setItem('compressedData', compressed);

    // Retrieve and decompress
    const storedCompressed = window.localStorage.getItem('compressedData');
    const decompressed = decompress(storedCompressed);

    expect(decompressed).toBe(testData);
  });

  test('event handling works with compression', () => {
    const { compress, decompress } = window.NetworkCompressionUtils;
    const container = document.getElementById('test-container');

    let eventData = null;

    // Create and dispatch a custom event with compressed data
    const originalData = 'Event payload data';
    const compressedData = compress(originalData);

    container.addEventListener('testEvent', (event) => {
      eventData = decompress(event.detail);
    });

    const customEvent = new window.CustomEvent('testEvent', {
      detail: compressedData
    });

    container.dispatchEvent(customEvent);

    expect(eventData).toBe(originalData);
  });

  test('error handling works in browser context', () => {
    const { compress } = window.NetworkCompressionUtils;

    expect(() => compress(null)).not.toThrow();
    expect(() => compress(undefined)).not.toThrow();
    expect(() => compress(123)).not.toThrow();
  });
});