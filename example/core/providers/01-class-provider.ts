import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, Inject } from '@tarpit/core'

@TpService()
class DatabaseService {
    connect() {
        console.log('DatabaseService: Connected to database')
        return 'connection-established'
    }
    
    query(sql: string) {
        console.log(`DatabaseService: Executing query: ${sql}`)
        return { rows: [], count: 0 }
    }
}

@TpService()
class UserService {
    constructor(
        private db: DatabaseService,                               // Injected via shorthand form
        @Inject('database-service') private db2: DatabaseService,  // Injected via string token
        @Inject('PaymentProcessor') private payment: PaymentProcessor // Injected via interface
    ) {}
    
    async create_user(name: string, email: string) {
        console.log(`UserService: Creating user ${name} (${email})`)
        
        // Use first database connection
        this.db.connect()
        this.db.query(`INSERT INTO users (name, email) VALUES ('${name}', '${email}')`)
        
        // Use second database connection (same instance)
        this.db2.query('SELECT COUNT(*) FROM users')
        
        // Process payment
        await this.payment.process(29.99)
        
        console.log('UserService: User created successfully')
    }
}

@TpService()
class EmailService {
    send(to: string, subject: string) {
        console.log(`EmailService: Sending email to ${to} with subject: ${subject}`)
        return { message_id: `msg_${Date.now()}`, to, subject }
    }
}

@TpService()
class LoggingService {
    log(level: string, message: string) {
        console.log(`LoggingService: [${level.toUpperCase()}] ${message}`)
        return { timestamp: Date.now(), level, message }
    }
}

// Interface for payment processing
interface PaymentProcessor {
    process(amount: number): Promise<void>
}

@TpService()
class StripePaymentProcessor implements PaymentProcessor {
    async process(amount: number) {
        console.log(`StripePaymentProcessor: Processing payment of $${amount}`)
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('StripePaymentProcessor: Payment processed successfully')
    }
}

async function demonstrate_class_providers() {
    console.log('=== ClassProvider Examples ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        // 1. Shorthand form (recommended)
        // Equivalent to { provide: DatabaseService, useClass: DatabaseService }
        .import(DatabaseService)
        .import(StripePaymentProcessor)
        .import(UserService)
        
        // 2. Explicit form: when token and implementation are the same
        .import({
            provide: 'database-service',    // String token
            useClass: DatabaseService       // Implementation class
        })
        
        // 3. Explicit form: interface-based injection
        .import({
            provide: 'PaymentProcessor',        // String token for interface
            useClass: StripePaymentProcessor    // Concrete implementation
        })
    
    await platform.start()
    console.log('1. Platform started with ClassProviders')
    
    // Demonstrate usage
    const user_service = platform.expose(UserService)
    if (user_service) {
        console.log('\n2. Demonstrating ClassProvider dependency injection...')
        await user_service.create_user('John Doe', 'john@example.com')
    }
    
    // Verify singleton behavior
    const db1 = platform.expose(DatabaseService)
    const db2 = platform.expose('database-service' as any)
    
    console.log('\n3. Verifying singleton behavior:')
    console.log(`DatabaseService instances are same: ${db1 === db2}`)
    
    await platform.terminate()
    console.log('\n4. Platform terminated')
    
    console.log('\n=== ClassProvider Examples Complete ===')
}

async function main() {
    await demonstrate_class_providers()
}

if (require.main === module) {
    main().catch(console.error)
} 