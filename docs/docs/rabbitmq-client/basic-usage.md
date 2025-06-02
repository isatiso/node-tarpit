# Basic Usage

This guide covers the fundamental concepts and usage patterns of the Tarpit RabbitMQ module.

## Setup and Configuration

### Module Import

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { RabbitmqModule } from '@tarpit/rabbitmq'

const config = load_config<TpConfigSchema>({
    rabbitmq: {
        url: 'amqp://user:password@localhost:5672',
        prefetch: 20,
        timeout: 5000
    }
})

const platform = new Platform(config)
    .import(RabbitmqModule)
    .import(YourProducers)
    .import(YourConsumers)

await platform.start()
```

### Configuration Options

```typescript
interface RabbitMQConfig {
    // Connection URL (string or object)
    url: string | {
        protocol?: string      // Default: 'amqp'
        hostname?: string      // Default: 'localhost'
        port?: number         // Default: 5672
        username?: string     // Default: 'guest'
        password?: string     // Default: 'guest'
        vhost?: string        // Default: '/'
        locale?: string       // Default: 'en_US'
        frameMax?: number     // Default: 0x1000 (4KB)
        heartbeat?: number    // Default: 0
    }
    
    // Global prefetch count for consumers
    prefetch?: number         // Default: 20
    
    // Connection timeout in milliseconds
    timeout?: number          // Default: 1000
    
    // Additional socket options
    socket_options?: any
}
```

## Message Producers

### Direct Queue Publishing (@Enqueue)

Use `@Enqueue` to send messages directly to a queue:

```typescript
import { TpProducer, Enqueue } from '@tarpit/rabbitmq'

@TpProducer()
class NotificationProducer {
    
    @Enqueue('user.notifications')
    async send_notification(message: {
        user_id: string
        title: string
        content: string
        timestamp: Date
    }) {
        // Method body can be empty or contain additional logic
        console.log('Sending notification:', message)
    }
}
```

### Exchange Publishing (@Publish)

Use `@Publish` to publish messages to an exchange with routing keys:

```typescript
import { TpProducer, Publish } from '@tarpit/rabbitmq'

@TpProducer()
class EventProducer {
    
    @Publish('user.events', 'user.created')
    async user_created(event: {
        user_id: string
        email: string
        created_at: Date
    }) {
        console.log('Publishing user created event:', event)
    }
    
    @Publish('user.events', 'user.updated')
    async user_updated(event: {
        user_id: string
        changes: Record<string, any>
        updated_at: Date
    }) {
        console.log('Publishing user updated event:', event)
    }
}
```

## Message Consumers

### Basic Consumer

```typescript
import { TpConsumer, Consume, RabbitMessage } from '@tarpit/rabbitmq'

@TpConsumer()
class NotificationConsumer {
    
    @Consume('user.notifications', { prefetch: 10 })
    async handle_notification(message: RabbitMessage<{
        user_id: string
        title: string
        content: string
        timestamp: Date
    }>) {
        const { user_id, title, content } = message.data
        
        console.log(`Processing notification for user ${user_id}: ${title}`)
        
        // Process the notification
        await this.send_email(user_id, title, content)
        
        // Message is automatically acknowledged on success
        return true
    }
    
    private async send_email(user_id: string, title: string, content: string) {
        // Email sending logic
        console.log(`Email sent to user ${user_id}`)
    }
}
```

### Error Handling

```typescript
@TpConsumer()
class OrderConsumer {
    
    @Consume('orders.processing')
    async process_order(message: RabbitMessage<any>) {
        try {
            // Process order logic
            await this.handle_order(message.data)
            
        } catch (error) {
            console.error('Order processing failed:', error)
            
            // Return false to reject message (will be requeued)
            return false
        }
    }
    
    private async handle_order(order: any) {
        // Business logic
    }
}
```

## Using Producers in Services

```typescript
import { TpService } from '@tarpit/core'

@TpService()
class UserService {
    
    constructor(
        private notification_producer: NotificationProducer,
        private event_producer: EventProducer
    ) {}
    
    async create_user(user_data: any) {
        const user = await this.save_user(user_data)
        
        // Send notification
        await this.notification_producer.send_notification({
            user_id: user.id,
            title: 'Welcome!',
            content: 'Your account has been created',
            timestamp: new Date()
        })
        
        // Publish event
        await this.event_producer.user_created({
            user_id: user.id,
            email: user.email,
            created_at: user.created_at
        })
        
        return user
    }
    
    private async save_user(data: any) {
        // Database logic
        return { id: '123', ...data, created_at: new Date() }
    }
}
```

## Message Acknowledgment

- **Automatic ACK**: Messages are automatically acknowledged when the handler returns successfully
- **Manual NACK**: Return `false` from the handler to reject and requeue the message
- **Exceptions**: Unhandled exceptions will reject the message and requeue it

## Best Practices

1. **Use specific queue/exchange names** to avoid conflicts
2. **Handle errors gracefully** to prevent message loss
3. **Set appropriate prefetch values** based on processing capacity
4. **Use typed interfaces** for message payloads
5. **Log important events** for debugging and monitoring 