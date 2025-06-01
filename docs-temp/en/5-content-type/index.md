---
layout: default
title: Content Type
nav_order: 6
has_children: true
---

# Content Type Module

The Tarpit Content Type module provides comprehensive content parsing, decompression, and deserialization capabilities for handling various MIME types and encodings in web applications.

## Features

- **MIME Type Processing**: Parse and handle various content types
- **Content Decompression**: Support for gzip, deflate, and other compression formats
- **Built-in Deserializers**: JSON, form data, and text content parsing
- **Character Encoding**: Support for multiple character encodings (UTF-8, etc.)
- **URL Encoding**: Comprehensive URL encoding/decoding utilities
- **Streaming Support**: Handle both Buffer and Readable stream inputs
- **Extensible Architecture**: Easy to add custom deserializers and decompressors

## Quick Start

```typescript
import { Platform } from '@tarpit/core'
import { ContentTypeModule, ContentReaderService } from '@tarpit/content-type'

// Basic usage in a service
@TpService()
class MyService {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_request(body: Buffer, headers: { [key: string]: string }) {
        const content = await this.content_reader.read(body, {
            content_type: headers['content-type'] || 'text/plain',
            content_encoding: headers['content-encoding'] || 'identity'
        })
        
        console.log('Content type:', content.type)
        console.log('Charset:', content.charset)
        console.log('Parsed data:', content.data)
        
        return content
    }
}

const platform = new Platform({})
    .import(ContentTypeModule)
    .import(MyService)
```

## Core Concepts

### 1. MIMEContent Structure

The module works with a standardized `MIMEContent` structure:

```typescript
interface MIMEContent<T> {
    type: string | undefined           // MIME type (e.g., 'application/json')
    charset: string | undefined        // Character encoding (e.g., 'utf-8')
    parameters: { [prop: string]: string }  // Additional content-type parameters
    raw: Buffer                        // Raw binary content
    text?: string                      // Decoded text content
    data?: T                          // Deserialized structured data
}
```

### 2. Processing Pipeline

Content processing follows a three-stage pipeline:

1. **Decompression**: Handle compressed content (gzip, deflate)
2. **Text Decoding**: Convert binary to text using appropriate charset
3. **Deserialization**: Parse structured data based on content type

### 3. Content Reader Service

The main service that orchestrates the entire content processing pipeline:

```typescript
@TpService({ inject_root: true })
class ContentReaderService {
    async read(raw: Readable | Buffer, options: ParseContentOptions): Promise<MIMEContent<any>>
    async deserialize(content: MIMEContent<any>): Promise<any>
}
```

## Supported Content Types

### JSON Content

```typescript
// Content-Type: application/json
const json_content = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'identity'
})

console.log(json_content.data) // Parsed JavaScript object
```

### Form Data

```typescript
// Content-Type: application/x-www-form-urlencoded
const form_content = await content_reader.read(buffer, {
    content_type: 'application/x-www-form-urlencoded',
    content_encoding: 'identity'
})

console.log(form_content.data) // Parsed form fields object
```

### Text Content

```typescript
// Content-Type: text/plain; charset=utf-8
const text_content = await content_reader.read(buffer, {
    content_type: 'text/plain; charset=utf-8',
    content_encoding: 'identity'
})

console.log(text_content.text) // Decoded text string
```

## Built-in Deserializers

### JSON Deserializer

Handles JSON content with error tolerance:

```typescript
import { json_deserialize } from '@tarpit/content-type'

const content: MIMEContent<any> = {
    type: 'application/json',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('{"name": "John", "age": 30}')
}

const result = json_deserialize(content)
console.log(result) // { name: "John", age: 30 }
```

### Form Deserializer

Parses URL-encoded form data:

```typescript
import { form_deserialize } from '@tarpit/content-type'

const content: MIMEContent<any> = {
    type: 'application/x-www-form-urlencoded',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('name=John&age=30&hobbies=reading&hobbies=coding')
}

const result = form_deserialize(content)
console.log(result) // { name: "John", age: "30", hobbies: ["reading", "coding"] }
```

### Text Deserializer

Simple text decoding with charset support:

