import { load_config } from '@tarpit/config'
import { 
    Platform, 
    TpConfigSchema, 
    TpService, 
    TpModule, 
    Inject, 
    Optional, 
    OnTerminate 
} from '@tarpit/core'

// Custom tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_RETRIES = Symbol('MAX_RETRIES')

@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

@TpService()
class MetricsService {
    private counters = new Map<string, number>()
    
    increment(metric: string) {
        const current = this.counters.get(metric) || 0
        this.counters.set(metric, current + 1)
        console.log(`[METRICS] ${metric}: ${current + 1}`)
    }
    
    @OnTerminate()
    async save_metrics() {
        console.log('[METRICS] Saving metrics before shutdown')
        console.log('[METRICS] Final counts:', Object.fromEntries(this.counters))
    }
}

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_RETRIES) private maxRetries: number,
        private logger: LoggerService
    ) {}
    
    connect() {
        this.logger.log(`Connecting to database: ${this.url} (max retries: ${this.maxRetries})`)
    }
    
    @OnTerminate()
    async cleanup() {
        this.logger.log('Closing database connection')
        // Simulate cleanup
        await new Promise(resolve => setTimeout(resolve, 100))
    }
}

@TpService()
class EmailService {
    constructor(
        private logger: LoggerService,
        @Optional() private metrics?: MetricsService
    ) {}
    
    send_email(to: string, subject: string) {
        this.logger.log(`Sending email to ${to}: ${subject}`)
        
        // Metrics service might not be available
        this.metrics?.increment('emails_sent')
    }
}

@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        private email: EmailService
    ) {}
    
    create_user(name: string, email_address: string) {
        this.db.connect()
        console.log(`Creating user: ${name}`)
        
        this.email.send_email(email_address, 'Welcome!')
        
        return { id: Date.now(), name, email: email_address }
    }
}

// Module to group related services
@TpModule({
    providers: [
        LoggerService,
        DatabaseService,
        EmailService,
        UserService
    ]
})
class UserModule {}

async function main() {
    console.log('=== Decorators Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        // Register custom tokens with values
        .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/myapp' })
        .import({ provide: MAX_RETRIES, useValue: 3 })
        
        // Import the module (which includes all its providers)
        .import(UserModule)
        
        // Import optional service separately
        .import(MetricsService)
    
    await platform.start()
    
    console.log('1. Testing service with injected tokens:')
    const userService = platform.expose(UserService)
    if (!userService) {
        throw new Error('UserService not found')
    }
    
    const user1 = userService.create_user('Alice', 'alice@example.com')
    const user2 = userService.create_user('Bob', 'bob@example.com')
    
    console.log('\nCreated users:', [user1, user2])
    
    console.log('\n2. Testing lifecycle hooks during shutdown:')
    await platform.terminate()
    
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 