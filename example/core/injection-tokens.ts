import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, Inject } from '@tarpit/core'

// Example demonstrating injection tokens usage

// 1. Type-based injection (implicit tokens)
@TpService()
class EmailService {
    send(to: string, message: string) {
        console.log(`Sending email to ${to}: ${message}`)
    }
}

@TpService()
class UserService {
    // EmailService class is used as the injection token
    constructor(private emailService: EmailService) {}
    
    notify_user(email: string, message: string) {
        this.emailService.send(email, message)
    }
}

// 2. Token-based injection (explicit tokens)
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_CONNECTIONS = Symbol('MAX_CONNECTIONS')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_CONNECTIONS) private maxConnections: number
    ) {}
    
    connect() {
        console.log(`Connecting to database: ${this.url}`)
        console.log(`Max connections: ${this.maxConnections}`)
    }
}

async function main() {
    console.log('=== Injection Tokens Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        // Register services with class tokens (implicit)
        .import(EmailService)
        .import(UserService)
        
        // Register values with symbol tokens (explicit)
        .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/mydb' })
        .import({ provide: MAX_CONNECTIONS, useValue: 10 })
        .import(DatabaseService)
    
    await platform.start()
    
    console.log('1. Testing type-based injection:')
    const userService = platform.expose(UserService)
    if (!userService) {
        throw new Error('UserService not found')
    }
    
    userService.notify_user('user@example.com', 'Welcome to our platform!')
    
    console.log('\n2. Testing token-based injection:')
    const dbService = platform.expose(DatabaseService)
    if (!dbService) {
        throw new Error('DatabaseService not found')
    }
    
    dbService.connect()
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 