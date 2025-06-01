---
layout: default
title: Request Handling
nav_order: 2
parent: HTTP Server
---

# Request Handling
{:.no_toc}

> **💡 Working Examples**: See [request-parsing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/request-parsing.ts) and [form-handling.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/form-handling.ts) for complete working examples.

Request handling in Tarpit involves parsing incoming HTTP requests, extracting data from different sources (body, headers, query parameters), and validating input. Tarpit provides a rich set of built-in tools for handling various content types and request formats.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Request Bodies

### JSON Body Parsing

Use `JsonBody` for JSON request bodies with type validation:

> **📁 Example**: [request-parsing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/request-parsing.ts)

```typescript
import { JsonBody } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody<{ name: string, email: string, age?: number }>) {
        const name = body.ensure('name', Jtl.string.trim().min(1))
        const email = body.ensure('email', Jtl.string.email())
        const age = body.get('age', Jtl.integer.min(0).max(150))
        
        return {
            id: Date.now(),
            name,
            email,
            age: age || null
        }
    }
}
```

### Form Data Parsing

Handle HTML form submissions with `FormBody`:

> **📁 Example**: [form-handling.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/form-handling.ts)

```typescript
import { FormBody } from '@tarpit/http'

@TpRouter('/api/forms')
class FormRouter {
    @Post('contact')
    async handle_contact_form(body: FormBody) {
        const name = body.ensure('name', Jtl.string.trim().min(1))
        const email = body.ensure('email', Jtl.string.email())
        const message = body.ensure('message', Jtl.string.trim().min(10))
        const newsletter = body.get('newsletter') === 'on'
        
        return {
            success: true,
            data: { name, email, message, newsletter }
        }
    }
}
```

### Raw Body Access

Access raw request body for custom parsing:

```typescript
import { RawBody } from '@tarpit/http'

@TpRouter('/api/webhook')
class WebhookRouter {
    @Post('github')
    async handle_github_webhook(body: RawBody) {
        const payload = body.buffer // Get raw Buffer
        const signature = body.get_header('x-hub-signature-256')
        
        // Custom webhook validation
        if (!this.verify_signature(payload, signature)) {
            throw new TpHttpFinish({ status: 401, msg: 'Invalid signature' })
        }
        
        return { received: true }
    }
}
```

### Text Body Parsing

Handle plain text requests:

```typescript
import { TextBody } from '@tarpit/http'

@TpRouter('/api/content')
class ContentRouter {
    @Post('text')
    async handle_text(body: TextBody) {
        const content = body.content // Get text content
        const word_count = content.split(/\s+/).length
        
        return {
            content,
            word_count,
            char_count: content.length
        }
    }
}
```

## Request Headers

### Accessing Headers

Use `RequestHeaders` or `TpRequest` to access HTTP headers:

```typescript
import { RequestHeaders, TpRequest } from '@tarpit/http'

@TpRouter('/api/info')
class InfoRouter {
    @Get('headers')
    async get_headers(headers: RequestHeaders) {
        const user_agent = headers.get('user-agent')
        const accept = headers.get('accept')
        const authorization = headers.get('authorization')
        
        return {
            user_agent,
            accept,
            authorization: authorization ? '***' : null
        }
    }
    
    @Get('request-info')
    async get_request_info(req: TpRequest) {
        return {
            method: req.method,
            url: req.url,
            headers: Object.fromEntries(req.headers.entries()),
            ip: req.ip
        }
    }
}
```

### Header Validation

Validate required headers:

```typescript
@TpRouter('/api/secure')
class SecureRouter {
    @Post('data')
    async handle_secure_data(headers: RequestHeaders, body: JsonBody) {
        // Validate required headers
        const api_key = headers.ensure('x-api-key', Jtl.string.min(1))
        const content_type = headers.ensure('content-type', Jtl.string)
        
        if (!content_type.includes('application/json')) {
            throw new TpHttpFinish({
                status: 400,
                msg: 'Content-Type must be application/json'
            })
        }
        
        // Process data...
        return { success: true }
    }
}
```

## Query Parameters

### Basic Query Handling

Access URL query parameters:

```typescript
@TpRouter('/api/search')
class SearchRouter {
    @Get('users')
    async search_users(req: TpRequest) {
        const query = req.query.get('q') || ''
        const page = parseInt(req.query.get('page') || '1')
        const limit = Math.min(100, parseInt(req.query.get('limit') || '10'))
        const sort_by = req.query.get('sort') || 'name'
        const order = req.query.get('order') === 'desc' ? 'desc' : 'asc'
        
        return {
            query,
            page,
            limit,
            sort_by,
            order,
            results: []
        }
    }
}
```

### Query Parameter Validation

Validate query parameters with proper error handling:

```typescript
@TpRouter('/api/reports')
class ReportRouter {
    @Get('analytics')
    async get_analytics(req: TpRequest) {
        const start_date = req.query.get('start_date')
        const end_date = req.query.get('end_date')
        
        if (!start_date || !end_date) {
            throw new TpHttpFinish({
                status: 400,
                code: 'MISSING_DATE_RANGE',
                msg: 'start_date and end_date query parameters are required'
            })
        }
        
        // Validate date format
        const start = new Date(start_date)
        const end = new Date(end_date)
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_DATE_FORMAT',
                msg: 'Dates must be in valid ISO format'
            })
        }
        
        return {
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            data: []
        }
    }
}
```

## File Uploads

### Single File Upload

Handle single file uploads:

```typescript
import { MimeBody } from '@tarpit/http'

@TpRouter('/api/files')
class FileRouter {
    @Post('upload')
    async upload_file(body: MimeBody) {
        const file = body.files.get('file')
        
        if (!file) {
            throw new TpHttpFinish({
                status: 400,
                msg: 'No file provided'
            })
        }
        
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            throw new TpHttpFinish({
                status: 400,
                msg: 'Only image files are allowed'
            })
        }
        
        // Process file...
        return {
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype
        }
    }
}
```

### Multiple File Upload

Handle multiple file uploads:

```typescript
@TpRouter('/api/gallery')
class GalleryRouter {
    @Post('upload-multiple')
    async upload_gallery(body: MimeBody) {
        const files = body.files.get_all('photos') // Multiple files with same field name
        
        if (!files || files.length === 0) {
            throw new TpHttpFinish({
                status: 400,
                msg: 'No photos provided'
            })
        }
        
        const processed_files = []
        
        for (const file of files) {
            if (!file.mimetype.startsWith('image/')) {
                throw new TpHttpFinish({
                    status: 400,
                    msg: `Invalid file type: ${file.filename}`
                })
            }
            
            processed_files.push({
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype
            })
        }
        
        return {
            uploaded_count: processed_files.length,
            files: processed_files
        }
    }
}
```

## Request Context

### HTTP Context

Access the full HTTP context for advanced scenarios:

```typescript
import { HttpContext } from '@tarpit/http'

@TpRouter('/api/advanced')
class AdvancedRouter {
    @Get('context')
    async get_context(ctx: HttpContext) {
        return {
            method: ctx.req.method,
            url: ctx.req.url,
            headers: Object.fromEntries(ctx.req.headers.entries()),
            remote_ip: ctx.req.ip,
            user_agent: ctx.req.headers.get('user-agent'),
            timestamp: Date.now()
        }
    }
    
    @Post('custom-response')
    async custom_response(ctx: HttpContext, body: JsonBody) {
        const data = body.ensure('data', Jtl.any)
        
        // Custom response headers
        ctx.res.headers.set('x-custom-header', 'custom-value')
        ctx.res.headers.set('x-timestamp', Date.now().toString())
        
        return {
            success: true,
            data,
            processed_at: new Date().toISOString()
        }
    }
}
```

## Input Validation

### Using Tarpit Judge

Combine multiple validation strategies:

```typescript
@TpRouter('/api/validation')
class ValidationRouter {
    @Post('user')
    async create_user(body: JsonBody<{
        name: string
        email: string
        age: number
        preferences: {
            theme: 'light' | 'dark'
            notifications: boolean
        }
    }>) {
        // Complex validation
        const name = body.ensure('name', 
            Jtl.string
                .trim()
                .min(2, 'Name must be at least 2 characters')
                .max(50, 'Name must be less than 50 characters')
                .match(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
        )
        
        const email = body.ensure('email',
            Jtl.string
                .email('Invalid email format')
                .max(100, 'Email too long')
        )
        
        const age = body.ensure('age',
            Jtl.integer
                .min(13, 'Must be at least 13 years old')
                .max(120, 'Invalid age')
        )
        
        const preferences = body.ensure('preferences', Jtl.object({
            theme: Jtl.string.enum(['light', 'dark']),
            notifications: Jtl.boolean
        }))
        
        return {
            id: Date.now(),
            name,
            email,
            age,
            preferences
        }
    }
}
```

