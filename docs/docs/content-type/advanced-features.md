# Advanced Features

This guide covers advanced usage patterns, performance optimization, and complex integration scenarios for the Tarpit Content Type module.

## Streaming Content Processing

### Large File Handling

The module can process content from streams, making it suitable for large files:

```typescript
import { Readable } from 'stream'
import { ContentReaderService } from '@tarpit/content-type'

async function process_large_file(file_stream: Readable, content_type: string) {
    const content = await content_reader.read(file_stream, {
        content_type,
        content_encoding: 'identity'
    })
    
    return content
}

// Example with file upload
async function handle_file_upload(upload_stream: Readable) {
    try {
        const content = await content_reader.read(upload_stream, {
            content_type: 'application/json',
            content_encoding: 'gzip'
        })
        
        console.log('Processed large file:', content.data)
        return content.data
        
    } catch (error) {
        console.error('Large file processing failed:', error)
        throw error
    }
}
```

### Stream Creation

Create streams from various sources:

```typescript
import { Readable } from 'stream'

// From string data
function create_stream_from_string(data: string): Readable {
    return Readable.from(data)
}

// From chunks
function create_chunked_stream(chunks: Buffer[]): Readable {
    let index = 0
    
    return new Readable({
        read() {
            if (index < chunks.length) {
                this.push(chunks[index++])
            } else {
                this.push(null) // End stream
            }
        }
    })
}

// From async generator
async function* generate_data() {
    for (let i = 0; i < 1000; i++) {
        yield `{"id": ${i}, "data": "item ${i}"}\n`
    }
}

function create_generator_stream(): Readable {
    return Readable.from(generate_data())
}
```

## Performance Optimization

### Memory Management

```typescript
// Efficient content processing
class EfficientContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_memory_limits(
        data: Buffer | Readable, 
        content_type: string,
        max_size_mb = 10
    ) {
        const max_bytes = max_size_mb * 1024 * 1024
        
        // Check buffer size before processing
        if (Buffer.isBuffer(data) && data.length > max_bytes) {
            throw new Error(`Content too large: ${data.length} bytes (limit: ${max_bytes})`)
        }
        
        try {
            const content = await this.content_reader.read(data, {
                content_type,
                content_encoding: 'identity'
            })
            
            // Additional size check after decompression
            if (content.raw.length > max_bytes) {
                throw new Error(`Decompressed content too large: ${content.raw.length} bytes`)
            }
            
            return content
            
        } catch (error) {
            console.error('Memory-limited processing failed:', error)
            throw error
        }
    }
    
    async process_batch(items: Array<{ data: Buffer, type: string }>) {
        const results = []
        
        // Process in batches to manage memory
        const batch_size = 10
        for (let i = 0; i < items.length; i += batch_size) {
            const batch = items.slice(i, i + batch_size)
            
            const batch_results = await Promise.all(
                batch.map(item => this.process_with_memory_limits(item.data, item.type))
            )
            
            results.push(...batch_results)
            
            // Optional: garbage collection hint
            if (global.gc) {
                global.gc()
            }
        }
        
        return results
    }
}
```

### Caching Content

```typescript
// Content caching for repeated processing
class CachedContentProcessor {
    private cache = new Map<string, any>()
    private cache_size_limit = 100
    
    constructor(private content_reader: ContentReaderService) {}
    
    private get_cache_key(buffer: Buffer, content_type: string): string {
        const crypto = require('crypto')
        const hash = crypto.createHash('sha256')
        hash.update(buffer)
        hash.update(content_type)
        return hash.digest('hex')
    }
    
    async process_with_cache(buffer: Buffer, content_type: string) {
        const cache_key = this.get_cache_key(buffer, content_type)
        
        // Check cache first
        if (this.cache.has(cache_key)) {
            console.log('Cache hit for content')
            return this.cache.get(cache_key)
        }
        
        // Process and cache result
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding: 'identity'
        })
        
        // Manage cache size
        if (this.cache.size >= this.cache_size_limit) {
            const first_key = this.cache.keys().next().value
            this.cache.delete(first_key)
        }
        
        this.cache.set(cache_key, content)
        return content
    }
    
    clear_cache() {
        this.cache.clear()
    }
    
    get_cache_stats() {
        return {
            size: this.cache.size,
            limit: this.cache_size_limit
        }
    }
}
```

## Content Validation

### Schema Validation

```typescript
// JSON Schema validation
@TpService()
class ValidatingContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_schema(
        buffer: Buffer,
        content_type: string,
        schema?: any
    ) {
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding: 'identity'
        })
        
        if (schema && content.type === 'application/json' && content.data) {
            this.validate_against_schema(content.data, schema)
        }
        
        return content
    }
    
    private validate_against_schema(data: any, schema: any): void {
        // Example using a hypothetical JSON Schema validator
        const is_valid = JSONSchema.validate(data, schema)
        
        if (!is_valid) {
            throw new Error('Content does not match expected schema')
        }
    }
    
    async process_user_data(buffer: Buffer) {
        const user_schema = {
            type: 'object',
            required: ['id', 'name', 'email'],
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' }
            }
        }
        
        return this.process_with_schema(buffer, 'application/json', user_schema)
    }
}
```

