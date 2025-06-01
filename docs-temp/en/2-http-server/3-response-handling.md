---
layout: default
title: Response Handling
parent: HTTP Server
nav_order: 3
---

# Response Handling
{:.no_toc}

Learn how to send responses, handle errors, and work with different response formats in Tarpit HTTP servers.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Response Basics

### Simple Responses

Return data directly from route handlers:

```typescript
@TpRouter('/api')
class ApiRouter {
    
    @Get('text')
    text_response() {
        return 'Hello World'
    }
    
    @Get('json')
    json_response() {
        return { message: 'Success', data: [1, 2, 3] }
    }
    
    @Get('number')
    number_response() {
        return 42
    }
}
```

### Response Object

Access the response object for more control:

```typescript
@TpRouter('/api')
class ApiRouter {
    
    @Get('custom')
    custom_response(res: TpResponse) {
        res.status = 201
        res.set('X-Custom-Header', 'MyValue')
        res.type = 'application/json'
        
        return { created: true }
    }
    
    @Get('redirect')
    redirect_response(res: TpResponse) {
        res.status = 302
        res.set('Location', '/new-path')
        return null
    }
}
```

## Response Types

### JSON Responses

JSON is the default response format:

```typescript
@TpRouter('/api')
class DataRouter {
    
    @Get('users')
    async get_users() {
        // Automatically serialized as JSON
        return {
            users: [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' }
            ],
            total: 2,
            page: 1
        }
    }
    
    @Get('status')
    get_status(res: TpResponse) {
        res.status = 200
        return {
            server: 'Tarpit HTTP',
            version: '1.0.0',
            uptime: process.uptime()
        }
    }
}
```

### HTML Responses

Return HTML content:

```typescript
@TpRouter('/pages')
class PageRouter {
    
    @Get('home')
    home_page(res: TpResponse) {
        res.type = 'text/html'
        
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Home</title></head>
        <body>
            <h1>Welcome to Tarpit</h1>
            <p>This is a dynamic HTML response.</p>
        </body>
        </html>
        `
    }
    
    @Get('template/:name')
    template_page(path_args: PathArgs, res: TpResponse) {
        const name = path_args.ensure('name', Jtl.string)
        res.type = 'text/html'
        
        return `
        <html>
        <body>
            <h1>Hello, ${name}!</h1>
            <p>Generated at: ${new Date().toISOString()}</p>
        </body>
        </html>
        `
    }
}
```

### Stream Responses

Stream large responses or real-time data:

```typescript
import { Readable } from 'stream'

@TpRouter('/api')
class StreamRouter {
    
    @Get('large-data')
    async stream_data(res: TpResponse) {
        res.type = 'application/json'
        res.set('Transfer-Encoding', 'chunked')
        
        // Create a readable stream
        const stream = new Readable({
            read() {
                // Generate data chunks
                for (let i = 0; i < 1000; i++) {
                    this.push(JSON.stringify({ id: i, data: `Item ${i}` }) + '\n')
                }
                this.push(null) // End of stream
            }
        })
        
        return stream
    }
    
    @Get('server-events')
    async server_events(res: TpResponse) {
        res.type = 'text/event-stream'
        res.set('Cache-Control', 'no-cache')
        res.set('Connection', 'keep-alive')
        
        const stream = new Readable({
            read() {}
        })
        
        // Send periodic updates
        const interval = setInterval(() => {
            const data = {
                timestamp: Date.now(),
                message: 'Server update'
            }
            stream.push(`data: ${JSON.stringify(data)}\n\n`)
        }, 1000)
        
        // Clean up on disconnect
        setTimeout(() => {
            clearInterval(interval)
            stream.push(null)
        }, 10000)
        
        return stream
    }
}
```

## File Responses

### File Downloads

Serve files for download:

```typescript
@TpRouter('/files')
class FileRouter {
    
    constructor(private file_manager: HttpFileManager) {}
    
    @Get('download/:filename')
    async download_file(path_args: PathArgs, res: TpResponse) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        // Set download headers
        res.set('Content-Disposition', `attachment; filename="${filename}"`)
        res.type = 'application/octet-stream'
        
        // Stream the file
        const file_stream = await this.file_manager.read_stream(filename)
        return file_stream
    }
    
    @Get('view/:filename')
    async view_file(path_args: PathArgs, res: TpResponse) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        // Set content type based on file extension
        const ext = filename.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'jpg':
            case 'jpeg':
                res.type = 'image/jpeg'
                break
            case 'png':
                res.type = 'image/png'
                break
            case 'pdf':
                res.type = 'application/pdf'
                break
            default:
                res.type = 'application/octet-stream'
        }
        
        const file_stream = await this.file_manager.read_stream(filename)
        return file_stream
    }
}
```

### Static File Integration

Combine with static file service:

```typescript
@TpRouter('/assets')
class AssetRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('*')
    async serve_asset(req: TpRequest, res: TpResponse) {
        try {
            // Try to serve static file
            const stream = await this.static_service.serve(req, res, {
                scope: 'assets',
                cache_control: { public: true, 'max-age': 3600 }
            })
            return stream
        } catch (error) {
            // Fallback for missing files
            res.status = 404
            return { error: 'Asset not found' }
        }
    }
}
```

## Error Handling

### HTTP Finish Exceptions

Use `TpHttpFinish` for controlled error responses:

```typescript
import { TpHttpFinish } from '@tarpit/http'

@TpRouter('/api')
class ErrorRouter {
    
