import 'reflect-metadata'
import { Platform, TpService, Inject, TpConfigSchema, TpConfigData } from '@tarpit/core'
import { load_config } from '@tarpit/config'

// Extend configuration schema for this example
declare module '@tarpit/core' {
    interface TpConfigSchema {
        logger?: {
            level?: 'debug' | 'info' | 'warn' | 'error'
            format?: 'json' | 'text'
        }
        db?: {
            url?: string
            pool_size?: number
        }
        app_cache?: {
            type?: 'memory' | 'redis'
            ttl?: number
        }
    }
}

// Abstract logger interface
abstract class Logger {
    abstract log(level: string, message: string): void
}

class ConsoleLogger extends Logger {
    constructor(private format: string = 'text') {
        super()
    }
    
    log(level: string, message: string) {
        if (this.format === 'json') {
            console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString() }))
        } else {
            console.log(`[${level.toUpperCase()}] ${message}`)
        }
    }
}

class FileLogger extends Logger {
    constructor(private filename: string) {
        super()
    }
    
    log(level: string, message: string) {
        // Simulate file logging
        console.log(`FileLogger: Writing to ${this.filename}: [${level.toUpperCase()}] ${message}`)
    }
}

// Database connection class
class DatabaseConnection {
    private connected = false
    
    constructor(private url: string, private pool_size: number) {}
    
    async connect() {
        if (!this.connected) {
            console.log(`DatabaseConnection: Connecting to ${this.url}`)
            console.log(`DatabaseConnection: Pool size: ${this.pool_size}`)
            // Simulate connection
            await new Promise(resolve => setTimeout(resolve, 100))
            console.log('DatabaseConnection: Connected successfully')
            this.connected = true
        }
        return this
    }
    
    query(sql: string) {
        if (!this.connected) {
            console.log('DatabaseConnection: Auto-connecting before query...')
            // In real apps, you'd await connect() here or use connection pooling
        }
        console.log(`DatabaseConnection: Executing query: ${sql}`)
        return { rows: [], affected: 0 }
    }
}

// Cache interface
interface CacheProvider {
    get(key: string): any
    set(key: string, value: any, ttl?: number): void
}

class MemoryCache implements CacheProvider {
    private store = new Map<string, { value: any, expires: number }>()
    
    constructor(private default_ttl: number = 300) {}
    
    get(key: string) {
        const item = this.store.get(key)
        if (!item || item.expires < Date.now()) {
            console.log(`MemoryCache: Cache miss for key '${key}'`)
            return null
        }
        console.log(`MemoryCache: Cache hit for key '${key}'`)
        return item.value
    }
    
    set(key: string, value: any, ttl = this.default_ttl) {
        const expires = Date.now() + (ttl * 1000)
        this.store.set(key, { value, expires })
        console.log(`MemoryCache: Cached key '${key}' for ${ttl}s`)
    }
}

class RedisCache implements CacheProvider {
    constructor(private default_ttl: number = 300) {}
    
    get(key: string) {
        // Simulate Redis operation
        console.log(`RedisCache: Getting key '${key}' from Redis`)
        return null
    }
    
    set(key: string, value: any, ttl = this.default_ttl) {
        console.log(`RedisCache: Setting key '${key}' in Redis for ${ttl}s`)
    }
}

@TpService()
class ApplicationService {
    constructor(
        private logger: Logger,
        @Inject('database-connection') private db: DatabaseConnection,
        @Inject('cache-provider') private cache: CacheProvider,
        @Inject('timestamp') private startup_time: number
    ) {}
    
    async process_data(id: string) {
        this.logger.log('info', `ApplicationService: Processing data for ID: ${id}`)
        
        // Check cache first
        const cached_result = this.cache.get(`data:${id}`)
        if (cached_result) {
            this.logger.log('info', 'ApplicationService: Using cached result')
            return cached_result
        }
        
        // Query database
        const result = this.db.query(`SELECT * FROM data WHERE id = '${id}'`)
        
        // Cache the result
        this.cache.set(`data:${id}`, result, 300)
        
        this.logger.log('info', 'ApplicationService: Data processed successfully')
        return result
    }
    
