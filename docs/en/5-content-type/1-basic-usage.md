---
layout: default
title: Basic Usage
parent: Content Type
nav_order: 1
---

# Basic Usage

This guide covers the fundamentals of using the Tarpit Content Type module for content processing and parsing.

## Installation and Setup

The Content Type module is part of the Tarpit framework. To use it:

```typescript
import { Platform } from '@tarpit/core'
import { ContentTypeModule, ContentReaderService } from '@tarpit/content-type'

const platform = new Platform({})
    .import(ContentTypeModule)
    // Your other modules and services
```

## Basic Content Processing

### Processing Request Bodies

The most common use case is processing HTTP request bodies:

```typescript
import { TpService } from '@tarpit/core'
import { ContentReaderService } from '@tarpit/content-type'

@TpService()
class ContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_request(body: Buffer, content_type: string, content_encoding?: string) {
        const content = await this.content_reader.read(body, {
            content_type: content_type || 'text/plain',
            content_encoding: content_encoding || 'identity'
        })
        
        console.log('🔍 Content processed:')
        console.log('  Type:', content.type)
        console.log('  Charset:', content.charset)
        console.log('  Size:', content.raw.length, 'bytes')
        
        if (content.data) {
            console.log('  Parsed data:', content.data)
        } else if (content.text) {
            console.log('  Text content:', content.text.substring(0, 100) + '...')
        }
        
        return content
    }
}
```

### JSON Content Processing

Handle JSON requests and responses:

```typescript
@TpService()
class JsonProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_json(json_buffer: Buffer) {
        const content = await this.content_reader.read(json_buffer, {
            content_type: 'application/json',
            content_encoding: 'identity'
        })
        
        if (!content.data) {
            throw new Error('Invalid JSON content')
        }
        
        console.log('📄 JSON processed successfully:', content.data)
        return content.data
    }
    
    async process_json_with_charset(json_buffer: Buffer, charset = 'utf-8') {
        const content = await this.content_reader.read(json_buffer, {
            content_type: `application/json; charset=${charset}`,
            content_encoding: 'identity'
        })
        
        return {
            parsed_data: content.data,
            original_text: content.text,
            charset_used: content.charset
        }
    }
}
```

### Form Data Processing

Handle form submissions:

```typescript
@TpService()
class FormProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_form(form_buffer: Buffer) {
        const content = await this.content_reader.read(form_buffer, {
            content_type: 'application/x-www-form-urlencoded',
            content_encoding: 'identity'
        })
        
        console.log('📝 Form fields:', content.data)
        
        // Access individual fields
        if (content.data) {
            Object.entries(content.data).forEach(([key, value]) => {
                console.log(`  ${key}:`, value)
            })
        }
        
        return content.data
    }
    
    async validate_form_fields(form_buffer: Buffer, required_fields: string[]) {
        const content = await this.content_reader.read(form_buffer, {
            content_type: 'application/x-www-form-urlencoded',
            content_encoding: 'identity'
        })
        
        const form_data = content.data || {}
        const missing_fields = required_fields.filter(field => !form_data[field])
        
        if (missing_fields.length > 0) {
            throw new Error(`Missing required fields: ${missing_fields.join(', ')}`)
        }
        
        return form_data
    }
}
```

### Text Content Processing

Handle plain text content:

```typescript
@TpService()
class TextProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_text(text_buffer: Buffer, charset?: string) {
        const content_type = charset 
            ? `text/plain; charset=${charset}`
            : 'text/plain'
            
        const content = await this.content_reader.read(text_buffer, {
            content_type,
            content_encoding: 'identity'
        })
        
        return {
            text: content.text,
            charset: content.charset,
            line_count: content.text?.split('\n').length || 0,
            word_count: content.text?.split(/\s+/).length || 0
        }
    }
    
    async process_multiline_text(text_buffer: Buffer) {
        const content = await this.content_reader.read(text_buffer, {
            content_type: 'text/plain; charset=utf-8',
            content_encoding: 'identity'
        })
        
        if (!content.text) {
            throw new Error('No text content found')
        }
        
        const lines = content.text.split('\n')
        
        return {
            total_lines: lines.length,
            non_empty_lines: lines.filter(line => line.trim()).length,
            lines: lines,
            statistics: {
                max_line_length: Math.max(...lines.map(line => line.length)),
                avg_line_length: lines.reduce((sum, line) => sum + line.length, 0) / lines.length
            }
        }
    }
}
```

