---
sidebar_position: 4
---

# Response Handling

:::info Working Examples
See [response-formatting.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/response-formatting.ts) for complete working examples.
:::

Response handling in Tarpit involves formatting and sending HTTP responses, managing status codes, headers, and different content types. Tarpit provides flexible response mechanisms for various use cases.

## Basic Response Handling

### JSON Responses

Return JavaScript objects/arrays for automatic JSON serialization:

```typescript
@TpRouter('/api/users')
class UserRouter {
    @Get('list')
    async list_users() {
        return {
            users: [
                { id: 1, name: 'John', email: 'john@example.com' },
                { id: 2, name: 'Jane', email: 'jane@example.com' }
            ],
            total: 2
        }
    }
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        return { id, name: `User ${id}`, status: 'active' }
    }
}
```

### Custom Status Codes

Use `TpHttpFinish` for custom status codes and responses:

```typescript
import { TpHttpFinish } from '@tarpit/http'

@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody) {
        const name = body.ensure('name', Jtl.string)
        
        const user = { id: Date.now(), name }
        
        // Return 201 Created
        throw new TpHttpFinish({
            status: 201,
            msg: 'User created successfully',
            data: user
        })
    }
    
    @Delete(':id')
    async delete_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        
        // Return 204 No Content
        throw new TpHttpFinish({ status: 204 })
    }
}
```

## Error Handling

### Standard Error Responses

Handle different types of errors:

```typescript
@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        
        const user = await this.user_service.find_by_id(id)
        
        if (!user) {
            throw new TpHttpFinish({
                status: 404,
                msg: 'User not found',
                data: { id }
            })
        }
        
        return user
    }
    
    @Put(':id')
    async update_user(args: PathArgs<{ id: string }>, body: JsonBody) {
        try {
            const id = args.ensure('id', Jtl.string)
            const updates = body.ensure('updates', Jtl.object)
            
            const user = await this.user_service.update(id, updates)
            return user
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new TpHttpFinish({
                    status: 400,
                    msg: 'Validation failed',
                    data: { errors: error.details }
                })
            }
            
            // Re-throw other errors for global error handler
            throw error
        }
    }
}
```

### Global Error Handling

Implement centralized error handling:

```typescript
@TpService()
class ErrorHandler {
    handle_error(error: Error, req: TpRequest) {
        if (error instanceof ValidationError) {
            return new TpHttpFinish({
                status: 400,
                msg: 'Validation failed',
                data: { errors: error.details }
            })
        }
        
        if (error instanceof UnauthorizedError) {
            return new TpHttpFinish({
                status: 401,
                msg: 'Unauthorized'
            })
        }
        
        // Log unexpected errors
        console.error('Unexpected error:', error)
        
        return new TpHttpFinish({
            status: 500,
            msg: 'Internal server error'
        })
    }
}
```

## Response Headers

### Setting Custom Headers

Set response headers for various purposes:

```typescript
@TpRouter('/api/data')
class DataRouter {
    @Get('download')
    async download_data(res: TpResponse) {
        const data = await this.data_service.generate_report()
        
        // Set download headers
        res.headers.set('Content-Type', 'application/csv')
        res.headers.set('Content-Disposition', 'attachment; filename="report.csv"')
        
        return data
    }
    
    @Get('cached')
    async get_cached_data(res: TpResponse) {
        const data = await this.cache_service.get_data()
        
        // Set cache headers
        res.headers.set('Cache-Control', 'public, max-age=3600')
        res.headers.set('ETag', `"${data.version}"`)
        
        return data
    }
}
```

### CORS Headers

Handle CORS for cross-origin requests:

```typescript
@TpRouter('/api/public')
class PublicApiRouter {
    @Get('data')
    async get_public_data(res: TpResponse) {
        // Set CORS headers
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        return { data: 'public data' }
    }
}
```

## Content Types

### Different Response Formats

Support multiple response formats:

```typescript
@TpRouter('/api/content')
class ContentRouter {
    @Get('xml')
    async get_xml_data(res: TpResponse) {
        const data = await this.data_service.get_data()
        
        res.headers.set('Content-Type', 'application/xml')
        
        const xml = `<?xml version="1.0"?>
        <response>
            <data>${data.value}</data>
        </response>`
        
        return xml
    }
    
    @Get('text')
    async get_text_data(res: TpResponse) {
        res.headers.set('Content-Type', 'text/plain')
        return 'Plain text response'
    }
    
    @Get('html')
    async get_html_page(res: TpResponse) {
        res.headers.set('Content-Type', 'text/html')
        
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Dynamic Page</title></head>
        <body><h1>Hello from Tarpit!</h1></body>
        </html>
        `
    }
}
```

## Streaming Responses

### Large Data Streaming

Stream large datasets:

```typescript
import { Readable } from 'stream'

@TpRouter('/api/stream')
class StreamRouter {
    @Get('large-dataset')
    async stream_large_dataset(res: TpResponse) {
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Transfer-Encoding', 'chunked')
        
        const stream = new Readable({
            read() {
                // Generate data chunks
                for (let i = 0; i < 1000; i++) {
                    this.push(JSON.stringify({ id: i, data: `Item ${i}` }) + '\n')
                }
                this.push(null) // End stream
            }
        })
        
        return stream
    }
}
```

## Best Practices

### 1. Use Appropriate Status Codes

```typescript
// ✅ Good - Correct status codes
@TpRouter('/api/users')
class UserRouter {
    @Post('create')
    async create_user(body: JsonBody) {
        const user = await this.user_service.create(body.data)
        throw new TpHttpFinish({ status: 201, data: user }) // Created
    }
    
    @Put(':id')
    async update_user(args: PathArgs<{ id: string }>, body: JsonBody) {
        const user = await this.user_service.update(args.get('id'), body.data)
        return user // 200 OK (default)
    }
    
    @Delete(':id')
    async delete_user(args: PathArgs<{ id: string }>) {
        await this.user_service.delete(args.get('id'))
        throw new TpHttpFinish({ status: 204 }) // No Content
    }
}
```

### 2. Consistent Error Format

```typescript
// ✅ Good - Consistent error response format
interface ErrorResponse {
    error: {
        code: string
        message: string
        details?: any
    }
    timestamp: string
    path: string
}

@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>, req: TpRequest) {
        const id = args.ensure('id', Jtl.string)
        const user = await this.user_service.find_by_id(id)
        
        if (!user) {
            throw new TpHttpFinish({
                status: 404,
                data: {
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    },
                    timestamp: new Date().toISOString(),
                    path: req.url.pathname
                }
            })
        }
        
        return user
    }
}
```

### 3. Security Headers

```typescript
// ✅ Good - Include security headers
@TpRouter('/api/secure')
class SecureRouter {
    @Get('data')
    async get_secure_data(res: TpResponse) {
        // Security headers
        res.headers.set('X-Content-Type-Options', 'nosniff')
        res.headers.set('X-Frame-Options', 'DENY')
        res.headers.set('X-XSS-Protection', '1; mode=block')
        
        return { secure: 'data' }
    }
}
```

### 4. Response Compression

```typescript
// ✅ Good - Enable compression for large responses
@TpRouter('/api/data')
class DataRouter {
    @Get('large')
    async get_large_data(res: TpResponse) {
        const data = await this.data_service.get_large_dataset()
        
        // Enable compression
        res.headers.set('Content-Encoding', 'gzip')
        
        return data
    }
}
```

## Next Steps

- [**Static Files**](./static-files) - Learn about serving static assets
- [**Request Handling**](./request-handling) - Review request processing
- [**Routing**](./routing) - Understand routing fundamentals 