import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpConfigData } from '@tarpit/core'

// Extend TpConfigSchema for custom application configuration
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
        database?: {
            url?: string
            poolSize?: number
        }
        features?: {
            emailEnabled?: boolean
            analyticsEnabled?: boolean
        }
    }
}

@TpService()
class HttpConfigService {
    constructor(private config: TpConfigData) {}
    
    get_server_port() {
        // Access nested configuration using JSON path
        console.log('HttpConfigService: Getting server port...')
        const port = this.config.get('http.port') ?? 3000
        console.log(`HttpConfigService: Server port is ${port}`)
        return port
    }
    
    get_cors_origin() {
        const origin = this.config.get('http.cors.origin') ?? '*'
        console.log(`HttpConfigService: CORS origin is ${origin}`)
        return origin
    }
    
    is_cors_enabled() {
        const enabled = this.config.get('http.cors.enabled') === true
        console.log(`HttpConfigService: CORS enabled: ${enabled}`)
        return enabled
    }
}

@TpService()
class DatabaseConfigService {
    constructor(private config: TpConfigData) {}
    
    get_connection_config() {
        console.log('DatabaseConfigService: Getting connection config...')
        
        const url = this.config.get('database.url') ?? 'postgresql://localhost:5432/default'
        const poolSize = this.config.get('database.poolSize') ?? 10
        
        console.log(`DatabaseConfigService: URL: ${url}`)
        console.log(`DatabaseConfigService: Pool Size: ${poolSize}`)
        
        return { url, poolSize }
    }
    
    get_feature_flags() {
        console.log('DatabaseConfigService: Getting feature flags...')
        
        const emailEnabled = this.config.get('features.emailEnabled') ?? false
        const analyticsEnabled = this.config.get('features.analyticsEnabled') ?? false
        
        console.log(`DatabaseConfigService: Email enabled: ${emailEnabled}`)
        console.log(`DatabaseConfigService: Analytics enabled: ${analyticsEnabled}`)
        
        return { emailEnabled, analyticsEnabled }
    }
}

@TpService()
class ConfigurationService {
    constructor(private config: TpConfigData) {}
    
    log_all_configuration() {
        console.log('\n=== Complete Configuration ===')
        // Get entire configuration without path
        const fullConfig = this.config.get()
        console.log('Full configuration:', JSON.stringify(fullConfig, null, 2))
        return fullConfig
    }
    
    log_specific_sections() {
        console.log('\n=== Specific Configuration Sections ===')
        
        // Access specific configuration sections
        const databaseConfig = this.config.get('database')
        const featuresConfig = this.config.get('features')
        
        console.log('Database Configuration:', databaseConfig)
        console.log('Features Configuration:', featuresConfig)
        
        return { databaseConfig, featuresConfig }
    }
}

@TpService()
class TypeSafeConfigService {
    constructor(private config: TpConfigData) {}
    
    initialize() {
        console.log('\n=== Type-Safe Configuration Access ===')
        
        // TypeScript provides full IntelliSense for these paths
        const dbUrl = this.config.get('database.url')              // string | undefined
        const emailEnabled = this.config.get('features.emailEnabled') // boolean | undefined
        
        // Use with default values
        const poolSize = this.config.get('database.poolSize') ?? 10
        
        console.log(`TypeSafeConfigService: Database URL: ${dbUrl || 'default'}`)
        console.log(`TypeSafeConfigService: Email enabled: ${emailEnabled}`)
        console.log(`TypeSafeConfigService: Pool size: ${poolSize}`)
    }
}

async function demonstrate_environment_based_configuration() {
    console.log('=== Environment-Based Configuration ===\n')
    
    // Set environment variables for demonstration
    process.env.PORT = '8080'
    process.env.HOST = '127.0.0.1'
    process.env.DATABASE_URL = 'postgresql://prod.example.com:5432/proddb'
    process.env.DB_POOL_SIZE = '20'
    process.env.EMAIL_ENABLED = 'true'
    process.env.ANALYTICS_ENABLED = 'false'
    
    const config = load_config<TpConfigSchema>({
        database: {
            url: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
            poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
        },
        features: {
            emailEnabled: process.env.EMAIL_ENABLED === 'true',
            analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true'
        }
    })
    
    console.log('1. Configuration loaded from environment variables')
    
    const platform = new Platform(config)
        .import(HttpConfigService)
        .import(DatabaseConfigService)
        .import(ConfigurationService)
        .import(TypeSafeConfigService)
    
    await platform.start()
    console.log('2. Platform started with configuration services')
    
    // Demonstrate configuration access
    const httpConfigService = platform.expose(HttpConfigService)
    const dbConfigService = platform.expose(DatabaseConfigService)
    const configService = platform.expose(ConfigurationService)
    const typeSafeService = platform.expose(TypeSafeConfigService)
    
    console.log('\n3. Accessing configuration in services...')
    
    if (httpConfigService) {
        httpConfigService.get_server_port()
        httpConfigService.get_cors_origin()
        httpConfigService.is_cors_enabled()
    }
    
    if (dbConfigService) {
        dbConfigService.get_connection_config()
        dbConfigService.get_feature_flags()
    }
    
    if (configService) {
        configService.log_all_configuration()
        configService.log_specific_sections()
    }
    
    if (typeSafeService) {
        typeSafeService.initialize()
    }
    
    await platform.terminate()
    console.log('\n4. Platform terminated')
    
    console.log('\n=== Environment-Based Configuration Complete ===')
}

async function main() {
    await demonstrate_environment_based_configuration()
}

if (require.main === module) {
    main().catch(console.error)
} 