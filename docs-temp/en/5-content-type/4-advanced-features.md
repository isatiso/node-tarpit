---
layout: default
title: Advanced Features
parent: Content Type
nav_order: 4
---

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

## Content Type Detection and Validation

### Advanced Content Type Detection

```typescript
// Sophisticated content type detection
class ContentTypeDetector {
    
    constructor(private content_reader: ContentReaderService) {}
    
    detect_from_buffer(buffer: Buffer): string {
        // Check for common magic numbers/signatures
        if (this.is_json(buffer)) return 'application/json'
        if (this.is_xml(buffer)) return 'application/xml'
        if (this.is_html(buffer)) return 'text/html'
        if (this.is_css(buffer)) return 'text/css'
        if (this.is_javascript(buffer)) return 'application/javascript'
        if (this.is_image(buffer)) return this.detect_image_type(buffer)
        if (this.is_pdf(buffer)) return 'application/pdf'
        
        return 'application/octet-stream'
    }
    
    private is_json(buffer: Buffer): boolean {
        const start = buffer.toString('utf8', 0, 10).trim()
        return start.startsWith('{') || start.startsWith('[')
    }
    
    private is_xml(buffer: Buffer): boolean {
        const start = buffer.toString('utf8', 0, 100).trim()
        return start.startsWith('<?xml') || start.startsWith('<')
    }
    
    private is_html(buffer: Buffer): boolean {
        const start = buffer.toString('utf8', 0, 100).toLowerCase()
        return start.includes('<!doctype html') || start.includes('<html')
    }
    
    private is_css(buffer: Buffer): boolean {
        const content = buffer.toString('utf8', 0, 200)
        return /^[^{]*\{[^}]*\}/.test(content.trim())
    }
    
    private is_javascript(buffer: Buffer): boolean {
        const content = buffer.toString('utf8', 0, 200)
        return /^\s*(function|var|let|const|import|export|\/\*|\/{2})/.test(content)
    }
    
    private is_image(buffer: Buffer): boolean {
        if (buffer.length < 8) return false
        
        // Check common image signatures
        const signature = buffer.toString('hex', 0, 8)
        return /^(89504e47|ffd8ffe|47494638|424d|52494646)/.test(signature)
    }
    
    private detect_image_type(buffer: Buffer): string {
        const signature = buffer.toString('hex', 0, 8)
        
        if (signature.startsWith('89504e47')) return 'image/png'
        if (signature.startsWith('ffd8ffe')) return 'image/jpeg'
        if (signature.startsWith('47494638')) return 'image/gif'
        if (signature.startsWith('424d')) return 'image/bmp'
        if (signature.startsWith('52494646')) return 'image/webp'
        
        return 'application/octet-stream'
    }
    
    private is_pdf(buffer: Buffer): boolean {
        return buffer.toString('ascii', 0, 4) === '%PDF'
    }
    
    async process_with_detection(buffer: Buffer, provided_type?: string) {
        const detected_type = this.detect_from_buffer(buffer)
        const content_type = provided_type || detected_type
        
        console.log(`Detected: ${detected_type}, Using: ${content_type}`)
        
        return this.content_reader.read(buffer, {
            content_type,
            content_encoding: 'identity'
        })
    }
}
```

### Content Validation

