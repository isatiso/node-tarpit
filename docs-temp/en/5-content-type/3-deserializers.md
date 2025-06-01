---
layout: default
title: Deserializers
parent: Content Type
nav_order: 3
---

# Deserializers and Decompression

The Tarpit Content Type module provides extensible deserializer and decompressor systems for handling various content formats and compression encodings.

## Overview

The module uses a two-stage processing pipeline:

1. **Decompression**: Handle compressed content (gzip, deflate, etc.)
2. **Deserialization**: Parse structured data from text content

Both stages are extensible through dependency injection tokens, allowing you to register custom handlers for specific content types or encodings.

## Built-in Deserializers

### JSON Deserializer

Automatically handles `application/json` content type:

```typescript
import { json_deserialize, MIMEContent } from '@tarpit/content-type'

// Used automatically by ContentReaderService
const content = await content_reader.read(json_buffer, {
    content_type: 'application/json',
    content_encoding: 'identity'
})

console.log(content.data) // Parsed JavaScript object

// Direct usage
const mime_content: MIMEContent<any> = {
    type: 'application/json',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('{"key": "value"}')
}

const result = json_deserialize(mime_content)
console.log(result) // { key: "value" }
console.log(mime_content.text) // '{"key": "value"}' (also sets text property)
```

**Features:**
- Error tolerance: Invalid JSON returns `undefined` but preserves text
- Automatic charset detection and decoding
- Supports all valid JSON data types

### Form Deserializer

Handles `application/x-www-form-urlencoded` content:

```typescript
import { form_deserialize, MIMEContent } from '@tarpit/content-type'

// Used automatically by ContentReaderService
const content = await content_reader.read(form_buffer, {
    content_type: 'application/x-www-form-urlencoded',
    content_encoding: 'identity'
})

console.log(content.data) // Parsed form fields object

// Direct usage
const mime_content: MIMEContent<any> = {
    type: 'application/x-www-form-urlencoded',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('name=John&tags=js&tags=ts')
}

const result = form_deserialize(mime_content)
console.log(result) // { name: "John", tags: ["js", "ts"] }
```

**Features:**
- Array handling for multiple values with same key
- URL decoding of special characters
- Custom charset support
- Uses the URLEncoding utility internally

### Text Deserializer

Handles `text/*` content types:

```typescript
import { text_deserialize, MIMEContent } from '@tarpit/content-type'

// Used automatically for text content types
const content = await content_reader.read(text_buffer, {
    content_type: 'text/plain; charset=utf-8',
    content_encoding: 'identity'
})

console.log(content.text) // Decoded text string

// Direct usage
const mime_content: MIMEContent<any> = {
    type: 'text/plain',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('Hello, 世界!')
}

text_deserialize(mime_content)
console.log(mime_content.text) // "Hello, 世界!"
```

**Features:**
- Character encoding detection and conversion
- Handles various text subtypes (plain, html, css, etc.)
- Unicode support

## Custom Deserializers

### Registering Custom Deserializers

You can register custom deserializers for specific content types:

```typescript
import { TpEntry, Platform } from '@tarpit/core'
import { ContentTypeModule, deserializer_token, MIMEContent, decode } from '@tarpit/content-type'

// XML deserializer example
function xml_deserialize(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    if (!content.text) {
        return undefined
    }
    
    // Your XML parsing logic here
    try {
        // Example using a hypothetical XML parser
        return parse_xml_to_object(content.text)
    } catch (error) {
        console.error('XML parsing failed:', error)
        return undefined
    }
}

// CSV deserializer example
function csv_deserialize(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    if (!content.text) {
        return undefined
    }
    
    try {
        const lines = content.text.split('\n').filter(line => line.trim())
        if (lines.length === 0) return []
        
        const headers = lines[0].split(',').map(h => h.trim())
        const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim())
            const row: any = {}
            headers.forEach((header, index) => {
                row[header] = values[index] || ''
            })
            return row
        })
        
        return rows
    } catch (error) {
        console.error('CSV parsing failed:', error)
        return undefined
    }
}

// Register deserializers
@TpEntry({
    imports: [ContentTypeModule],
    providers: [
        {
            provide: deserializer_token,
            useValue: {
                'application/xml': xml_deserialize,
                'text/xml': xml_deserialize,
                'text/csv': csv_deserialize,
                'application/csv': csv_deserialize
            },
            multi: true
        }
    ]
})
class MyApp {}

const platform = new Platform({}).import(MyApp)
```

### Advanced Custom Deserializer

