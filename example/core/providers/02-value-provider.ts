import 'reflect-metadata'
import { Platform, TpService, Inject, TpConfigSchema } from '@tarpit/core'
import { load_config } from '@tarpit/config'

// Configuration interfaces
interface DatabaseConfig {
    host: string
    port: number
    database: string
    ssl?: boolean
}

interface ApiConfig {
    baseUrl: string
    timeout: number
    retries: number
}

@TpService()
class DatabaseService {
    constructor(
        @Inject('database-config') private config: DatabaseConfig,
        @Inject('app-name') private app_name: string
    ) {}
    
    connect() {
        console.log(`DatabaseService: Connecting to ${this.config.host}:${this.config.port}`)
        console.log(`DatabaseService: Database: ${this.config.database}`)
        console.log(`DatabaseService: SSL: ${this.config.ssl ? 'enabled' : 'disabled'}`)
        console.log(`DatabaseService: Application: ${this.app_name}`)
        return 'connected'
    }
}

@TpService()
class ApiService {
    constructor(
        @Inject('api-config') private config: ApiConfig,
        @Inject('app-version') private version: string
    ) {}
    
    async make_request(endpoint: string) {
        console.log(`ApiService: Making request to ${this.config.baseUrl}${endpoint}`)
        console.log(`ApiService: Timeout: ${this.config.timeout}ms`)
        console.log(`ApiService: Max retries: ${this.config.retries}`)
        console.log(`ApiService: User-Agent: MyApp/${this.version}`)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100))
        return { status: 200, data: 'Success' }
    }
}

@TpService()
class FeatureService {
    constructor(
        @Inject('feature-flags') private features: Record<string, boolean>,
        @Inject('constants') private constants: any
    ) {}
    
    is_feature_enabled(feature: string) {
        const enabled = this.features[feature] ?? false
        console.log(`FeatureService: Feature '${feature}' is ${enabled ? 'enabled' : 'disabled'}`)
        return enabled
    }
    
    get_max_file_size() {
        const size = this.constants.MAX_FILE_SIZE_MB
        console.log(`FeatureService: Max file size: ${size}MB`)
        return size
    }
}

async function demonstrate_value_providers() {
    console.log('=== ValueProvider Examples ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(ApiService)
        .import(FeatureService)
        
        // 1. Simple string value
        .import({
            provide: 'app-name',
            useValue: 'My Awesome App'
        })
        
        // 2. Simple version value
        .import({
            provide: 'app-version',
            useValue: '1.2.3'
        })
        
        // 3. Configuration object
        .import({
            provide: 'database-config',
            useValue: {
                host: 'localhost',
                port: 5432,
                database: 'myapp',
                ssl: true
            } as DatabaseConfig
        })
        
        // 4. API configuration object
        .import({
            provide: 'api-config',
            useValue: {
                baseUrl: 'https://api.example.com',
                timeout: 5000,
                retries: 3
            } as ApiConfig
        })
        
        // 5. Feature flags object
        .import({
            provide: 'feature-flags',
            useValue: {
                userProfiles: true,
                analytics: false,
                betaFeatures: true,
                darkMode: true
            }
        })
        
        // 6. Constants object
        .import({
            provide: 'constants',
            useValue: {
                MAX_FILE_SIZE_MB: 10,
                ITEMS_PER_PAGE: 25,
                SESSION_TIMEOUT_MINUTES: 30
            }
        })
    
    await platform.start()
    console.log('1. Platform started with ValueProviders')
    
    // Demonstrate database service
    const db_service = platform.expose(DatabaseService)
    if (db_service) {
        console.log('\n2. Demonstrating DatabaseService with injected values...')
        db_service.connect()
    }
    
    // Demonstrate API service
    const api_service = platform.expose(ApiService)
    if (api_service) {
        console.log('\n3. Demonstrating ApiService with injected configuration...')
        const result = await api_service.make_request('/users')
        console.log('API result:', result)
    }
    
    // Demonstrate feature service
    const feature_service = platform.expose(FeatureService)
    if (feature_service) {
        console.log('\n4. Demonstrating FeatureService with injected flags...')
        feature_service.is_feature_enabled('userProfiles')
        feature_service.is_feature_enabled('analytics')
        feature_service.is_feature_enabled('nonexistentFeature')
        feature_service.get_max_file_size()
    }
    
    // Demonstrate direct value access
    console.log('\n5. Direct value access from platform...')
    const app_name = platform.expose('app-name')
    const app_version = platform.expose('app-version')
    const db_config = platform.expose('database-config')
    
    console.log(`App: ${app_name} v${app_version}`)
    console.log('Database Config:', db_config)
    
    await platform.terminate()
    console.log('\n6. Platform terminated')
    
    console.log('\n=== ValueProvider Examples Complete ===')
}

async function main() {
    await demonstrate_value_providers()
}

if (require.main === module) {
    main().catch(console.error)
} 