import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpConfigData, OnStart, OnTerminate } from '@tarpit/core'
import { createWriteStream } from 'node:fs'
import { unlink } from 'node:fs/promises'

// 1. Proper Platform Configuration
declare module '@tarpit/core' {
    interface TpConfigSchema {
        http?: {
            port?: number
            hostname?: string
            cors?: {
                enabled?: boolean
                origin?: string | string[]
            }
        }
        cache?: {
            enabled?: boolean
            ttl?: number
        }
    }
}

@TpService()
class ApiService {
    constructor(private config: TpConfigData) {}
    
    get_base_url() {
        const port = this.config.get('http.port') ?? 3000
        const hostname = this.config.get('http.hostname') ?? 'localhost'
        const baseUrl = `http://${hostname}:${port}/api`
        console.log(`ApiService: Base URL configured as ${baseUrl}`)
        return baseUrl
    }
    
    is_cache_enabled() {
        const enabled = this.config.get('cache.enabled') ?? false
        console.log(`ApiService: Cache ${enabled ? 'enabled' : 'disabled'}`)
        return enabled
    }
}

// 2. Proper Lifecycle Management using decorators
interface DatabaseClient {
    close(): Promise<void>
}

interface Stream {
    destroy(callback?: (error?: Error) => void): void
}

@TpService()
class DatabaseService {
    private client?: DatabaseClient
    private tempFiles: string[] = []
    private activeStreams: Stream[] = []
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: Initializing...')
        this.client = await this.connect()
        console.log('DatabaseService: Connected successfully')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: Starting cleanup...')
        
        try {
            // Close database connection
            if (this.client) {
                await this.client.close()
                console.log('DatabaseService: Connection closed')
            }
            
            // Close all active streams
            await Promise.all(
                this.activeStreams.map(stream => 
                    new Promise<void>(resolve => stream.destroy(() => resolve()))
                )
            )
            console.log('DatabaseService: All streams closed')
            
            // Clean up temporary files
            await Promise.all(
                this.tempFiles.map(async file => {
                    try {
                        await unlink(file)
                        console.log(`DatabaseService: Cleaned up file: ${file}`)
                    } catch (error) {
                        console.warn(`DatabaseService: Could not clean file ${file}:`, error)
                    }
                })
            )
            
            console.log('DatabaseService: Cleanup completed')
        } catch (error) {
            console.error('DatabaseService: Error during cleanup:', error)
            // Don't throw - allow other services to terminate
        }
    }
    
    private async connect(): Promise<DatabaseClient> {
        // Database connection logic - simulate delay
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('DatabaseService: Simulated database connection established')
        
        return {
            async close() {
                console.log('DatabaseService: Database client connection closed')
            }
        }
    }
    
    query(sql: string) {
        console.log(`DatabaseService: Executing query: ${sql}`)
        return { rows: 1, success: true }
    }
}

@TpService()
class CacheService {
    private cache = new Map<string, any>()
    
    constructor(private config: TpConfigData) {}
    
    get(key: string) {
        const enabled = this.config.get('cache.enabled') ?? false
        if (!enabled) {
            console.log('CacheService: Cache disabled, skipping get')
            return null
        }
        
        console.log(`CacheService: Getting ${key}`)
        return this.cache.get(key)
    }
    
    set(key: string, value: any) {
        const enabled = this.config.get('cache.enabled') ?? false
        if (!enabled) {
            console.log('CacheService: Cache disabled, skipping set')
            return
        }
        
        console.log(`CacheService: Setting ${key}`)
        this.cache.set(key, value)
    }
}

@TpService()
class UserValidator {
    validate(userData: any): boolean {
        console.log('UserValidator: Validating user data...')
        
        if (!userData.name || userData.name.length < 2) {
            console.log('UserValidator: Invalid name')
            return false
        }
        
        if (!userData.email || !userData.email.includes('@')) {
            console.log('UserValidator: Invalid email')
            return false
        }
        
        console.log('UserValidator: Validation passed')
        return true
    }
}

// 3. Clear Service Dependencies
@TpService()
class UserService {
    constructor(
        private database: DatabaseService,
        private cache: CacheService,
        private validator: UserValidator,
        private config: TpConfigData
    ) {
        console.log('UserService: Dependencies injected successfully')
    }
    
    async create_user(userData: { name: string; email: string }) {
        console.log(`UserService: Creating user ${userData.name}`)
        
        // Validate first
        if (!this.validator.validate(userData)) {
            throw new Error('User validation failed')
        }
        
        // Save to database
        const user = {
            id: Date.now(),
            ...userData,
            created_at: new Date().toISOString()
        }
        
        this.database.query(`INSERT INTO users (name, email) VALUES ('${userData.name}', '${userData.email}')`)
        
        // Update cache if enabled
        const cacheEnabled = this.config.get('cache.enabled') ?? false
        if (cacheEnabled) {
            this.cache.set(`user:${user.id}`, user)
            console.log('UserService: User cached')
        }
        
        console.log('UserService: User created successfully')
        return user
    }
    
    async find_user(id: number) {
        console.log(`UserService: Finding user ${id}`)
        
        // Try cache first if enabled
        const cached = this.cache.get(`user:${id}`)
        if (cached) {
            console.log('UserService: User found in cache')
            return cached
        }
        
        // Query database
        const result = this.database.query(`SELECT * FROM users WHERE id = ${id}`)
        const user = { id, name: 'Found User', email: 'user@example.com' }
        
        // Cache the result if cache is enabled
        const cacheEnabled = this.config.get('cache.enabled') ?? false
        if (cacheEnabled) {
            this.cache.set(`user:${id}`, user)
        }
        
        return user
    }
}