### Custom Validation

Implement custom validation logic:

```typescript
@TpRouter('/api/custom')
class CustomValidationRouter {
    @Post('password')
    async change_password(body: JsonBody<{ current: string, new: string, confirm: string }>) {
        const current = body.ensure('current', Jtl.string.min(1))
        const new_password = body.ensure('new', Jtl.string.min(8))
        const confirm = body.ensure('confirm', Jtl.string.min(1))
        
        // Custom password validation
        if (new_password !== confirm) {
            throw new TpHttpFinish({
                status: 400,
                code: 'PASSWORD_MISMATCH',
                msg: 'New password and confirmation do not match'
            })
        }
        
        if (!this.is_strong_password(new_password)) {
            throw new TpHttpFinish({
                status: 400,
                code: 'WEAK_PASSWORD',
                msg: 'Password must contain uppercase, lowercase, number, and special character'
            })
        }
        
        return { success: true }
    }
    
    private is_strong_password(password: string): boolean {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)
    }
}
```

## Error Handling

### Request Parsing Errors

Handle malformed requests gracefully:

```typescript
@TpRouter('/api/safe')
class SafeRouter {
    @Post('data')
    async handle_data(body: JsonBody) {
        try {
            const data = body.ensure('data', Jtl.object({
                name: Jtl.string,
                value: Jtl.number
            }))
            
            return { success: true, data }
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new TpHttpFinish({
                    status: 400,
                    code: 'VALIDATION_ERROR',
                    msg: error.message,
                    details: error.details
                })
            }
            throw error
        }
    }
}
```

### Content Type Validation

Ensure correct content types:

```typescript
@TpRouter('/api/strict')
class StrictRouter {
    @Post('json-only')
    async json_only(headers: RequestHeaders, body: JsonBody) {
        const content_type = headers.get('content-type')
        
        if (!content_type || !content_type.includes('application/json')) {
            throw new TpHttpFinish({
                status: 415,
                code: 'UNSUPPORTED_MEDIA_TYPE',
                msg: 'This endpoint only accepts application/json'
            })
        }
        
        return body.ensure('data', Jtl.any)
    }
}
```

## Best Practices

### 1. Always Validate Input

```typescript
// ✅ Good - Comprehensive validation
@Post('user')
async create_user(body: JsonBody<User>) {
    const name = body.ensure('name', Jtl.string.trim().min(1).max(100))
    const email = body.ensure('email', Jtl.string.email())
    const age = body.ensure('age', Jtl.integer.min(0).max(150))
    // Continue with validated data
}

// ❌ Avoid - No validation
@Post('user')
async create_user(body: JsonBody<any>) {
    const { name, email, age } = body.data // Raw, unvalidated data
}
```

### 2. Use Appropriate Body Types

```typescript
// ✅ Good - Use specific body types
@Post('json-data')
async handle_json(body: JsonBody<DataType>) {}

@Post('form-data')
async handle_form(body: FormBody) {}

@Post('file-upload')
async handle_upload(body: MimeBody) {}

// ❌ Avoid - Generic body handling
@Post('data')
async handle_data(req: TpRequest) {
    // Manual body parsing - error-prone
}
```

### 3. Provide Clear Error Messages

```typescript
// ✅ Good - Descriptive error messages
const age = body.ensure('age', 
    Jtl.integer
        .min(13, 'Users must be at least 13 years old')
        .max(120, 'Please enter a valid age')
)

// ❌ Avoid - Generic error messages
const age = body.ensure('age', Jtl.integer.min(13).max(120))
```

### 4. Handle Optional Fields Gracefully

```typescript
// ✅ Good - Handle optional fields
const preferences = body.get('preferences', Jtl.object({
    theme: Jtl.string.enum(['light', 'dark']).default('light'),
    notifications: Jtl.boolean.default(true)
}))

// ❌ Avoid - Assuming all fields exist
const preferences = body.ensure('preferences', Jtl.object({})) // Might fail
```

## Next Steps

- Learn about [Response Handling](3-response-handling.html) for sending responses and handling errors
- Explore [Authentication](4-authentication.html) for securing your endpoints
- See [WebSocket](5-websocket.html) for real-time communication 