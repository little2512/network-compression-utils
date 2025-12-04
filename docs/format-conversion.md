# Format Conversion

This document describes the format conversion functionality implemented in Stage 5.

## Overview

The `FormatConverter` class provides comprehensive data format conversion capabilities, supporting transformation between different data representations commonly used in web applications. It seamlessly integrates with the compression and network detection systems.

## Supported Output Formats

### URLSearchParams (Query String Format)
- **Use Case**: HTTP query parameters, URL construction, API requests
- **Browser Support**: Universal (built-in browser API)
- **Character Encoding**: URL-encoded (UTF-8)
- **Size Limit**: ~2048 bytes (typical URL limit)
- **Best For**: Small to medium datasets, HTTP requests

### FormData (Multipart Format)
- **Use Case**: File uploads, form submissions, multipart HTTP requests
- **Browser Support**: Universal (built-in browser API)
- **File Support**: Native support for File and Blob objects
- **Size Limit**: Large (supports file uploads)
- **Best For**: Forms with files, large datasets

### String (JSON Format)
- **Use Case**: API responses, data storage, general purpose
- **Browser Support**: Universal (native JSON support)
- **Encoding**: Plain text or JSON
- **Size Limit**: Large (limited only by memory)
- **Best For**: Complex data structures, API communication

## API Reference

### Core Methods

#### `convertToFormat(data, targetFormat, options): FormatResult`
Converts data to the specified format.

#### `convertBetweenFormats(data, sourceFormat, targetFormat, options): FormatResult`
Converts data between two different formats.

#### `toString(data, options): string`
Converts data to string representation with options.

#### `toUrlSearchParams(data, options): URLSearchParams`
Converts data to URLSearchParams format.

#### `toFormData(data, options): FormData`
Converts data to FormData format.

### Utility Methods

#### `getDataSize(data, format): number`
Calculates the size of data in bytes for a specific format.

#### `validateFormat(data, format): ValidationResult`
Validates data compatibility with target format.

#### `recommendFormat(data, context): string`
Recommends the best format for given data and context.

#### `getFormatInfo(format): Object`
Provides detailed information about a format.

## Usage Examples

### Basic Format Conversion

```javascript
import { FormatConverter } from 'network-compression-utils';

const converter = new FormatConverter();

// Convert object to URLSearchParams
const data = { name: 'John', age: 30, city: 'New York' };
const urlResult = converter.convertToFormat(data, 'urlsearch');

console.log(urlResult.data.toString());
// "name=John&age=30&city=New+York"

// Convert object to FormData
const formResult = converter.convertToFormat(data, 'formdata');

// Convert object to JSON string
const stringResult = converter.convertToFormat(data, 'string');
console.log(stringResult.data);
// '{"name":"John","age":30,"city":"New York"}'
```

### Advanced Options

```javascript
// String conversion with pretty formatting
const prettyResult = converter.convertToFormat(data, 'string', {
  pretty: true
});
console.log(prettyResult.data);
// {
//   "name": "John",
//   "age": 30,
//   "city": "New York"
// }

// String conversion with base64 encoding
const base64Result = converter.convertToFormat(data, 'string', {
  base64: true
});

// URLSearchParams with custom prefix and array handling
const complexData = {
  user: {
    name: 'John',
    tags: ['developer', 'javascript', 'react']
  }
};

const urlResult = converter.convertToFormat(complexData, 'urlsearch', {
  prefix: 'api',
  arrayFormat: 'indices', // 'brackets', 'indices', or 'repeat'
});
// "api.user.name=John&api.user.tags[0]=developer&api.user.tags[1]=javascript&api.user.tags[2]=react"
```

### Format Conversion Between Types

```javascript
// Convert URLSearchParams back to object
const params = new URLSearchParams('name=John&age=30');
const result = converter.convertBetweenFormats(params, 'urlsearch', 'string');

// Convert between all supported formats
const originalData = { user: 'John', active: true };

// String → URLSearchParams → FormData → String
const urlResult = converter.convertBetweenFormats(originalData, 'string', 'urlsearch');
const formResult = converter.convertBetweenFormats(urlResult.data, 'urlsearch', 'formdata');
const finalResult = converter.convertBetweenFormats(formResult.data, 'formdata', 'string');
```

