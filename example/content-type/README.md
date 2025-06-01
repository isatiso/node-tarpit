# Tarpit Content Type Module Examples

This directory contains examples demonstrating the Tarpit Content Type module's content parsing, decompression, and deserialization capabilities.

## Examples Overview

### 1. Simple Demo (`simple-demo.ts`)

A comprehensive example showcasing:
- **JSON Processing**: Parse JSON data with Unicode support
- **Form Data Handling**: URL-encoded form data with arrays and special characters
- **Text Processing**: Multi-line text with character encoding
- **Error Handling**: Graceful handling of invalid content
- **URL Encoding**: Query string parsing and generation utilities
- **Direct Deserializers**: Testing individual deserializer functions

**Features Demonstrated:**
- Content type detection and processing
- Character encoding handling (UTF-8)
- Binary data handling
- Error tolerance for malformed content
- URL encoding/decoding with multiple charsets

### 2. Basic Usage (deprecated - `basic-usage.ts`)

Note: This file contains TypeScript decorator compatibility issues. Use `simple-demo.ts` instead.

## Running the Examples

### Prerequisites

Make sure you're in the project root directory and have installed dependencies:

```bash
cd /path/to/node-tarpit
yarn install
```

### Running Simple Demo

```bash
# From project root
yarn node example/content-type/simple-demo.ts
```

**What to expect:**
- Platform startup and content type module initialization
- JSON processing with Unicode characters
- Form data parsing with arrays and special characters
- Text content processing with line analysis
- Error handling demonstrations
- URL encoding/decoding examples
- Direct deserializer testing

**Sample Output:**
```
=== Tarpit Content Type Module Demo ===

🔧 Building platform...
✅ Platform started successfully

📄 === JSON Content Processing Demo ===
🔹 Processing JSON buffer...
✅ JSON processed successfully:
  Content type: application/json
  Charset: utf-8
  Original size: 156 bytes
  Parsed data: {
    "user_id": 12345,
    "name": "张三",
    "email": "zhangsan@example.com",
    "preferences": {
      "language": "zh-CN",
      "theme": "dark"
    },
    "tags": ["developer", "typescript", "nodejs"]
  }
```

## Content Types Supported

### JSON Content

The module automatically detects and parses JSON content:

```typescript
// Input: Buffer containing JSON string
// Content-Type: application/json; charset=utf-8
// Output: Parsed JavaScript object
```

**Features:**
- Unicode character support
- Error tolerance (invalid JSON returns undefined data but preserves text)
- Automatic charset detection

### Form Data

URL-encoded form data with full specification support:

```typescript
// Input: name=John&age=30&tags=js&tags=ts
// Content-Type: application/x-www-form-urlencoded
// Output: { name: "John", age: "30", tags: ["js", "ts"] }
```

**Features:**
- Array value handling
- Special character encoding/decoding
- Empty value handling
- Custom charset support

### Text Content

Plain text processing with encoding support:

```typescript
// Input: Buffer containing text
// Content-Type: text/plain; charset=utf-8
// Output: Decoded text string
```

**Features:**
- Multi-line text support
- Unicode and emoji handling
- Line counting and analysis
- Various character encoding support

### Binary Content

Binary data handling for unsupported content types:

```typescript
// Input: Binary buffer (e.g., image data)
// Content-Type: image/png
// Output: Raw buffer (no deserialization)
```

**Features:**
- Preserves binary data integrity
- Content type detection
- Size reporting

## URL Encoding Utilities

The `URLEncoding` namespace provides comprehensive query string handling:

### Parsing Examples

```typescript
URLEncoding.parse('name=John&age=30')
// → { name: "John", age: "30" }

URLEncoding.parse('tags=js&tags=ts&tags=node')
// → { tags: ["js", "ts", "node"] }

URLEncoding.parse('search=%E6%90%9C%E7%B4%A2', { charset: 'utf-8' })
// → { search: "搜索" }
```

### Stringifying Examples

```typescript
URLEncoding.stringify({ name: 'John', age: '30' })
// → "name=John&age=30"

URLEncoding.stringify({ tags: ['js', 'ts'] })
// → "tags=js&tags=ts"

URLEncoding.stringify({ search: '搜索' }, 'utf-8')
// → "search=%E6%90%9C%E7%B4%A2"
```

## Error Handling

The module demonstrates various error handling scenarios:

### Invalid JSON

```typescript
// Input: '{"invalid": json}'
// Result: data = undefined, text = original string
```

### Unsupported Content Types

```typescript
// Input: Binary PNG data
// Content-Type: image/png
// Result: No deserialization, raw buffer preserved
```

