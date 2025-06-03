import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// Example demonstrating type-based (implicit) injection

@TpService()
class EmailService {
    send(to: string, message: string) {
        console.log(`Sending email to ${to}: ${message}`)
    }
}

@TpService()
class UserService {
    // EmailService class is used as the injection token
    constructor(private email: EmailService) {}
    
    notify_user(email: string, message: string) {
        this.email.send(email, message)
    }
}

async function main() {
    console.log('=== Type-Based (Implicit) Injection Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(EmailService)
        .import(UserService)
    
    await platform.start()
    
    const user_service = platform.expose(UserService)
    if (!user_service) {
        throw new Error('UserService not found')
    }
    
    user_service.notify_user('user@example.com', 'Welcome to our platform!')
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 