## Compressed Content

Handle compressed content automatically:

```typescript
@TpService()
class CompressionProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_gzipped_json(gzipped_buffer: Buffer) {
        const content = await this.content_reader.read(gzipped_buffer, {
            content_type: 'application/json',
            content_encoding: 'gzip'
        })
        
        console.log('📦 Decompressed and parsed JSON:')
        console.log('  Original size:', gzipped_buffer.length, 'bytes')
        console.log('  Decompressed size:', content.raw.length, 'bytes')
        console.log('  Compression ratio:', (gzipped_buffer.length / content.raw.length).toFixed(2))
        
        return content.data
    }
    
    async process_compressed_text(compressed_buffer: Buffer, encoding: string) {
        const content = await this.content_reader.read(compressed_buffer, {
            content_type: 'text/plain',
            content_encoding: encoding // 'gzip', 'deflate', etc.
        })
        
        return {
            text: content.text,
            original_size: compressed_buffer.length,
            decompressed_size: content.raw.length,
            compression_type: encoding
        }
    }
}
```

## Content Type Detection

Working with unknown or dynamic content types:

```typescript
@TpService()
class ContentTypeDetector {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async detect_and_process(buffer: Buffer, headers: any) {
        const content_type = this.detect_content_type(headers)
        const content_encoding = headers['content-encoding'] || 'identity'
        
        console.log('🔍 Detected content type:', content_type)
        
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding
        })
        
        return this.format_result(content)
    }
    
    private detect_content_type(headers: any): string {
        // Check various header formats
        const content_type = headers['content-type'] || 
                           headers['Content-Type'] || 
                           headers['CONTENT-TYPE']
        
        if (content_type) {
            return Array.isArray(content_type) ? content_type[0] : content_type
        }
        
        // Default fallback
        return 'application/octet-stream'
    }
    
    private format_result(content: any) {
        const result = {
            type: content.type,
            charset: content.charset,
            size: content.raw.length,
            has_text: !!content.text,
            has_data: !!content.data
        }
        
        // Add type-specific information
        switch (content.type) {
            case 'application/json':
                return { ...result, json_valid: !!content.data }
                
            case 'application/x-www-form-urlencoded':
                return { 
                    ...result, 
                    field_count: content.data ? Object.keys(content.data).length : 0 
                }
                
            case 'text/plain':
                return { 
                    ...result, 
                    line_count: content.text ? content.text.split('\n').length : 0 
                }
                
            default:
                return result
        }
    }
}
```

## Error Handling

Robust error handling for content processing:

```typescript
@TpService()
class SafeContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async safe_process(buffer: Buffer, content_type: string, content_encoding = 'identity') {
        try {
            const content = await this.content_reader.read(buffer, {
                content_type,
                content_encoding
            })
            
            return {
                success: true,
                content,
                error: null
            }
            
        } catch (error) {
            console.error('❌ Content processing failed:', error)
            
            return {
                success: false,
                content: null,
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    type: 'PROCESSING_ERROR'
                }
            }
        }
    }
    
    async process_with_fallback(buffer: Buffer, content_type: string) {
        // Try with original content type
        let result = await this.safe_process(buffer, content_type)
        
        if (result.success) {
            return result.content
        }
        
        console.warn('⚠️ Primary processing failed, trying fallbacks...')
        
        // Fallback 1: Try as plain text
        result = await this.safe_process(buffer, 'text/plain')
        if (result.success) {
            console.log('✅ Processed as plain text')
            return result.content
        }
        
        // Fallback 2: Return raw buffer
        console.log('📦 Returning raw buffer')
        return {
            type: undefined,
            charset: undefined,
            parameters: {},
            raw: buffer,
            text: undefined,
            data: undefined
        }
    }
    
    async validate_json_content(buffer: Buffer) {
        const result = await this.safe_process(buffer, 'application/json')
        
        if (!result.success) {
            throw new Error(`JSON processing failed: ${result.error?.message}`)
        }
        
        if (!result.content?.data) {
            throw new Error('Invalid JSON: parsing returned no data')
        }
        
        return result.content.data
    }
}
```