```typescript
// Content validation and sanitization
class ContentValidator {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async validate_json(buffer: Buffer, schema?: any) {
        const content = await this.content_reader.read(buffer, {
            content_type: 'application/json',
            content_encoding: 'identity'
        })
        
        if (!content.data) {
            throw new Error('Invalid JSON content')
        }
        
        // Optional schema validation
        if (schema) {
            if (!this.validate_against_schema(content.data, schema)) {
                throw new Error('JSON does not match schema')
            }
        }
        
        return content.data
    }
    
    async validate_form(buffer: Buffer, required_fields: string[] = []) {
        const content = await this.content_reader.read(buffer, {
            content_type: 'application/x-www-form-urlencoded',
            content_encoding: 'identity'
        })
        
        if (!content.data) {
            throw new Error('Invalid form data')
        }
        
        // Check required fields
        const missing_fields = required_fields.filter(field => !content.data[field])
        if (missing_fields.length > 0) {
            throw new Error(`Missing required fields: ${missing_fields.join(', ')}`)
        }
        
        return content.data
    }
    
    async sanitize_text(buffer: Buffer, options: {
        max_length?: number
        allowed_chars?: RegExp
        strip_html?: boolean
    } = {}) {
        const content = await this.content_reader.read(buffer, {
            content_type: 'text/plain; charset=utf-8',
            content_encoding: 'identity'
        })
        
        if (!content.text) {
            return ''
        }
        
        let sanitized = content.text
        
        // Length limit
        if (options.max_length && sanitized.length > options.max_length) {
            sanitized = sanitized.substring(0, options.max_length)
        }
        
        // Character filtering
        if (options.allowed_chars) {
            sanitized = sanitized.replace(options.allowed_chars, '')
        }
        
        // HTML stripping
        if (options.strip_html) {
            sanitized = sanitized.replace(/<[^>]*>/g, '')
        }
        
        return sanitized
    }
    
    private validate_against_schema(data: any, schema: any): boolean {
        // Simplified schema validation
        // In real implementation, use a proper JSON schema validator
        return typeof data === typeof schema
    }
}
```

## Integration Patterns

### Middleware Integration

```typescript
// Express.js middleware example
import { Request, Response, NextFunction } from 'express'

function content_parsing_middleware(content_reader: ContentReaderService) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.body && Buffer.isBuffer(req.body)) {
                const content_type = req.headers['content-type'] || 'application/octet-stream'
                const content_encoding = req.headers['content-encoding'] || 'identity'
                
                const content = await content_reader.read(req.body, {
                    content_type,
                    content_encoding
                })
                
                // Attach parsed content to request
                req.parsed_content = content
                req.content_info = {
                    type: content.type,
                    charset: content.charset,
                    size: content.raw.length,
                    has_data: !!content.data
                }
            }
            
            next()
            
        } catch (error) {
            console.error('Content parsing middleware error:', error)
            res.status(400).json({ error: 'Invalid content format' })
        }
    }
}
```

### Service Integration

```typescript
// Integration with other services
@TpService()
class ContentProcessingService {
    
    constructor(
        private content_reader: ContentReaderService,
        private validator: ContentValidator,
        private detector: ContentTypeDetector
    ) {}
    
    async process_upload(
        buffer: Buffer,
        headers: { [key: string]: string },
        validation_rules?: any
    ) {
        // Step 1: Detect content type
        const detected_type = this.detector.detect_from_buffer(buffer)
        const content_type = headers['content-type'] || detected_type
        
        // Step 2: Process content
        const content = await this.content_reader.read(buffer, {
            content_type,
            content_encoding: headers['content-encoding'] || 'identity'
        })
        
        // Step 3: Validate if rules provided
        if (validation_rules) {
            await this.validate_content(content, validation_rules)
        }
        
        // Step 4: Return processed result
        return {
            content,
            metadata: {
                detected_type,
                provided_type: headers['content-type'],
                size: buffer.length,
                processed_at: new Date()
            }
        }
    }
    
    private async validate_content(content: any, rules: any) {
        switch (content.type) {
            case 'application/json':
                if (rules.json_schema) {
                    await this.validator.validate_json(content.raw, rules.json_schema)
                }
                break
                
            case 'application/x-www-form-urlencoded':
                if (rules.required_fields) {
                    await this.validator.validate_form(content.raw, rules.required_fields)
                }
                break
                
            case 'text/plain':
                if (rules.text_options) {
                    await this.validator.sanitize_text(content.raw, rules.text_options)
                }
                break
        }
    }
}
```

## Error Handling and Recovery

### Robust Error Handling