### Malformed Content

```typescript
// Input: Corrupted or incomplete data
// Result: Graceful fallback with error information
```

## Direct Deserializer Testing

The examples include direct testing of individual deserializer functions:

### JSON Deserializer

```typescript
import { json_deserialize, MIMEContent } from '@tarpit/content-type'

const content: MIMEContent<any> = {
    type: 'application/json',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('{"test": "data"}')
}

const result = json_deserialize(content)
// Result: { test: "data" }
```

### Form Deserializer

```typescript
import { form_deserialize } from '@tarpit/content-type'

const content: MIMEContent<any> = {
    type: 'application/x-www-form-urlencoded',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('name=John&age=30')
}

const result = form_deserialize(content)
// Result: { name: "John", age: "30" }
```

### Text Deserializer

```typescript
import { text_deserialize } from '@tarpit/content-type'

const content: MIMEContent<any> = {
    type: 'text/plain',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('Hello, 世界!')
}

text_deserialize(content)
// Sets content.text to decoded string
```

## Understanding the Output

### Content Processing Results

Each content processing operation returns a `MIMEContent` object:

```typescript
interface MIMEContent<T> {
    type: string | undefined           // MIME type
    charset: string | undefined        // Character encoding
    parameters: { [prop: string]: string }  // Content-type parameters
    raw: Buffer                        // Original binary data
    text?: string                      // Decoded text (if applicable)
    data?: T                          // Parsed structured data (if applicable)
}
```

### Processing Pipeline

1. **Input**: Buffer or Readable stream + content type information
2. **Decompression**: Handle gzip, deflate, etc. (if content-encoding specified)
3. **Text Decoding**: Convert binary to text using specified charset
4. **Deserialization**: Parse structured data based on content type
5. **Output**: MIMEContent object with all processing results

## Customizing Examples

### Adding Custom Content Types

To test custom content types, modify the demo functions:

```typescript
async function demo_custom_content(content_reader: ContentReaderService) {
    const custom_data = Buffer.from('<xml>...</xml>')
    
    const content = await content_reader.read(custom_data, {
        content_type: 'application/xml',
        content_encoding: 'identity'
    })
    
    // Custom content will have type but no automatic deserialization
    console.log('Custom content type:', content.type)
    console.log('Raw buffer size:', content.raw.length)
}
```

### Testing Different Charsets

```typescript
// Test with different character encodings
const latin1_text = Buffer.from('Café', 'latin1')

const content = await content_reader.read(latin1_text, {
    content_type: 'text/plain; charset=latin1',
    content_encoding: 'identity'
})
```

### Adding Compression Testing

```typescript
// Note: Compression testing requires proper zlib type handling
// See the deprecated basic-usage.ts for compression examples
```

## Performance Considerations

### Memory Usage

- Large content is processed in memory
- Consider streaming for very large payloads
- Binary content is preserved entirely in raw buffer

### Processing Speed

- JSON parsing is fastest for structured data
- Form parsing handles complex query strings efficiently
- Text decoding depends on charset complexity

### Error Handling

- Invalid content doesn't throw exceptions
- Malformed data results in undefined parsed data
- Original raw content is always preserved

## Troubleshooting

### Common Issues

1. **Module Not Found**
   - Ensure you're running from the project root
   - Check that dependencies are installed with `yarn install`

2. **Content Not Parsed**
   - Verify content-type header format
   - Check that content is valid for the specified type
   - Review error messages in console output

3. **Unicode Issues**
   - Ensure charset is specified correctly
   - Verify input data encoding matches content-type charset
   - Check for BOM (Byte Order Mark) in text content

### Debug Information

The examples include extensive logging to help understand the processing pipeline:

```
🔹 Processing [content type]...
✅ [Content type] processed successfully:
  Content type: [detected type]
  Charset: [detected/specified charset]
  [Additional processing details]
```

## Next Steps

After running these examples:

1. **Read the Documentation**: Check out the full documentation in `docs-temp/en/5-content-type/`
2. **Explore Integration**: Learn how to integrate with HTTP controllers
3. **Custom Deserializers**: Implement custom deserializers for specific content types
4. **Production Usage**: Review best practices for production deployments

## Related Documentation

- [Basic Usage](../../docs-temp/en/5-content-type/1-basic-usage.md)
- [Deserializers](../../docs-temp/en/5-content-type/2-deserializers.md)
- [URL Encoding](../../docs-temp/en/5-content-type/3-url-encoding.md)
- [Advanced Features](../../docs-temp/en/5-content-type/4-advanced-features.md) 