import { load_config } from '@tarpit/config'
import { 
    Platform, 
    TpConfigSchema, 
    TpService,
    OnTerminate 
} from '@tarpit/core'

@TpService()
class DatabaseService {
    private connected = false
    
    constructor() {
        console.log('DatabaseService constructor called')
    }
    
    connect() {
        if (!this.connected) {
            console.log('Connecting to database...')
            this.connected = true
        }
    }
    
    query(sql: string) {
        this.connect()
        console.log(`Executing query: ${sql}`)
        return []
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService cleanup: Closing database connection')
        this.connected = false
    }
}

@TpService()
class CacheService {
    private cache = new Map<string, any>()
    
    constructor() {
        console.log('CacheService constructor called')
    }
    
    set(key: string, value: any) {
        this.cache.set(key, value)
        console.log(`Cache set: ${key}`)
    }
    
    get(key: string) {
        const value = this.cache.get(key)
        console.log(`Cache get: ${key} = ${value}`)
        return value
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('CacheService cleanup: Clearing cache')
        this.cache.clear()
    }
}

@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        private cache: CacheService
    ) {
        console.log('UserService constructor called')
    }
    
    create_user(name: string) {
        console.log(`Creating user: ${name}`)
        
        // Use database
        this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        
        // Cache the user
        this.cache.set(`user_${name}`, { name, id: Date.now() })
        
        return { name, id: Date.now() }
    }
    
    get_user(name: string) {
        console.log(`Getting user: ${name}`)
        
        // Try cache first
        let user = this.cache.get(`user_${name}`)
        if (!user) {
            // Query database
            this.db.query(`SELECT * FROM users WHERE name = '${name}'`)
            user = { name, id: Date.now() }
            this.cache.set(`user_${name}`, user)
        }
        
        return user
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('UserService cleanup: Saving any pending data')
    }
}

async function demonstrate_platform_lifecycle() {
    console.log('=== Platform Lifecycle Example ===\n')
    
    // 1. Configuration
    console.log('1. Loading configuration...')
    const config = load_config<TpConfigSchema>({
        name: 'lifecycle-demo',
        version: '1.0.0',
        debug: true
    })
    
    // 2. Platform creation
    console.log('\n2. Creating platform...')
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(CacheService)
        .import(UserService)
    
    console.log('Platform created, services registered')
    
    // 3. Platform startup
    console.log('\n3. Starting platform...')
    await platform.start()
    console.log('Platform started successfully')
    
    // 4. Using services
    console.log('\n4. Using services...')
    const userService = platform.expose(UserService)
    if (!userService) {
        throw new Error('UserService not found')
    }
    
    const user1 = userService.create_user('Alice')
    const user2 = userService.create_user('Bob')
    
    console.log('Created users:', [user1, user2])
    
    // Get users (should use cache)
    const retrievedUser1 = userService.get_user('Alice')
    const retrievedUser2 = userService.get_user('Bob')
    
    console.log('Retrieved users:', [retrievedUser1, retrievedUser2])
    
    // 5. Platform shutdown
    console.log('\n5. Shutting down platform...')
    await platform.terminate()
    console.log('Platform shutdown complete')
    
    console.log('\n=== Lifecycle demonstration completed ===')
}

async function demonstrate_error_handling() {
    console.log('\n=== Error Handling Example ===\n')
    
    try {
        const config = load_config<TpConfigSchema>({})
        const platform = new Platform(config)
            .import(UserService) // Missing dependencies!
        
        console.log('Starting platform with missing dependencies...')
        await platform.start()
        
    } catch (error) {
        console.log('Caught expected error:', (error as Error).message)
    }
}

async function main() {
    await demonstrate_platform_lifecycle()
    await demonstrate_error_handling()
}

if (require.main === module) {
    main().catch(console.error)
} 