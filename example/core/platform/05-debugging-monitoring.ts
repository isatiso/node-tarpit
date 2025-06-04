import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpModule } from '@tarpit/core'

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

@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
    
    create_user(name: string) {
        console.log(`UserService: Creating user: ${name}`)
        const result = this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        return { id: Date.now(), name, result }
    }
}

@TpService()
class UserRepository {
    save(user: any) {
        console.log(`UserRepository: Saving user to repository`)
        return user
    }
}

@TpService()
class UserValidator {
    validate(userData: any) {
        console.log(`UserValidator: Validating user data`)
        return userData.name && userData.name.length > 0
    }
}

@TpModule({
    providers: [UserRepository, UserValidator]
})
class UserModule {}

async function demonstrate_provider_tree_visualization() {
    console.log('=== Provider Tree Visualization ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(CacheService)
        .import(UserService)
        .import(UserModule)  // Module with its own providers
    
    // Before starting - shows registered providers
    console.log('1. Provider tree BEFORE starting platform:')
    console.log(platform.inspect_injector())
    console.log('')
    
    await platform.start()
    
    // After starting - before using services
    console.log('2. Provider tree AFTER starting platform:')
    console.log(platform.inspect_injector())
    console.log('')
    
    // Use some services to show usage tracking
    console.log('3. Using some services...')
    const userService = platform.expose(UserService)
    const cacheService = platform.expose(CacheService)
    
    if (userService) {
        console.log('   - Using UserService')
        userService.create_user('Alice')
    }
    
    if (cacheService) {
        console.log('   - Using CacheService')
        cacheService.set('user:1', { name: 'Alice' })
        cacheService.get('user:1')
    }
    
    // After using services - shows which services are now "used"
    console.log('\n4. Provider tree AFTER using services:')
    console.log(platform.inspect_injector())
    
    console.log('\n5. Provider Tree Analysis:')
    console.log('   ✓ = Service has been instantiated (used)')
    console.log('   ○ = Service is registered but not yet instantiated')
    console.log('   Built-in services (TpConfigData, TpLoader) are framework services')
    console.log('   Dependencies show the injection hierarchy')
    console.log('   Module providers are nested under their modules')
    
    await platform.terminate()
    
    console.log('\n=== Provider Tree Visualization Complete ===\n')
}

async function demonstrate_performance_monitoring() {
    console.log('=== Built-in Performance Monitoring ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(UserService)
        .import(CacheService)
    
    console.log('1. Starting platform and measuring performance...')
    
    // Start the platform - returns startup time in seconds
    const startupTime = await platform.start()
    console.log(`✓ Platform started in ${startupTime}s`)
    
    // Access timing properties
    console.log('\n2. Timing information:')
    console.log(`   Started at: ${new Date(platform.started_at).toISOString()}`)
    console.log(`   Startup duration: ${platform.start_time}s`)
    
    // Use services briefly
    console.log('\n3. Running some operations...')
    const userService = platform.expose(UserService)
    const cacheService = platform.expose(CacheService)
    
    if (userService && cacheService) {
        for (let i = 0; i < 3; i++) {
            const user = userService.create_user(`User${i + 1}`)
            cacheService.set(`user:${user.id}`, user)
        }
    }
    
    // Terminate the platform - returns shutdown time in seconds  
    console.log('\n4. Terminating platform and measuring shutdown...')
    const shutdownTime = await platform.terminate()
    console.log(`✓ Platform terminated in ${shutdownTime}s`)
    
    // Access shutdown timing
    console.log('\n5. Final timing information:')
    console.log(`   Terminated at: ${new Date(platform.terminated_at).toISOString()}`)
    console.log(`   Shutdown duration: ${platform.terminate_time}s`)
    console.log(`   Total runtime: ${(platform.terminated_at - platform.started_at) / 1000}s`)
    
    console.log('\n=== Performance Monitoring Features ===')
    console.log('✓ Automatic startup time tracking')
    console.log('✓ Automatic shutdown time tracking')
    console.log('✓ Timestamp recording for lifecycle events')
    console.log('✓ Console logging with timing information')
    console.log('✓ Programmatic access to all timing data')
    
    console.log('\n=== Built-in Performance Monitoring Complete ===\n')
}

async function demonstrate_debugging_workflow() {
    console.log('=== Debugging Workflow Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(CacheService)
        .import(UserService)
        .import(UserModule)
    
    console.log('1. DEBUG: Initial state')
    console.log('   Services imported, checking initial provider tree...')
    console.log(platform.inspect_injector())
    
    console.log('\n2. DEBUG: Starting platform')
    const startTime = await platform.start()
    console.log(`   Platform startup completed in ${startTime}s`)
    
    console.log('\n3. DEBUG: Testing service resolution')
    const userService = platform.expose(UserService)
    const nonExistentService = platform.expose(class NonExistent {})
    
    console.log(`   UserService resolved: ${userService ? 'YES' : 'NO'}`)
    console.log(`   NonExistentService resolved: ${nonExistentService ? 'YES' : 'NO'}`)
    
    console.log('\n4. DEBUG: Service usage tracking')
    if (userService) {
        console.log('   Using UserService to create a user...')
        userService.create_user('DebugUser')
        
        console.log('\n   Provider tree after service usage:')
        console.log(platform.inspect_injector())
    }
    
    console.log('\n5. DEBUG: Performance analysis')
    console.log(`   Current uptime: ${(Date.now() - platform.started_at) / 1000}s`)
    console.log(`   Services in use: Check ✓ markers in provider tree above`)
    
    console.log('\n6. DEBUG: Graceful shutdown')
    const shutdownTime = await platform.terminate()
    console.log(`   Platform shutdown completed in ${shutdownTime}s`)
    
    console.log('\n=== Debugging Tips ===')
    console.log('• Use inspect_injector() to verify service registration')
    console.log('• Check ✓/○ markers to see which services are actually used')
    console.log('• Monitor startup/shutdown times for performance issues')
    console.log('• Use expose() to test service resolution')
    console.log('• Check dependency chains in the provider tree')
    
    console.log('\n=== Debugging Workflow Complete ===\n')
}

async function main() {
    await demonstrate_provider_tree_visualization()
    await demonstrate_performance_monitoring()
    await demonstrate_debugging_workflow()
    
    console.log('=== All Debugging and Monitoring Demonstrations Complete ===')
}

if (require.main === module) {
    main().catch(console.error)
} 