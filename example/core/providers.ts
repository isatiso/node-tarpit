import { load_config } from '@tarpit/config'
import { 
    Platform, 
    TpConfigSchema, 
    TpService, 
    TpConfigData,
    Inject 
} from '@tarpit/core'

// Abstract interface for email service
interface IEmailService {
    send(to: string, subject: string, body: string): Promise<void>
}

// Token for the email service interface
const EMAIL_SERVICE = Symbol('EMAIL_SERVICE')
const NOTIFICATION_SERVICE = Symbol('NOTIFICATION_SERVICE')
const STORAGE_SERVICE = Symbol('STORAGE_SERVICE')

// Email service implementations
@TpService()
class ConsoleEmailService implements IEmailService {
    async send(to: string, subject: string, body: string) {
        console.log(`[CONSOLE EMAIL] To: ${to}, Subject: ${subject}`)
        console.log(`[CONSOLE EMAIL] Body: ${body}`)
    }
}

@TpService()
class MockEmailService implements IEmailService {
    async send(to: string, subject: string, body: string) {
        console.log(`[MOCK EMAIL] Mock sending to ${to}: ${subject}`)
    }
}

// Storage services for factory provider example
interface IStorageService {
    save(key: string, data: any): Promise<void>
    load(key: string): Promise<any>
}

class MemoryStorage implements IStorageService {
    private data = new Map<string, any>()
    
    async save(key: string, data: any) {
        this.data.set(key, data)
        console.log(`[MEMORY STORAGE] Saved ${key}`)
    }
    
    async load(key: string) {
        const data = this.data.get(key)
        console.log(`[MEMORY STORAGE] Loaded ${key}:`, data)
        return data
    }
}

class FileStorage implements IStorageService {
    async save(key: string, data: any) {
        console.log(`[FILE STORAGE] Would save ${key} to file:`, data)
    }
    
    async load(key: string) {
        console.log(`[FILE STORAGE] Would load ${key} from file`)
        return null
    }
}

@TpService()
class UserService {
    constructor(
        @Inject(EMAIL_SERVICE) private emailService: IEmailService,
        @Inject(NOTIFICATION_SERVICE) private notificationService: IEmailService,
        @Inject(STORAGE_SERVICE) private storage: IStorageService
    ) {}
    
    async create_user(name: string, email: string) {
        const user = { id: Date.now(), name, email }
        
        // Save user data
        await this.storage.save(`user_${user.id}`, user)
        
        // Send welcome email
        await this.emailService.send(
            email, 
            'Welcome!', 
            `Hello ${name}, welcome to our platform!`
        )
        
        // Send notification (using different service)
        await this.notificationService.send(
            'admin@example.com',
            'New User',
            `New user registered: ${name}`
        )
        
        return user
    }
}

async function main() {
    console.log('=== Providers Example ===\n')
    
    const config = load_config<TpConfigSchema>({
        debug: true
    })
    
    // Simulate environment condition
    const isDevelopment = true
    const useMemoryStorage = true
    
    const platform = new Platform(config)
        // 1. ClassProvider - choose implementation based on condition
        .import({
            provide: EMAIL_SERVICE,
            useClass: isDevelopment ? ConsoleEmailService : MockEmailService
        })
        
        // 2. Different class for notification service
        .import({
            provide: NOTIFICATION_SERVICE,
            useClass: MockEmailService
        })
        
        // 3. FactoryProvider - create service based on condition
        .import({
            provide: STORAGE_SERVICE,
            useFactory: () => {
                if (useMemoryStorage) {
                    console.log('Creating MemoryStorage')
                    return new MemoryStorage()
                } else {
                    console.log('Creating FileStorage')
                    return new FileStorage()
                }
            }
        })
        
        // 4. ValueProvider - provide simple values
        .import({ provide: 'app-version', useValue: '1.0.0' })
        .import({ 
            provide: 'database-config', 
            useValue: { 
                host: 'localhost', 
                port: 5432, 
                database: 'myapp' 
            } 
        })
        
        .import(UserService)
    
    await platform.start()
    
    console.log('1. Testing different provider types:')
    
    const userService = platform.expose(UserService)
    if (!userService) {
        throw new Error('UserService not found')
    }
    
    // Test the service (should use providers we configured)
    await userService.create_user('Alice', 'alice@example.com')
    await userService.create_user('Bob', 'bob@example.com')
    
    console.log('\n2. Testing value providers:')
    const version = platform.expose('app-version')
    const dbConfig = platform.expose('database-config')
    
    console.log('App version:', version)
    console.log('Database config:', dbConfig)
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 