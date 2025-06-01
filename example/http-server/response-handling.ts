import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { 
    HttpServerModule, 
    TpRouter, 
    Get, 
    Post,
    JsonBody,
    PathArgs,
    TpRequest, 
    TpResponse,
    TpHttpFinish
} from '@tarpit/http'
import { Jtl } from '@tarpit/judge'
import { Readable } from 'stream'

// Router demonstrating simple responses
@TpRouter('/api/responses')
class ResponseRouter {
    
    @Get('text')
    text_response() {
        return 'Hello World - Plain Text Response'
    }
    
    @Get('json')
    json_response() {
        return { 
            message: 'Success', 
            data: [1, 2, 3],
            timestamp: new Date().toISOString()
        }
    }
    
    @Get('number')
    number_response() {
        return 42
    }
    
    @Get('custom')
    custom_response(res: TpResponse) {
        res.status = 201
        res.set('X-Custom-Header', 'MyValue')
        res.set('X-API-Version', '1.0')
        res.type = 'application/json'
        
        return { created: true, id: 'new-resource-123' }
    }
    
    @Get('redirect')
    redirect_response(res: TpResponse) {
        res.status = 302
        res.set('Location', '/api/responses/json')
        return { message: 'Redirecting to JSON endpoint' }
    }
}

// Router demonstrating HTML responses
@TpRouter('/pages')
class PageRouter {
    
    @Get('home')
    home_page(res: TpResponse) {
        res.type = 'text/html'
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Tarpit Response Example</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 50px; }
                .highlight { background: #f0f8ff; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Welcome to Tarpit HTTP Server</h1>
            <div class="highlight">
                <p>This is a dynamic HTML response generated at: ${new Date().toISOString()}</p>
            </div>
            <ul>
                <li><a href="/api/responses/json">JSON Response</a></li>
                <li><a href="/api/stream/data">Stream Response</a></li>
                <li><a href="/api/errors/demo">Error Demo</a></li>
            </ul>
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
        <head><title>Hello ${name}</title></head>
        <body>
            <h1>Hello, ${name}!</h1>
            <p>This page was generated at: ${new Date().toISOString()}</p>
            <p><a href="/pages/home">← Back to Home</a></p>
        </body>
        </html>
        `
    }
}

// Router demonstrating streaming responses
@TpRouter('/api/stream')
class StreamRouter {
    
    @Get('data')
    async stream_data(res: TpResponse) {
        res.type = 'application/json'
        res.set('Transfer-Encoding', 'chunked')
        
        // Create a readable stream that generates data
        const stream = new Readable({
            read() {
                // Generate 100 items
                for (let i = 0; i < 100; i++) {
                    this.push(JSON.stringify({ 
                        id: i, 
                        data: `Item ${i}`,
                        timestamp: Date.now()
                    }) + '\n')
                }
                this.push(null) // End of stream
            }
        })
        
        return stream
    }
    
    @Get('events')
    async server_events(res: TpResponse) {
        res.type = 'text/event-stream'
        res.set('Cache-Control', 'no-cache')
        res.set('Connection', 'keep-alive')
        res.set('Access-Control-Allow-Origin', '*')
        
        const stream = new Readable({
            read() {}
        })
        
        let counter = 0
        
        // Send periodic updates
        const interval = setInterval(() => {
            const data = {
                counter: ++counter,
                timestamp: Date.now(),
                message: `Server update #${counter}`
            }
            stream.push(`data: ${JSON.stringify(data)}\n\n`)
            
            // Stop after 10 updates
            if (counter >= 10) {
                clearInterval(interval)
                stream.push(null)
            }
        }, 1000)
        
        return stream
    }
}

// Router demonstrating error handling
@TpRouter('/api/errors')
class ErrorRouter {
    
    @Get('demo')
    error_demo(req: TpRequest) {
        const type = req.query?.get?.('type') || 'not_found'
        
        switch (type) {
            case 'not_found':
                throw new TpHttpFinish({
                    status: 404,
                    code: 'RESOURCE_NOT_FOUND',
                    msg: 'The requested resource was not found'
                })
            
            case 'forbidden':
                throw new TpHttpFinish({
                    status: 403,
                    code: 'ACCESS_DENIED',
                    msg: 'Access denied to this resource'
                })
            
            case 'validation':
                throw new TpHttpFinish({
                    status: 400,
                    code: 'VALIDATION_ERROR',
                    msg: 'Invalid input provided',
                    info: { field: 'email', message: 'Email format is invalid' }
                })
            
            default:
                return { 
                    message: 'Error demo', 
                    available_types: ['not_found', 'forbidden', 'validation'],
                    usage: '/api/errors/demo?type=not_found'
                }
        }
    }
    