```typescript
// JSON-LD deserializer with validation
function json_ld_deserialize(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    if (!content.text) {
        return undefined
    }
    
    try {
        const parsed = JSON.parse(content.text)
        
        // Validate JSON-LD structure
        if (!parsed['@context']) {
            console.warn('JSON-LD missing @context')
        }
        
        // Process JSON-LD specific features
        return {
            context: parsed['@context'],
            data: parsed,
            type: 'json-ld'
        }
    } catch (error) {
        console.error('JSON-LD parsing failed:', error)
        return undefined
    }
}

// YAML deserializer
function yaml_deserialize(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    if (!content.text) {
        return undefined
    }
    
    try {
        // Using a hypothetical YAML parser
        return parse_yaml(content.text)
    } catch (error) {
        console.error('YAML parsing failed:', error)
        return undefined
    }
}

// Register advanced deserializers
@TpEntry({
    imports: [ContentTypeModule],
    providers: [
        {
            provide: deserializer_token,
            useValue: {
                'application/ld+json': json_ld_deserialize,
                'application/yaml': yaml_deserialize,
                'text/yaml': yaml_deserialize,
                'application/x-yaml': yaml_deserialize
            },
            multi: true
        }
    ]
})
class AdvancedContentApp {}
```

## Content Decompression

### Built-in Decompressors

The module automatically handles common compression formats:

- **gzip**: Standard gzip compression
- **deflate**: Deflate compression  
- **identity**: No compression (pass-through)
- **br**: Brotli compression (if available in Node.js)

### Using Compression

```typescript
// Automatic decompression
const compressed_content = await content_reader.read(gzipped_buffer, {
    content_type: 'application/json',
    content_encoding: 'gzip'  // Automatically decompressed
})

console.log(compressed_content.data) // Parsed JSON from decompressed content

// Multiple compression layers
const double_compressed = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'gzip, deflate'  // Processed in reverse order
})
```

### Custom Decompressors

Register custom decompression handlers:

```typescript
import { decompressor_token } from '@tarpit/content-type'
import { Readable, Transform } from 'stream'

// Custom LZ4 decompressor example
function lz4_decompressor(input: Readable): Readable {
    const transform = new Transform({
        transform(chunk, encoding, callback) {
            try {
                // Your LZ4 decompression logic here
                const decompressed = decompress_lz4(chunk)
                callback(null, decompressed)
            } catch (error) {
                callback(error)
            }
        }
    })
    
    return input.pipe(transform)
}

// Brotli decompressor (if not built-in)
function custom_brotli_decompressor(input: Readable): Readable {
    const zlib = require('zlib')
    return input.pipe(zlib.createBrotliDecompress())
}

// Register custom decompressors
@TpEntry({
    imports: [ContentTypeModule],
    providers: [
        {
            provide: decompressor_token,
            useValue: {
                'lz4': lz4_decompressor,
                'br': custom_brotli_decompressor
            },
            multi: true
        }
    ]
})
class CompressionApp {}
```

## Error Handling in Custom Deserializers

### Best Practices

```typescript
function robust_deserializer(content: MIMEContent<any>): any {
    // Always decode text first
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    // Handle empty content
    if (!content.text || content.text.trim() === '') {
        return undefined
    }
    
    try {
        // Your parsing logic
        const result = parse_custom_format(content.text)
        
        // Validate result
        if (!result || typeof result !== 'object') {
            console.warn('Invalid parse result for custom format')
            return undefined
        }
        
        return result
        
    } catch (error) {
        // Log error but don't throw
        console.error('Custom deserializer failed:', error)
        return undefined
    }
}
```

### Graceful Degradation

```typescript
function fallback_deserializer(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    if (!content.text) {
        return undefined
    }
    
    // Try primary format
    try {
        return parse_primary_format(content.text)
    } catch (primary_error) {
        console.warn('Primary format parsing failed:', primary_error)
        
        // Try fallback format
        try {
            return parse_fallback_format(content.text)
        } catch (fallback_error) {
            console.warn('Fallback format parsing failed:', fallback_error)
            
            // Return basic structure
            return {
                raw_text: content.text,
                error: 'Parsing failed',
                attempted_formats: ['primary', 'fallback']
            }
        }
    }
}
```

## Content Type Detection

### Automatic Type Handling

The deserializer system automatically selects the appropriate deserializer based on the content type:

```typescript
// These will use different deserializers automatically
const json_content = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'identity'
})

const form_content = await content_reader.read(buffer, {
    content_type: 'application/x-www-form-urlencoded',
    content_encoding: 'identity'
})

const xml_content = await content_reader.read(buffer, {
    content_type: 'application/xml',  // Uses custom XML deserializer if registered
    content_encoding: 'identity'
})
```

### Manual Deserialization

You can also manually call deserializers:

```typescript
import { ContentReaderService } from '@tarpit/content-type'

// Skip automatic deserialization
const content = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'identity',
    skip_deserialize: true
})

console.log(content.data) // undefined
console.log(content.text) // Raw JSON string

// Manually deserialize later
const deserialized_content = await content_reader.deserialize(content)
console.log(deserialized_content.data) // Parsed JavaScript object
```

## Testing Custom Deserializers

### Unit Testing

