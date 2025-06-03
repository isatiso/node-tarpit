import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpModule } from '@tarpit/core'

// Database layer services
@TpService()
class DatabaseService {
    connect() {
        console.log('Database connected')
        return true
    }
    
    query(sql: string) {
        console.log(`Executing query: ${sql}`)
        return { rows: [], count: 0 }
    }
}

@TpService()
class UserRepository {
    constructor(private db: DatabaseService) {}
    
    find_by_id(id: number) {
        this.db.connect()
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`)
    }
    
    create(name: string) {
        this.db.connect()
        return this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
    }
}

// Database module - groups database-related services
@TpModule({
    providers: [DatabaseService, UserRepository]
})
class DatabaseModule {}

// Business logic services
@TpService()
class UserService {
    constructor(private user_repo: UserRepository) {}
    
    get_user(id: number) {
        console.log(`UserService: Getting user ${id}`)
        return this.user_repo.find_by_id(id)
    }
    
    create_user(name: string) {
        console.log(`UserService: Creating user ${name}`)
        return this.user_repo.create(name)
    }
}

@TpService()
class NotificationService {
    send_notification(user_id: number, message: string) {
        console.log(`Sending notification to user ${user_id}: ${message}`)
    }
}

// User module - imports DatabaseModule and provides business logic
@TpModule({
    imports: [DatabaseModule],           // Import database functionality
    providers: [UserService, NotificationService]
})
class UserModule {}

// Application layer services
@TpService()
class UserController {
    constructor(
        private user_service: UserService,
        private notification: NotificationService
    ) {}
    
    handle_create_user(name: string) {
        console.log(`UserController: Handling create user request for ${name}`)
        const result = this.user_service.create_user(name)
        this.notification.send_notification(123, `User ${name} created`)
        return result
    }
    
    handle_get_user(id: number) {
        console.log(`UserController: Handling get user request for ID ${id}`)
        return this.user_service.get_user(id)
    }
}

// Application module - top-level module that brings everything together
@TpModule({
    imports: [UserModule],               // Import user functionality
    providers: [UserController]
})
class ApplicationModule {}

async function demonstrate_module_organization() {
    console.log('=== Module Organization Example ===')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(ApplicationModule)       // Import the top-level module
    
    await platform.start()
    
    console.log('\nModule hierarchy:')
    console.log('ApplicationModule → UserModule → DatabaseModule')
    console.log('                     ↓')
    console.log('                NotificationService')
    
    console.log('\nTesting the complete module stack:')
    const controller = platform.expose(UserController)
    if (!controller) {
        throw new Error('UserController not found')
    }
    
    controller.handle_create_user('Alice')
    console.log('')
    controller.handle_get_user(1)
    
    // Demonstrate module isolation - these are not exported, so not accessible
    console.log('\nTesting module isolation:')
    const database_service = platform.expose(DatabaseService)
    if (!database_service) {
        console.log('✓ DatabaseService is not accessible - properly encapsulated by module')
    }
    
    const notification_service = platform.expose(NotificationService)
    if (!notification_service) {
        console.log('✓ NotificationService is not accessible - not exported by UserModule')
    }
    
    await platform.terminate()
    console.log('\n=== Module organization example completed ===')
}

if (require.main === module) {
    demonstrate_module_organization().catch(console.error)
} 