### Handling Complex Data Structures

```javascript
const complexData = {
  user: {
    profile: {
      name: 'John Doe',
      addresses: [
        { type: 'home', street: '123 Main St', city: 'New York' },
        { type: 'work', street: '456 Office Blvd', city: 'San Francisco' }
      ],
      preferences: {
        theme: 'dark',
        notifications: ['email', 'sms', 'push'],
        privacy: {
          showEmail: true,
          showLocation: false
        }
      }
  },
  metadata: {
    created: new Date(),
    version: '1.0.0'
  }
};

// Convert to URLSearchParams (flattened)
const urlResult = converter.convertToFormat(complexData, 'urlsearch');
// user.profile.name=John+Doe
// user.profile.addresses[0].type=home
// user.profile.addresses[0].street=123+Main+St
// user.profile.addresses[0].city=New+York
// user.profile.preferences.theme=dark
// user.profile.preferences.notifications[0]=email
// user.profile.privacy.showEmail=true
// user.metadata.created=2023-01-01T00:00:00.000Z
// user.metadata.version=1.0.0
```

### File and Blob Handling

```javascript
const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
const data = {
  name: 'John Doe',
  document: file,
  avatar: new Blob(['avatar-image-data'], { type: 'image/jpeg' })
};

// FormData handles files natively
const formResult = converter.convertToFormat(data, 'formdata');
console.log(formResult.data.get('document')); // File object
console.log(formResult.data.get('avatar')); // Blob object

// URLSearchParams converts files to string representations
const urlResult = converter.convertToFormat(data, 'urlsearch');
// Warning: File/Blob objects will be converted to filenames in URLSearchParams
```

### Format Validation

```javascript
const data = { name: 'John', file: new File(['content'], 'test.txt') };

// Validate URLSearchParams compatibility
const urlValidation = converter.validateFormat(data, 'urlsearch');
console.log(urlValidation);
// {
//   valid: true,
//   warnings: ['File/Blob objects will be converted to filenames in URLSearchParams'],
//   errors: []
// }

// Validate FormData compatibility
const formValidation = converter.validateFormat(data, 'formdata');
// {
//   valid: true,
//   warnings: [],
//   errors: []
// }
```

### Format Recommendations

```javascript
// Get format recommendations based on data and context
const data = { user: 'John', preferences: { theme: 'dark' } };

// For file uploads
const fileData = { document: new File(['content'], 'doc.pdf') };
const fileRecommendation = converter.recommendFormat(fileData, { hasFiles: true });
// 'formdata'

// For URL parameters
const urlRecommendation = converter.recommendFormat(data, { useCase: 'url' });
// 'urlsearch'

// For small data
const smallRecommendation = converter.recommendFormat(data, { maxSize: 100 });
// 'urlsearch'

// For general use
const generalRecommendation = converter.recommendFormat(data, { useCase: 'general' });
// 'string'
```

### Data Size Calculation

```javascript
const data = { name: 'John', description: 'A long text description...'.repeat(10) };

// Calculate size for different formats
const stringSize = converter.getDataSize(data, 'string');
const urlSize = converter.getDataSize(converter.convertToFormat(data, 'urlsearch').data, 'urlsearch');
const formSize = converter.getDataSize(converter.convertToFormat(data, 'formdata').data, 'formdata');

console.log(`String: ${stringSize} bytes`);
console.log(`URLSearchParams: ${urlSize} bytes`);
console.log(`FormData: ${formSize} bytes`);
```

## Array Handling Options

### Brackets Format (Default)
```javascript
const data = { items: ['apple', 'banana', 'cherry'] };
const result = converter.convertToFormat(data, 'urlsearch', { arrayFormat: 'brackets' });
// items[]=apple&items[]=banana&items[]=cherry
```

### Indices Format
```javascript
const result = converter.convertToFormat(data, 'urlsearch', { arrayFormat: 'indices' });
// items[0]=apple&items[1]=banana&items[2]=cherry
```

### Repeat Format
```javascript
const result = converter.convertToFormat(data, 'urlsearch', { arrayFormat: 'repeat' });
// items=apple&items=banana&items=cherry
```

## Integration with Compression System

