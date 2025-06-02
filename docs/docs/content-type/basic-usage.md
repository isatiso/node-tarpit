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

Handle gzip and deflate compressed content:

```typescript
@TpService()
class CompressionProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async process_gzipped_json(compressed_buffer: Buffer) {
        const content = await this.content_reader.read(compressed_buffer, {
            content_type: 'application/json',
            content_encoding: 'gzip'
        })
        
        console.log('📦 Decompressed and parsed JSON:', content.data)
        return content.data
    }
    
    async process_deflated_text(compressed_buffer: Buffer) {
        const content = await this.content_reader.read(compressed_buffer, {
            content_type: 'text/plain; charset=utf-8',
            content_encoding: 'deflate'
        })
        
        return {
            original_size: compressed_buffer.length,
            decompressed_size: content.raw.length,
            compression_ratio: compressed_buffer.length / content.raw.length,
            text: content.text
        }
    }
}
```

## Content Types Overview

The module supports various content types:

### Supported Content Types

- **JSON**: `application/json`
- **Form Data**: `application/x-www-form-urlencoded`
- **Text**: `text/plain`, `text/html`, `text/css`, `text/javascript`
- **Binary**: Any content type not specifically handled

### Supported Encodings

- **Identity**: No compression (default)
- **Gzip**: GNU zip compression
- **Deflate**: zlib compression

### Content Object Structure

The `ContentReaderService.read()` method returns an object with:

```typescript
interface Content {
    type: string        // MIME type
    charset: string     // Character encoding
    raw: Buffer         // Original raw bytes
    text?: string       // Text representation (if applicable)
    data?: any          // Parsed data (for JSON, forms)
}
```

## Error Handling

```typescript
@TpService()
class SafeContentProcessor {
    
    constructor(private content_reader: ContentReaderService) {}
    
    async safe_process(buffer: Buffer, content_type: string) {
        try {
            const content = await this.content_reader.read(buffer, {
                content_type,
                content_encoding: 'identity'
            })
            
            return { success: true, content }
            
        } catch (error) {
            console.error('Content processing failed:', error.message)
            
            return { 
                success: false, 
                error: error.message,
                fallback: buffer.toString('utf-8', 0, Math.min(buffer.length, 100))
            }
        }
    }
}
```

## Best Practices

1. **Always specify content type** when known
2. **Handle different charsets** appropriately
3. **Validate parsed data** before using
4. **Handle compression** when applicable
5. **Implement error handling** for malformed content
6. **Consider memory usage** for large content
7. **Use appropriate content types** for your data format 