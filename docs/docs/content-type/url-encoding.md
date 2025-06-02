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
const plus_handling = URLEncoding.parse('name=John+Doe&message=Hello+World')
console.log(plus_handling)
// Output: { name: "John Doe", message: "Hello World" }

// Stringifying with spaces
const with_spaces = URLEncoding.stringify({
    name: 'John Doe',
    message: 'Hello World'
})
console.log(with_spaces)
// Output: "name=John%20Doe&message=Hello%20World"
```

## Integration with HTTP Requests

### Processing Form Data

```typescript
import { TpService } from '@tarpit/core'
import { URLEncoding } from '@tarpit/content-type'

@TpService()
class FormHandler {
    
    async process_form_data(body: Buffer, content_type: string) {
        if (content_type.includes('application/x-www-form-urlencoded')) {
            const form_string = body.toString('utf-8')
            const parsed_data = URLEncoding.parse(form_string)
            
            console.log('Form data:', parsed_data)
            return parsed_data
        }
        
        throw new Error('Invalid content type for form processing')
    }
    
    async handle_search_query(query_string: string) {
        const search_params = URLEncoding.parse(query_string)
        
        return {
            query: search_params.q || '',
            page: parseInt(search_params.page) || 1,
            limit: parseInt(search_params.limit) || 10,
            tags: Array.isArray(search_params.tags) 
                ? search_params.tags 
                : search_params.tags ? [search_params.tags] : []
        }
    }
}
```

### Generating Query Strings

```typescript
@TpService()
class APIClient {
    
    build_query_string(params: Record<string, any>): string {
        // Filter out null/undefined values
        const clean_params = Object.entries(params)
            .filter(([_, value]) => value != null)
            .reduce((acc, [key, value]) => {
                acc[key] = value
                return acc
            }, {} as Record<string, any>)
        
        return URLEncoding.stringify(clean_params)
    }
    
    async search_users(filters: {
        name?: string
        age?: number
        tags?: string[]
        active?: boolean
    }) {
        const query_string = this.build_query_string(filters)
        const url = `https://api.example.com/users?${query_string}`
        
        console.log('Request URL:', url)
        // Make HTTP request...
    }
}

// Usage
const client = new APIClient()
await client.search_users({
    name: 'John',
    tags: ['developer', 'nodejs'],
    active: true
})
// Request URL: https://api.example.com/users?name=John&tags=developer&tags=nodejs&active=true
```

## Advanced Options

### Parsing Options

```typescript
interface ParseOptions {
    charset?: string          // Character encoding (default: 'utf-8')
    arrayLimit?: number       // Maximum array length (default: 100)
    parameterLimit?: number   // Maximum parameters (default: 1000)
    parseArrays?: boolean     // Enable array parsing (default: true)
}

// Custom parsing options
const options: ParseOptions = {
    charset: 'utf-8',
    arrayLimit: 50,
    parameterLimit: 500,
    parseArrays: true
}

const parsed = URLEncoding.parse('data=value1&data=value2', options)
```

### Stringification Options

```typescript
interface StringifyOptions {
    charset?: string          // Character encoding (default: 'utf-8')
    encodeValuesOnly?: boolean // Only encode values, not keys (default: false)
    skipNulls?: boolean       // Skip null values (default: false)
    addQueryPrefix?: boolean  // Add '?' prefix (default: false)
}

// Custom stringification options
const stringify_options: StringifyOptions = {
    charset: 'utf-8',
    encodeValuesOnly: true,
    skipNulls: true,
    addQueryPrefix: true
}

const query = URLEncoding.stringify({
    name: 'John',
    email: null,
    age: 30
}, stringify_options)
// Output: "?name=John&age=30"
```

## Error Handling

```typescript
@TpService()
class SafeURLEncoding {
    
    safe_parse(input: string): Record<string, any> | null {
        try {
            return URLEncoding.parse(input)
        } catch (error) {
            console.error('URL parsing failed:', error.message)
            return null
        }
    }
    
    safe_stringify(obj: Record<string, any>): string | null {
        try {
            return URLEncoding.stringify(obj)
        } catch (error) {
            console.error('URL stringification failed:', error.message)
            return null
        }
    }
    
    validate_and_parse(input: string): Record<string, any> {
        // Basic validation
        if (!input || typeof input !== 'string') {
            throw new Error('Invalid input: must be a non-empty string')
        }
        
        // Check for suspicious patterns
        if (input.length > 10000) {
            throw new Error('Input too large')
        }
        
        return URLEncoding.parse(input)
    }
}
```

## Best Practices

1. **Always validate input** before parsing
2. **Set reasonable limits** for arrays and parameters
3. **Handle encoding consistently** across your application
4. **Use appropriate charset** for your data
5. **Consider security implications** of user input
6. **Test with special characters** and edge cases
7. **Handle errors gracefully** in production code 