The format converter is integrated into the main `NetworkCompressionUtils` class:

```javascript
import { NetworkCompressionUtils } from 'network-compression-utils';

const ncu = new NetworkCompressionUtils();

// Process data with specific output format
const result = ncu.compress({
  data: { user: 'John', preferences: ['email', 'sms'] },
  outputFormat: 'urlsearch', // or 'formdata', 'string'
});

console.log(result);
// {
//   compressed: true,
//   data: URLSearchParams('user=John&preferences[0]=email&preferences[1]=sms'),
//   outputFormat: 'urlsearch',
//   networkType: '4g',
//   algorithm: 'lz-string',
//   processingTime: 12.5
// }
```

## Format Information

Each format provides detailed information:

```javascript
const converter = new FormatConverter();

const urlInfo = converter.getFormatInfo('urlsearch');
console.log(urlInfo);
// {
//   name: 'URLSearchParams',
//   description: 'URL-encoded query string format',
//   useCase: 'HTTP query parameters, URL construction',
//   browserSupport: 'Universal',
//   maxSize: '2048 bytes (URL limit)'
// }
```

## Error Handling

The format converter provides robust error handling:

```javascript
// Handle unsupported formats
const result = converter.convertToFormat(data, 'unsupported');
if (!result.success) {
  console.error('Conversion failed:', result.error);
}

// Handle circular references
const circularData = { name: 'test' };
circularData.self = circularData;

const stringResult = converter.convertToFormat(circularData, 'string');
console.log(stringResult.data); // String representation with circular reference handling
```

## Performance Considerations

### Memory Usage
- Format conversion creates new objects, consider reuse for large datasets
- File/Blob objects are handled by reference, not copied
- Large objects may require significant memory for string conversion

### Processing Time
- URLSearchParams: Fast for simple objects, slower for deeply nested structures
- FormData: Fast for all data types, handles files efficiently
- String: Fast for simple data, slower for complex objects requiring JSON serialization

### Size Optimization
- URLSearchParams: Best for small datasets (< 2KB)
- FormData: Best for datasets with files or binary data
- String: Best for complex structures and API communication

## Browser Compatibility

### Universal Support
All formats are supported in all modern browsers:
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Full support on iOS Safari and Android Chrome

### Format-Specific Considerations

#### URLSearchParams
- Native in all modern browsers
- Automatically handles URL encoding
- Limited to string values

#### FormData
- Native in all modern browsers
- Supports File and Blob objects
- Automatically handles multipart boundaries

#### String/JSON
- Native JSON.parse/stringify in all browsers
- Circular reference handling in modern browsers
- UTF-8 encoding support

## Best Practices

### Format Selection Guidelines

1. **Use URLSearchParams for**:
   - HTTP query parameters
   - Small to medium datasets (< 2KB)
   - URL construction
   - Form submissions without files

2. **Use FormData for**:
   - File uploads
   - Form submissions with binary data
   - Large datasets
   - Multipart HTTP requests

3. **Use String for**:
   - API responses and requests
   - Complex data structures
   - Data storage
   - General purpose communication

### Performance Optimization

1. **Reuse FormatConverter Instances**
   ```javascript
   const converter = new FormatConverter(); // Create once, reuse
   ```

2. **Choose Appropriate Format Early**
   ```javascript
   const format = converter.recommendFormat(data, context);
   // Use the recommended format throughout your application
   ```

3. **Handle Large Data Carefully**
   ```javascript
   if (converter.getDataSize(data, 'string') > 1024 * 1024) {
     // Consider streaming or chunking for very large data
   }
   ```

### Security Considerations

1. **URL Encoding**: URLSearchParams automatically encodes special characters
2. **File Handling**: FormData maintains file type and size information
3. **Data Sanitization**: Always validate and sanitize data before conversion
4. **Size Limits**: Consider URL length limits for URLSearchParams

## Testing

Comprehensive tests are provided in `src/format-converter.test.js`:

- **Format Conversion Tests**: All format conversions with various data types
- **Error Handling Tests**: Invalid formats, circular references, edge cases
- **Performance Tests**: Large datasets, memory usage, processing time
- **Integration Tests**: Format conversion between different types
- **Validation Tests**: Format compatibility and recommendation logic