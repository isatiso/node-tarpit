import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpModule, TpRoot } from '@tarpit/core'

@TpService()
class DatabaseService {
    query(sql: string) {
        console.log(`Executing query: ${sql}`)
        return { affected_rows: 1 }
    }
}

@TpService()
class DatabaseService1 {
}

@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
    
    create_user(name: string) {
        console.log(`Creating user: ${name}`)
        this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        return { id: Date.now(), name }
    }
    
    find_user(id: number) {
        console.log(`Finding user with ID: ${id}`)
        this.db.query(`SELECT * FROM users WHERE id = ${id}`)
        return { id, name: 'Found User' }
    }
}

@TpService()
class UserService2 {
}

@TpModule({
    providers: [DatabaseService, UserService]
})
class AppModule {
}

@TpRoot({
    imports: [AppModule]
})
class AppRoot {
}

@TpRoot({
    imports: [AppRoot],
    providers: [UserService2,DatabaseService1]
})
class AppRoot2 {
}

async function basic_platform_usage() {
    console.log('=== Basic Platform Usage ===\n')
    
    // 1. Creating a Platform
    console.log('1. Creating platform...')
    const config = load_config<TpConfigSchema>({
        name: 'basic-app',
        version: '1.0.0'
    })
    
    const platform = new Platform(config)
    
    // 2. Importing Services
    console.log('2. Importing services...')
    platform.import(AppRoot2)      // Import the root module
    platform.import(AppRoot)      // Import the root module

    // 2.5. Print Provider Tree (before starting)
    console.log('\n2.5. Printing provider tree...')
    const provider_tree = platform.print_provider_tree()
    console.log(provider_tree)
    
    // 3. Starting the Platform
    console.log('3. Starting platform...')
    await platform.start()
    console.log('Platform started successfully!\n')
    
    // 4. Using Services
    console.log('4. Using services...')
    const user_service = platform.expose(UserService)
    const database_service = platform.expose(DatabaseService)
    
    console.log('UserService instance:', user_service)
    console.log('DatabaseService instance:', database_service)
    
    if (!user_service || !database_service) {
        throw new Error('Services not found')
    }
    
    // Debug the UserService instance
    console.log('UserService.db property:', (user_service as any).db)
    
    // Test database service directly first
    console.log('\n--- Testing database service directly ---')
    const dbResult = database_service.query('TEST QUERY')
    console.log('Database result:', dbResult)
    
    // Now test user service
    console.log('\n--- Testing user service ---')
    const user1 = user_service.create_user('Alice')
    const user2 = user_service.create_user('Bob')
    
    console.log('Created users:', [user1, user2])
    
    // Find users
    const found_user = user_service.find_user(user1.id)
    console.log('Found user:', found_user)
    
    // Direct database access
    database_service.query('SELECT COUNT(*) FROM users')
    
    // 5. Print Provider Tree
    console.log('\n5. Printing provider tree...')
    const provider_tree_after = platform.print_provider_tree()
    console.log(provider_tree_after)
    
    // 6. Shutting Down
    console.log('\n6. Shutting down platform...')
    await platform.terminate()
    console.log('Platform shutdown complete')
    
    console.log('\n=== Basic usage completed ===')
}

// Import multiple services at once
async function import_multiple_services() {
    console.log('\n=== Importing Multiple Services ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(AppRoot)      // Import the root module
    
    await platform.start()
    console.log('Multiple services imported and started via module')
    
    await platform.terminate()
}

async function main() {
    await basic_platform_usage()
    await import_multiple_services()
}

if (require.main === module) {
    main().catch(console.error)
} 