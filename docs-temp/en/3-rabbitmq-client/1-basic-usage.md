---
layout: default
title: Basic Usage
parent: RabbitMQ Client
nav_order: 1
---

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

### Using Producers

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

### Event Consumer with Routing

```typescript
@TpConsumer()
class EventConsumer {
    
    @Consume('user.events.created')
    async handle_user_created(message: RabbitMessage<{
        user_id: string
        email: string
        created_at: Date
    }>) {
        const { user_id, email } = message.data
        
        console.log(`New user created: ${user_id} (${email})`)
        
        // Initialize user profile
        await this.create_user_profile(user_id)
        
        // Send welcome email
        await this.send_welcome_email(email)
    }
    
    @Consume('user.events.updated')
    async handle_user_updated(message: RabbitMessage<{
        user_id: string
        changes: Record<string, any>
        updated_at: Date
    }>) {
        const { user_id, changes } = message.data
        
        console.log(`User updated: ${user_id}`, changes)
        
        // Update derived data
        await this.update_user_index(user_id, changes)
    }
    
    private async create_user_profile(user_id: string) {
        // Profile creation logic
    }
    
    private async send_welcome_email(email: string) {
        // Welcome email logic
    }
    
    private async update_user_index(user_id: string, changes: any) {
        // Search index update logic
    }
}
```

## Message Structure

### RabbitMessage

All consumed messages are wrapped in a `RabbitMessage` object:

```typescript
interface RabbitMessage<T = any> {
    // Parsed message data
    data: T
    
    // AMQP message properties
    properties: {
        contentType?: string
        contentEncoding?: string
        headers?: { [key: string]: any }
        deliveryMode?: number
        priority?: number
        correlationId?: string
        replyTo?: string
        expiration?: string
        messageId?: string
        timestamp?: number
        type?: string
        userId?: string
        appId?: string
        clusterId?: string
    }
    
    // AMQP message fields
    fields: {
        consumerTag: string
        deliveryTag: number
        redelivered: boolean
        exchange: string
        routingKey: string
    }
}
```

### Accessing Message Metadata

```typescript
@Consume('my.queue')
async handle_message(message: RabbitMessage<any>) {
    // Access message data
    const data = message.data
    
    // Check if message was redelivered
    if (message.fields.redelivered) {
        console.log('This message was redelivered')
    }
    
    // Access headers
    const priority = message.properties.headers?.priority
    
    // Get routing information
    const exchange = message.fields.exchange
    const routing_key = message.fields.routingKey
}
```

## Publishing Options

### Message Options

```typescript
@Enqueue('my.queue')
async send_with_options(data: any) {
    // Method-level options can be set using method parameters
}

// Or configure at call time through method injection
@TpProducer()
class MyProducer {
    
    @Enqueue('my.queue')
    async send_message(data: any, options?: {
        persistent?: boolean
        priority?: number
        expiration?: string
        headers?: Record<string, any>
    }) {
        // The second parameter can be used to pass publishing options
    }
}
```

### Publishing with Metadata

```typescript
@TpProducer()
class OrderProducer {
    
    @Publish('orders.events', 'order.created')
    async order_created(order: Order) {
        // Return additional metadata along with the message
        return {
            data: order,
            options: {
                persistent: true,
                priority: order.is_urgent ? 10 : 1,
                headers: {
                    order_type: order.type,
                    customer_tier: order.customer.tier
                }
            }
        }
    }
}
```

## Consumer Options

### Prefetch Configuration

```typescript
@TpConsumer()
class HighThroughputConsumer {
    
    // High prefetch for fast processing
    @Consume('fast.queue', { prefetch: 100 })
    async handle_fast(message: RabbitMessage<any>) {
        // Quick processing
    }
    
    // Low prefetch for slow processing
    @Consume('slow.queue', { prefetch: 1 })
    async handle_slow(message: RabbitMessage<any>) {
        // Time-consuming processing
        await this.slow_operation(message.data)
    }
    
    private async slow_operation(data: any) {
        // Simulated slow operation
        await new Promise(resolve => setTimeout(resolve, 5000))
    }
}
```

### Consumer with Dependencies

```typescript
@TpService()
class EmailService {
    async send_email(to: string, subject: string, body: string) {
        // Email implementation
    }
}

@TpConsumer({
    providers: [EmailService]
})
class NotificationConsumer {
    
    constructor(private email_service: EmailService) {}
    
    @Consume('email.notifications')
    async handle_email(message: RabbitMessage<{
        to: string
        subject: string
        body: string
    }>) {
        const { to, subject, body } = message.data
        await this.email_service.send_email(to, subject, body)
    }
}
```

## Error Handling Basics

### Automatic Acknowledgment

```typescript
@Consume('my.queue')
async handle_message(message: RabbitMessage<any>) {
    // Process successfully - message is automatically acknowledged
    await this.process_data(message.data)
    
    // Return value doesn't affect acknowledgment
    return 'success'
}
```

### Manual Error Handling

```typescript
import { kill_message, requeue_message } from '@tarpit/rabbitmq'

@Consume('my.queue')
async handle_message(message: RabbitMessage<any>) {
    try {
        await this.risky_operation(message.data)
        // Success - automatic ack
    } catch (error) {
        if (this.is_retryable(error)) {
            // Requeue for retry
            requeue_message()
        } else {
            // Permanent failure - kill message
            kill_message()
        }
    }
}

private is_retryable(error: Error): boolean {
    // Determine if error is temporary
    return error.message.includes('timeout') || 
           error.message.includes('connection')
}
```

## Testing

### Testing Producers

```typescript
import { expect } from 'chai'

describe('NotificationProducer', () => {
    let producer: NotificationProducer
    
    beforeEach(() => {
        // Setup test platform
        producer = platform.expose(NotificationProducer)!
    })
    
    it('should send notification', async () => {
        const message = {
            user_id: 'user123',
            title: 'Test',
            content: 'Test notification',
            timestamp: new Date()
        }
        
        // This will send to the test queue
        await producer.send_notification(message)
        
        // Verify message was sent (implementation depends on test setup)
    })
})
```

### Testing Consumers

```typescript
describe('NotificationConsumer', () => {
    let consumer: NotificationConsumer
    
    it('should handle notification', async () => {
        const message = {
            data: {
                user_id: 'user123',
                title: 'Test',
                content: 'Test notification',
                timestamp: new Date()
            },
            properties: {},
            fields: {
                consumerTag: 'test',
                deliveryTag: 1,
                redelivered: false,
                exchange: '',
                routingKey: 'test'
            }
        } as RabbitMessage<any>
        
        // Call handler directly
        const result = await consumer.handle_notification(message)
        
        expect(result).to.be.true
    })
})
```

## Next Steps

- [Exchange and Queue Management](./2-topology.md) - Learn about defining message topology
- [Message Acknowledgment](./3-acknowledgment.md) - Advanced acknowledgment strategies
- [Error Handling](./4-error-handling.md) - Comprehensive error handling patterns
- [Advanced Patterns](./5-advanced-patterns.md) - Complex messaging patterns 