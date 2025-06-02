import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

@TpService()
class DatabaseService {
    constructor(private logger: LoggerService) {}
    
    query(sql: string) {
        this.logger.log(`Executing query: ${sql}`)
        return []
    }
}

@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        private logger: LoggerService  // Same LoggerService instance as DatabaseService
    ) {}
    
    find_user(id: string) {
        this.logger.log(`Finding user ${id}`)
        return this.db.query(`SELECT * FROM users WHERE id = '${id}'`)
    }
}

@TpService()
class CounterService {
    private count = 0
    
    increment() {
        return ++this.count
    }
    
    get_count() {
        return this.count
    }
}

@TpService()
class ServiceA {
    constructor(private counter: CounterService) {}
    
    do_something() {
        const result = this.counter.increment()
        console.log(`ServiceA incremented counter to: ${result}`)
        return result
    }
}

@TpService()
class ServiceB {
    constructor(private counter: CounterService) {}
    
    do_something() {
        const result = this.counter.increment()
        console.log(`ServiceB incremented counter to: ${result}`)
        return result
    }
}

async function main() {
    console.log('=== Dependency Resolution Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(LoggerService)
        .import(DatabaseService)
        .import(UserService)
        .import(CounterService)
        .import(ServiceA)
        .import(ServiceB)
    
    await platform.start()
    
    // Test dependency resolution
    console.log('1. Testing dependency resolution chain:')
    const userService = platform.expose(UserService)
    if (!userService) {
        throw new Error('UserService not found')
    }
    
    userService.find_user('123')
    
    // Test singleton behavior
    console.log('\n2. Testing singleton behavior:')
    const serviceA = platform.expose(ServiceA)
    const serviceB = platform.expose(ServiceB)
    const counter = platform.expose(CounterService)
    
    if (!serviceA || !serviceB || !counter) {
        throw new Error('Services not found')
    }
    
    console.log(`Initial counter value: ${counter.get_count()}`)
    
    serviceA.do_something()  // Should increment to 1
    serviceB.do_something()  // Should increment to 2 (same instance!)
    serviceA.do_something()  // Should increment to 3
    
    console.log(`Final counter value: ${counter.get_count()}`)
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 