```typescript
import { describe, test, expect } from 'your-test-framework'
import { MIMEContent } from '@tarpit/content-type'

describe('Custom XML Deserializer', () => {
    test('should parse valid XML', () => {
        const content: MIMEContent<any> = {
            type: 'application/xml',
            charset: 'utf-8',
            parameters: {},
            raw: Buffer.from('<root><item>value</item></root>')
        }
        
        const result = xml_deserialize(content)
        
        expect(result).toBeDefined()
        expect(result.root).toBeDefined()
        expect(result.root.item).toBe('value')
    })
    
    test('should handle invalid XML gracefully', () => {
        const content: MIMEContent<any> = {
            type: 'application/xml',
            charset: 'utf-8',
            parameters: {},
            raw: Buffer.from('<invalid><xml>')
        }
        
        const result = xml_deserialize(content)
        
        expect(result).toBeUndefined()
        expect(content.text).toBe('<invalid><xml>')
    })
})
```

### Integration Testing

```typescript
import { Platform } from '@tarpit/core'
import { ContentTypeModule, ContentReaderService } from '@tarpit/content-type'

describe('Custom Deserializer Integration', () => {
    let platform: Platform
    let content_reader: ContentReaderService
    
    beforeAll(async () => {
        platform = new Platform({})
            .import(ContentTypeModule)
            .import(MyCustomDeserializerModule)
        
        await platform.start()
        content_reader = platform.expose(ContentReaderService)!
    })
    
    afterAll(async () => {
        await platform.terminate()
    })
    
    test('should use custom deserializer for registered content type', async () => {
        const xml_buffer = Buffer.from('<root><item>test</item></root>')
        
        const content = await content_reader.read(xml_buffer, {
            content_type: 'application/xml',
            content_encoding: 'identity'
        })
        
        expect(content.type).toBe('application/xml')
        expect(content.data).toBeDefined()
        expect(content.data.root.item).toBe('test')
    })
})
```

## Performance Considerations

### Deserializer Efficiency

```typescript
// Efficient deserializer pattern
function efficient_deserializer(content: MIMEContent<any>): any {
    // Reuse text if already decoded
    if (!content.text) {
        content.text = decode(content.raw, content.charset ?? 'utf-8')
    }
    
    // Early return for empty content
    if (!content.text) {
        return undefined
    }
    
    // Use streaming for large content
    if (content.raw.length > 1024 * 1024) { // 1MB
        return parse_streaming(content.text)
    }
    
    // Standard parsing for smaller content
    return parse_standard(content.text)
}
```

### Memory Management

```typescript
// Memory-conscious deserializer
function memory_safe_deserializer(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    if (!content.text) {
        return undefined
    }
    
    try {
        // Limit processing for very large content
        if (content.text.length > 10 * 1024 * 1024) { // 10MB
            throw new Error('Content too large for processing')
        }
        
        const result = parse_content(content.text)
        
        // Clear text after parsing to save memory (optional)
        // content.text = undefined
        
        return result
        
    } catch (error) {
        console.error('Memory-safe deserializer failed:', error)
        return undefined
    }
}
```

## Best Practices

### 1. Always Handle Errors Gracefully

```typescript
// Good - never throws, always returns undefined on error
function good_deserializer(content: MIMEContent<any>): any {
    try {
        content.text = decode(content.raw, content.charset ?? 'utf-8')
        return content.text ? parse_format(content.text) : undefined
    } catch (error) {
        console.error('Deserializer error:', error)
        return undefined
    }
}

// Avoid - throws exceptions
function bad_deserializer(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    return parse_format(content.text) // Could throw
}
```

### 2. Set content.text Property

```typescript
// Good - sets text property for consistency
function good_deserializer(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    return content.text ? parse_format(content.text) : undefined
}

// Avoid - doesn't set text property
function incomplete_deserializer(content: MIMEContent<any>): any {
    const text = decode(content.raw, content.charset ?? 'utf-8')
    return text ? parse_format(text) : undefined
}
```

### 3. Use Appropriate Content Type Matching

```typescript
// Register with specific and general types
{
    provide: deserializer_token,
    useValue: {
        'application/xml': xml_deserialize,
        'text/xml': xml_deserialize,           // Alternative MIME type
        'application/soap+xml': xml_deserialize // Specialized XML variant
    },
    multi: true
}
```

### 4. Document Custom Deserializers

```typescript
/**
 * Deserializes XML content to JavaScript objects
 * 
 * @param content - MIMEContent with XML data
 * @returns Parsed object or undefined if parsing fails
 * 
 * Supported content types:
 * - application/xml
 * - text/xml
 * - application/soap+xml
 */
function xml_deserialize(content: MIMEContent<any>): any {
    // Implementation
}
```

## Next Steps

- [Basic Usage](./1-basic-usage.md) - General content processing
- [URL Encoding](./2-url-encoding.md) - Query string handling
- [Advanced Features](./4-advanced-features.md) - Advanced configuration and patterns
- [Examples](./5-examples.md) - Real-world usage examples 