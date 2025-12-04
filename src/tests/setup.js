/**
 * Jest Test Environment Setup
 * Configures global test environment and mocks
 */

// Import Jest globals and export globally
import { jest } from '@jest/globals';
global.jest = jest;

// Mock LZ-String globally
global.LZString = {
  compressToUTF16: jest.fn((str) => 'compressed_' + str),
  decompressFromUTF16: jest.fn((str) => str.replace('compressed_', '')),
  compress: jest.fn((str) => 'comp_' + str),
  decompress: jest.fn((str) => str.replace('comp_', '')),
  // Add more LZ-String methods as needed
  compressToBase64: jest.fn((str) => 'base64_' + str),
  decompressFromBase64: jest.fn((str) => str.replace('base64_', '')),
};

// Mock navigator for all tests
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)',
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onchange: null,
    },
    mozConnection: null,
    webkitConnection: null,
  },
  writable: true,
  configurable: true,
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    timing: {
      navigationStart: Date.now(),
      domainLookupStart: Date.now(),
      domainLookupEnd: Date.now() + 50,
      connectStart: Date.now() + 50,
      connectEnd: Date.now() + 100,
      requestStart: Date.now() + 100,
      responseStart: Date.now() + 200,
      responseEnd: Date.now() + 300,
      loadEventEnd: Date.now() + 400,
    },
    navigation: {
      type: 0,
    },
  },
  writable: true,
  configurable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Enhanced URLSearchParams mock
if (typeof URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this.params = new Map();
      if (typeof init === 'string') {
        this.parseFromString(init);
      }
    }

    parseFromString(str) {
      const pairs = str.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
          this.append(
            decodeURIComponent(key),
            value ? decodeURIComponent(value) : ''
          );
        }
      }
    }

    append(name, value) {
      const existing = this.params.get(name) || [];
      existing.push(String(value));
      this.params.set(name, existing);
    }

    delete(name) {
      this.params.delete(name);
    }

    get(name) {
      const values = this.params.get(name);
      return values ? values[0] : null;
    }

    getAll(name) {
      return this.params.get(name) || [];
    }

    has(name) {
      return this.params.has(name);
    }

    set(name, value) {
      this.params.set(name, [String(value)]);
    }

    forEach(callback, thisArg) {
      this.params.forEach((values, name) => {
        values.forEach((value) => callback.call(thisArg, value, name, this));
      });
    }

    toString() {
      const pairs = [];
      this.params.forEach((values, name) => {
        values.forEach((value) => {
          pairs.push(
            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
          );
        });
      });
      return pairs.join('&');
    }

    entries() {
      const result = [];
      this.params.forEach((values, name) => {
        values.forEach((value) => {
          result.push([name, value]);
        });
      });
      return result[Symbol.iterator]();
    }
  };
}

// Enhanced FormData mock
if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }

    append(name, value) {
      const entries = this.data.get(name) || [];
      entries.push(value);
      this.data.set(name, entries);
    }

    delete(name) {
      this.data.delete(name);
    }

    get(name) {
      const entries = this.data.get(name);
      return entries ? entries[0] : null;
    }

    getAll(name) {
      return this.data.get(name) || [];
    }

    has(name) {
      return this.data.has(name);
    }

    set(name, value) {
      this.data.set(name, [value]);
    }

    forEach(callback, thisArg) {
      this.data.forEach((values, name) => {
        values.forEach((value) => callback.call(thisArg, value, name, this));
      });
    }

    entries() {
      const result = [];
      this.data.forEach((values, name) => {
        values.forEach((value) => {
          result.push([name, value]);
        });
      });
      return result[Symbol.iterator]();
    }
  };
}

// Mock Blob
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts, options = {}) {
      this.parts = parts;
      this.type = options.type || '';
    }

    get size() {
      return this.parts.reduce(
        (total, part) => total + (typeof part === 'string' ? part.length : 0),
        0
      );
    }
  };
}

// Mock localStorage and sessionStorage
const createStorage = () => {
  const storage = new Map();
  return {
    getItem: jest.fn((key) => storage.get(key) || null),
    setItem: jest.fn((key, value) => storage.set(key, value)),
    removeItem: jest.fn((key) => storage.delete(key)),
    clear: jest.fn(() => storage.clear()),
    get length() {
      return storage.size;
    },
    key: jest.fn((index) => Array.from(storage.keys())[index] || null),
  };
};

Object.defineProperty(global, 'localStorage', {
  value: createStorage(),
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: createStorage(),
  writable: true,
  configurable: true,
});

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Export globals for tests
export { jest };