    @Post('validate')
    async validate_data(body: JsonBody<{ email?: string, age?: number }>) {
        const email = body.get('email')
        const age_raw = body.get('age')
        
        // Validate email
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_EMAIL',
                msg: 'Valid email is required',
                info: { field: 'email', value: email }
            })
        }
        
        // Validate age if provided
        if (age_raw !== undefined) {
            const age = typeof age_raw === 'number' ? age_raw : parseInt(age_raw as string)
            if (isNaN(age) || age < 0 || age > 150) {
                throw new TpHttpFinish({
                    status: 400,
                    code: 'INVALID_AGE',
                    msg: 'Age must be between 0 and 150',
                    info: { field: 'age', value: age_raw }
                })
            }
        }
        
        return { 
            message: 'Data is valid',
            validated: { email, age: age_raw }
        }
    }
}

// Router demonstrating headers
@TpRouter('/api/headers')
class HeaderRouter {
    
    @Get('cached')
    cached_response(res: TpResponse) {
        // Cache control headers
        res.set('Cache-Control', 'public, max-age=3600')
        res.set('ETag', '"response-12345"')
        res.set('Last-Modified', new Date().toUTCString())
        
        return { 
            data: 'This response is cacheable for 1 hour',
            generated_at: new Date().toISOString()
        }
    }
    
    @Get('security')
    secure_response(res: TpResponse) {
        // Security headers
        res.set('X-Frame-Options', 'DENY')
        res.set('X-Content-Type-Options', 'nosniff')
        res.set('X-XSS-Protection', '1; mode=block')
        res.set('Strict-Transport-Security', 'max-age=31536000')
        
        return { 
            message: 'Secure response with security headers',
            security_level: 'high'
        }
    }
    
    @Get('cors')
    cors_response(res: TpResponse) {
        // CORS headers
        res.set('Access-Control-Allow-Origin', '*')
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.set('Access-Control-Max-Age', '86400')
        
        return { 
            message: 'CORS enabled response',
            cors_policy: 'permissive'
        }
    }
    
    @Get('info/:id')
    dynamic_headers(path_args: PathArgs, res: TpResponse) {
        const id = path_args.ensure('id', Jtl.string)
        
        // Dynamic headers based on data
        const resource = { 
            id, 
            name: `Resource ${id}`, 
            updated_at: new Date() 
        }
        
        res.set('X-Resource-ID', resource.id)
        res.set('Last-Modified', resource.updated_at.toUTCString())
        res.set('ETag', `"resource-${resource.id}-${resource.updated_at.getTime()}"`)
        res.set('X-Content-Version', '1.0')
        
        return resource
    }
}

async function main() {
    console.log('=== Response Handling Example ===\n')
    
    const config = load_config<TpConfigSchema>({ 
        http: { port: 4204 } 
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(ResponseRouter)
        .import(PageRouter)
        .import(StreamRouter)
        .import(ErrorRouter)
        .import(HeaderRouter)
    
    await platform.start()
    
    console.log('HTTP Server started on http://localhost:4204')
    console.log('\n=== Available Endpoints ===')
    
    console.log('\nSimple Responses:')
    console.log('  GET    /api/responses/text      - Plain text response')
    console.log('  GET    /api/responses/json      - JSON response')
    console.log('  GET    /api/responses/number    - Number response')
    console.log('  GET    /api/responses/custom    - Custom headers and status')
    console.log('  GET    /api/responses/redirect  - Redirect response')
    
    console.log('\nHTML Pages:')
    console.log('  GET    /pages/home              - HTML home page')
    console.log('  GET    /pages/template/:name    - Dynamic HTML template')
    
    console.log('\nStreaming:')
    console.log('  GET    /api/stream/data         - JSON stream')
    console.log('  GET    /api/stream/events       - Server-sent events')
    
    console.log('\nError Handling:')
    console.log('  GET    /api/errors/demo         - Error examples (?type=not_found|forbidden|validation)')
    console.log('  POST   /api/errors/validate     - Validation errors')
    
    console.log('\nHeaders:')
    console.log('  GET    /api/headers/cached      - Cached response')
    console.log('  GET    /api/headers/security    - Security headers')
    console.log('  GET    /api/headers/cors        - CORS headers')
    console.log('  GET    /api/headers/info/:id    - Dynamic headers')
    
    console.log('\n=== Test Commands ===')
    
    console.log('\n# Test simple responses')
    console.log('curl http://localhost:4204/api/responses/json')
    console.log('curl http://localhost:4204/pages/home')
    
    console.log('\n# Test streaming')
    console.log('curl http://localhost:4204/api/stream/data')
    console.log('curl http://localhost:4204/api/stream/events')
    
    console.log('\n# Test error handling')
    console.log('curl "http://localhost:4204/api/errors/demo?type=not_found"')
    console.log('curl -X POST http://localhost:4204/api/errors/validate \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"email":"invalid","age":200}\'')
    
    console.log('\n# Test headers')
    console.log('curl -I http://localhost:4204/api/headers/security')
    console.log('curl -I http://localhost:4204/api/headers/cached')
    
    console.log('\nPress Ctrl+C to stop the server')
}

if (require.main === module) {
    main().catch(console.error)
} 