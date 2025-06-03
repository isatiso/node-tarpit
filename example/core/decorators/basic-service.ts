import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

@TpService()
class UserService {
    private users: User[] = []
    
    create_user(name: string): User {
        const user = { id: Date.now(), name }
        this.users.push(user)
        console.log(`Created user: ${name}`)
        return user
    }
    
    find_user(id: number): User | undefined {
        const user = this.users.find(u => u.id === id)
        console.log(`Found user: ${user ? user.name : 'not found'}`)
        return user
    }
    
    list_users(): User[] {
        console.log(`Total users: ${this.users.length}`)
        return this.users
    }
}

@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${new Date().toISOString()}: ${message}`)
    }
    
    error(message: string) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`)
    }
}

// Service with dependency injection
@TpService()
class EmailService {
    constructor(private logger: LoggerService) {}
    
    send_email(to: string, subject: string, body: string) {
        this.logger.log(`Sending email to ${to}`)
        console.log(`Email sent: ${subject}`)
        // Simulate email sending
        return { success: true, message_id: `msg_${Date.now()}` }
    }
}

interface User {
    id: number
    name: string
}

async function demonstrate_basic_services() {
    console.log('=== Basic Service Decorators Example ===')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(LoggerService)
        .import(UserService)
        .import(EmailService)
    
    await platform.start()
    
    console.log('\n1. Using UserService:')
    const user_service = platform.expose(UserService)
    if (!user_service) {
        throw new Error('UserService not found')
    }
    
    user_service.create_user('Alice')
    user_service.create_user('Bob')
    user_service.list_users()
    
    console.log('\n2. Using EmailService (with dependency injection):')
    const email_service = platform.expose(EmailService)
    if (!email_service) {
        throw new Error('EmailService not found')
    }
    
    email_service.send_email('alice@example.com', 'Welcome!', 'Welcome to our platform!')
    
    await platform.terminate()
    console.log('\n=== Basic services example completed ===')
}

if (require.main === module) {
    demonstrate_basic_services().catch(console.error)
} 