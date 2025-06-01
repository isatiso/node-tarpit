import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { 
    RabbitmqModule, 
    TpProducer, 
    TpConsumer, 
    Enqueue, 
    Publish, 
    Consume, 
    RabbitMessage,
    RabbitDefine,
    RabbitDefineToken
} from '@tarpit/rabbitmq'

// Define message topology
const message_topology = new RabbitDefine()
    .define_exchange('user.events', 'topic', { durable: true })
    .define_queue('user.notifications', { durable: true })
    .define_queue('user.events.created', { durable: true })
    .define_queue('user.events.updated', { durable: true })
    .bind_queue('user.events', 'user.events.created', 'user.created')
    .bind_queue('user.events', 'user.events.updated', 'user.updated')

// User data interfaces
interface User {
    id: string
    email: string
    name: string
    created_at: Date
    updated_at: Date
}

interface UserCreatedEvent {
    user_id: string
    email: string
    name: string
    created_at: Date
}

interface UserUpdatedEvent {
    user_id: string
    changes: Record<string, any>
    updated_at: Date
}

interface NotificationMessage {
    user_id: string
    title: string
    content: string
    timestamp: Date
}

// Email service for notifications
@TpService()
class EmailService {
    async send_email(to: string, subject: string, body: string) {
        console.log(`📧 Sending email to ${to}`)
        console.log(`   Subject: ${subject}`)
        console.log(`   Body: ${body}`)
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log(`✅ Email sent successfully`)
    }
}

// Message producers
@TpProducer({
    providers: [
        { provide: RabbitDefineToken, useValue: message_topology, multi: true }
    ]
})
class UserProducer {
    
    @Publish('user.events', 'user.created')
    async user_created(event: UserCreatedEvent) {
        console.log(`📤 Publishing user.created event for user ${event.user_id}`)
        return event
    }
    
    @Publish('user.events', 'user.updated')
    async user_updated(event: UserUpdatedEvent) {
        console.log(`📤 Publishing user.updated event for user ${event.user_id}`)
        return event
    }
}

@TpProducer({
    providers: [
        { provide: RabbitDefineToken, useValue: message_topology, multi: true }
    ]
})
class NotificationProducer {
    
    @Enqueue('user.notifications')
    async send_notification(message: NotificationMessage) {
        console.log(`📬 Sending notification to user ${message.user_id}: ${message.title}`)
        return message
    }
}

// User management service
@TpService()
class UserService {
    
    constructor(
        private user_producer: UserProducer,
        private notification_producer: NotificationProducer
    ) {}
    
    async create_user(user_data: { email: string, name: string }): Promise<User> {
        const user: User = {
            id: this.generate_id(),
            email: user_data.email,
            name: user_data.name,
            created_at: new Date(),
            updated_at: new Date()
        }
        
        console.log(`👤 Creating user: ${user.name} (${user.email})`)
        
        // Publish user created event
        await this.user_producer.user_created({
            user_id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at
        })
        
        // Send welcome notification
        await this.notification_producer.send_notification({
            user_id: user.id,
            title: 'Welcome to Tarpit!',
            content: `Hello ${user.name}, welcome to our platform!`,
            timestamp: new Date()
        })
        
        return user
    }
    
    async update_user(user_id: string, changes: Record<string, any>): Promise<void> {
        console.log(`📝 Updating user ${user_id}:`, changes)
        
        // Publish user updated event
        await this.user_producer.user_updated({
            user_id,
            changes,
            updated_at: new Date()
        })
        
        // Send update notification if email changed
        if (changes.email) {
            await this.notification_producer.send_notification({
                user_id,
                title: 'Email Updated',
                content: `Your email has been updated to ${changes.email}`,
                timestamp: new Date()
            })
        }
    }
    
    private generate_id(): string {
        return Math.random().toString(36).substring(2, 15)
    }
}

// Message consumers
@TpConsumer({
    providers: [
        EmailService,
        { provide: RabbitDefineToken, useValue: message_topology, multi: true }
    ]
})
class UserEventConsumer {
    
    constructor(private email_service: EmailService) {}
    
    @Consume('user.events.created', { prefetch: 5 })
    async handle_user_created(message: RabbitMessage<UserCreatedEvent>) {
        if (!message.data) {
            console.log('❌ Received message without data')
            return
        }
        
        const { user_id, email, name } = message.data
        
        console.log(`📥 Processing user.created event for ${user_id}`)
        
        // Initialize user profile
        await this.initialize_user_profile(user_id)
        
        // Send welcome email
        await this.email_service.send_email(
            email,
            'Welcome to Tarpit!',
            `Hello ${name}, welcome to our platform. Your account is ready to use.`
        )
        
        console.log(`✅ User created event processed for ${user_id}`)
    }
    
