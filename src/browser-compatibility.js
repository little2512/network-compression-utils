/**
 * Browser Compatibility Manager
 * Handles polyfills and browser-specific adaptations
 */

class BrowserCompatibilityManager {
  constructor() {
    this.features = this.detectFeatures();
    this.polyfills = new Map();
    this.initializePolyfills();
  }

  /**
   * Detect available browser features
   */
  detectFeatures() {
    const features = {
      // Network Information API
      networkInformation: !!(
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection
      ),

      // Compression APIs
      compressionStream: typeof CompressionStream !== 'undefined',
      decompressionStream: typeof DecompressionStream !== 'undefined',

      // Modern JavaScript features
      urlSearchParams: typeof URLSearchParams !== 'undefined',
      formData: typeof FormData !== 'undefined',
      blob: typeof Blob !== 'undefined',

      // Event handling
      addEventListener: typeof EventTarget !== 'undefined' &&
                       typeof EventTarget.prototype.addEventListener === 'function',

      // JSON support
      json: typeof JSON !== 'undefined' &&
            typeof JSON.stringify === 'function' &&
            typeof JSON.parse === 'function',

      // Console methods
      console: typeof console !== 'undefined' &&
              typeof console.log === 'function' &&
              typeof console.warn === 'function' &&
              typeof console.error === 'function',

      // Storage APIs
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',

      // Performance API
      performance: typeof performance !== 'undefined' &&
                  typeof performance.now === 'function',

      // Async operations
      promise: typeof Promise !== 'undefined',

      // Fetch API
      fetch: typeof fetch !== 'undefined',

      // Text encoding
      textEncoder: typeof TextEncoder !== 'undefined',
      textDecoder: typeof TextDecoder !== 'undefined'
    };

    return features;
  }

  /**
   * Initialize required polyfills
   */
  initializePolyfills() {
    // URLSearchParams polyfill
    if (!this.features.urlSearchParams) {
      this.polyfills.set('urlSearchParams', this.createURLSearchParamsPolyfill());
    }

    // FormData polyfill
    if (!this.features.formData) {
      this.polyfills.set('formData', this.createFormDataPolyfill());
    }

    // Performance.now polyfill
    if (!this.features.performance) {
      this.polyfills.set('performance', this.createPerformancePolyfill());
    }

    // Console polyfill
    if (!this.features.console) {
      this.polyfills.set('console', this.createConsolePolyfill());
    }

    // JSON polyfill
    if (!this.features.json) {
      this.polyfills.set('json', this.createJSONPolyfill());
    }

    // Promise polyfill
    if (!this.features.promise) {
      this.polyfills.set('promise', this.createPromisePolyfill());
    }
  }

  /**
   * Create URLSearchParams polyfill
   */
  createURLSearchParamsPolyfill() {
    class URLSearchParamsPolyfill {
      constructor(init) {
        this.params = new Map();

        if (typeof init === 'string') {
          this.parseFromString(init);
        } else if (init instanceof URLSearchParamsPolyfill) {
          this.params = new Map(init.params);
        } else if (init && typeof init === 'object') {
          this.parseFromObject(init);
        }
      }

      parseFromString(str) {
        const pairs = str.split('&');
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key) {
            this.append(
              decodeURIComponent(key.replace(/\+/g, ' ')),
              value ? decodeURIComponent(value.replace(/\+/g, ' ')) : ''
            );
          }
        }
      }

