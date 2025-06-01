---
layout: default
title: URL Encoding
parent: Content Type
nav_order: 2
---

# URL Encoding

The Tarpit Content Type module includes comprehensive URL encoding and decoding utilities through the `URLEncoding` namespace, providing full support for query string parsing and generation.

## Overview

URL encoding is essential for handling form data, query parameters, and any data transmitted via URLs. The module provides:

- **Query String Parsing**: Convert URL-encoded strings to JavaScript objects
- **Object Stringification**: Convert JavaScript objects to URL-encoded strings
- **Character Encoding Support**: Handle various character encodings (UTF-8, Latin1, etc.)
- **Array Handling**: Proper support for multiple values with the same key
- **Special Character Handling**: Correct encoding/decoding of special characters

## Basic Usage

### Importing

```typescript
import { URLEncoding } from '@tarpit/content-type'
```

### Simple Parsing

```typescript
// Basic key-value pairs
const simple = URLEncoding.parse('name=John&age=30')
console.log(simple)
// Output: { name: "John", age: "30" }

// Empty values
const with_empty = URLEncoding.parse('name=John&email=&age=30')
console.log(with_empty)
// Output: { name: "John", email: "", age: "30" }

// Missing values (key without =)
const missing_values = URLEncoding.parse('name=John&subscribe&age=30')
console.log(missing_values)
// Output: { name: "John", subscribe: "", age: "30" }
```

### Simple Stringification

```typescript
// Basic object
const basic = URLEncoding.stringify({
    name: 'John',
    age: '30',
    email: 'john@example.com'
})
console.log(basic)
// Output: "name=John&age=30&email=john%40example.com"

// With empty values
const with_empty = URLEncoding.stringify({
    name: 'John',
    email: '',
    age: '30'
})
console.log(with_empty)
// Output: "name=John&email=&age=30"
```

## Array Values

### Parsing Arrays

When multiple values share the same key, they are automatically converted to arrays:

```typescript
// Multiple values for the same key
const arrays = URLEncoding.parse('tags=javascript&tags=typescript&tags=nodejs')
console.log(arrays)
// Output: { tags: ["javascript", "typescript", "nodejs"] }

// Mixed single and multiple values
const mixed = URLEncoding.parse('name=John&tags=js&tags=ts&age=30')
console.log(mixed)
// Output: { name: "John", tags: ["js", "ts"], age: "30" }

// Single value (not converted to array)
const single = URLEncoding.parse('tags=javascript')
console.log(single)
// Output: { tags: "javascript" }
```

### Stringifying Arrays

Arrays are automatically converted to multiple key-value pairs:

```typescript
// Array values
const arrays = URLEncoding.stringify({
    name: 'John',
    tags: ['javascript', 'typescript', 'nodejs'],
    age: '30'
})
console.log(arrays)
// Output: "name=John&tags=javascript&tags=typescript&tags=nodejs&age=30"

// Single-item arrays
const single_array = URLEncoding.stringify({
    tags: ['javascript']
})
console.log(single_array)
// Output: "tags=javascript"

// Empty arrays are skipped
const empty_array = URLEncoding.stringify({
    name: 'John',
    tags: [],
    age: '30'
})
console.log(empty_array)
// Output: "name=John&age=30"
```

## Character Encoding

### UTF-8 Encoding (Default)

```typescript
// Chinese characters
const chinese = URLEncoding.parse('name=%E5%BC%A0%E4%B8%89&city=%E5%8C%97%E4%BA%AC')
console.log(chinese)
// Output: { name: "张三", city: "北京" }

// Stringifying Chinese characters
const chinese_string = URLEncoding.stringify({
    name: '张三',
    city: '北京'
})
console.log(chinese_string)
// Output: "name=%E5%BC%A0%E4%B8%89&city=%E5%8C%97%E4%BA%AC"

// Emojis and special Unicode
const unicode = URLEncoding.stringify({
    status: '🎉 Success!',
    message: 'Hello, 世界!'
})
console.log(unicode)
// Output: "status=%F0%9F%8E%89%20Success!&message=Hello%2C%20%E4%B8%96%E7%95%8C!"
```

### Custom Character Encoding

```typescript
// Specify custom charset for parsing
const custom_charset = URLEncoding.parse(
    'name=%D5%C5%C8%FD',  // 张三 in GBK encoding
    { charset: 'gbk' }
)
console.log(custom_charset)
// Output: { name: "张三" }

// Specify custom charset for stringification
const custom_string = URLEncoding.stringify(
    { name: '张三' },
    'gbk'
)
console.log(custom_string)
// Output: "name=%D5%C5%C8%FD"
```

## Special Characters

### Common Special Characters

