/**
 * Format Converter Module
 * Handles conversion between different output formats
 */

/**
 * Format conversion result
 * @typedef {Object} FormatResult
 * @property {boolean} success - Whether conversion was successful
 * @property {string|URLSearchParams|FormData} data - Converted data
 * @property {string} format - Result format
 * @property {string} error - Error message if conversion failed
 */

/**
 * Available output formats
 */
const OUTPUT_FORMATS = {
  URLSEARCH: 'urlsearch',
  FORMDATA: 'formdata',
  STRING: 'string',
};

export default class FormatConverter {
  constructor(options = {}) {
    this.URLSearchParams = options.URLSearchParams || URLSearchParams;
    this.FormData = options.FormData || FormData;
    this.supportedFormats = Object.values(OUTPUT_FORMATS);
  }

  /**
   * Convert data to specified format
   * @param {any} data - Data to convert
   * @param {string} targetFormat - Target format ('urlsearch', 'formdata', 'string')
   * @param {Object} options - Conversion options
   * @returns {FormatResult} - Conversion result
   */
  convertToFormat(data, targetFormat, options = {}) {
    try {
      if (!this.isFormatSupported(targetFormat)) {
        return this.createResult(
          false,
          null,
          targetFormat,
          `Unsupported format: ${targetFormat}`
        );
      }

      let convertedData;

      switch (targetFormat) {
        case OUTPUT_FORMATS.URLSEARCH:
          convertedData = this.toUrlSearchParams(data, options);
          break;
        case OUTPUT_FORMATS.FORMDATA:
          convertedData = this.toFormData(data, options);
          break;
        case OUTPUT_FORMATS.STRING:
          convertedData = this.toString(data, options);
          break;
        default:
          return this.createResult(
            false,
            null,
            targetFormat,
            `Unknown format: ${targetFormat}`
          );
      }

      return this.createResult(true, convertedData, targetFormat);
    } catch (error) {
      return this.createResult(
        false,
        null,
        targetFormat,
        `Conversion failed: ${error.message}`
      );
    }
  }

  /**
   * Convert data to URLSearchParams
   * @param {any} data - Data to convert
   * @param {Object} options - Conversion options
   * @returns {URLSearchParams} - URLSearchParams object
   */
  toUrlSearchParams(data, options = {}) {
    const {
      prefix = '',  // Changed to empty string to avoid prefixing simple objects
      encode = true,
      arrayFormat = 'brackets', // 'brackets', 'indices', 'repeat'
    } = options;

    const params = new this.URLSearchParams();

    if (data === null || data === undefined) {
      return params;
    }

    const flattened = this.flattenData(data, prefix, arrayFormat);

    for (const [key, value] of Object.entries(flattened)) {
      if (value !== null && value !== undefined) {
        const stringValue = String(value);
        if (encode) {
          params.append(key, encodeURIComponent(stringValue));
        } else {
          params.append(key, stringValue);
        }
      }
    }

    return params;
  }

