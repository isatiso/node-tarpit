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
import { TpService } from '@tarpit/core'

// YAML deserializer with validation
function yaml_deserialize(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    
    if (!content.text) {
        return undefined
    }
    
    try {
        // Using a hypothetical YAML library
        const parsed = YAML.parse(content.text)
        
        // Validate structure
        if (typeof parsed === 'object' && parsed !== null) {
            return parsed
        }
        
        return undefined
    } catch (error) {
        console.error('YAML parsing failed:', error)
        return undefined
    }
}

// MessagePack binary deserializer
function msgpack_deserialize(content: MIMEContent<any>): any {
    try {
        // For binary formats, work directly with the buffer
        const parsed = MessagePack.decode(content.raw)
        
        // Set text representation if needed
        content.text = JSON.stringify(parsed, null, 2)
        
        return parsed
    } catch (error) {
        console.error('MessagePack parsing failed:', error)
        return undefined
    }
}

@TpService()
class CustomDeserializerService {
    
    register_custom_deserializers() {
        return {
            'application/yaml': yaml_deserialize,
            'text/yaml': yaml_deserialize,
            'application/x-yaml': yaml_deserialize,
            'application/msgpack': msgpack_deserialize,
            'application/x-msgpack': msgpack_deserialize
        }
    }
}
```

## Built-in Decompressors

### Gzip Decompressor

Handles `gzip` content encoding:

```typescript
// Automatically used for gzip content
const content = await content_reader.read(gzipped_buffer, {
    content_type: 'application/json',
    content_encoding: 'gzip'
})

// Content is automatically decompressed before deserialization
console.log(content.data) // Parsed JSON from decompressed data
```

### Deflate Decompressor

Handles `deflate` content encoding:

```typescript
// Automatically used for deflate content
const content = await content_reader.read(deflated_buffer, {
    content_type: 'text/plain',
    content_encoding: 'deflate'
})

console.log(content.text) // Decompressed text content
```

## Custom Decompressors

### Registering Custom Decompressors

```typescript
import { decompressor_token, MIMEContent } from '@tarpit/content-type'
import { promisify } from 'util'
import * as zlib from 'zlib'

// Brotli decompressor example
async function brotli_decompress(content: MIMEContent<any>): Promise<Buffer> {
    const brotli_decompress = promisify(zlib.brotliDecompress)
    
    try {
        return await brotli_decompress(content.raw)
    } catch (error) {
        console.error('Brotli decompression failed:', error)
        throw error
    }
}

// LZ4 decompressor example (hypothetical)
async function lz4_decompress(content: MIMEContent<any>): Promise<Buffer> {
    try {
        // Using hypothetical LZ4 library
        return LZ4.decompress(content.raw)
    } catch (error) {
        console.error('LZ4 decompression failed:', error)
        throw error
    }
}

@TpEntry({
    imports: [ContentTypeModule],
    providers: [
        {
            provide: decompressor_token,
            useValue: {
                'br': brotli_decompress,
                'brotli': brotli_decompress,
                'lz4': lz4_decompress
            },
            multi: true
        }
    ]
})
class MyApp {}
```

## Content Processing Pipeline

### Understanding the Pipeline

```typescript
// 1. Content arrives as Buffer with metadata
const raw_content = {
    body: Buffer.from('...'),  // Raw bytes
    content_type: 'application/json',
    content_encoding: 'gzip'
}

// 2. Parse content type
const parsed_type = parse_content_type(raw_content.content_type)
// { type: 'application/json', charset: 'utf-8', parameters: {} }

// 3. Decompress if needed
let decompressed_buffer = raw_content.body
if (raw_content.content_encoding !== 'identity') {
    decompressed_buffer = await decompress(raw_content.body, raw_content.content_encoding)
}

// 4. Create MIMEContent object
const mime_content: MIMEContent<any> = {
    type: parsed_type.type,
    charset: parsed_type.charset,
    parameters: parsed_type.parameters,
    raw: decompressed_buffer
}