## Size Limits and Streaming

Handle large content with size limits:

```typescript
@TpService()
class BoundedContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_limit(buffer: Buffer, content_type: string, max_size = 1024 * 1024) {
        if (buffer.length > max_size) {
            throw new Error(`Content too large: ${buffer.length} bytes (limit: ${max_size})`)
        }
        
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding: 'identity',
            max_byte_length: max_size
        })
        
        console.log(`📏 Processed content: ${content.raw.length}/${max_size} bytes`)
        return content
    }
    
    async process_streaming(stream: any, content_type: string) {
        console.log('🌊 Processing streaming content...')
        
        const content = await this.content_reader.read(stream, {
            content_type,
            content_encoding: 'identity'
        })
        
        console.log('✅ Stream processed successfully')
        return content
    }
    
    async process_chunked_upload(chunks: Buffer[], content_type: string) {
        // Combine chunks
        const total_size = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const combined_buffer = Buffer.concat(chunks, total_size)
        
        console.log(`🔗 Combined ${chunks.length} chunks (${total_size} bytes)`)
        
        const content = await this.content_reader.read(combined_buffer, {
            content_type,
            content_encoding: 'identity'
        })
        
        return {
            content,
            chunk_count: chunks.length,
            total_size
        }
    }
}
```

## Integration Patterns

### With HTTP Controllers

```typescript
import { TpRouter, Post, ReqBody, ReqHeaders } from '@tarpit/http'

@TpRouter('api')
class ContentApiController {
    
    constructor(private content_reader: ContentReaderService) {}
    
    @Post('process')
    async process_content(
        @ReqBody() body: Buffer,
        @ReqHeaders() headers: any
    ) {
        const content = await this.content_reader.read(body, {
            content_type: headers['content-type'] || 'application/octet-stream',
            content_encoding: headers['content-encoding'] || 'identity'
        })
        
        return {
            processed: true,
            content_type: content.type,
            charset: content.charset,
            size: content.raw.length,
            has_structured_data: !!content.data
        }
    }
    
    @Post('json')
    async process_json(
        @ReqBody() body: Buffer,
        @ReqHeaders() headers: any
    ) {
        if (!headers['content-type']?.includes('application/json')) {
            throw new Error('Expected JSON content type')
        }
        
        const content = await this.content_reader.read(body, {
            content_type: headers['content-type'],
            content_encoding: headers['content-encoding'] || 'identity'
        })
        
        if (!content.data) {
            throw new Error('Invalid JSON content')
        }
        
        return { data: content.data, received_at: new Date() }
    }
}
```

### With Middleware

```typescript
@TpService()
class ContentProcessingMiddleware {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_request_body(req: any, res: any, next: Function) {
        try {
            if (!req.body || req.body.length === 0) {
                req.parsed_content = null
                return next()
            }
            
            const content = await this.content_reader.read(req.body, {
                content_type: req.headers['content-type'] || 'text/plain',
                content_encoding: req.headers['content-encoding'] || 'identity'
            })
            
            // Attach parsed content to request
            req.parsed_content = content
            req.content_info = {
                type: content.type,
                charset: content.charset,
                size: content.raw.length
            }
            
            next()
            
        } catch (error) {
            console.error('Content processing middleware error:', error)
            res.status(400).json({ error: 'Invalid content format' })
        }
    }
}
```

## Testing Content Processing

Test your content processing logic:

```typescript
import { Platform } from '@tarpit/core'
import { ContentTypeModule, ContentReaderService } from '@tarpit/content-type'

describe('Content Processing', () => {
    let platform: Platform
    let content_reader: ContentReaderService
    
    beforeAll(async () => {
        platform = new Platform({}).import(ContentTypeModule)
        await platform.start()
        content_reader = platform.expose(ContentReaderService)!
    })
    
    afterAll(async () => {
        await platform.terminate()
    })
    
    test('should process JSON content', async () => {
        const test_data = { name: 'John', age: 30 }
        const buffer = Buffer.from(JSON.stringify(test_data))
        
        const content = await content_reader.read(buffer, {
            content_type: 'application/json',
            content_encoding: 'identity'
        })
        
        expect(content.type).toBe('application/json')
        expect(content.data).toEqual(test_data)
    })
    
    test('should process form data', async () => {
        const form_string = 'name=John&age=30&hobbies=reading&hobbies=coding'
        const buffer = Buffer.from(form_string)
        
        const content = await content_reader.read(buffer, {
            content_type: 'application/x-www-form-urlencoded',
            content_encoding: 'identity'
        })
        
        expect(content.data).toEqual({
            name: 'John',
            age: '30',
            hobbies: ['reading', 'coding']
        })
    })
    
    test('should handle invalid JSON gracefully', async () => {
        const invalid_json = '{"invalid": json}'
        const buffer = Buffer.from(invalid_json)
        
        const content = await content_reader.read(buffer, {
            content_type: 'application/json',
            content_encoding: 'identity'
        })
        
        expect(content.data).toBeUndefined()
        expect(content.text).toBe(invalid_json)
    })
})
```

## Common Patterns

### Content Type Router

```typescript
@TpService()
class ContentTypeRouter {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async route_by_content_type(buffer: Buffer, content_type: string) {
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding: 'identity'
        })
        
        switch (content.type) {
            case 'application/json':
                return this.handle_json(content.data)
                
            case 'application/x-www-form-urlencoded':
                return this.handle_form(content.data)
                
            case 'text/plain':
                return this.handle_text(content.text)
                
            case 'text/html':
                return this.handle_html(content.text)
                
            default:
                return this.handle_binary(content.raw)
        }
    }
    
    private async handle_json(data: any) {
        console.log('📄 Processing JSON data')
        return { type: 'json', processed: true, data }
    }
    
    private async handle_form(data: any) {
        console.log('📝 Processing form data')
        return { type: 'form', processed: true, fields: data }
    }
    
    private async handle_text(text?: string) {
        console.log('📃 Processing text content')
        return { type: 'text', processed: true, text, length: text?.length || 0 }
    }
    
    private async handle_html(html?: string) {
        console.log('🌐 Processing HTML content')
        return { type: 'html', processed: true, html, length: html?.length || 0 }
    }
    
    private async handle_binary(buffer: Buffer) {
        console.log('📦 Processing binary content')
        return { type: 'binary', processed: true, size: buffer.length }
    }
}
```

## Best Practices

### 1. Always Specify Content Type

```typescript
// Good
const content = await content_reader.read(buffer, {
    content_type: 'application/json; charset=utf-8',
    content_encoding: 'identity'
})

// Avoid - missing important information
const content = await content_reader.read(buffer, {
    content_type: 'application/json',
    content_encoding: 'identity'
})
```

### 2. Handle Errors Gracefully

```typescript
async safe_json_parse(buffer: Buffer) {
    try {
        const content = await this.content_reader.read(buffer, {
            content_type: 'application/json',
            content_encoding: 'identity'
        })
        
        if (!content.data) {
            throw new Error('JSON parsing failed')
        }
        
        return content.data
        
    } catch (error) {
        console.error('JSON parsing error:', error)
        return null
    }
}
```

### 3. Use Size Limits

```typescript
const MAX_CONTENT_SIZE = 10 * 1024 * 1024 // 10MB

const content = await content_reader.read(buffer, {
    content_type: content_type,
    content_encoding: content_encoding,
    max_byte_length: MAX_CONTENT_SIZE
})
```

### 4. Validate Content Before Processing

```typescript
function validate_content_type(content_type: string, allowed_types: string[]) {
    const main_type = content_type.split(';')[0].trim()
    
    if (!allowed_types.includes(main_type)) {
        throw new Error(`Unsupported content type: ${main_type}`)
    }
}
```

## Next Steps

- [Deserializers](./2-deserializers.md) - Learn about built-in and custom deserializers
- [URL Encoding](./3-url-encoding.md) - Master URL encoding and form data handling
- [Advanced Features](./4-advanced-features.md) - Explore compression and custom extensions
- [Examples](./5-examples.md) - See real-world usage examples 