```typescript
// URL-unsafe characters
const special = URLEncoding.stringify({
    email: 'user@example.com',
    query: 'hello world',
    symbols: '!@#$%^&*()',
    path: '/api/v1/users?id=123'
})
console.log(special)
// Output: "email=user%40example.com&query=hello%20world&symbols=%21%40%23%24%25%5E%26*%28%29&path=%2Fapi%2Fv1%2Fusers%3Fid%3D123"

// Parsing encoded special characters
const parsed_special = URLEncoding.parse(
    'email=user%40example.com&query=hello%20world&symbols=%21%40%23%24%25'
)
console.log(parsed_special)
// Output: { email: "user@example.com", query: "hello world", symbols: "!@#$%" }
```

### Plus Sign Handling

The plus sign (+) is treated as a space character in query strings:

```typescript
// Plus signs are converted to spaces
const with_plus = URLEncoding.parse('query=hello+world&name=John+Doe')
console.log(with_plus)
// Output: { query: "hello world", name: "John Doe" }

// To include literal plus signs, they must be encoded
const literal_plus = URLEncoding.parse('math=2%2B2%3D4')
console.log(literal_plus)
// Output: { math: "2+2=4" }
```

## Advanced Options

### Maximum Keys Limit

Prevent memory exhaustion attacks by limiting the number of keys:

```typescript
// Default limit is 1000 keys
const limited = URLEncoding.parse(
    'key1=value1&key2=value2&key3=value3',
    { max_keys: 2 }
)
console.log(limited)
// Output: { key1: "value1", key2: "value2" } (key3 is ignored)

// Disable limit by setting to 0 or negative value
const unlimited = URLEncoding.parse(
    'key1=value1&key2=value2&key3=value3',
    { max_keys: 0 }
)
console.log(unlimited)
// Output: { key1: "value1", key2: "value2", key3: "value3" }
```

### Complex Parsing Options

```typescript
interface ParseOptions {
    max_keys?: number      // Maximum number of keys to parse (default: 1000)
    charset?: string       // Character encoding (default: 'utf-8')
}

// Example with all options
const complex = URLEncoding.parse(
    'name=%E5%BC%A0%E4%B8%89&age=30&tags=js&tags=ts',
    {
        max_keys: 10,
        charset: 'utf-8'
    }
)
console.log(complex)
// Output: { name: "张三", age: "30", tags: ["js", "ts"] }
```

## Integration with Form Data

### Processing Form Submissions

```typescript
import { ContentReaderService } from '@tarpit/content-type'

// In a service or controller
async function process_form(content_reader: ContentReaderService, form_body: Buffer) {
    const content = await content_reader.read(form_body, {
        content_type: 'application/x-www-form-urlencoded',
        content_encoding: 'identity'
    })
    
    // The form data is automatically parsed using URLEncoding.parse()
    console.log('Form fields:', content.data)
    
    return content.data
}
```

### Manual Form Processing

```typescript
// Direct use of URLEncoding for form data
function parse_form_data(form_string: string) {
    return URLEncoding.parse(form_string, {
        charset: 'utf-8',
        max_keys: 100
    })
}

// Example form data
const form_data = 'username=johndoe&email=john%40example.com&interests=coding&interests=reading'
const parsed = parse_form_data(form_data)
console.log(parsed)
// Output: { 
//   username: "johndoe", 
//   email: "john@example.com", 
//   interests: ["coding", "reading"] 
// }
```

## Query String Generation

### Building URLs

```typescript
function build_url(base: string, params: Record<string, string | string[]>): string {
    const query = URLEncoding.stringify(params)
    return query ? `${base}?${query}` : base
}

// Example usage
const url = build_url('/api/search', {
    q: 'javascript tutorial',
    category: 'programming',
    tags: ['beginner', 'web'],
    limit: '10'
})
console.log(url)
// Output: "/api/search?q=javascript%20tutorial&category=programming&tags=beginner&tags=web&limit=10"
```

### API Request Parameters

```typescript
// Building API request parameters
const api_params = {
    user_id: '12345',
    fields: ['name', 'email', 'profile'],
    include: 'preferences',
    format: 'json'
}

const query_string = URLEncoding.stringify(api_params)
console.log(query_string)
// Output: "user_id=12345&fields=name&fields=email&fields=profile&include=preferences&format=json"
```

## Error Handling

### Malformed Input

The URLEncoding functions are designed to handle malformed input gracefully:

```typescript
// Missing values
const missing = URLEncoding.parse('name=&age=30&email')
console.log(missing)
// Output: { name: "", age: "30", email: "" }

// Malformed encoding
const malformed = URLEncoding.parse('name=%ZZ&age=30')
console.log(malformed)
// Output: { name: "%ZZ", age: "30" } (invalid encoding preserved)

// Empty input
const empty = URLEncoding.parse('')
console.log(empty)
// Output: {}
```

### Invalid Characters