// 5. Deserialize based on content type
const deserializer = get_deserializer(mime_content.type)
if (deserializer) {
    mime_content.data = deserializer(mime_content)
}

// 6. Return final content object
return {
    type: mime_content.type,
    charset: mime_content.charset,
    raw: mime_content.raw,
    text: mime_content.text,
    data: mime_content.data
}
```

### Custom Pipeline Integration

```typescript
@TpService()
class CustomContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_validation(
        buffer: Buffer, 
        content_type: string, 
        content_encoding?: string
    ) {
        // 1. Standard processing
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding: content_encoding || 'identity'
        })
        
        // 2. Custom validation
        if (content.data && typeof content.data === 'object') {
            this.validate_structure(content.data)
        }
        
        // 3. Custom post-processing
        if (content.type === 'application/json') {
            content.data = this.normalize_json_data(content.data)
        }
        
        return content
    }
    
    private validate_structure(data: any): void {
        // Custom validation logic
        if (!data.id) {
            throw new Error('Missing required field: id')
        }
    }
    
    private normalize_json_data(data: any): any {
        // Custom normalization logic
        if (Array.isArray(data)) {
            return data.filter(item => item != null)
        }
        return data
    }
}
```

## Error Handling

### Graceful Degradation

```typescript
@TpService()
class RobustContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async safe_process(
        buffer: Buffer,
        content_type: string,
        content_encoding?: string
    ) {
        try {
            return await this.content_reader.read(buffer, {
                content_type,
                content_encoding: content_encoding || 'identity'
            })
        } catch (error) {
            console.error('Content processing failed:', error)
            
            // Fallback to raw text
            return {
                type: content_type,
                charset: 'utf-8',
                raw: buffer,
                text: buffer.toString('utf-8'),
                data: undefined
            }
        }
    }
    
    async process_with_fallbacks(
        buffer: Buffer,
        content_type: string,
        content_encoding?: string
    ) {
        // Try primary processing
        try {
            return await this.content_reader.read(buffer, {
                content_type,
                content_encoding: content_encoding || 'identity'
            })
        } catch (decompression_error) {
            console.warn('Decompression failed, trying without decompression')
            
            // Try without decompression
            try {
                return await this.content_reader.read(buffer, {
                    content_type,
                    content_encoding: 'identity'
                })
            } catch (parsing_error) {
                console.warn('Parsing failed, returning raw content')
                
                // Final fallback
                return {
                    type: content_type,
                    charset: 'utf-8',
                    raw: buffer,
                    text: buffer.toString('utf-8'),
                    data: undefined
                }
            }
        }
    }
}
```

## Performance Optimization

### Streaming Deserializers

```typescript
import { Transform } from 'stream'

// Example streaming JSON deserializer for large datasets
class StreamingJSONDeserializer extends Transform {
    
    private buffer = ''
    
    constructor() {
        super({ objectMode: true })
    }
    
    _transform(chunk: Buffer, encoding: string, callback: Function) {
        this.buffer += chunk.toString()
        
        // Process complete JSON objects
        const lines = this.buffer.split('\n')
        this.buffer = lines.pop() || '' // Keep incomplete line
        
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const parsed = JSON.parse(line)
                    this.push(parsed)
                } catch (error) {
                    this.emit('error', error)
                    return
                }
            }
        }
        
        callback()
    }
    
    _flush(callback: Function) {
        if (this.buffer.trim()) {
            try {
                const parsed = JSON.parse(this.buffer)
                this.push(parsed)
            } catch (error) {
                this.emit('error', error)
                return
            }
        }
        callback()
    }
}
```

## Best Practices

1. **Handle errors gracefully** - Always provide fallback behavior
2. **Validate input data** - Check structure and types after deserialization
3. **Set memory limits** - Prevent excessive memory usage with large content
4. **Use streaming** for large datasets when possible
5. **Cache deserializers** - Avoid recreating deserializer functions
6. **Log processing metrics** - Monitor performance and errors
7. **Test edge cases** - Handle malformed, empty, or very large content 