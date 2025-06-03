import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

// 1. Declaration - Mark classes as injectable services
@TpService()
class DatabaseService {
    connect() {
        console.log('Connected to database')
    }
    
    query(sql: string) {
        console.log(`Executing query: ${sql}`)
        return []
    }
    
    find_user(id: string) {
        console.log(`Finding user with ID: ${id}`)
        return { id, name: `User ${id}`, email: `user${id}@example.com` }
    }
}

@TpService()
class UserService {
    // 2. Dependency will be injected automatically
    constructor(private db: DatabaseService) {}
    
    create_user(name: string) {
        this.db.connect()
        const result = this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        console.log(`Created user: ${name}`)
        return { id: Date.now(), name }
    }
    
    get_user(id: string) {
        this.db.connect()
        return this.db.find_user(id)
    }
    
    find_user(name: string) {
        this.db.connect()
        const result = this.db.query(`SELECT * FROM users WHERE name = '${name}'`)
        console.log(`Found user: ${name}`)
        return result
    }
}

// 3. HTTP Router using injected services
@TpRouter('/api/users')
class UserRouter {
    // 4. Service injection in router
    constructor(private userService: UserService) {}
    
    @Get('')
    async list_users() {
        return { 
            message: 'User list endpoint',
            users: ['Alice', 'Bob', 'Charlie']
        }
    }
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const user_id = args.ensure('id', Jtl.string)
        const user = this.userService.get_user(user_id)
        return user
    }
    
    @Get('hello/:name')
    async greet_user(args: PathArgs<{ name: string }>) {
        const name = args.ensure('name', Jtl.string)
        this.userService.create_user(name)
        return { 
            message: `Hello, ${name}!`,
            user: { name, created: true }
        }
    }
}

async function main() {
    console.log('=== Service Injection with HTTP Example ===\n')
    
    // 5. Registration - Register services and router with platform
    const config = load_config<TpConfigSchema>({ 
        http: { port: 4100 } 
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(DatabaseService)
        .import(UserService)
        .import(UserRouter)
    
    await platform.start()
    
    console.log('Server started on http://localhost:4100')
    console.log('Try these endpoints:')
    console.log('  GET  http://localhost:4100/api/users')
    console.log('  GET  http://localhost:4100/api/users/123')
    console.log('  GET  http://localhost:4100/api/users/hello/Alice')
    
    // Optionally test programmatically
    const userService = platform.expose(UserService)
    if (userService) {
        console.log('\nProgrammatic test:')
        userService.create_user('TestUser')
    }
}

if (require.main === module) {
    main().catch(console.error)
} 
