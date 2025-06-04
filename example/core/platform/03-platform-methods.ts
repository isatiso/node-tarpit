import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpConfigData } from '@tarpit/core'

// Example services for platform methods demonstration
@TpService()
class UserService {
    create_user(name: string) {
        console.log(`UserService: Creating user ${name}`)
        return { id: Date.now(), name }
    }
    
    find_user(id: number) {
        console.log(`UserService: Finding user ${id}`)
        return { id, name: 'Found User' }
    }
}

@TpService()
class DatabaseService {
    query(sql: string) {
        console.log(`DatabaseService: Executing query: ${sql}`)
        return { rows: 3, success: true }
    }
}

@TpService()
class CacheService {
    private cache = new Map<string, any>()
    
    get(key: string) {
        console.log(`CacheService: Getting ${key}`)
        return this.cache.get(key)
    }
    
    set(key: string, value: any) {
        console.log(`CacheService: Setting ${key}`)
        this.cache.set(key, value)
    }
}

// Service using custom provider tokens
const DATABASE_URL = Symbol('DATABASE_URL')

@TpService()
class OptionalService {
    do_something() {
        console.log('OptionalService: Doing something...')
        return { result: 'optional operation completed' }
    }
}

async function demonstrate_import_method() {
    console.log('=== .import() Method ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
    
    console.log('1. Importing services and providers...')
    
    // Import a service class
    platform.import(UserService)
    console.log('✓ Imported UserService')
    
    // Import multiple services
    platform.import(DatabaseService)
    platform.import(CacheService)
    console.log('✓ Imported DatabaseService and CacheService')
    
    // Import with custom provider
    platform.import({
        provide: DATABASE_URL,
        useValue: 'postgresql://localhost:5432'
    })
    console.log('✓ Imported custom DATABASE_URL provider')
    
    // Import factory provider
    platform.import({
        provide: 'ApiClient',
        useFactory: (config: TpConfigData) => {
            console.log('Factory: Creating ApiClient instance')
            return { baseUrl: 'https://api.example.com' }
        },
        deps: [TpConfigData]
    })
    console.log('✓ Imported factory provider for ApiClient')
    
    await platform.start()
    await platform.terminate()
    
    console.log('\n.import() method demonstration complete\n')
}

async function demonstrate_start_method() {
    console.log('=== .start() Method ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(UserService)
        .import(DatabaseService)
    
    console.log('1. Starting platform...')
    
    try {
        // Simple start
        const startTime = await platform.start()
        console.log(`✓ Platform started successfully in ${startTime}s`)
        
        console.log('2. Platform is now running and ready to serve requests')
        
        await platform.terminate()
        console.log('✓ Platform terminated')
        
    } catch (error) {
        console.error('Failed to start platform:', error)
        // Platform automatically cleans up on startup failure
        // No need to manually call terminate()
    }
    
    console.log('\n.start() method demonstration complete\n')
}

async function demonstrate_expose_method() {
    console.log('=== .expose() Method ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(UserService)
        .import({
            provide: DATABASE_URL,
            useValue: 'postgresql://localhost:5432'
        })
        .import(OptionalService)
    
    await platform.start()
    
    console.log('1. Exposing services from platform...')
    
    // Get a service instance
    const userService = platform.expose(UserService)
    if (userService) {
        console.log('✓ UserService exposed successfully')
        const user = userService.create_user('Alice')
        console.log('Service result:', user)
    }
    
    // Use with custom token
    const dbUrl = platform.expose(DATABASE_URL)
    console.log('✓ DATABASE_URL exposed:', dbUrl)
    
    // Check if service exists (returns undefined if not found)
    const optionalService = platform.expose(OptionalService)
    if (optionalService) {
        console.log('✓ OptionalService found and exposed')
        optionalService.do_something()
    } else {
        console.log('✗ OptionalService not found')
    }
    
    await platform.terminate()
    
    console.log('\n.expose() method demonstration complete\n')
}

async function demonstrate_terminate_method() {
    console.log('=== .terminate() Method ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(UserService)
        .import(DatabaseService)
    
    await platform.start()
    console.log('1. Platform started and running')
    
    console.log('2. Terminating platform...')
    
    try {
        const terminateTime = await platform.terminate()
        console.log(`✓ Platform terminated successfully in ${terminateTime}s`)
    } catch (error) {
        console.error('Error during platform termination:', error)
    }
    
    console.log('\n.terminate() method demonstration complete\n')
}

async function demonstrate_inspect_injector_method() {
    console.log('=== .inspect_injector() Method ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(UserService)
        .import(DatabaseService)
        .import(CacheService)
        .import(OptionalService)
    
    // Before using any services
    console.log('1. Provider tree BEFORE starting:')
    console.log(platform.inspect_injector())
    
    await platform.start()
    
    console.log('\n2. Provider tree AFTER starting:')
    console.log(platform.inspect_injector())
    
    // Use some services
    console.log('\n3. Using some services...')
    const userService = platform.expose(UserService)
    const dbService = platform.expose(DatabaseService)
    
    if (userService && dbService) {
        userService.create_user('Bob')
        dbService.query('SELECT * FROM users')
    }
    
    // Print the dependency tree after usage
    console.log('\n4. Provider tree AFTER using services:')
    console.log(platform.inspect_injector())
    
    console.log('\n5. Analysis:')
    console.log('   ✓ = Service has been used (instantiated)')
    console.log('   ○ = Service is registered but not yet used')
    console.log('   Used services show dependency chain activation')
    console.log('   Built-in services (TpConfigData, TpLoader) are always present')
    
    await platform.terminate()
    
    console.log('\n.inspect_injector() method demonstration complete\n')
}

async function main() {
    await demonstrate_import_method()
    await demonstrate_start_method()
    await demonstrate_expose_method()
    await demonstrate_terminate_method()
    await demonstrate_inspect_injector_method()
    
    console.log('=== Platform Methods Demonstration Complete ===')
}

if (require.main === module) {
    main().catch(console.error)
} 