### Content Sanitization

```typescript
@TpService()
class SanitizingContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_sanitization(
        buffer: Buffer,
        content_type: string
    ) {
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding: 'identity'
        })
        
        // Sanitize based on content type
        if (content.type === 'text/html' && content.text) {
            content.text = this.sanitize_html(content.text)
        } else if (content.type === 'application/json' && content.data) {
            content.data = this.sanitize_json(content.data)
        }
        
        return content
    }
    
    private sanitize_html(html: string): string {
        // Remove script tags and other dangerous elements
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    }
    
    private sanitize_json(data: any): any {
        if (typeof data === 'string') {
            // Remove potential script injections
            return data.replace(/<script/gi, '&lt;script')
        } else if (Array.isArray(data)) {
            return data.map(item => this.sanitize_json(item))
        } else if (typeof data === 'object' && data !== null) {
            const sanitized: any = {}
            for (const [key, value] of Object.entries(data)) {
                // Only allow safe property names
                if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                    sanitized[key] = this.sanitize_json(value)
                }
            }
            return sanitized
        }
        return data
    }
}
```

## Multi-part Content Handling

### Form Data Processing

```typescript
@TpService()
class MultipartProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_multipart_form(
        buffer: Buffer,
        boundary: string
    ) {
        const parts = this.parse_multipart(buffer, boundary)
        const form_data: Record<string, any> = {}
        
        for (const part of parts) {
            const { name, filename, content_type, data } = part
            
            if (filename) {
                // File upload
                const content = await this.content_reader.read(data, {
                    content_type: content_type || 'application/octet-stream',
                    content_encoding: 'identity'
                })
                
                form_data[name] = {
                    filename,
                    content_type,
                    size: data.length,
                    content
                }
            } else {
                // Regular form field
                form_data[name] = data.toString('utf-8')
            }
        }
        
        return form_data
    }
    
    private parse_multipart(buffer: Buffer, boundary: string) {
        const delimiter = Buffer.from(`--${boundary}`)
        const parts: Array<{
            name: string
            filename?: string
            content_type?: string
            data: Buffer
        }> = []
        
        // Split buffer by boundary
        const sections = this.split_buffer(buffer, delimiter)
        
        for (const section of sections) {
            if (section.length === 0) continue
            
            const part = this.parse_multipart_section(section)
            if (part) {
                parts.push(part)
            }
        }
        
        return parts
    }
    
    private split_buffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
        const sections: Buffer[] = []
        let start = 0
        let index = 0
        
        while ((index = buffer.indexOf(delimiter, start)) !== -1) {
            if (index > start) {
                sections.push(buffer.slice(start, index))
            }
            start = index + delimiter.length
        }
        
        if (start < buffer.length) {
            sections.push(buffer.slice(start))
        }
        
        return sections
    }
    
    private parse_multipart_section(section: Buffer) {
        // Find headers/body separator
        const separator = Buffer.from('\r\n\r\n')
        const separator_index = section.indexOf(separator)
        
        if (separator_index === -1) return null
        
        const headers = section.slice(0, separator_index).toString()
        const data = section.slice(separator_index + separator.length)
        
        // Parse Content-Disposition header
        const disposition_match = headers.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i)
        if (!disposition_match) return null
        
        const name = disposition_match[1]
        const filename = disposition_match[2]
        
        // Parse Content-Type header
        const content_type_match = headers.match(/Content-Type:\s*([^\r\n]+)/i)
        const content_type = content_type_match?.[1]
        
        return { name, filename, content_type, data }
    }
}
```

## Compression Integration

### Custom Compression Pipeline

```typescript
import { Transform } from 'stream'
import * as zlib from 'zlib'

@TpService()
class CompressionProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_compression(
        buffer: Buffer,
        content_type: string,
        compression_level = 6
    ) {
        // Compress content before processing
        const compressed = await this.compress_content(buffer, compression_level)
        
        // Process compressed content
        const content = await this.content_reader.read(compressed, {
            content_type,
            content_encoding: 'gzip'
        })
        
        return content
    }
    
    private async compress_content(buffer: Buffer, level: number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            zlib.gzip(buffer, { level }, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }
    
    async create_compression_stream(compression: 'gzip' | 'deflate' | 'br'): Promise<Transform> {
        switch (compression) {
            case 'gzip':
                return zlib.createGzip()
            case 'deflate':
                return zlib.createDeflate()
            case 'br':
                return zlib.createBrotliCompress()
            default:
                throw new Error(`Unsupported compression: ${compression}`)
        }
    }
    
    async process_stream_with_compression(
        input_stream: Readable,
        content_type: string,
        compression: 'gzip' | 'deflate' | 'br'
    ) {
        const compression_stream = await this.create_compression_stream(compression)
        
        // Pipe through compression
        const compressed_stream = input_stream.pipe(compression_stream)
        
        // Process compressed stream
        return this.content_reader.read(compressed_stream, {
            content_type,
            content_encoding: compression
        })
    }
}
```