```typescript
// Invalid UTF-8 sequences are handled gracefully
const invalid_utf8 = URLEncoding.parse('name=%C0%C1&age=30')
console.log(invalid_utf8)
// Output: { name: "%C0%C1", age: "30" } (preserved as-is)
```

## Performance Considerations

### Large Query Strings

```typescript
// Use max_keys to prevent memory issues
const safe_parse = (query: string) => {
    return URLEncoding.parse(query, {
        max_keys: 1000  // Reasonable limit
    })
}

// For known large datasets, consider streaming or chunking
```

### Character Encoding Performance

```typescript
// UTF-8 is most efficient
const fast = URLEncoding.stringify(data, 'utf-8')

// Other encodings require additional processing
const slower = URLEncoding.stringify(data, 'gbk')
```

## Best Practices

### 1. Always Specify Charset

```typescript
// Good - explicit charset
const parsed = URLEncoding.parse(query_string, { charset: 'utf-8' })

// Avoid - relies on default
const parsed_default = URLEncoding.parse(query_string)
```

### 2. Set Reasonable Limits

```typescript
// Good - prevents memory attacks
const safe = URLEncoding.parse(query, { max_keys: 100 })

// Avoid - unlimited parsing
const unsafe = URLEncoding.parse(query, { max_keys: 0 })
```

### 3. Handle Arrays Consistently

```typescript
// Good - check for array values
const tags = parsed.tags
const tag_array = Array.isArray(tags) ? tags : [tags].filter(Boolean)

// Good - normalize to array
function normalize_to_array(value: string | string[] | undefined): string[] {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
}
```

### 4. Validate Input

```typescript
function safe_parse(query: string): Record<string, string | string[]> {
    if (!query || typeof query !== 'string') {
        return {}
    }
    
    // Limit query string length
    if (query.length > 10000) {
        throw new Error('Query string too long')
    }
    
    return URLEncoding.parse(query, {
        max_keys: 100,
        charset: 'utf-8'
    })
}
```

## Common Patterns

### Search Parameters

```typescript
// Building search URLs
function build_search_url(params: {
    query?: string
    category?: string
    tags?: string[]
    page?: number
    limit?: number
}) {
    const search_params: Record<string, string | string[]> = {}
    
    if (params.query) search_params.q = params.query
    if (params.category) search_params.category = params.category
    if (params.tags?.length) search_params.tags = params.tags
    if (params.page) search_params.page = params.page.toString()
    if (params.limit) search_params.limit = params.limit.toString()
    
    return '/search?' + URLEncoding.stringify(search_params)
}
```

### Form Validation

```typescript
// Validating parsed form data
function validate_form(parsed: Record<string, string | string[]>) {
    const errors: string[] = []
    
    // Required fields
    if (!parsed.name || parsed.name === '') {
        errors.push('Name is required')
    }
    
    // Email validation
    const email = parsed.email
    if (typeof email === 'string' && email && !email.includes('@')) {
        errors.push('Invalid email format')
    }
    
    // Array fields
    const tags = parsed.tags
    if (tags && Array.isArray(tags) && tags.length > 10) {
        errors.push('Too many tags (max 10)')
    }
    
    return errors
}
```

### API Parameter Building

```typescript
// Building API request parameters with proper encoding
function build_api_params(filters: {
    user_id?: string
    date_range?: { start: string, end: string }
    status?: string[]
    search?: string
}) {
    const params: Record<string, string | string[]> = {}
    
    if (filters.user_id) {
        params.user_id = filters.user_id
    }
    
    if (filters.date_range) {
        params.start_date = filters.date_range.start
        params.end_date = filters.date_range.end
    }
    
    if (filters.status?.length) {
        params.status = filters.status
    }
    
    if (filters.search) {
        params.q = filters.search
    }
    
    return URLEncoding.stringify(params)
}
```

## Testing URL Encoding

### Unit Testing Examples

```typescript
describe('URLEncoding', () => {
    test('should parse simple key-value pairs', () => {
        const result = URLEncoding.parse('name=John&age=30')
        expect(result).toEqual({ name: 'John', age: '30' })
    })
    
    test('should handle array values', () => {
        const result = URLEncoding.parse('tags=js&tags=ts&tags=node')
        expect(result).toEqual({ tags: ['js', 'ts', 'node'] })
    })
    
    test('should encode Unicode characters', () => {
        const result = URLEncoding.stringify({ name: '张三' })
        expect(result).toBe('name=%E5%BC%A0%E4%B8%89')
    })
    
    test('should handle special characters', () => {
        const result = URLEncoding.parse('email=user%40example.com')
        expect(result).toEqual({ email: 'user@example.com' })
    })
})
```

## Next Steps

- [Basic Usage](./1-basic-usage.md) - General content processing
- [Deserializers](./3-deserializers.md) - Custom content deserializers
- [Advanced Features](./4-advanced-features.md) - Compression and custom extensions
- [Examples](./5-examples.md) - Real-world usage examples 