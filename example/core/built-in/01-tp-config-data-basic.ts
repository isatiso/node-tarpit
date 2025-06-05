import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpService, TpConfigData } from '@tarpit/core'

// Extend the global TpConfigSchema interface for type safety
declare module '@tarpit/core' {
    interface TpConfigSchema {
        basic_database: {
            host: string
            port: number
            name: string
        }
        basic_redis: {
            host: string
            port: number
        }
        basic_debug: boolean
    }
}

@TpService()
class DatabaseService {
    constructor(private config: TpConfigData) {}
    
    connect() {
        // Access configuration using JSON path notation
        const host = this.config.get('basic_database.host') ?? 'localhost'
        const port = this.config.get('basic_database.port') ?? 5432
        console.log(`DatabaseService: Connecting to database: ${host}:${port}`)
        return { connected: true, host, port }
    }
    
    get_database_info() {
        // TypeScript knows the exact shape of config when using paths
        const host = this.config.get('basic_database.host')
        const port = this.config.get('basic_database.port')
        const name = this.config.get('basic_database.name')
        console.log(`DatabaseService: Database info - ${host}:${port}/${name}`)
        return { host, port, name }
    }
    
    get_full_database_config() {
        // Get entire database section
        const dbConfig = this.config.get('basic_database')
        console.log(`DatabaseService: Full database config:`, dbConfig)
        return dbConfig
    }
    
    get_all_config() {
        // Get entire configuration object
        const allConfig = this.config.get()
        console.log(`DatabaseService: All configuration:`, allConfig)
        return allConfig
    }
}

@TpService()
class RedisService {
    constructor(private config: TpConfigData) {}
    
    connect() {
        // Access Redis configuration
        const host = this.config.get('basic_redis.host') ?? 'localhost'
        const port = this.config.get('basic_redis.port') ?? 6379
        console.log(`RedisService: Connecting to Redis: ${host}:${port}`)
        return { connected: true, host, port }
    }
    
    get_redis_config() {
        // Get entire Redis section
        const redisConfig = this.config.get('basic_redis')
        console.log(`RedisService: Redis config:`, redisConfig)
        return redisConfig
    }
}

@TpService()
class AppService {
    constructor(private config: TpConfigData) {}
    
    check_debug_mode() {
        // Access boolean configuration
        const debug = this.config.get('basic_debug') ?? false
        console.log(`AppService: Debug mode is ${debug ? 'enabled' : 'disabled'}`)
        return debug
    }
    
    get_app_info() {
        const debug = this.config.get('basic_debug')
        const dbName = this.config.get('basic_database.name')
        const redisHost = this.config.get('basic_redis.host')
        
        console.log(`AppService: App running with database '${dbName}', redis '${redisHost}', debug: ${debug}`)
        return { database: dbName, redis: redisHost, debug }
    }
}

async function main() {
    console.log('=== TpConfigData Basic Usage Example ===\n')
    
    // Load configuration with typed structure
    const config = load_config({
        basic_database: {
            host: 'localhost',
            port: 5432,
            name: 'myapp'
        },
        basic_redis: {
            host: 'localhost',
            port: 6379
        },
        basic_debug: true
    })
    
    // Create platform with configuration and services
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(RedisService)
        .import(AppService)
    
    // Start platform
    console.log('Starting platform...')
    await platform.start()
    
    // Get services and demonstrate usage
    const dbService = platform.expose(DatabaseService)!
    const redisService = platform.expose(RedisService)!
    const appService = platform.expose(AppService)!
    
    console.log('\n1. Basic database configuration access:')
    dbService.connect()
    
    console.log('\n2. Detailed database information:')
    dbService.get_database_info()
    
    console.log('\n3. Full database config section:')
    dbService.get_full_database_config()
    
    console.log('\n4. Redis configuration access:')
    redisService.connect()
    redisService.get_redis_config()
    
    console.log('\n5. Debug mode check:')
    appService.check_debug_mode()
    
    console.log('\n6. App information summary:')
    appService.get_app_info()
    
    console.log('\n7. All configuration data:')
    dbService.get_all_config()
    
    // Terminate platform
    console.log('\nTerminating platform...')
    await platform.terminate()
    
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 