```typescript
import { text_deserialize } from '@tarpit/content-type'

const content: MIMEContent<any> = {
    type: 'text/plain',
    charset: 'utf-8',
    parameters: {},
    raw: Buffer.from('Hello, 世界!')
}

const result = text_deserialize(content)
console.log(content.text) // "Hello, 世界!"
```

## URL Encoding Utilities

The `URLEncoding` namespace provides comprehensive URL encoding/decoding:

### Parsing Query Strings

```typescript
import { URLEncoding } from '@tarpit/content-type'

// Simple parsing
const params = URLEncoding.parse('name=John&age=30')
console.log(params) // { name: "John", age: "30" }

// Array values
const multi_params = URLEncoding.parse('tags=js&tags=ts&tags=node')
console.log(multi_params) // { tags: ["js", "ts", "node"] }

// With options
const custom_params = URLEncoding.parse('name=%E5%BC%A0%E4%B8%89', {
    charset: 'utf-8',
    max_keys: 100
})
console.log(custom_params) // { name: "张三" }
```

### Stringifying Objects

```typescript
import { URLEncoding } from '@tarpit/content-type'

// Simple object
const query = URLEncoding.stringify({
    name: 'John',
    age: '30'
})
console.log(query) // "name=John&age=30"

// Array values
const multi_query = URLEncoding.stringify({
    tags: ['js', 'ts', 'node']
})
console.log(multi_query) // "tags=js&tags=ts&tags=node"

// Custom charset
const unicode_query = URLEncoding.stringify({
    name: '张三'
}, 'utf-8')
console.log(unicode_query) // "name=%E5%BC%A0%E4%B8%89"
```

## Content Decompression

The module automatically handles compressed content:

```typescript
// Gzip compressed content
const compressed_content = await content_reader.read(gzipped_buffer, {
    content_type: 'application/json',
    content_encoding: 'gzip'
})

// The content is automatically decompressed
console.log(compressed_content.data) // Parsed JSON object
```

### Supported Compression Formats

- **gzip**: Standard gzip compression
- **deflate**: Deflate compression
- **identity**: No compression (pass-through)
- **br**: Brotli compression (if available)

## Advanced Usage

### Custom Deserializers

Register custom deserializers for specific content types:

```typescript
import { deserializer_token } from '@tarpit/content-type'

// Custom XML deserializer
function xml_deserialize(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    // Your XML parsing logic here
    return parse_xml(content.text)
}

// Register in module
@TpEntry({
    imports: [ContentTypeModule],
    providers: [
        {
            provide: deserializer_token,
            useValue: {
                'application/xml': xml_deserialize,
                'text/xml': xml_deserialize
            },
            multi: true
        }
    ]
})
class MyApp {}
```

### Content Type Detection

The module uses standard MIME type detection:

```typescript
import { get_default_charset } from '@tarpit/content-type'

// Get default charset for content type
const charset = get_default_charset('text/html')
console.log(charset) // "utf-8"

const json_charset = get_default_charset('application/json')
console.log(json_charset) // "utf-8"
```

### Streaming Content

Handle streaming content for large payloads:

```typescript
import { Readable } from 'stream'

// Create a readable stream
const stream = new Readable({
    read() {
        this.push('{"data": "streaming content"}')
        this.push(null) // End stream
    }
})

// Process streaming content
const content = await content_reader.read(stream, {
    content_type: 'application/json',
    content_encoding: 'identity'
})

console.log(content.data) // { data: "streaming content" }
```

## Configuration Options

### Parse Content Options

```typescript
interface ParseContentOptions {
    content_encoding: string      // Compression encoding
    content_type: string         // MIME type with parameters
    max_byte_length?: number     // Maximum content size (optional)
    skip_deserialize?: boolean   // Skip deserialization step
}
```

### Usage Examples

```typescript
// With size limit
const content = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'gzip',
    max_byte_length: 1024 * 1024 // 1MB limit
})

// Skip deserialization (only decode to text)
const raw_content = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'identity',
    skip_deserialize: true
})
console.log(raw_content.text) // Raw JSON string
console.log(raw_content.data) // undefined
```

## Error Handling

The module handles various error conditions gracefully:

### JSON Parsing Errors

```typescript
// Invalid JSON content
const invalid_json = Buffer.from('{"invalid": json}')

const content = await content_reader.read(invalid_json, {
    content_type: 'application/json',
    content_encoding: 'identity'
})

console.log(content.data) // undefined (parsing failed)
console.log(content.text) // '{"invalid": json}'
```

