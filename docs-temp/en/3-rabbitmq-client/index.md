---
layout: default
title: RabbitMQ Client
nav_order: 4
has_children: true
---

# RabbitMQ Client

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
const rabbit_define = new RabbitDefine()
    .define_exchange('user.events', 'topic', { durable: true })
    .define_queue('user.notifications', { durable: true })
    .bind_queue('user.events', 'user.notifications', 'user.created')
```

## Error Handling

The module includes built-in error handling and retry strategies:

- **Connection Errors**: Automatic reconnection with exponential backoff
- **Channel Errors**: Channel recreation and message redelivery
- **Consumer Errors**: Configurable error handling (ack/nack/requeue/kill)
- **Message Validation**: Integration with content-type validation

## Examples

This documentation includes comprehensive examples covering:

- [Basic Producer/Consumer](./1-basic-usage.md)
- [Exchange and Queue Management](./2-topology.md)
- [Message Acknowledgment](./3-acknowledgment.md)
- [Error Handling](./4-error-handling.md)
- [Advanced Patterns](./5-advanced-patterns.md)

## Best Practices

1. **Use Durable Exchanges and Queues** for persistent messaging
2. **Set Appropriate Prefetch** values for consumer throughput
3. **Handle Errors Gracefully** with proper acknowledgment strategies
4. **Define Topology Declaratively** using `RabbitDefine`
5. **Monitor Connection Health** using built-in events
6. **Use Type-Safe Messages** with content-type validation

## Integration

The RabbitMQ module integrates seamlessly with other Tarpit modules:

- **Core Module**: Dependency injection and lifecycle management
- **Content-Type Module**: Message serialization and validation
- **Schedule Module**: Delayed message processing
- **HTTP Module**: HTTP-triggered message publishing

## Performance Considerations

- **Connection Pooling**: Single connection with multiple channels
- **Prefetch Control**: Configure consumer prefetch for optimal throughput
- **Message Batching**: Use confirm channels for high-throughput publishing
- **Memory Management**: Automatic message buffering and flow control
