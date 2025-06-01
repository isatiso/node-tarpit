import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, JsonBody, TpRequest, TpHttpFinish } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

// User data model
interface User {
    id: string
    name: string
    email: string
    age?: number
}

// In-memory user store service
@TpService()
class UserService {
    private users = new Map<string, User>()
    
    create_user(user_data: Omit<User, 'id'>): User {
        const id = `user_${Date.now()}`
        const user = { id, ...user_data }
        this.users.set(id, user)
        return user
    }
    
    get_all_users(): User[] {
        return Array.from(this.users.values())
    }
    
    search_users(query: string): User[] {
        const lower_query = query.toLowerCase()
        return Array.from(this.users.values()).filter(user => 
            user.name.toLowerCase().includes(lower_query) ||
            user.email.toLowerCase().includes(lower_query)
        )
    }
}

// Router demonstrating JSON body parsing
@TpRouter('/api/users')
class UserRouter {
    
    constructor(private user_service: UserService) {}
    
    @Post('create')
    async create_user(body: JsonBody<{ name: string, email: string, age?: number }>) {
        console.log('Creating user with JSON body...')
        
        // Basic validation with Jtl
        const name = body.ensure('name', Jtl.string)
        const email = body.ensure('email', Jtl.string)
        const age_value = body.get('age')
        const age = age_value ? Jtl.number.parse(age_value) : undefined
        
        // Simple validation
        if (!name || name.length < 1) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_NAME',
                msg: 'Name is required'
            })
        }
        
        if (!email || !email.includes('@')) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_EMAIL',
                msg: 'Valid email is required'
            })
        }
        
        const user = this.user_service.create_user({
            name: name.trim(),
            email: email.toLowerCase(),
            age
        })
        
        return {
            success: true,
            message: 'User created successfully',
            user
        }
    }
}

// Router demonstrating query parameter handling
@TpRouter('/api/search')
class SearchRouter {
    
    constructor(private user_service: UserService) {}
    
    @Get('users')
    async search_users(req: TpRequest) {
        console.log('Searching users with query parameters...')
        
        // Access query parameters safely
        const query_params = req.query || new Map()
        const query = query_params.get?.('q') || ''
        const page_str = query_params.get?.('page') || '1'
        const limit_str = query_params.get?.('limit') || '10'
        
        // Convert and validate
        const page = Math.max(1, parseInt(page_str as string) || 1)
        const limit = Math.min(100, Math.max(1, parseInt(limit_str as string) || 10))
        
        // Perform search
        let users = query ? this.user_service.search_users(query as string) : this.user_service.get_all_users()
        
        // Paginate
        const total = users.length
        const start = (page - 1) * limit
        const paginated_users = users.slice(start, start + limit)
        
        return {
            query,
            page,
            limit,
            total,
            results: paginated_users,
            has_more: start + limit < total
        }
    }
}

// Router demonstrating request information
@TpRouter('/api/info')
class InfoRouter {
    
    @Get('request')
    async get_request_info(req: TpRequest) {
        console.log('Getting request information...')
        
        const headers = req.headers || new Map()
        const query_params = req.query || new Map()
        
        return {
            method: req.method,
            url: req.url,
            ip: req.ip,
            user_agent: headers.get?.('user-agent') || '',
            content_type: headers.get?.('content-type') || '',
            query_params: Object.fromEntries(query_params.entries?.() || []),
            timestamp: new Date().toISOString()
        }
    }
    
    @Post('echo')
    async echo_request(req: TpRequest, body: JsonBody<any>) {
        console.log('Echoing request data...')
        
        const headers = req.headers || new Map()
        const query_params = req.query || new Map()
        
        return {
            method: req.method,
            path: req.path,
            headers: {
                'user-agent': headers.get?.('user-agent') || '',
                'content-type': headers.get?.('content-type') || ''
            },
            query: Object.fromEntries(query_params.entries?.() || []),
            body: body.data,
            timestamp: new Date().toISOString()
        }
    }
}

async function main() {
    console.log('=== Request Parsing Example ===\n')
    
    const config = load_config<TpConfigSchema>({ 
        http: { port: 4202 } 
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(UserService)
        .import(UserRouter)
        .import(SearchRouter)
        .import(InfoRouter)
    
    await platform.start()
    
    console.log('HTTP Server started on http://localhost:4202')
    console.log('\n=== Available Endpoints ===')
    console.log('User Management:')
    console.log('  POST   /api/users/create     - Create user (JSON body)')
    console.log('\nSearch:')
    console.log('  GET    /api/search/users     - Search users (?q=query&page=1&limit=10)')
    console.log('\nRequest Info:')
    console.log('  GET    /api/info/request     - Get request details')
    console.log('  POST   /api/info/echo        - Echo request data')
    
    console.log('\n=== Test Commands ===')
    console.log('# Create a user')
    console.log('curl -X POST http://localhost:4202/api/users/create \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"name":"Alice Smith","email":"alice@example.com","age":30}\'')
    
    console.log('\n# Search users')
    console.log('curl "http://localhost:4202/api/search/users?q=alice&page=1&limit=5"')
    
    console.log('\n# Get request info')
    console.log('curl http://localhost:4202/api/info/request')
    
    console.log('\n# Echo request')
    console.log('curl -X POST http://localhost:4202/api/info/echo \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"message":"hello world"}\'')
    
    console.log('\nPress Ctrl+C to stop the server')
}

if (require.main === module) {
    main().catch(console.error)
} 