      parseFromObject(obj) {
        for (const [key, value] of Object.entries(obj)) {
          this.append(key, value);
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
          values.forEach(value => {
            callback.call(thisArg, value, name, this);
          });
        });
      }

      toString() {
        const pairs = [];
        this.params.forEach((values, name) => {
          values.forEach(value => {
            pairs.push(
              `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
            );
          });
        });
        return pairs.join('&');
      }
    }

    return URLSearchParamsPolyfill;
  }

  /**
   * Create FormData polyfill
   */
  createFormDataPolyfill() {
    class FormDataPolyfill {
      constructor(form) {
        this.data = new Map();

        if (form && form.elements) {
          for (const element of form.elements) {
            if (element.name && !element.disabled) {
              if (element.type === 'file' && element.files.length > 0) {
                this.append(element.name, element.files[0]);
              } else if (element.type !== 'file' && element.type !== 'checkbox' || element.checked) {
                this.append(element.name, element.value);
              }
            }
          }
        }
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
          values.forEach(value => {
            callback.call(thisArg, value, name, this);
          });
        });
      }
    }

    return FormDataPolyfill;
  }

  /**
   * Create Performance polyfill
   */
  createPerformancePolyfill() {
    const startTime = Date.now();

    return {
      now: () => Date.now() - startTime,
      timing: {
        navigationStart: startTime
      }
    };
  }

  /**
   * Create Console polyfill
   */
  createConsolePolyfill() {
    return {
      log: (...args) => {
        // Try to use alert for debugging in very old browsers
        try {
          if (typeof alert !== 'undefined') {
            alert('LOG: ' + args.join(' '));
          }
        } catch (e) {
          // Silent fail
        }
      },
      warn: (...args) => {
        try {
          if (typeof alert !== 'undefined') {
            alert('WARN: ' + args.join(' '));
          }
        } catch (e) {
          // Silent fail
        }
      },
      error: (...args) => {
        try {
          if (typeof alert !== 'undefined') {
            alert('ERROR: ' + args.join(' '));
          }
        } catch (e) {
          // Silent fail
        }
      }
    };
  }

  /**
   * Create JSON polyfill (basic implementation)
   */
  createJSONPolyfill() {
    return {
      stringify: (obj) => {
        if (obj === null) return 'null';
        if (obj === undefined) return 'undefined';
        if (typeof obj === 'string') return '"' + obj.replace(/"/g, '\\"') + '"';
        if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
        if (Array.isArray(obj)) {
          return '[' + obj.map(item => this.stringify(item)).join(',') + ']';
        }
        if (typeof obj === 'object') {
          const pairs = [];
          for (const [key, value] of Object.entries(obj)) {
            pairs.push('"' + key + '":' + this.stringify(value));
          }
          return '{' + pairs.join(',') + '}';
        }
        return '{}';
      },
      parse: (str) => {
        // This is a very basic JSON parser - in production, use a proper library
        try {
          return eval('(' + str + ')');
        } catch (e) {
          throw new Error('Invalid JSON');
        }
      }
    };
  }

  /**
   * Create Promise polyfill (basic implementation)
   */
  createPromisePolyfill() {
    class PromisePolyfill {
      constructor(executor) {
        this.state = 'pending';
        this.value = undefined;
        this.handlers = [];

        const resolve = (value) => {
          if (this.state === 'pending') {
            this.state = 'fulfilled';
            this.value = value;
            this.handlers.forEach(handler => {
              if (handler.onFulfill) {
                setTimeout(() => handler.onFulfill(value), 0);
              }
            });
          }
        };

        const reject = (reason) => {
          if (this.state === 'pending') {
            this.state = 'rejected';
            this.value = reason;
            this.handlers.forEach(handler => {
              if (handler.onReject) {
                setTimeout(() => handler.onReject(reason), 0);
              }
            });
          }
        };

        try {
          executor(resolve, reject);
        } catch (e) {
          reject(e);
        }
      }

      then(onFulfill, onReject) {
        return new PromisePolyfill((resolve, reject) => {
          this.handlers.push({
            onFulfill: (value) => {
              if (onFulfill) {
                try {
                  resolve(onFulfill(value));
                } catch (e) {
                  reject(e);
                }
              } else {
                resolve(value);
              }
            },
            onReject: (reason) => {
              if (onReject) {
                try {
                  resolve(onReject(reason));
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(reason);
              }
            }
          });

          if (this.state !== 'pending') {
            setTimeout(() => {
              if (this.state === 'fulfilled' && onFulfill) {
                try {
                  resolve(onFulfill(this.value));
                } catch (e) {
                  reject(e);
                }
              } else if (this.state === 'rejected' && onReject) {
                try {
                  resolve(onReject(this.value));
                } catch (e) {
                  reject(e);
                }
              }
            }, 0);
          }
        });
      }

      catch(onReject) {
        return this.then(null, onReject);
      }
    }

    return PromisePolyfill;
  }

  /**
   * Get compatible constructor for a feature
   */
  getFeature(featureName) {
    if (this.features[featureName]) {
      return window[featureName] || global[featureName];
    }

    if (this.polyfills.has(featureName)) {
      return this.polyfills.get(featureName);
    }

    return null;
  }

  /**
   * Apply polyfills to global scope
   */
  applyPolyfills() {
    const globalScope = typeof window !== 'undefined' ? window : global;

    // Apply URLSearchParams polyfill
    if (!this.features.urlSearchParams && this.polyfills.has('urlSearchParams')) {
      globalScope.URLSearchParams = this.polyfills.get('urlSearchParams');
    }

    // Apply FormData polyfill
    if (!this.features.formData && this.polyfills.has('formData')) {
      globalScope.FormData = this.polyfills.get('formData');
    }

    // Apply performance polyfill
    if (!this.features.performance && this.polyfills.has('performance')) {
      globalScope.performance = this.polyfills.get('performance');
    }

    // Apply console polyfill
    if (!this.features.console && this.polyfills.has('console')) {
      globalScope.console = this.polyfills.get('console');
    }

    // Apply JSON polyfill
    if (!this.features.json && this.polyfills.has('json')) {
      globalScope.JSON = this.polyfills.get('json');
    }

    // Apply Promise polyfill
    if (!this.features.promise && this.polyfills.has('promise')) {
      globalScope.Promise = this.polyfills.get('promise');
    }
  }

  /**
   * Get browser compatibility report
   */
  getCompatibilityReport() {
    const report = {
      browser: this.getBrowserInfo(),
      features: { ...this.features },
      polyfills: Array.from(this.polyfills.keys()),
      recommendations: []
    };

    // Add recommendations based on missing features
    if (!report.features.networkInformation) {
      report.recommendations.push({
        feature: 'Network Information API',
        impact: 'Network detection will use fallback methods',
        suggestion: 'Consider using a network quality estimation library'
      });
    }

    if (!report.features.compressionStream) {
      report.recommendations.push({
        feature: 'Compression Stream API',
        impact: 'Will use LZ-String library instead of native compression',
        suggestion: 'No action required - library handles this automatically'
      });
    }

    if (!report.features.promise) {
      report.recommendations.push({
        feature: 'Promise API',
        impact: 'Async operations will use polyfill implementation',
        suggestion: 'Consider upgrading to a modern browser for better performance'
      });
    }

    return report;
  }

  /**
   * Get browser information
   */
  getBrowserInfo() {
    const userAgent = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'Unknown';

    // Basic browser detection
    let browser = 'Unknown';
    let version = 'Unknown';

    if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
      version = userAgent.match(/Safari\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge';
      version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('MSIE') > -1) {
      browser = 'Internet Explorer';
      version = userAgent.match(/MSIE (\d+)/)?.[1] || 'Unknown';
    }

    return {
      name: browser,
      version: version,
      userAgent: userAgent,
      supportedFeatures: Object.keys(this.features).filter(key => this.features[key]).length,
      totalFeatures: Object.keys(this.features).length
    };
  }

  /**
   * Check if browser supports minimum required features
   */
  isBrowserSupported() {
    const requiredFeatures = [
      'json',        // Required for data serialization
      'console',     // Required for logging
      'addEventListener' // Required for event handling
    ];

    const optionalButRecommended = [
      'urlSearchParams',
      'formData',
      'promise'
    ];

    const hasRequired = requiredFeatures.every(feature => this.features[feature]);
    const hasRecommended = optionalButRecommended.filter(feature => this.features[feature]).length;

    return {
      supported: hasRequired,
      level: hasRequired ? (hasRecommended >= 2 ? 'full' : 'basic') : 'unsupported',
      missingRequired: requiredFeatures.filter(feature => !this.features[feature]),
      missingRecommended: optionalButRecommended.filter(feature => !this.features[feature])
    };
  }

  /**
   * Get warning messages for missing features
   */
  getCompatibilityWarnings() {
    const warnings = [];

    if (!this.features.networkInformation) {
      warnings.push('Network Information API not available - using fallback network detection');
    }

    if (!this.features.compressionStream) {
      warnings.push('Native compression not available - using LZ-String library');
    }

    if (!this.features.urlSearchParams) {
      warnings.push('URLSearchParams not available - using polyfill');
    }

    if (!this.features.formData) {
      warnings.push('FormData not available - using polyfill');
    }

    if (!this.features.promise) {
      warnings.push('Promise not available - using polyfill (reduced performance)');
    }

    if (!this.features.performance) {
      warnings.push('Performance API not available - using Date for timing');
    }

    return warnings;
  }

  /**
   * Destroy compatibility manager
   */
  destroy() {
    this.polyfills.clear();
  }
}

export { BrowserCompatibilityManager as default };