```typescript
// Comprehensive error handling
class RobustContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_with_fallbacks(
        buffer: Buffer,
        primary_type: string,
        fallback_types: string[] = ['text/plain', 'application/octet-stream']
    ) {
        // Try primary content type
        try {
            return await this.content_reader.read(buffer, {
                content_type: primary_type,
                content_encoding: 'identity'
            })
        } catch (primary_error) {
            console.warn(`Primary type ${primary_type} failed:`, primary_error)
        }
        
        // Try fallback types
        for (const fallback_type of fallback_types) {
            try {
                console.log(`Trying fallback type: ${fallback_type}`)
                return await this.content_reader.read(buffer, {
                    content_type: fallback_type,
                    content_encoding: 'identity'
                })
            } catch (fallback_error) {
                console.warn(`Fallback type ${fallback_type} failed:`, fallback_error)
            }
        }
        
        // Final fallback - return raw data
        console.log('All parsing failed, returning raw data')
        return {
            type: undefined,
            charset: undefined,
            parameters: {},
            raw: buffer,
            text: undefined,
            data: undefined,
            error: 'All content type parsing failed'
        }
    }
    
    async process_with_retry(
        data: Buffer | Readable,
        content_type: string,
        max_retries = 3,
        retry_delay = 1000
    ) {
        let last_error: Error | undefined
        
        for (let attempt = 1; attempt <= max_retries; attempt++) {
            try {
                return await this.content_reader.read(data, {
                    content_type,
                    content_encoding: 'identity'
                })
            } catch (error) {
                last_error = error as Error
                console.warn(`Attempt ${attempt} failed:`, error)
                
                if (attempt < max_retries) {
                    console.log(`Retrying in ${retry_delay}ms...`)
                    await new Promise(resolve => setTimeout(resolve, retry_delay))
                    retry_delay *= 2 // Exponential backoff
                }
            }
        }
        
        throw new Error(`All ${max_retries} attempts failed. Last error: ${last_error?.message}`)
    }
}
```

### Circuit Breaker Pattern

```typescript
// Circuit breaker for content processing
class ContentProcessingCircuitBreaker {
    private failure_count = 0
    private failure_threshold = 5
    private timeout = 60000 // 1 minute
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
    private next_attempt = 0
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process(buffer: Buffer, content_type: string) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.next_attempt) {
                throw new Error('Circuit breaker is OPEN')
            } else {
                this.state = 'HALF_OPEN'
            }
        }
        
        try {
            const result = await this.content_reader.read(buffer, {
                content_type,
                content_encoding: 'identity'
            })
            
            // Success - reset circuit breaker
            this.failure_count = 0
            this.state = 'CLOSED'
            
            return result
            
        } catch (error) {
            this.failure_count++
            
            if (this.failure_count >= this.failure_threshold) {
                this.state = 'OPEN'
                this.next_attempt = Date.now() + this.timeout
                console.warn('Circuit breaker opened due to failures')
            }
            
            throw error
        }
    }
    
    get_status() {
        return {
            state: this.state,
            failure_count: this.failure_count,
            next_attempt: new Date(this.next_attempt)
        }
    }
    
    reset() {
        this.failure_count = 0
        this.state = 'CLOSED'
        this.next_attempt = 0
    }
}
```

## Monitoring and Metrics

### Performance Monitoring

```typescript
// Performance monitoring for content processing
class ContentProcessingMonitor {
    private metrics = {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        processing_times: [] as number[],
        content_types: new Map<string, number>(),
        content_sizes: [] as number[]
    }
    
    constructor(private content_reader: ContentReaderService) {}
    
    async monitored_process(buffer: Buffer, content_type: string) {
        const start_time = Date.now()
        this.metrics.total_requests++
        
        try {
            const result = await this.content_reader.read(buffer, {
                content_type,
                content_encoding: 'identity'
            })
            
            // Success metrics
            this.metrics.successful_requests++
            this.record_processing_time(Date.now() - start_time)
            this.record_content_type(content_type)
            this.record_content_size(buffer.length)
            
            return result
            
        } catch (error) {
            this.metrics.failed_requests++
            throw error
        }
    }
    
    private record_processing_time(time: number) {
        this.metrics.processing_times.push(time)
        
        // Keep only last 1000 measurements
        if (this.metrics.processing_times.length > 1000) {
            this.metrics.processing_times = this.metrics.processing_times.slice(-1000)
        }
    }
    
    private record_content_type(type: string) {
        const count = this.metrics.content_types.get(type) || 0
        this.metrics.content_types.set(type, count + 1)
    }
    
    private record_content_size(size: number) {
        this.metrics.content_sizes.push(size)
        
        // Keep only last 1000 measurements
        if (this.metrics.content_sizes.length > 1000) {
            this.metrics.content_sizes = this.metrics.content_sizes.slice(-1000)
        }
    }
    
    get_statistics() {
        const processing_times = this.metrics.processing_times
        const content_sizes = this.metrics.content_sizes
        
        return {
            requests: {
                total: this.metrics.total_requests,
                successful: this.metrics.successful_requests,
                failed: this.metrics.failed_requests,
                success_rate: this.metrics.total_requests > 0 
                    ? this.metrics.successful_requests / this.metrics.total_requests 
                    : 0
            },
            performance: {
                avg_processing_time: processing_times.length > 0 
                    ? processing_times.reduce((a, b) => a + b) / processing_times.length 
                    : 0,
                max_processing_time: processing_times.length > 0 
                    ? Math.max(...processing_times) 
                    : 0,
                min_processing_time: processing_times.length > 0 
                    ? Math.min(...processing_times) 
                    : 0
            },
            content: {
                avg_size: content_sizes.length > 0 
                    ? content_sizes.reduce((a, b) => a + b) / content_sizes.length 
                    : 0,
                max_size: content_sizes.length > 0 
                    ? Math.max(...content_sizes) 
                    : 0,
                min_size: content_sizes.length > 0 
                    ? Math.min(...content_sizes) 
                    : 0
            },
            content_types: Object.fromEntries(this.metrics.content_types)
        }
    }
    
    reset_metrics() {
        this.metrics = {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            processing_times: [],
            content_types: new Map(),
            content_sizes: []
        }
    }
}
```

