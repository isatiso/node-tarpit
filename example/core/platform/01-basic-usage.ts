import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpModule } from '@tarpit/core'

// Example services for demonstration
@TpService()
class DatabaseService {
    query(sql: string) {
        console.log(`DatabaseService: Executing query: ${sql}`)
        return { affected_rows: 1, result: 'success' }
    }
}

@TpService()
class EmailService {
    send_email(to: string, subject: string) {
        console.log(`EmailService: Sending email to ${to} with subject: ${subject}`)
        return { message_id: `msg_${Date.now()}` }
    }
}

@TpService()
class NotificationService {
    send_notification(message: string) {
        console.log(`NotificationService: Sending notification: ${message}`)
        return { notification_id: `notif_${Date.now()}` }
    }
}

@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
    
    create_user(name: string) {
        console.log(`UserService: Creating user: ${name}`)
        const result = this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        console.log(`UserService: User created successfully`)
        return { id: Date.now(), name, created: true }
    }
}

@TpModule({
    providers: [DatabaseService, UserService]
})
class UserModule {}

async function demonstrate_basic_platform_usage() {
    console.log('=== Basic Platform Usage ===\n')
    
    // Creating a Platform
    console.log('1. Creating platform with configuration...')
    const config = load_config<TpConfigSchema>({
        name: 'my-app',
        version: '1.0.0',
        // debug: process.env.NODE_ENV === 'development'
    })
    console.log('✓ Platform configuration loaded')
    
    const platform = new Platform(config)
    console.log('✓ Platform instance created')
    
    // Importing Modules and Services
    console.log('\n2. Importing services and modules...')
    platform
        .import(DatabaseService)      // Import individual service
        .import(UserModule)           // Import entire module
        .import(EmailService)         // Import each service individually
        .import(NotificationService)  // import() doesn't support arrays
    
    console.log('✓ Services and modules imported')
    
    // Starting the Application
    console.log('\n3. Starting the platform...')
    await platform.start()
    console.log('✓ Platform started successfully')
    
    // Access services after startup
    console.log('\n4. Using services...')
    const userService = platform.expose(UserService)
    const emailService = platform.expose(EmailService)
    const notificationService = platform.expose(NotificationService)
    
    if (userService) {
        const result = userService.create_user('Alice')
        console.log('User creation result:', result)
    }
    
    if (emailService) {
        const emailResult = emailService.send_email('alice@example.com', 'Welcome!')
        console.log('Email result:', emailResult)
    }
    
    if (notificationService) {
        const notifResult = notificationService.send_notification('New user registered')
        console.log('Notification result:', notifResult)
    }
    
    // Graceful shutdown
    console.log('\n5. Shutting down platform...')
    await platform.terminate()
    console.log('✓ Platform terminated gracefully')
    
    console.log('\n=== Basic Platform Usage Complete ===')
}

async function main() {
    await demonstrate_basic_platform_usage()
}

if (require.main === module) {
    main().catch(console.error)
} 