    @Get('users/:id')
    async get_user(path_args: PathArgs) {
        const id = path_args.ensure('id', Jtl.string)
        
        if (id === '404') {
            throw new TpHttpFinish({
                status: 404,
                code: 'USER_NOT_FOUND',
                msg: 'User not found'
            })
        }
        
        if (id === 'forbidden') {
            throw new TpHttpFinish({
                status: 403,
                code: 'ACCESS_DENIED',
                msg: 'Access denied to this user'
            })
        }
        
        return { id, name: `User ${id}` }
    }
    
    @Post('validate')
    async validate_data(body: JsonBody<{ email: string, age: number }>) {
        const email = body.ensure('email', Jtl.string)
        const age = body.ensure('age', Jtl.number)
        
        if (!email.includes('@')) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_EMAIL',
                msg: 'Invalid email format',
                info: { field: 'email', value: email }
            })
        }
        
        if (age < 0 || age > 150) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_AGE',
                msg: 'Age must be between 0 and 150',
                info: { field: 'age', value: age }
            })
        }
        
        return { message: 'Data is valid' }
    }
}
```

### Custom Error Handlers

Create reusable error handling:

```typescript
@TpService()
class ErrorService {
    
    validation_error(field: string, message: string): never {
        throw new TpHttpFinish({
            status: 400,
            code: 'VALIDATION_ERROR',
            msg: message,
            info: { field }
        })
    }
    
    not_found(resource: string, id: string): never {
        throw new TpHttpFinish({
            status: 404,
            code: 'RESOURCE_NOT_FOUND',
            msg: `${resource} not found`,
            info: { resource, id }
        })
    }
    
    unauthorized(reason?: string): never {
        throw new TpHttpFinish({
            status: 401,
            code: 'UNAUTHORIZED',
            msg: reason || 'Authentication required'
        })
    }
}

@TpRouter('/api')
class SecureRouter {
    
    constructor(private error_service: ErrorService) {}
    
    @Get('protected')
    protected_endpoint(req: TpRequest) {
        const auth_header = req.headers.get?.('authorization')
        if (!auth_header) {
            this.error_service.unauthorized('Missing authorization header')
        }
        
        return { message: 'Access granted' }
    }
}
```

## Response Headers

### Common Headers

Set common response headers:

```typescript
@TpRouter('/api')
class HeaderRouter {
    
    @Get('cached')
    cached_response(res: TpResponse) {
        // Cache control
        res.set('Cache-Control', 'public, max-age=3600')
        res.set('ETag', '"12345"')
        res.set('Last-Modified', new Date().toUTCString())
        
        return { data: 'This response is cacheable' }
    }
    
    @Get('security')
    secure_response(res: TpResponse) {
        // Security headers
        res.set('X-Frame-Options', 'DENY')
        res.set('X-Content-Type-Options', 'nosniff')
        res.set('X-XSS-Protection', '1; mode=block')
        res.set('Strict-Transport-Security', 'max-age=31536000')
        
        return { message: 'Secure response' }
    }
    
    @Get('cors')
    cors_response(res: TpResponse) {
        // CORS headers
        res.set('Access-Control-Allow-Origin', '*')
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        return { message: 'CORS enabled' }
    }
}
```

### Dynamic Headers

Generate headers based on request data:

```typescript
@TpRouter('/api')
class DynamicHeaderRouter {
    
    @Get('user/:id')
    async user_with_metadata(path_args: PathArgs, res: TpResponse) {
        const id = path_args.ensure('id', Jtl.string)
        
        // Simulate user lookup
        const user = { id, name: `User ${id}`, updated_at: new Date() }
        
        // Set headers based on user data
        res.set('X-User-ID', user.id)
        res.set('Last-Modified', user.updated_at.toUTCString())
        res.set('ETag', `"user-${user.id}-${user.updated_at.getTime()}"`)
        
        return user
    }
    
    @Get('download-info/:filename')
    async download_with_info(path_args: PathArgs, res: TpResponse) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        // Get file info (simulated)
        const file_size = 1024 * 1024 // 1MB
        const mime_type = 'application/pdf'
        
        // Set download headers
        res.set('Content-Type', mime_type)
        res.set('Content-Length', file_size.toString())
        res.set('Content-Disposition', `attachment; filename="${filename}"`)
        res.set('X-File-Size', file_size.toString())
        
        return { filename, size: file_size, type: mime_type }
    }
}
```

## Working Example

[View the complete response handling example](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/response-handling.ts) on GitHub.

## Best Practices

### 1. Consistent Error Format

Use a consistent error response format:

```typescript
interface ErrorResponse {
    error: {
        code: string
        message: string
        details?: any
    }
    timestamp: string
    path: string
}
```

### 2. Proper Status Codes

Use appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### 3. Content Negotiation

Support multiple response formats:

```typescript
@Get('data')
async get_data(req: TpRequest, res: TpResponse) {
    const data = { message: 'Hello World' }
    
    const accept = req.headers.get?.('accept') || ''
    
    if (accept.includes('application/xml')) {
        res.type = 'application/xml'
        return `<response><message>${data.message}</message></response>`
    }
    
    // Default to JSON
    return data
}
```

### 4. Response Compression

Enable compression for large responses:

```typescript
@Get('large-data')
async large_data(res: TpResponse) {
    res.set('Content-Encoding', 'gzip')
    // Compression handled by reverse proxy or middleware
    return { data: new Array(1000).fill('large data') }
}
```

## Next Steps

- Learn about [Static File Service](./4-static-files.md) for serving static assets
- Explore [File Manager](./5-file-manager.md) for advanced file operations
- Check out [Authentication](./6-authentication.md) for securing your endpoints 