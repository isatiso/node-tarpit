import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, Inject, Optional } from '@tarpit/core'

// Example demonstrating dependency injection best practices

// 1. Use interfaces for abstraction
interface IEmailService {
    send(to: string, message: string): void
}

interface IStorageService {
    save(key: string, data: any): Promise<void>
    load(key: string): Promise<any>
}

// Tokens for interfaces
const EMAIL_SERVICE = Symbol('EMAIL_SERVICE')
const STORAGE_SERVICE = Symbol('STORAGE_SERVICE')

// Implementations
@TpService()
class EmailService implements IEmailService {
    send(to: string, message: string) {
        console.log(`Email sent to ${to}: ${message}`)
    }
}

@TpService()
class FileStorageService implements IStorageService {
    async save(key: string, data: any) {
        console.log(`Saving ${key} to file storage`)
    }
    
    async load(key: string) {
        console.log(`Loading ${key} from file storage`)
        return null
    }
}

// ✅ Good - Constructor injection with interface abstraction
@TpService()
class UserService {
    constructor(
        @Inject(EMAIL_SERVICE) private emailService: IEmailService,
        @Inject(STORAGE_SERVICE) private storageService: IStorageService
    ) {}
    
    async create_user(name: string, email: string) {
        const user = { id: Date.now(), name, email }
        
        // Save user data
        await this.storageService.save(`user_${user.id}`, user)
        
        // Send welcome email
        this.emailService.send(email, `Welcome ${name}!`)
        
        return user
    }
}

// ❌ Example of what to avoid - Manual dependency creation
class BadUserService {
    private emailService = new EmailService() // Avoid manual creation
    private storageService = new FileStorageService() // Hard to test/mock
    
    create_user(name: string, email: string) {
        // This approach makes testing difficult
        return { id: Date.now(), name, email }
    }
}

// ✅ Good - Handling optional dependencies
@TpService()
class NotificationService {
    constructor(
        @Inject(EMAIL_SERVICE) private emailService: IEmailService,
        @Optional() private smsService?: any // Optional dependency
    ) {}
    
    send_notification(to: string, message: string) {
        // Always send email
        this.emailService.send(to, message)
        
        // Send SMS only if service is available
        if (this.smsService) {
            console.log(`SMS sent to ${to}: ${message}`)
        }
    }
}

// ✅ Good - Circular dependency solution with Optional
@TpService()
class ServiceB {
    // No circular dependency - ServiceB doesn't inject ServiceA
    help_with_task() {
        console.log('ServiceB helping with task')
    }
}

@TpService()
class ServiceA {
    constructor(@Optional() private serviceB?: ServiceB) {}
    
    do_something() {
        console.log('ServiceA doing work')
        this.serviceB?.help_with_task()
    }
}

async function main() {
    console.log('=== Best Practices Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        // Register interfaces with implementations
        .import({ provide: EMAIL_SERVICE, useClass: EmailService })
        .import({ provide: STORAGE_SERVICE, useClass: FileStorageService })
        
        // Register services
        .import(UserService)
        .import(NotificationService)
        .import(ServiceB)
        .import(ServiceA)
    
    await platform.start()
    
    console.log('1. Testing interface-based injection:')
    const userService = platform.expose(UserService)
    if (!userService) {
        throw new Error('UserService not found')
    }
    
    const user = await userService.create_user('Alice', 'alice@example.com')
    console.log('Created user:', user)
    
    console.log('\n2. Testing optional dependencies:')
    const notificationService = platform.expose(NotificationService)
    if (!notificationService) {
        throw new Error('NotificationService not found')
    }
    
    notificationService.send_notification('alice@example.com', 'Your account is ready!')
    
    console.log('\n3. Testing circular dependency solution:')
    const serviceA = platform.expose(ServiceA)
    if (!serviceA) {
        throw new Error('ServiceA not found')
    }
    
    serviceA.do_something()
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 