## Best Practices for Production

### Security Considerations

```typescript
// Security-focused content processing
class SecureContentProcessor {
    
    constructor(
        private content_reader: ContentReaderService,
        private max_size = 10 * 1024 * 1024, // 10MB
        private allowed_types = ['application/json', 'application/x-www-form-urlencoded', 'text/plain']
    ) {}
    
    async secure_process(buffer: Buffer, content_type: string) {
        // Size validation
        if (buffer.length > this.max_size) {
            throw new Error(`Content too large: ${buffer.length} bytes (max: ${this.max_size})`)
        }
        
        // Content type validation
        if (!this.allowed_types.includes(content_type)) {
            throw new Error(`Content type not allowed: ${content_type}`)
        }
        
        // Process with timeout
        const timeout_promise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Processing timeout')), 30000) // 30 seconds
        })
        
        const processing_promise = this.content_reader.read(buffer, {
            content_type,
            content_encoding: 'identity'
        })
        
        return Promise.race([processing_promise, timeout_promise])
    }
}
```

### Configuration Management

```typescript
// Configurable content processing
interface ContentProcessingConfig {
    max_content_size: number
    allowed_content_types: string[]
    enable_compression: boolean
    cache_enabled: boolean
    cache_size: number
    timeout_ms: number
}

class ConfigurableContentProcessor {
    private config: ContentProcessingConfig
    
    constructor(
        private content_reader: ContentReaderService,
        config: Partial<ContentProcessingConfig> = {}
    ) {
        this.config = {
            max_content_size: 10 * 1024 * 1024, // 10MB
            allowed_content_types: ['application/json', 'text/plain'],
            enable_compression: true,
            cache_enabled: false,
            cache_size: 100,
            timeout_ms: 30000,
            ...config
        }
    }
    
    async process(buffer: Buffer, content_type: string, content_encoding = 'identity') {
        // Apply configuration rules
        if (buffer.length > this.config.max_content_size) {
            throw new Error('Content too large')
        }
        
        if (!this.config.allowed_content_types.includes(content_type)) {
            throw new Error('Content type not allowed')
        }
        
        if (!this.config.enable_compression && content_encoding !== 'identity') {
            throw new Error('Compression not enabled')
        }
        
        // Process with timeout
        const timeout_promise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Processing timeout')), this.config.timeout_ms)
        })
        
        const processing_promise = this.content_reader.read(buffer, {
            content_type,
            content_encoding
        })
        
        return Promise.race([processing_promise, timeout_promise])
    }
    
    update_config(new_config: Partial<ContentProcessingConfig>) {
        this.config = { ...this.config, ...new_config }
    }
    
    get_config() {
        return { ...this.config }
    }
}
```

## Next Steps

- [Basic Usage](./1-basic-usage.md) - Getting started guide
- [URL Encoding](./2-url-encoding.md) - Query string handling
- [Deserializers](./3-deserializers.md) - Custom content deserializers
- [Examples](./5-examples.md) - Real-world usage examples 