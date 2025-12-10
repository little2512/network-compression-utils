/**
 * Jasmine Test Setup
 * Sets up test environment and mocks for browser testing
 */

// Make jasmine globals available
window.spyOn = jasmine.createSpy;

// Mock navigator.connection for network detection tests
if (!navigator.connection) {
  navigator.connection = {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
    onchange: null,
  };
}

// Mock localStorage for config persistence tests
if (typeof localStorage === 'undefined') {
  window.localStorage = {
    _data: {},
    setItem: function (id, val) {
      this._data[id] = String(val);
    },
    getItem: function (id) {
      return Object.prototype.hasOwnProperty.call(this._data, id)
        ? this._data[id]
        : undefined;
    },
    removeItem: function (id) {
      delete this._data[id];
    },
    clear: function () {
      this._data = {};
    },
  };
}

// Mock sessionStorage
if (typeof sessionStorage === 'undefined') {
  window.sessionStorage = {
    _data: {},
    setItem: function (id, val) {
      this._data[id] = String(val);
    },
    getItem: function (id) {
      return Object.prototype.hasOwnProperty.call(this._data, id)
        ? this._data[id]
        : undefined;
    },
    removeItem: function (id) {
      delete this._data[id];
    },
    clear: function () {
      this._data = {};
    },
  };
}

// Mock fetch API for network tests
if (typeof fetch === 'undefined') {
  window.fetch = function (url, options) {
    // Handle network speed test requests
    if (url && url.includes('/api/network-speed-test')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const size = parseInt(urlParams.get('size')) || 64;

      // Simulate network delay based on connection type
      const connection = navigator.connection || { effectiveType: '4g' };
      let delay = 10; // default for 4g

      switch (connection.effectiveType) {
        case 'slow-2g':
          delay = 2000;
          break;
        case '2g':
          delay = 1000;
          break;
        case '3g':
          delay = 200;
          break;
        case '4g':
          delay = 10;
          break;
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                size: size,
                duration: delay,
                speed: Math.round((size * 8) / (delay / 1000)), // bits per second
                unit: 'bps',
              }),
            text: () => Promise.resolve(''),
            blob: () => Promise.resolve(new Blob()),
          });
        }, delay);
      });
    }

    // Default fetch response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
    });
  };
}

// Mock XMLHttpRequest for tests that rely on it
if (typeof XMLHttpRequest === 'undefined') {
  window.XMLHttpRequest = function () {
    this.readyState = 0;
    this.status = 200;
    this.responseText = '';
    this.onreadystatechange = null;

    this.open = function () {};
    this.send = function () {
      if (this.onreadystatechange) {
        this.readyState = 4;
        this.onreadystatechange();
      }
    };
    this.setRequestHeader = function () {};
  };
}

// Mock console for cleaner test output
beforeEach(function () {
  // Suppress console.log during tests unless debugging
  if (typeof jasmine !== 'undefined' && jasmine.createSpy) {
    spyOn(window.console, 'log').and.callThrough();
    spyOn(window.console, 'warn').and.callThrough();
    spyOn(window.console, 'error').and.callThrough();
  }
});

// Global test helpers
window.testHelpers = {
  // Create test data with predictable compression
  createTestRepetitiveData: function () {
    return {
      message: 'test_message_12345'.repeat(2000),
      content: 'A'.repeat(5000),
      details: {
        pattern: 'repeated_pattern_xyz'.repeat(1000),
        metadata: 'x'.repeat(3000),
      },
    };
  },

  // Create test data that doesn't compress well
  createNonRepetitiveData: function () {
    return {
      message: 'This is a non-repetitive message that should not compress well',
      random: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      ),
    };
  },

  // Create large test data
  createLargeTestData: function (size) {
    size = size || 100000;
    return {
      data: 'x'.repeat(size),
      timestamp: new Date().toISOString(),
      metadata: Array(1000).fill('large_data_test_metadata'),
    };
  },

  // Test helper for async operations
  waitFor: function (condition, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > (timeout || 5000)) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  },
};
