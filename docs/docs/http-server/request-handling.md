---
sidebar_position: 3
---

# Request Handling

:::info Working Examples
See [request-parsing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/request-parsing.ts) and [form-handling.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/form-handling.ts) for complete working examples.
:::

Request handling in Tarpit involves parsing incoming HTTP requests, extracting data from different sources (body, headers, query parameters), and validating input. Tarpit provides a rich set of built-in tools for handling various content types and request formats.

## Request Bodies

### JSON Body Parsing

Use `JsonBody` for JSON request bodies with type validation:

:::info Complete Example
[request-parsing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/request-parsing.ts)
:::

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

:::info Complete Example
[form-handling.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/form-handling.ts)
:::

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
        const limit = parseInt(req.query.get('limit') || '10')
        
        return {
            query,
            page,
            limit,
            results: []
        }
    }
}
```

### Query Parameter Validation

Use validation for type-safe query parameters:

```typescript
import { QueryParam } from '@tarpit/http'

@TpRouter('/api/products')
class ProductRouter {
    @Get('search')
    async search_products(
        @QueryParam('q') query: string = '',
        @QueryParam('category') category: string = 'all',
        @QueryParam('min_price') min_price: number = 0,
        @QueryParam('max_price') max_price: number = Infinity
    ) {
        return {
            query,
            category,
            price_range: { min: min_price, max: max_price },
            products: []
        }
    }
}
```

## File Uploads

### Single File Upload

Handle file uploads with `FileBody`:

```typescript
import { FileBody } from '@tarpit/http'

@TpRouter('/api/upload')
class UploadRouter {
    @Post('avatar')
    async upload_avatar(file: FileBody) {
        const uploaded_file = file.get('avatar')
        
        if (!uploaded_file) {
            throw new TpHttpFinish({ status: 400, msg: 'No file uploaded' })
        }
        
        // Validate file type
        if (!uploaded_file.mimetype.startsWith('image/')) {
            throw new TpHttpFinish({ status: 400, msg: 'Only images allowed' })
        }
        
        // Save file
        const filename = `avatar-${Date.now()}-${uploaded_file.filename}`
        await uploaded_file.save(`./uploads/${filename}`)
        
        return {
            filename,
            size: uploaded_file.size,
            type: uploaded_file.mimetype
        }
    }
}
```

### Multiple File Upload

Handle multiple files:

```typescript
@TpRouter('/api/upload')
class UploadRouter {
    @Post('gallery')
    async upload_gallery(file: FileBody) {
        const images = file.get_all('images') // Get multiple files
        
        if (images.length === 0) {
            throw new TpHttpFinish({ status: 400, msg: 'No files uploaded' })
        }
        
        const results = []
        for (const image of images) {
            if (image.mimetype.startsWith('image/')) {
                const filename = `gallery-${Date.now()}-${image.filename}`
                await image.save(`./uploads/${filename}`)
                results.push({ filename, size: image.size })
            }
        }
        
        return { uploaded: results.length, files: results }
    }
}
```

## Request Validation

### Custom Validators

Create reusable validation logic:

```typescript
import { Jtl } from '@tarpit/judge'

// Custom validator for user data
const UserValidator = Jtl.object({
    name: Jtl.string.trim().min(1).max(100),
    email: Jtl.string.email(),
    age: Jtl.integer.min(13).max(150).optional(),
    roles: Jtl.array(Jtl.string).optional()
})

@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody) {
        const user_data = body.ensure('user', UserValidator)
        
        return {
            id: Date.now(),
            ...user_data,
            created_at: new Date().toISOString()
        }
    }
}
```

### Error Handling

Handle validation errors gracefully:

```typescript
@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody) {
        try {
            const name = body.ensure('name', Jtl.string.trim().min(1))
            const email = body.ensure('email', Jtl.string.email())
            
            return { id: Date.now(), name, email }
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new TpHttpFinish({
                    status: 400,
                    msg: 'Validation failed',
                    data: { errors: error.details }
                })
            }
            throw error
        }
    }
}
```

## Best Practices

### 1. Always Validate Input

```typescript
// ✅ Good - Always validate user input
@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody) {
        const name = body.ensure('name', Jtl.string.trim().min(1).max(100))
        const email = body.ensure('email', Jtl.string.email())
        const age = body.get('age', Jtl.integer.min(0).max(150))
        
        return { name, email, age }
    }
}

// ❌ Avoid - Using unvalidated input
@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody) {
        const name = body.get('name') // No validation
        return { name }
    }
}
```

### 2. Use Type-Safe Body Parsing

```typescript
// ✅ Good - Type-safe request handling
interface CreateUserRequest {
    name: string
    email: string
    age?: number
}

@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody<CreateUserRequest>) {
        const name = body.ensure('name', Jtl.string.trim().min(1))
        const email = body.ensure('email', Jtl.string.email())
        
        return { name, email }
    }
}
```

### 3. Handle Different Content Types

```typescript
// ✅ Good - Support multiple content types
@TpRouter('/api/data')
class DataRouter {
    @Post('submit')
    async submit_data(req: TpRequest, json_body?: JsonBody, form_body?: FormBody) {
        const content_type = req.headers.get('content-type') || ''
        
        if (content_type.includes('application/json')) {
            const data = json_body!.ensure('data', Jtl.object)
            return this.process_data(data)
        } else if (content_type.includes('application/x-www-form-urlencoded')) {
            const data = Object.fromEntries(form_body!.entries())
            return this.process_data(data)
        } else {
            throw new TpHttpFinish({ status: 400, msg: 'Unsupported content type' })
        }
    }
}
```

### 4. Sanitize Output

```typescript
// ✅ Good - Sanitize sensitive data in responses
@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        const user = await this.user_service.find_by_id(id)
        
        // Remove sensitive fields
        const { password, secret_key, ...safe_user } = user
        return safe_user
    }
}
```

## Next Steps

- [**Response Handling**](./response-handling) - Learn about response formatting and error handling
- [**Static Files**](./static-files) - Serve static assets efficiently
- [**Routing**](./routing) - Review routing fundamentals 