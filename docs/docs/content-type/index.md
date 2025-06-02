---
sidebar_position: 1
---

# Content Type Module

:::info Working Examples
See [content-type examples](https://github.com/isatiso/node-tarpit/blob/main/example/content-type/) for complete working examples.
:::

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

// Complex nested structures
const nested = URLEncoding.parse('user[name]=John&user[profile][age]=30')
console.log(nested) // { user: { name: "John", profile: { age: "30" } } }
```

### URL Encoding

```typescript
// Simple encoding
const encoded = URLEncoding.stringify({ name: 'John Doe', city: 'New York' })
console.log(encoded) // "name=John%20Doe&city=New%20York"

// Array encoding
const arrays = URLEncoding.stringify({ tags: ['js', 'ts', 'node'] })
console.log(arrays) // "tags=js&tags=ts&tags=node"

// Nested object encoding
const nested = URLEncoding.stringify({ 
    user: { 
        name: 'John', 
        profile: { age: 30 } 
    } 
})
console.log(nested) // "user[name]=John&user[profile][age]=30"
```

## Content Decompression

### Automatic Decompression

The module automatically handles compressed content based on `Content-Encoding` headers:

```typescript
// Handles gzip compressed content
const gzipped_content = await content_reader.read(gzipped_buffer, {
    content_type: 'application/json',
    content_encoding: 'gzip'
})

// Handles deflate compressed content
const deflated_content = await content_reader.read(deflated_buffer, {
    content_type: 'application/json',
    content_encoding: 'deflate'
})
```

### Supported Compression Formats

- **gzip**: Most common compression format
- **deflate**: Standard deflate compression
- **identity**: No compression (default)
- **br**: Brotli compression (if available)

## Character Encoding Support

### UTF-8 (Default)

```typescript
const utf8_content = await content_reader.read(buffer, {
    content_type: 'text/plain; charset=utf-8',
    content_encoding: 'identity'
})
```

### Other Encodings

```typescript
// Latin-1 encoding
const latin1_content = await content_reader.read(buffer, {
    content_type: 'text/plain; charset=iso-8859-1',
    content_encoding: 'identity'
})

// ASCII encoding
const ascii_content = await content_reader.read(buffer, {
    content_type: 'text/plain; charset=us-ascii',
    content_encoding: 'identity'
})
```

## Custom Deserializers

### Creating Custom Deserializers

```typescript
import { MIMEContent, Deserializer } from '@tarpit/content-type'

// Custom XML deserializer
class XmlDeserializer implements Deserializer {
    deserialize(content: MIMEContent): any {
        if (content.type === 'application/xml' || content.type === 'text/xml') {
            // Parse XML content
            return this.parse_xml(content.text || '')
        }
        return undefined
    }
    
    private parse_xml(xml_text: string): any {
        // XML parsing logic
        return { parsed: 'xml' }
    }
}

// Register custom deserializer
@TpService()
class CustomContentService {
    constructor(private content_reader: ContentReaderService) {
        content_reader.register_deserializer(new XmlDeserializer())
    }
}
```

## Integration with HTTP Module

### Automatic Content Processing

When using with the HTTP module, content is automatically processed:

```typescript
import { TpRouter, Post, JsonBody, FormBody, TextBody } from '@tarpit/http'

@TpRouter('/api')
class ContentHandler {
    
    @Post('json')
    async handle_json(body: JsonBody<{ name: string, age: number }>) {
        // JSON content automatically parsed
        const name = body.ensure('name', Jtl.string)
        const age = body.ensure('age', Jtl.integer)
        
        return { received: { name, age } }
    }
    
    @Post('form')
    async handle_form(body: FormBody) {
        // Form data automatically parsed
        const name = body.ensure('name', Jtl.string)
        const email = body.ensure('email', Jtl.string.email())
        
        return { received: { name, email } }
    }
    
    @Post('text')
    async handle_text(body: TextBody) {
        // Text content automatically decoded
        const content = body.content
        
        return { 
            length: content.length,
            preview: content.substring(0, 100) 
        }
    }
}
```

## Error Handling

### Content Processing Errors

```typescript
try {
    const content = await content_reader.read(buffer, {
        content_type: 'application/json',
        content_encoding: 'gzip'
    })
} catch (error) {
    if (error instanceof DecompressionError) {
        console.error('Failed to decompress content:', error.message)
    } else if (error instanceof DeserializationError) {
        console.error('Failed to parse content:', error.message)
    } else if (error instanceof EncodingError) {
        console.error('Failed to decode text:', error.message)
    }
}
```

### Graceful Fallbacks

```typescript
const content = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'identity',
    fallback_to_text: true  // Fall back to text if JSON parsing fails
})

if (content.data) {
    // Successfully parsed as JSON
    console.log('JSON data:', content.data)
} else if (content.text) {
    // Fell back to text
    console.log('Text content:', content.text)
}
```

## Best Practices

### 1. Handle Multiple Content Types

```typescript
// ✅ Good - Support multiple content types
@TpRouter('/api')
class FlexibleHandler {
    @Post('data')
    async handle_data(req: TpRequest) {
        const content_type = req.headers.get('content-type') || 'text/plain'
        
        if (content_type.includes('application/json')) {
            const json_body = req.get_json_body()
            return this.process_json(json_body.data)
        } else if (content_type.includes('application/x-www-form-urlencoded')) {
            const form_body = req.get_form_body()
            return this.process_form(form_body.data)
        } else {
            const text_body = req.get_text_body()
            return this.process_text(text_body.content)
        }
    }
}
```

### 2. Validate Content Size

```typescript
// ✅ Good - Check content size before processing
const MAX_CONTENT_SIZE = 10 * 1024 * 1024 // 10MB

if (buffer.length > MAX_CONTENT_SIZE) {
    throw new Error('Content too large')
}

const content = await content_reader.read(buffer, options)
```

### 3. Use Appropriate Encoding

```typescript
// ✅ Good - Respect charset parameters
const content_type_header = req.headers.get('content-type')
const parsed_type = parse_content_type(content_type_header)

const content = await content_reader.read(buffer, {
    content_type: parsed_type.type,
    content_encoding: req.headers.get('content-encoding') || 'identity'
})
```

### 4. Handle Compression Efficiently

```typescript
// ✅ Good - Use compression for large responses
@TpRouter('/api')
class DataHandler {
    @Get('large-dataset')
    async get_large_data(res: TpResponse) {
        const data = await this.get_large_dataset()
        
        // Enable compression for large responses
        res.headers.set('Content-Encoding', 'gzip')
        res.headers.set('Content-Type', 'application/json')
        
        return data
    }
}
```

## Performance Considerations

### Memory Management

- **Streaming**: Use streaming for large content when possible
- **Buffer Reuse**: Avoid unnecessary buffer copying
- **Garbage Collection**: Release references to large buffers promptly

### Compression

- **Selective Compression**: Only compress content above certain thresholds
- **Compression Levels**: Balance compression ratio vs. CPU usage
- **Client Support**: Check Accept-Encoding headers before compressing

### Character Encoding

- **UTF-8 Default**: Use UTF-8 as default for better compatibility
- **Encoding Detection**: Implement fallback encoding detection for ambiguous content
- **BOM Handling**: Properly handle Byte Order Marks in text content

## Next Steps

- Explore the [examples repository](https://github.com/isatiso/node-tarpit/tree/main/example/content-type) for real-world usage patterns
- Learn about creating custom deserializers for specialized content types
- Understand performance optimization techniques for content processing
- Integrate with other Tarpit modules for complete web application solutions 