    get_uptime() {
        const uptime = Date.now() - this.startup_time
        this.logger.log('info', `ApplicationService: Uptime: ${uptime}ms`)
        return uptime
    }
}

async function demonstrate_factory_providers() {
    console.log('=== FactoryProvider Examples ===\n')
    
    const config = load_config<TpConfigSchema>({
        logger: {
            level: 'info',
            format: 'json'
        },
        db: {
            url: 'postgresql://localhost:5432/myapp',
            pool_size: 10
        },
        app_cache: {
            type: 'memory',
            ttl: 600
        }
    })
    
    const platform = new Platform(config)
        .import(ApplicationService)
        
        // 1. Simple factory - current timestamp
        .import({
            provide: 'timestamp',
            useFactory: () => {
                const timestamp = Date.now()
                console.log(`Factory: Generated timestamp: ${timestamp}`)
                return timestamp
            }
        })
        
        // 2. Factory with dependencies - conditional logger
        .import({
            provide: Logger,
            useFactory: (config: TpConfigData) => {
                const log_level = config.get('logger.level') ?? 'info'
                const log_format = config.get('logger.format') ?? 'text'
                
                console.log(`Factory: Creating logger with level '${log_level}' and format '${log_format}'`)
                
                if (log_level === 'debug') {
                    return new FileLogger('/var/log/debug.log')
                } else {
                    return new ConsoleLogger(log_format)
                }
            },
            deps: [TpConfigData]
        })
        
        // 3. Synchronous factory - database connection (Tarpit doesn't support async factories)
        .import({
            provide: 'database-connection',
            useFactory: (config: TpConfigData) => {
                const db_url = config.get('db.url') ?? 'postgresql://localhost:5432/default'
                const pool_size = config.get('db.pool_size') ?? 5
                
                console.log('Factory: Creating database connection...')
                const connection = new DatabaseConnection(db_url, pool_size)
                // Note: In real applications, you'd handle async connection setup differently
                console.log('Factory: Database connection created (connection will be established on first use)')
                return connection
            },
            deps: [TpConfigData]
        })
        
        // 4. Conditional factory - cache provider
        .import({
            provide: 'cache-provider',
            useFactory: (config: TpConfigData) => {
                const cache_type = config.get('app_cache.type') ?? 'memory'
                const ttl = config.get('app_cache.ttl') ?? 300
                
                console.log(`Factory: Creating ${cache_type} cache with TTL ${ttl}s`)
                
                if (cache_type === 'redis') {
                    return new RedisCache(ttl)
                } else {
                    return new MemoryCache(ttl)
                }
            },
            deps: [TpConfigData]
        })
    
    await platform.start()
    console.log('1. Platform started with FactoryProviders')
    
    // Small delay to ensure async factories complete
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Demonstrate the application service
    const app_service = platform.expose(ApplicationService)
    if (app_service) {
        console.log('\n2. Demonstrating ApplicationService with factory-created dependencies...')
        
        // Process some data
        await app_service.process_data('user-123')
        await app_service.process_data('user-123') // Should hit cache
        await app_service.process_data('user-456')
        
        // Check uptime
        app_service.get_uptime()
    }
    
    // Demonstrate direct factory access
    console.log('\n3. Direct access to factory-created providers...')
    const logger = platform.expose(Logger)
    const db_connection = platform.expose('database-connection') as DatabaseConnection
    const cache_provider = platform.expose('cache-provider') as CacheProvider
    
    if (logger) {
        logger.log('info', 'Direct logger access working')
    }
    
    if (db_connection) {
        db_connection.query('SELECT COUNT(*) FROM users')
    }
    
    if (cache_provider) {
        cache_provider.set('test-key', { data: 'test-value' }, 60)
        const cached_value = cache_provider.get('test-key')
        console.log('Cached value:', cached_value)
    }
    
    await platform.terminate()
    console.log('\n4. Platform terminated')
    
    console.log('\n=== FactoryProvider Examples Complete ===')
}

async function main() {
    await demonstrate_factory_providers()
}

if (require.main === module) {
    main().catch(console.error)
} 