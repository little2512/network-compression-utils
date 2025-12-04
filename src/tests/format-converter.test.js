/**
 * Format Converter Tests
 */

import FormatConverter from '../format-converter.js';

describe('FormatConverter', () => {
  let converter;

  beforeEach(() => {
    converter = new FormatConverter({
      URLSearchParams: global.URLSearchParams || URLSearchParams,
      FormData: global.FormData || FormData,
    });
  });

  describe('Basic Conversion', () => {
    test('should convert simple object to URLSearchParams', () => {
      const data = { name: 'John', age: 30 };
      const result = converter.convertToFormat(data, 'urlsearch');

      expect(result.success).toBe(true);
      expect(result.format).toBe('urlsearch');
      expect(result.data).toBeInstanceOf(URLSearchParams);
      expect(result.data.get('name')).toBe('John');
      expect(result.data.get('age')).toBe('30');
    });

    test('should convert simple object to FormData', () => {
      const data = { name: 'John', age: 30 };
      const result = converter.convertToFormat(data, 'formdata');

      expect(result.success).toBe(true);
      expect(result.format).toBe('formdata');
      expect(result.data).toBeInstanceOf(FormData);
      expect(result.data.get('name')).toBe('John');
      expect(result.data.get('age')).toBe('30');
    });

    test('should convert object to string', () => {
      const data = { name: 'John', age: 30 };
      const result = converter.convertToFormat(data, 'string');

      expect(result.success).toBe(true);
      expect(result.format).toBe('string');
      expect(result.data).toBe('{"name":"John","age":30}');
    });

    test('should convert string to string (pass-through)', () => {
      const data = 'Hello, World!';
      const result = converter.convertToFormat(data, 'string');

      expect(result.success).toBe(true);
      expect(result.format).toBe('string');
      expect(result.data).toBe('Hello, World!');
    });

    test('should handle null and undefined data', () => {
      const nullResult = converter.convertToFormat(null, 'string');
      const undefinedResult = converter.convertToFormat(undefined, 'string');

      expect(nullResult.success).toBe(true);
      expect(nullResult.data).toBe('null');
      expect(undefinedResult.success).toBe(true);
      expect(undefinedResult.data).toBe('');
    });
  });

  describe('Nested Object Conversion', () => {
    test('should flatten nested objects for URLSearchParams', () => {
      const data = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            city: 'New York',
          },
        },
      };

      const result = converter.convertToFormat(data, 'urlsearch');

      expect(result.success).toBe(true);
      expect(result.data.get('user.name')).toBe('John');
      expect(result.data.get('user.profile.age')).toBe('30');
      expect(result.data.get('user.profile.city')).toBe('New York');
    });

    test('should handle arrays with different formats', () => {
      const data = { items: ['apple', 'banana', 'cherry'] };

      // Test brackets format
      const bracketsResult = converter.convertToFormat(data, 'urlsearch', {
        arrayFormat: 'brackets',
      });
      expect(bracketsResult.success).toBe(true);
      expect(bracketsResult.data.getAll('items[]')).toEqual([
        'apple',
        'banana',
        'cherry',
      ]);

      // Test indices format
      const indicesResult = converter.convertToFormat(data, 'urlsearch', {
        arrayFormat: 'indices',
      });
      expect(indicesResult.success).toBe(true);
      expect(indicesResult.data.get('items[0]')).toBe('apple');
      expect(indicesResult.data.get('items[1]')).toBe('banana');

      // Test repeat format
      const repeatResult = converter.convertToFormat(data, 'urlsearch', {
        arrayFormat: 'repeat',
      });
      expect(repeatResult.success).toBe(true);
      expect(repeatResult.data.getAll('items')).toEqual([
        'apple',
        'banana',
        'cherry',
      ]);
    });

    test('should handle complex nested structures', () => {
      const data = {
        order: {
          id: 123,
          customer: {
            name: 'John Doe',
            addresses: [
              { type: 'home', street: '123 Main St' },
              { type: 'work', street: '456 Office Blvd' },
            ],
          },
          items: [
            { id: 1, name: 'Product 1', price: 29.99 },
            { id: 2, name: 'Product 2', price: 49.99 },
          ],
        },
      };

      const result = converter.convertToFormat(data, 'urlsearch');

      expect(result.success).toBe(true);
      expect(result.data.get('order.id')).toBe('123');
      expect(result.data.get('order.customer.name')).toBe('John Doe');
      expect(result.data.get('order.customer.addresses[0].type')).toBe('home');
      expect(result.data.get('order.items[0].name')).toBe('Product 1');
    });
  });

  describe('Special Data Types', () => {
    test('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const data = { createdAt: date };

      const result = converter.convertToFormat(data, 'urlsearch');

      expect(result.success).toBe(true);
      expect(result.data.get('createdAt')).toBe('2023-01-01T00:00:00.000Z');
    });

    test('should handle File objects in FormData', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const data = { document: file };

      const result = converter.convertToFormat(data, 'formdata');

      expect(result.success).toBe(true);
      expect(result.data.get('document')).toBe(file);
    });

    test('should handle Blob objects in FormData', () => {
      const blob = new Blob(['content'], { type: 'text/plain' });
      const data = { data: blob };

      const result = converter.convertToFormat(data, 'formdata');

      expect(result.success).toBe(true);
      expect(result.data.get('data')).toBe(blob);
    });

    test('should convert File objects to string in URLSearchParams', () => {
      const file = new File(['content'], 'test.txt');
      const data = { document: file };

      const result = converter.convertToFormat(data, 'urlsearch');

      expect(result.success).toBe(true);
      expect(result.data.get('document')).toBe('[object File]');
    });
  });

  describe('String Conversion Options', () => {
    test('should convert with pretty formatting', () => {
      const data = { name: 'John', details: { age: 30 } };

      const prettyResult = converter.convertToFormat(data, 'string', {
        pretty: true,
      });
      const compactResult = converter.convertToFormat(data, 'string', {
        pretty: false,
      });

      expect(prettyResult.success).toBe(true);
      expect(compactResult.success).toBe(true);
      expect(prettyResult.data).toContain('\n');
      expect(compactResult.data).not.toContain('\n');
    });

    test('should convert to base64', () => {
      const data = 'Hello, World!';

      const result = converter.convertToFormat(data, 'string', {
        base64: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(btoa('Hello, World!'));
    });
  });

  describe('Format Conversion Between Types', () => {
    test('should convert URLSearchParams to FormData', () => {
      const params = new URLSearchParams();
      params.append('name', 'John');
      params.append('age', '30');

      const result = converter.convertBetweenFormats(
        params,
        'urlsearch',
        'formdata'
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('formdata');
      expect(result.data.get('name')).toBe('John');
      expect(result.data.get('age')).toBe('30');
    });

    test('should convert FormData to URLSearchParams', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('age', '30');

      const result = converter.convertBetweenFormats(
        formData,
        'formdata',
        'urlsearch'
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('urlsearch');
      expect(result.data.get('name')).toBe('John');
      expect(result.data.get('age')).toBe('30');
    });

    test('should convert between all supported formats', () => {
      const originalData = { user: 'John', active: true };

      // String to URLSearchParams
      const urlResult = converter.convertBetweenFormats(
        originalData,
        'string',
        'urlsearch'
      );
      expect(urlResult.success).toBe(true);

      // URLSearchParams to FormData
      const formResult = converter.convertBetweenFormats(
        urlResult.data,
        'urlsearch',
        'formdata'
      );
      expect(formResult.success).toBe(true);

      // FormData back to String
      const stringResult = converter.convertBetweenFormats(
        formResult.data,
        'formdata',
        'string'
      );
      expect(stringResult.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported formats', () => {
      const data = { test: 'data' };
      const result = converter.convertToFormat(data, 'unsupported');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported format');
    });

    test('should handle circular references in string conversion', () => {
      const data = { name: 'test' };
      data.self = data; // Create circular reference

      const result = converter.convertToFormat(data, 'string');

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
    });
  });

  describe('Data Size Calculation', () => {
    test('should calculate size for different formats', () => {
      const data = { name: 'John', age: 30 };

      const stringSize = converter.getDataSize(data, 'string');
      const urlParamsSize = converter.getDataSize(
        converter.convertToFormat(data, 'urlsearch').data,
        'urlsearch'
      );
      const formDataSize = converter.getDataSize(
        converter.convertToFormat(data, 'formdata').data,
        'formdata'
      );

      expect(stringSize).toBeGreaterThan(0);
      expect(urlParamsSize).toBeGreaterThan(0);
      expect(formDataSize).toBeGreaterThan(0);
    });

    test('should handle size calculation errors gracefully', () => {
      const circularData = { name: 'test' };
      circularData.self = circularData;

      const size = converter.getDataSize(circularData, 'string');

      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Format Validation', () => {
    test('should validate format compatibility', () => {
      const data = { name: 'John', file: new File(['content'], 'test.txt') };

      const urlValidation = converter.validateFormat(data, 'urlsearch');
      const formValidation = converter.validateFormat(data, 'formdata');
      const stringValidation = converter.validateFormat(data, 'string');

      expect(urlValidation.valid).toBe(true);
      expect(urlValidation.warnings.length).toBeGreaterThan(0); // File warning

      expect(formValidation.valid).toBe(true);
      expect(formValidation.warnings.length).toBe(0);

      expect(stringValidation.valid).toBe(true);
    });

    test('should detect circular references for string format', () => {
      const data = { name: 'test' };
      data.self = data;

      const validation = converter.validateFormat(data, 'string');

      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    test('should handle invalid formats in validation', () => {
      const data = { test: 'data' };

      const validation = converter.validateFormat(data, 'invalid');

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Methods', () => {
    test('should return supported formats', () => {
      const formats = converter.getSupportedFormats();

      expect(formats).toContain('urlsearch');
      expect(formats).toContain('formdata');
      expect(formats).toContain('string');
    });

    test('should check format support', () => {
      expect(converter.isFormatSupported('urlsearch')).toBe(true);
      expect(converter.isFormatSupported('formdata')).toBe(true);
      expect(converter.isFormatSupported('string')).toBe(true);
      expect(converter.isFormatSupported('invalid')).toBe(false);
    });

    test('should provide format information', () => {
      const urlInfo = converter.getFormatInfo('urlsearch');
      const formInfo = converter.getFormatInfo('formdata');
      const stringInfo = converter.getFormatInfo('string');
      const invalidInfo = converter.getFormatInfo('invalid');

      expect(urlInfo.name).toBe('URLSearchParams');
      expect(urlInfo.description).toBeDefined();
      expect(urlInfo.useCase).toBeDefined();

      expect(formInfo.name).toBe('FormData');
      expect(formInfo.description).toBeDefined();

      expect(stringInfo.name).toBe('String');
      expect(stringInfo.description).toBeDefined();

      expect(invalidInfo).toBeNull();
    });
  });

  describe('Format Recommendations', () => {
    test('should recommend FormData for file data', () => {
      const data = { file: new File(['content'], 'test.txt') };

      const recommended = converter.recommendFormat(data, { hasFiles: true });

      expect(recommended).toBe('formdata');
    });

    test('should recommend URLSearchParams for URL use case', () => {
      const data = { param1: 'value1', param2: 'value2' };

      const recommended = converter.recommendFormat(data, { useCase: 'url' });

      expect(recommended).toBe('urlsearch');
    });

    test('should recommend string for general use', () => {
      const data = { complex: 'object', with: 'multiple', properties: 'here' };

      const recommended = converter.recommendFormat(data, {
        useCase: 'general',
      });

      expect(recommended).toBe('string');
    });

    test('should recommend URLSearchParams for small data', () => {
      const data = { small: 'data' };

      const recommended = converter.recommendFormat(data, { maxSize: 100 });

      expect(recommended).toBe('urlsearch');
    });
  });

  describe('FormData String Representation', () => {
    test('should convert FormData to query string', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('age', '30');
      formData.append('active', 'true');

      const result = converter.formDataToString(formData);

      expect(result).toContain('name=John');
      expect(result).toContain('age=30');
      expect(result).toContain('active=true');
    });

    test('should handle special characters in FormData', () => {
      const formData = new FormData();
      formData.append('message', 'Hello & World!');
      formData.append('email', 'test@example.com');

      const result = converter.formDataToString(formData);

      expect(result).toContain('message=Hello+%26+World%21');
      expect(result).toContain('email=test%40example.com');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty objects', () => {
      const data = {};

      const urlResult = converter.convertToFormat(data, 'urlsearch');
      const formResult = converter.convertToFormat(data, 'formdata');
      const stringResult = converter.convertToFormat(data, 'string');

      expect(urlResult.success).toBe(true);
      expect(formResult.success).toBe(true);
      expect(stringResult.success).toBe(true);
      expect(stringResult.data).toBe('{}');
    });

    test('should handle empty arrays', () => {
      const data = { items: [] };

      const result = converter.convertToFormat(data, 'urlsearch');

      expect(result.success).toBe(true);
      expect(result.data.has('items[]')).toBe(false);
    });

    test('should handle deeply nested structures', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                deep: 'value',
              },
            },
          },
        },
      };

      const result = converter.convertToFormat(data, 'urlsearch');

      expect(result.success).toBe(true);
      expect(result.data.get('level1.level2.level3.level4.deep')).toBe('value');
    });

    test('should handle mixed data types', () => {
      const date = new Date();
      const data = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 'two', { three: 3 }],
        date: date,
        nested: {
          inner: 'value',
        },
      };

      const result = converter.convertToFormat(data, 'string');

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.data);
      expect(parsed.string).toBe('text');
      expect(parsed.number).toBe(42);
      expect(parsed.boolean).toBe(true);
      expect(parsed.null).toBeNull();
      expect(parsed.date).toBe(date.toISOString());
    });
  });
});