async function demonstrate_proper_configuration() {
    console.log('=== Best Practice: Proper Configuration ===\n')
    
    // Set environment variables for demonstration
    process.env.PORT = '8080'
    process.env.HOST = '0.0.0.0'
    process.env.CACHE_ENABLED = 'true'
    
    // ✅ Good - Proper Platform configuration
    const config = load_config<TpConfigSchema>({
        http: {
            port: parseInt(process.env.PORT || '3000'),
            hostname: process.env.HOST || '0.0.0.0'
        },
        cache: {
            enabled: process.env.CACHE_ENABLED === 'true',
            ttl: 3600
        }
    })
    
    console.log('✓ Configuration loaded from environment variables')
    
    const platform = new Platform(config)
        .import(ApiService)
    
    await platform.start()
    
    const apiService = platform.expose(ApiService)
    if (apiService) {
        apiService.get_base_url()
        apiService.is_cache_enabled()
    }
    
    await platform.terminate()
    
    console.log('✓ Proper configuration demonstration complete\n')
}

async function demonstrate_lifecycle_management() {
    console.log('=== Best Practice: Lifecycle Management ===\n')
    
    const config = load_config<TpConfigSchema>({
        cache: { enabled: true }
    })
    
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(CacheService)
    
    console.log('1. Starting platform with lifecycle hooks...')
    await platform.start()
    console.log('✓ All @OnStart hooks executed')
    
    // Use the services
    const dbService = platform.expose(DatabaseService)
    if (dbService) {
        dbService.query('SELECT * FROM test')
    }
    
    console.log('\n2. Terminating platform with cleanup hooks...')
    await platform.terminate()
    console.log('✓ All @OnTerminate hooks executed')
    
    console.log('✓ Lifecycle management demonstration complete\n')
}

async function demonstrate_service_dependencies() {
    console.log('=== Best Practice: Service Dependencies ===\n')
    
    const config = load_config<TpConfigSchema>({
        cache: { enabled: true }
    })
    
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(CacheService)
        .import(UserValidator)
        .import(UserService)  // UserService depends on all the above
    
    await platform.start()
    
    console.log('1. Using service with clear dependencies...')
    const userService = platform.expose(UserService)
    
    if (userService) {
        try {
            // Create a valid user
            const user1 = await userService.create_user({
                name: 'Alice Johnson',
                email: 'alice@example.com'
            })
            console.log('✓ User created:', user1)
            
            // Find the user (should use cache)
            const foundUser = await userService.find_user(user1.id)
            console.log('✓ User found:', foundUser)
            
            // Try to create invalid user
            try {
                await userService.create_user({
                    name: 'A',  // Too short
                    email: 'invalid-email'  // Invalid format
                })
            } catch (error) {
                console.log('✓ Validation properly rejected invalid user')
            }
            
        } catch (error) {
            console.error('Error in service operation:', error)
        }
    }
    
    console.log('\n2. Service dependency analysis:')
    console.log(platform.inspect_injector())
    
    await platform.terminate()
    
    console.log('\n✓ Service dependencies demonstration complete\n')
}

async function demonstrate_all_best_practices() {
    console.log('=== Complete Best Practices Example ===\n')
    
    // Environment-based configuration
    process.env.PORT = '3000'
    process.env.HOST = 'localhost'
    process.env.CACHE_ENABLED = 'true'
    
    const config = load_config<TpConfigSchema>({
        http: {
            port: parseInt(process.env.PORT || '3000'),
            hostname: process.env.HOST || 'localhost'
        },
        cache: {
            enabled: process.env.CACHE_ENABLED === 'true',
            ttl: 3600
        }
    })
    
    const platform = new Platform(config)
        .import(DatabaseService)    // Resource management
        .import(CacheService)       // Configuration-aware
        .import(UserValidator)      // Clear responsibility
        .import(UserService)        // Clear dependencies
        .import(ApiService)         // Configuration access
    
    console.log('1. Starting platform with all best practices...')
    const startTime = await platform.start()
    console.log(`✓ Platform started in ${startTime}s`)
    
    console.log('\n2. Using services following best practices...')
    const userService = platform.expose(UserService)
    const apiService = platform.expose(ApiService)
    
    if (apiService) {
        console.log('API Configuration:')
        console.log(`  Base URL: ${apiService.get_base_url()}`)
        console.log(`  Cache enabled: ${apiService.is_cache_enabled()}`)
    }
    
    if (userService) {
        const user = await userService.create_user({
            name: 'Best Practice User',
            email: 'best@example.com'
        })
        
        await userService.find_user(user.id)
    }
    
    console.log('\n3. Provider tree showing proper dependency structure:')
    console.log(platform.inspect_injector())
    
    console.log('\n4. Graceful shutdown with proper cleanup...')
    const shutdownTime = await platform.terminate()
    console.log(`✓ Platform terminated in ${shutdownTime}s`)
    
    console.log('\n=== Best Practices Applied ===')
    console.log('✓ Environment-based configuration')
    console.log('✓ Proper lifecycle hook implementation')
    console.log('✓ Clear service dependencies')
    console.log('✓ Resource cleanup and error handling')
    console.log('✓ Configuration-aware services')
    console.log('✓ Validation and error handling')
    
    console.log('\n=== Complete Best Practices Example Complete ===\n')
}

async function main() {
    await demonstrate_proper_configuration()
    await demonstrate_lifecycle_management()
    await demonstrate_service_dependencies()
    await demonstrate_all_best_practices()
    
    console.log('=== All Best Practices Demonstrations Complete ===')
}

if (require.main === module) {
    main().catch(console.error)
} 