    @Consume('user.events.updated', { prefetch: 5 })
    async handle_user_updated(message: RabbitMessage<UserUpdatedEvent>) {
        if (!message.data) {
            console.log('❌ Received message without data')
            return
        }
        
        const { user_id, changes } = message.data
        
        console.log(`📥 Processing user.updated event for ${user_id}`)
        
        // Update search index
        await this.update_search_index(user_id, changes)
        
        // Update analytics
        await this.update_analytics(user_id, changes)
        
        console.log(`✅ User updated event processed for ${user_id}`)
    }
    
    private async initialize_user_profile(user_id: string) {
        console.log(`   🔧 Initializing profile for user ${user_id}`)
        // Simulate profile initialization
        await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    private async update_search_index(user_id: string, changes: Record<string, any>) {
        console.log(`   🔍 Updating search index for user ${user_id}`)
        // Simulate search index update
        await new Promise(resolve => setTimeout(resolve, 30))
    }
    
    private async update_analytics(user_id: string, changes: Record<string, any>) {
        console.log(`   📊 Updating analytics for user ${user_id}`)
        // Simulate analytics update
        await new Promise(resolve => setTimeout(resolve, 20))
    }
}

@TpConsumer({
    providers: [
        EmailService,
        { provide: RabbitDefineToken, useValue: message_topology, multi: true }
    ]
})
class NotificationConsumer {
    
    constructor(private email_service: EmailService) {}
    
    @Consume('user.notifications', { prefetch: 10 })
    async handle_notification(message: RabbitMessage<NotificationMessage>) {
        if (!message.data) {
            console.log('❌ Received notification message without data')
            return
        }
        
        const { user_id, title, content } = message.data
        
        console.log(`📥 Processing notification for user ${user_id}: ${title}`)
        
        // For demo purposes, we'll assume we have user email lookup
        const user_email = `user-${user_id}@example.com`
        
        // Send email notification
        await this.email_service.send_email(user_email, title, content)
        
        console.log(`✅ Notification processed for user ${user_id}`)
    }
}

// Demo runner
@TpService()
class DemoRunner {
    
    constructor(private user_service: UserService) {}
    
    async run_demo() {
        console.log('\n=== RabbitMQ Producer/Consumer Demo ===\n')
        
        console.log('Starting demo in 3 seconds...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        try {
            // Create users
            const user1 = await this.user_service.create_user({
                email: 'alice@example.com',
                name: 'Alice Johnson'
            })
            
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const user2 = await this.user_service.create_user({
                email: 'bob@example.com', 
                name: 'Bob Smith'
            })
            
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Update users
            await this.user_service.update_user(user1.id, {
                email: 'alice.j@example.com',
                name: 'Alice Johnson-Smith'
            })
            
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            await this.user_service.update_user(user2.id, {
                name: 'Robert Smith'
            })
            
            console.log('\n✅ Demo completed successfully!')
            console.log('Check the logs above to see the message flow.')
            
        } catch (error) {
            console.error('❌ Demo failed:', error)
        }
    }
}

async function main() {
    console.log('=== Tarpit RabbitMQ Basic Example ===\n')
    
    const config = load_config<TpConfigSchema>({
        rabbitmq: {
            url: 'amqp://user:password@10.11.11.3:5672',
            prefetch: 20,
            timeout: 10000
        }
    })
    
    const platform = new Platform(config)
        .import(RabbitmqModule)
        .import(EmailService)
        .import(UserService)
        .import(UserProducer)
        .import(NotificationProducer)
        .import(UserEventConsumer)
        .import(NotificationConsumer)
        .import(DemoRunner)
    
    try {
        console.log('🚀 Starting platform...')
        await platform.start()
        console.log('✅ Platform started successfully')
        
        console.log('🔗 Connected to RabbitMQ at 10.11.11.3:5672')
        
        // Run the demo
        const demo_runner = platform.expose(DemoRunner)!
        await demo_runner.run_demo()
        
        // Keep the application running for a bit to process all messages
        console.log('\n⏱️  Waiting for message processing to complete...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
    } catch (error) {
        console.error('❌ Application failed:', error)
    } finally {
        console.log('\n🛑 Stopping platform...')
        await platform.terminate()
        console.log('✅ Platform stopped')
        process.exit(0)
    }
}

if (require.main === module) {
    main().catch(console.error)
} 