  /**
   * Convert data to FormData
   * @param {any} data - Data to convert
   * @param {Object} options - Conversion options
   * @returns {FormData} - FormData object
   */
  toFormData(data, options = {}) {
    const {
      prefix = '',  // Changed to empty string to avoid prefixing simple objects
      arrayFormat = 'brackets',
      includeNullValues = false,
    } = options;

    const formData = new this.FormData();

    if (data === null || data === undefined) {
      return formData;
    }

    const flattened = this.flattenData(data, prefix, arrayFormat);

    for (const [key, value] of Object.entries(flattened)) {
      if (value === null || value === undefined) {
        if (includeNullValues) {
          formData.append(key, '');
        }
        continue;
      }

      // Handle File objects and Blobs
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(key, String(item));
        });
      } else {
        formData.append(key, String(value));
      }
    }

    return formData;
  }

  /**
   * Convert data to string
   * @param {any} data - Data to convert
   * @param {Object} options - Conversion options
   * @returns {string} - String representation
   */
  toString(data, options = {}) {
    const { pretty = false, base64 = false } = options;

    let stringData;

    if (typeof data === 'string') {
      stringData = data;
    } else if (data instanceof URLSearchParams) {
      stringData = data.toString();
    } else if (data instanceof FormData) {
      stringData = this.formDataToString(data);
    } else {
      try {
        stringData = pretty
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data);
      } catch (error) {
        // Fallback for circular references or non-serializable data
        stringData = String(data);
      }
    }

    if (base64) {
      try {
        stringData = btoa(unescape(encodeURIComponent(stringData)));
      } catch (error) {
        throw new Error(`Base64 encoding failed: ${error.message}`);
      }
    }

    return stringData;
  }

  /**
   * Convert between formats
   * @param {any} data - Data to convert
   * @param {string} sourceFormat - Source format
   * @param {string} targetFormat - Target format
   * @param {Object} options - Conversion options
   * @returns {FormatResult} - Conversion result
   */
  convertBetweenFormats(data, sourceFormat, targetFormat, options = {}) {
    try {
      // First convert data to a neutral format (string)
      const intermediate = this.convertToIntermediateFormat(data, sourceFormat);

      // Then convert from intermediate to target format
      return this.convertFromIntermediateFormat(
        intermediate,
        targetFormat,
        options
      );
    } catch (error) {
      return this.createResult(
        false,
        null,
        targetFormat,
        `Format conversion failed: ${error.message}`
      );
    }
  }

  /**
   * Convert data to intermediate format (string)
   * @param {any} data - Source data
   * @param {string} sourceFormat - Source format
   * @returns {string} - Intermediate string representation
   */
  convertToIntermediateFormat(data, sourceFormat) {
    switch (sourceFormat) {
      case OUTPUT_FORMATS.STRING:
        return data;
      case OUTPUT_FORMATS.URLSEARCH:
        return data instanceof URLSearchParams ? data.toString() : String(data);
      case OUTPUT_FORMATS.FORMDATA:
        return data instanceof FormData
          ? this.formDataToString(data)
          : String(data);
      default:
        // Assume it's raw data that needs stringification
        return typeof data === 'string' ? data : JSON.stringify(data);
    }
  }

  /**
   * Convert from intermediate format to target format
   * @param {string} intermediateData - Intermediate string data
   * @param {string} targetFormat - Target format
   * @param {Object} options - Conversion options
   * @returns {FormatResult} - Conversion result
   */
  convertFromIntermediateFormat(intermediateData, targetFormat, options = {}) {
    try {
      // Try to parse as JSON first
      let parsedData;
      try {
        parsedData = JSON.parse(intermediateData);
      } catch {
        parsedData = intermediateData;
      }

      return this.convertToFormat(parsedData, targetFormat, options);
    } catch (error) {
      return this.createResult(
        false,
        null,
        targetFormat,
        `Intermediate conversion failed: ${error.message}`
      );
    }
  }

  /**
   * Flatten nested data for URL and FormData conversion
   * @param {any} data - Data to flatten
   * @param {string} prefix - Key prefix
   * @param {string} arrayFormat - Array format ('brackets', 'indices', 'repeat')
   * @returns {Object} - Flattened object
   */
  flattenData(data, prefix = '', arrayFormat = 'brackets') {
    const flattened = {};

    const flatten = (obj, currentKey = '') => {
      if (obj === null || obj === undefined) {
        flattened[currentKey] = obj;
        return;
      }

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          let key;
          switch (arrayFormat) {
            case 'indices':
              key = `${currentKey}[${index}]`;
              break;
            case 'repeat':
              key = currentKey;
              break;
            case 'brackets':
            default:
              key = `${currentKey}[]`;
              break;
          }
          flatten(item, key);
        });
        return;
      }

      if (
        typeof obj === 'object' &&
        !(obj instanceof Date) &&
        !(obj instanceof File) &&
        !(obj instanceof Blob)
      ) {
        Object.entries(obj).forEach(([key, value]) => {
          const newKey = currentKey ? `${currentKey}.${key}` : key;
          flatten(value, newKey);
        });
        return;
      }

      // Handle Date objects
      if (obj instanceof Date) {
        flattened[currentKey] = obj.toISOString();
        return;
      }

      // Handle File and Blob objects
      if (obj instanceof File || obj instanceof Blob) {
        flattened[currentKey] = obj;
        return;
      }

      // Primitive value
      flattened[currentKey] = obj;
    };

    flatten(data, prefix);
    return flattened;
  }

  /**
   * Convert FormData to string representation
   * @param {FormData} formData - FormData to convert
   * @returns {string} - String representation
   */
  formDataToString(formData) {
    const pairs = [];
    for (const [key, value] of formData.entries()) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    return pairs.join('&');
  }

  /**
   * Get data size in bytes for different formats
   * @param {any} data - Data to measure
   * @param {string} format - Data format
   * @returns {number} - Size in bytes
   */
  getDataSize(data, format) {
    try {
      switch (format) {
        case OUTPUT_FORMATS.URLSEARCH:
          if (data instanceof URLSearchParams) {
            return new Blob([data.toString()]).size;
          }
          break;
        case OUTPUT_FORMATS.FORMDATA:
          if (data instanceof FormData) {
            let size = 0;
            for (const [key, value] of data.entries()) {
              size += new Blob([key]).size;
              if (value instanceof Blob) {
                size += value.size;
              } else {
                size += new Blob([String(value)]).size;
              }
            }
            return size;
          }
          break;
        case OUTPUT_FORMATS.STRING:
          if (typeof data === 'string') {
            return new Blob([data]).size;
          }
          break;
      }

      // Fallback: convert to string and measure
      const stringData = this.toString(data);
      return new Blob([stringData]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Validate format compatibility with data
   * @param {any} data - Data to validate
   * @param {string} format - Target format
   * @returns {Object} - Validation result
   */
  validateFormat(data, format) {
    const result = {
      valid: true,
      warnings: [],
      errors: [],
    };

    switch (format) {
      case OUTPUT_FORMATS.URLSEARCH:
        // URLSearchParams can't handle File/Blob objects directly
        if (this.containsFiles(data)) {
          result.warnings.push(
            'File/Blob objects will be converted to filenames in URLSearchParams'
          );
        }
        break;

      case OUTPUT_FORMATS.FORMDATA:
        // FormData is compatible with most data types
        break;

      case OUTPUT_FORMATS.STRING:
        // String format has limitations for complex objects
        if (this.hasCircularReferences(data)) {
          result.warnings.push(
            'Circular references will be converted to string representations'
          );
        }
        break;

      default:
        result.valid = false;
        result.errors.push(`Unknown format: ${format}`);
        break;
    }

    return result;
  }

  /**
   * Check if data contains File or Blob objects
   * @param {any} data - Data to check
   * @returns {boolean} - True if contains files
   */
  containsFiles(data) {
    if (data instanceof File || data instanceof Blob) {
      return true;
    }

    if (Array.isArray(data)) {
      return data.some((item) => this.containsFiles(item));
    }

    if (data && typeof data === 'object') {
      return Object.values(data).some((value) => this.containsFiles(value));
    }

    return false;
  }

  /**
   * Check if data has circular references
   * @param {any} data - Data to check
   * @returns {boolean} - True if has circular references
   */
  hasCircularReferences(data) {
    try {
      JSON.stringify(data);
      return false;
    } catch (error) {
      return error.message.includes('circular');
    }
  }

  /**
   * Get supported formats
   * @returns {string[]} - Array of supported formats
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  /**
   * Check if format is supported
   * @param {string} format - Format to check
   * @returns {boolean} - True if supported
   */
  isFormatSupported(format) {
    return this.supportedFormats.includes(format);
  }

  /**
   * Create format result object
   * @param {boolean} success - Success status
   * @param {any} data - Result data
   * @param {string} format - Format
   * @param {string} [error] - Error message
   * @returns {FormatResult} - Result object
   */
  createResult(success, data, format, error = null) {
    return {
      success,
      data,
      format,
      error,
    };
  }

  /**
   * Get format information
   * @param {string} format - Format
   * @returns {Object} - Format information
   */
  getFormatInfo(format) {
    const formatInfo = {
      [OUTPUT_FORMATS.URLSEARCH]: {
        name: 'URLSearchParams',
        description: 'URL-encoded query string format',
        useCase: 'HTTP query parameters, URL construction',
        browserSupport: 'Universal',
        maxSize: '2048 bytes (URL limit)',
      },
      [OUTPUT_FORMATS.FORMDATA]: {
        name: 'FormData',
        description: 'Form data format for multipart/form-data',
        useCase: 'File uploads, form submissions',
        browserSupport: 'Universal',
        maxSize: 'Large (supports file uploads)',
      },
      [OUTPUT_FORMATS.STRING]: {
        name: 'String',
        description: 'Plain string or JSON format',
        useCase: 'General purpose, API responses',
        browserSupport: 'Universal',
        maxSize: 'Large',
      },
    };

    return formatInfo[format] || null;
  }

  /**
   * Recommend best format for data
   * @param {any} data - Data to analyze
   * @param {Object} context - Usage context
   * @returns {string} - Recommended format
   */
  recommendFormat(data, context = {}) {
    const { useCase = 'general', hasFiles = false, maxSize = null } = context;

    // If files are present, FormData is the best choice
    if (hasFiles || this.containsFiles(data)) {
      return OUTPUT_FORMATS.FORMDATA;
    }

    // For URL parameters or small data, URLSearchParams is good
    if (useCase === 'url' || (maxSize && maxSize < 1024)) {
      return OUTPUT_FORMATS.URLSEARCH;
    }

    // Default to string format
    return OUTPUT_FORMATS.STRING;
  }
}