## Error Recovery

### Fault Tolerant Processing

```typescript
@TpService()
class FaultTolerantProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_fallbacks(
        buffer: Buffer,
        primary_type: string,
        fallback_types: string[] = []
    ) {
        const types_to_try = [primary_type, ...fallback_types]
        const errors: Error[] = []
        
        for (const content_type of types_to_try) {
            try {
                return await this.content_reader.read(buffer, {
                    content_type,
                    content_encoding: 'identity'
                })
            } catch (error) {
                errors.push(error as Error)
                console.warn(`Failed to process as ${content_type}:`, error.message)
            }
        }
        
        // All attempts failed
        throw new Error(`All processing attempts failed: ${errors.map(e => e.message).join(', ')}`)
    }
    
    async process_with_auto_detection(buffer: Buffer) {
        // Try to detect content type from buffer
        const detected_type = this.detect_content_type(buffer)
        
        if (detected_type) {
            try {
                return await this.content_reader.read(buffer, {
                    content_type: detected_type,
                    content_encoding: 'identity'
                })
            } catch (error) {
                console.warn(`Auto-detected type ${detected_type} failed:`, error.message)
            }
        }
        
        // Fallback to common types
        const common_types = [
            'application/json',
            'text/plain',
            'application/x-www-form-urlencoded',
            'text/html'
        ]
        
        return this.process_with_fallbacks(buffer, 'application/octet-stream', common_types)
    }
    
    private detect_content_type(buffer: Buffer): string | null {
        // Simple magic number detection
        if (buffer.length < 4) return null
        
        // JSON detection
        const trimmed = buffer.toString().trim()
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            return 'application/json'
        }
        
        // HTML detection
        if (trimmed.toLowerCase().includes('<html') || trimmed.toLowerCase().includes('<!doctype')) {
            return 'text/html'
        }
        
        // XML detection
        if (trimmed.startsWith('<?xml') || trimmed.includes('<')) {
            return 'application/xml'
        }
        
        // Form data detection
        if (trimmed.includes('=') && !trimmed.includes('<') && !trimmed.includes('{')) {
            return 'application/x-www-form-urlencoded'
        }
        
        return null
    }
}
```

## Integration Patterns

### Middleware Integration

```typescript
import { TpMiddleware, MiddlewareCarrier } from '@tarpit/core'

@TpMiddleware()
class ContentProcessingMiddleware {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process(next: () => Promise<any>, carrier: MiddlewareCarrier) {
        const context = carrier.ctx
        
        // Process request body if present
        if (context.request.body && context.request.headers['content-type']) {
            try {
                const content = await this.content_reader.read(context.request.body, {
                    content_type: context.request.headers['content-type'],
                    content_encoding: context.request.headers['content-encoding'] || 'identity'
                })
                
                // Attach processed content to context
                context.request.parsed_content = content
                
            } catch (error) {
                console.error('Content processing failed:', error)
                // Continue without parsed content
            }
        }
        
        return next()
    }
}
```

### Service Integration

```typescript
@TpService()
class ContentAwareService {
    
    constructor(
        private content_reader: ContentReaderService,
        private cache_service: CacheService,
        private metrics_service: MetricsService
    ) {}
    
    async handle_request(
        data: Buffer | Readable,
        content_type: string,
        request_id: string
    ) {
        const start_time = Date.now()
        
        try {
            // Process content
            const content = await this.content_reader.read(data, {
                content_type,
                content_encoding: 'identity'
            })
            
            // Cache result if appropriate
            if (this.should_cache(content_type)) {
                await this.cache_service.set(`content:${request_id}`, content, 3600)
            }
            
            // Record metrics
            this.metrics_service.timing('content.processing_time', Date.now() - start_time)
            this.metrics_service.increment('content.processed')
            
            return content
            
        } catch (error) {
            this.metrics_service.increment('content.processing_errors')
            throw error
        }
    }
    
    private should_cache(content_type: string): boolean {
        return content_type.startsWith('application/json') ||
               content_type.startsWith('text/')
    }
}
```

## Best Practices Summary

1. **Memory Management**: Always set limits for content size and process in batches
2. **Error Handling**: Implement fallback strategies and graceful degradation
3. **Caching**: Cache processed content for repeated requests
4. **Validation**: Validate content against schemas and sanitize input
5. **Streaming**: Use streams for large content to avoid memory issues
6. **Monitoring**: Track performance metrics and error rates
7. **Security**: Sanitize content and validate against malicious input
8. **Type Detection**: Implement automatic content type detection when possible 