### Decompression Errors

```typescript
try {
    const content = await content_reader.read(corrupted_gzip, {
        content_type: 'text/plain',
        content_encoding: 'gzip'
    })
} catch (error) {
    console.error('Decompression failed:', error.message)
}
```

### Character Encoding Issues

```typescript
// Fallback to raw buffer if decoding fails
const content = await content_reader.read(binary_data, {
    content_type: 'text/plain; charset=invalid-encoding',
    content_encoding: 'identity'
})

console.log(content.text) // May be undefined
console.log(content.raw)  // Original buffer available
```

## Integration with HTTP Module

Common usage with HTTP requests:

```typescript
import { TpRouter, Post, ReqBody, ReqHeaders } from '@tarpit/http'
import { ContentReaderService } from '@tarpit/content-type'

@TpRouter('api')
class ApiController {
    
    constructor(private content_reader: ContentReaderService) {}
    
    @Post('upload')
    async upload(
        @ReqBody() body: Buffer,
        @ReqHeaders() headers: { [key: string]: string }
    ) {
        const content = await this.content_reader.read(body, {
            content_type: headers['content-type'] || 'application/octet-stream',
            content_encoding: headers['content-encoding'] || 'identity'
        })
        
        switch (content.type) {
            case 'application/json':
                return { message: 'JSON data received', data: content.data }
                
            case 'application/x-www-form-urlencoded':
                return { message: 'Form data received', fields: content.data }
                
            case 'text/plain':
                return { message: 'Text received', text: content.text }
                
            default:
                return { message: 'Binary data received', size: content.raw.length }
        }
    }
}
```

## Performance Considerations

### Memory Usage

- Use streaming for large content when possible
- Set appropriate `max_byte_length` limits
- Consider skipping deserialization for pass-through scenarios

### Compression

- Decompression is CPU-intensive; consider caching results
- Gzip provides good compression with reasonable CPU cost
- Brotli offers better compression but higher CPU usage

### Character Encoding

- UTF-8 is most efficient for text content
- Other encodings require additional processing overhead
- Default to UTF-8 when charset is not specified

## Best Practices

### 1. Content Type Validation

```typescript
async process_content(buffer: Buffer, content_type: string) {
    // Validate content type before processing
    if (!content_type || !content_type.startsWith('application/json')) {
        throw new Error('Invalid content type')
    }
    
    return this.content_reader.read(buffer, {
        content_type,
        content_encoding: 'identity'
    })
}
```

### 2. Size Limits

```typescript
const MAX_CONTENT_SIZE = 10 * 1024 * 1024 // 10MB

const content = await content_reader.read(buffer, {
    content_type: headers['content-type'],
    content_encoding: headers['content-encoding'],
    max_byte_length: MAX_CONTENT_SIZE
})
```

### 3. Error Handling

```typescript
async safe_parse_content(buffer: Buffer, options: ParseContentOptions) {
    try {
        const content = await this.content_reader.read(buffer, options)
        
        if (!content.data && content.type?.includes('json')) {
            throw new Error('Failed to parse JSON content')
        }
        
        return content
        
    } catch (error) {
        console.error('Content parsing failed:', error)
        
        // Return raw content as fallback
        return {
            type: undefined,
            charset: undefined,
            parameters: {},
            raw: buffer,
            text: buffer.toString('utf-8'),
            data: undefined
        }
    }
}
```

### 4. Content Type Detection

```typescript
function detect_content_type(headers: any, fallback = 'application/octet-stream'): string {
    const content_type = headers['content-type'] || headers['Content-Type']
    
    if (!content_type) {
        return fallback
    }
    
    // Handle multiple content types
    if (Array.isArray(content_type)) {
        return content_type[0]
    }
    
    return content_type
}
```

## Next Steps

- [Basic Usage](./1-basic-usage.md) - Getting started with content processing
- [Deserializers](./2-deserializers.md) - Working with built-in and custom deserializers
- [URL Encoding](./3-url-encoding.md) - URL encoding and form data handling
- [Advanced Features](./4-advanced-features.md) - Custom decompressors and complex scenarios
- [Examples](./5-examples.md) - Real-world usage examples
