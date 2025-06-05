import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// Bottom layer - no dependencies
@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

// Second layer - depends on LoggerService
@TpService()
class DatabaseService {
    constructor(private logger: LoggerService) {}
    
    connect() {
        this.logger.log('Database connected')
        return true
    }
    
    query(sql: string) {
        this.logger.log(`Query executed: ${sql}`)
        return { rows: [], count: 0 }
    }
}

// Third layer - depends on DatabaseService (which depends on LoggerService)
@TpService()
class UserRepository {
    constructor(
        private db: DatabaseService,
        private logger: LoggerService
    ) {}
    
    find_by_id(id: number) {
        this.logger.log(`Finding user by ID: ${id}`)
        this.db.connect()
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`)
    }
    
    create(name: string) {
        this.logger.log(`Creating user: ${name}`)
        this.db.connect()
        return this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
    }
}

// Fourth layer - depends on UserRepository (which depends on DatabaseService and LoggerService)
@TpService()
class UserService {
    constructor(
        private user_repo: UserRepository,
        private logger: LoggerService
    ) {}
    
    get_user(id: number) {
        this.logger.log(`UserService: Getting user ${id}`)
        return this.user_repo.find_by_id(id)
    }
    
    create_user(name: string) {
        this.logger.log(`UserService: Creating user ${name}`)
        return this.user_repo.create(name)
    }
}

// Top layer - depends on UserService (which has a deep dependency chain)
@TpService()
class UserController {
    constructor(
        private user_service: UserService,
        private logger: LoggerService
    ) {}
    
    handle_get_user(id: number) {
        this.logger.log(`UserController: Handling get user request for ID ${id}`)
        return this.user_service.get_user(id)
    }
    
    handle_create_user(name: string) {
        this.logger.log(`UserController: Handling create user request for ${name}`)
        return this.user_service.create_user(name)
    }
}

async function demonstrate_dependency_resolution() {
    console.log('Setting up platform with dependency chain...')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(LoggerService)      // No dependencies
        .import(DatabaseService)    // Depends on LoggerService
        .import(UserRepository)     // Depends on DatabaseService, LoggerService
        .import(UserService)        // Depends on UserRepository, LoggerService
        .import(UserController)     // Depends on UserService, LoggerService
    
    await platform.start()
    
    console.log('\nDependency resolution chain:')
    console.log('UserController → UserService → UserRepository → DatabaseService → LoggerService')
    
    // When we get UserController, all dependencies are resolved automatically
    const controller = platform.expose(UserController)
    if (!controller) {
        throw new Error('UserController not found')
    }
    
    console.log('\nExecuting operations (notice the dependency chain in action):')
    controller.handle_create_user('Alice')
    console.log('')
    controller.handle_get_user(1)
    
    await platform.terminate()
    console.log('\n=== Dependency resolution demonstration completed ===')
}

if (require.main === module) {
    demonstrate_dependency_resolution().catch(console.error)
} 