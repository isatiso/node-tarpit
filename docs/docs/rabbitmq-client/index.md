---
sidebar_position: 1
---

# RabbitMQ Client

:::info Working Examples
See [RabbitMQ examples](https://github.com/isatiso/node-tarpit/blob/main/example/rabbitmq/) for complete working examples.
:::

Tarpit RabbitMQ module provides a powerful message queue client with dependency injection support, built on top of the popular `amqplib` library. It offers decorators for publishers and consumers, automatic connection management, and message acknowledgment strategies.

## Features

- **Decorative API**: Use `@Publish`, `@Enqueue`, and `@Consume` decorators
- **Automatic Connection Management**: Built-in connection pooling and reconnection
- **Message Acknowledgment**: Support for ack, nack, requeue, and kill operations
- **Exchange & Queue Definition**: Declarative topology management
- **Error Handling**: Structured error handling with retry strategies
- **Type Safety**: Full TypeScript support with type-safe message handling

## Quick Start

### Installation

```typescript
import { RabbitmqModule } from '@tarpit/rabbitmq'
import { Platform } from '@tarpit/core'

const platform = new Platform(config)
    .import(RabbitmqModule)
    .import(YourMessageHandlers)
```

### Configuration

```typescript
// config.ts
export default {
    rabbitmq: {
        url: 'amqp://user:password@localhost:5672',
        // or object format:
        // url: {
        //     hostname: 'localhost',
        //     port: 5672,
        //     username: 'user',
        //     password: 'password',
        //     vhost: '/'
        // },
        timeout: 5000,
        prefetch: 20,
        socket_options: {}
    }
}
```

## Architecture

The RabbitMQ module consists of several key components:

### Core Components

1. **RabbitClient**: Main connection management
2. **RabbitDefine**: Exchange and queue topology definition
3. **Producers**: Message publishing (`@Publish`, `@Enqueue`)
4. **Consumers**: Message consumption (`@Consume`)
5. **Message Handling**: Acknowledgment and error strategies

### Message Flow

```
Publisher (@Publish/@Enqueue) → Exchange/Queue → Consumer (@Consume) → Message Handler
                                                                    ↓
                                               Ack/Nack/Requeue/Kill Decision
```

## Decorators Overview

| Decorator | Purpose | Usage |
|-----------|---------|-------|
| `@Publish` | Publish to exchange with routing key | `@Publish('my.exchange', 'routing.key')` |
| `@Enqueue` | Send directly to queue | `@Enqueue('my.queue')` |
| `@Consume` | Consume messages from queue | `@Consume('my.queue', options)` |
| `@TpProducer` | Producer class decorator | `@TpProducer({ providers: [...] })` |
| `@TpConsumer` | Consumer class decorator | `@TpConsumer({ providers: [...] })` |

## Basic Usage Example

### Producer

```typescript
import { TpProducer, Publish, Enqueue } from '@tarpit/rabbitmq'

@TpProducer()
class UserEventProducer {
    
    @Publish('user.events', 'user.created')
    async publish_user_created(user_data: { id: string, name: string, email: string }) {
        return {
            event: 'user.created',
            timestamp: new Date().toISOString(),
            data: user_data
        }
    }
    
    @Enqueue('user.notifications')
    async send_notification(notification: { user_id: string, message: string }) {
        return {
            type: 'notification',
            ...notification
        }
    }
}
```

### Consumer

```typescript
import { TpConsumer, Consume, RabbitMessage, ack_message, requeue_message } from '@tarpit/rabbitmq'

@TpConsumer()
class UserEventConsumer {
    
    @Consume('user.notifications', { prefetch: 5 })
    async handle_notification(msg: RabbitMessage<{ user_id: string, message: string }>) {
        try {
            const { user_id, message } = msg.content
            
            // Process notification
            await this.send_email_notification(user_id, message)
            
            // Acknowledge message
            ack_message()
            
        } catch (error) {
            console.error('Failed to process notification:', error)
            
            // Requeue for retry
            requeue_message()
        }
    }
    
    private async send_email_notification(user_id: string, message: string) {
        // Email sending logic
    }
}
```

## Message Acknowledgment

The module provides multiple ways to handle message acknowledgment:

```typescript
// Automatic acknowledgment (success)
return result

// Manual acknowledgment
ack_message()

// Requeue message
requeue_message()

// Kill message (dead letter)
kill_message()

// Using exceptions
throw new Ack()
throw new MessageRequeue({ code: 'RETRY', msg: 'Temporary failure' })
throw new MessageDead({ code: 'FATAL', msg: 'Permanent failure' })
```

## Exchange and Queue Management

Define your message topology using `RabbitDefine`:

```typescript
import { RabbitDefine } from '@tarpit/rabbitmq'

const rabbit_define = new RabbitDefine()
    .define_exchange('user.events', 'topic', { durable: true })
    .define_queue('user.notifications', { durable: true })
    .bind_queue('user.events', 'user.notifications', 'user.created')

// Register in your platform
const platform = new Platform(config)
    .import(RabbitmqModule)
    .import(rabbit_define)
    .start()
```

## Advanced Configuration

### Connection Options

```typescript
const config = {
    rabbitmq: {
        url: 'amqp://localhost:5672',
        timeout: 10000,
        prefetch: 50,
        socket_options: {
            heartbeat: 60,
            connection_timeout: 30000
        },
        retry: {
            max_attempts: 5,
            delay: 1000,
            exponential_backoff: true
        }
    }
}
```

### Consumer Options

```typescript
@Consume('my.queue', {
    prefetch: 10,           // Number of unacknowledged messages
    no_ack: false,          // Automatic acknowledgment
    exclusive: false,       // Exclusive consumer
    priority: 0,            // Consumer priority
    arguments: {}           // Additional arguments
})
async handle_message(msg: RabbitMessage) {
    // Message handling logic
}
```

## Error Handling

### Connection Errors

The module automatically handles connection errors with exponential backoff:

```typescript
// Built-in reconnection handling
// - Detects connection loss
// - Implements exponential backoff
// - Recreates channels and consumers
// - Logs connection events
```

### Message Processing Errors

Handle errors in message processing:

```typescript
@Consume('orders.processing')
async process_order(msg: RabbitMessage<Order>) {
    try {
        await this.order_service.process(msg.content)
        ack_message()
    } catch (error) {
        if (error instanceof ValidationError) {
            // Don't retry invalid messages
            kill_message()
        } else if (error instanceof NetworkError) {
            // Retry network errors
            requeue_message()
        } else {
            // Unknown error - log and kill
            console.error('Unknown error:', error)
            kill_message()
        }
    }
}
```

## Best Practices

### 1. Use Durable Exchanges and Queues

```typescript
// ✅ Good - Durable setup for production
const rabbit_define = new RabbitDefine()
    .define_exchange('user.events', 'topic', { 
        durable: true,           // Survive broker restart
        auto_delete: false       // Don't delete when unused
    })
    .define_queue('user.notifications', { 
        durable: true,           // Survive broker restart
        arguments: {
            'x-message-ttl': 86400000  // 24 hour TTL
        }
    })
```

### 2. Set Appropriate Prefetch Values

```typescript
// ✅ Good - Balanced prefetch for throughput
@Consume('heavy.processing', { prefetch: 1 })  // CPU intensive
async process_heavy_task(msg: RabbitMessage) {}

@Consume('light.processing', { prefetch: 20 }) // Light processing
async process_light_task(msg: RabbitMessage) {}
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good - Comprehensive error handling
@Consume('user.events')
async handle_user_event(msg: RabbitMessage<UserEvent>) {
    try {
        const result = await this.process_event(msg.content)
        
        // Success - acknowledge
        ack_message()
        return result
        
    } catch (error) {
        if (this.is_retryable_error(error)) {
            // Temporary error - requeue
            requeue_message()
        } else {
            // Permanent error - dead letter
            console.error('Permanent error:', error)
            kill_message()
        }
    }
}
```

### 4. Use Type-Safe Messages

```typescript
// ✅ Good - Type-safe message handling
interface UserCreatedEvent {
    user_id: string
    email: string
    created_at: string
}

@Consume('user.events')
async handle_user_created(msg: RabbitMessage<UserCreatedEvent>) {
    const { user_id, email, created_at } = msg.content // Type-safe access
    
    // Process with full type safety
    await this.welcome_email_service.send(email, user_id)
    ack_message()
}
```

## Integration with Other Modules

### HTTP Triggered Publishing

```typescript
import { TpRouter, Post, JsonBody } from '@tarpit/http'
import { TpProducer, Publish } from '@tarpit/rabbitmq'

@TpRouter('/api')
@TpProducer()
class ApiController {
    
    @Post('users')
    @Publish('user.events', 'user.created')
    async create_user(body: JsonBody<{ name: string, email: string }>) {
        const user = await this.user_service.create(body.data)
        
        // This will be published to RabbitMQ
        return {
            event: 'user.created',
            user
        }
    }
}
```

### Scheduled Message Processing

```typescript
import { Task, TaskContext } from '@tarpit/schedule'
import { TpProducer, Enqueue } from '@tarpit/rabbitmq'

@TpProducer()
class ScheduledProducer {
    
    @Task('0 0 9 * * *', 'daily_reports')
    @Enqueue('report.generation')
    async schedule_daily_reports(context: TaskContext) {
        return {
            type: 'daily_report',
            date: new Date().toISOString(),
            scheduled_by: 'cron'
        }
    }
}
```

## Performance Considerations

### Connection Management

- **Single Connection**: Use one connection with multiple channels
- **Channel Pooling**: Automatic channel creation and management
- **Heartbeat**: Configure appropriate heartbeat intervals

### Message Throughput

- **Prefetch Tuning**: Balance between throughput and memory usage
- **Batch Processing**: Process multiple messages efficiently
- **Confirm Channels**: Use publisher confirms for reliability

### Memory Management

- **Message Size**: Monitor and limit message payload sizes
- **Queue Depth**: Implement monitoring for queue depths
- **Consumer Scaling**: Scale consumers based on queue depth

## Next Steps

- Explore the [examples repository](https://github.com/isatiso/node-tarpit/tree/main/example/rabbitmq) for real-world patterns
- Learn about message topology design and best practices
- Understand error handling and retry strategies
- Integrate with other Tarpit modules for complete applications 