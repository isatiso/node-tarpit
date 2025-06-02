# Exchange and Queue Management

The Tarpit RabbitMQ module provides declarative topology management through the `RabbitDefine` class. This allows you to define exchanges, queues, and their bindings before your application starts.

## Overview

Message topology in RabbitMQ consists of:
- **Exchanges**: Route messages based on routing keys
- **Queues**: Store messages for consumption
- **Bindings**: Define routing rules between exchanges and queues

## RabbitDefine Class

The `RabbitDefine` class provides a fluent API for defining your message topology:

```typescript
import { RabbitDefine, RabbitDefineToken } from '@tarpit/rabbitmq'

const topology = new RabbitDefine()
    .define_exchange('user.events', 'topic', { durable: true })
    .define_queue('user.notifications', { durable: true })
    .bind_queue('user.events', 'user.notifications', 'user.created')
```

## Exchange Types

### Topic Exchange

Best for pub/sub patterns with routing key matching:

```typescript
const topology = new RabbitDefine()
    .define_exchange('logs', 'topic', { durable: true })
    .define_queue('error.logs', { durable: true })
    .define_queue('info.logs', { durable: true })
    .bind_queue('logs', 'error.logs', 'log.error.*')
    .bind_queue('logs', 'info.logs', 'log.info.*')
```

### Direct Exchange

For exact routing key matching:

```typescript
const topology = new RabbitDefine()
    .define_exchange('tasks', 'direct', { durable: true })
    .define_queue('high.priority', { durable: true })
    .define_queue('low.priority', { durable: true })
    .bind_queue('tasks', 'high.priority', 'urgent')
    .bind_queue('tasks', 'low.priority', 'normal')
```

### Fanout Exchange

Broadcasts to all bound queues:

```typescript
const topology = new RabbitDefine()
    .define_exchange('broadcasts', 'fanout', { durable: true })
    .define_queue('all.subscribers', { durable: true })
    .define_queue('audit.log', { durable: true })
    .bind_queue('broadcasts', 'all.subscribers', '') // Empty routing key
    .bind_queue('broadcasts', 'audit.log', '')
```

## Exchange Options

```typescript
interface ExchangeOptions {
    durable?: boolean           // Survive server restart
    internal?: boolean          // Only accessible from other exchanges
    autoDelete?: boolean        // Delete when no bindings exist
    alternateExchange?: string  // Route unroutable messages
    arguments?: any            // Custom exchange arguments
}

// Example with all options
const topology = new RabbitDefine()
    .define_exchange('main.events', 'topic', {
        durable: true,
        autoDelete: false,
        alternateExchange: 'fallback.exchange',
        arguments: {
            'x-max-length': 10000
        }
    })
```

## Queue Options

```typescript
interface QueueOptions {
    exclusive?: boolean         // Only accessible by this connection
    durable?: boolean          // Survive server restart
    autoDelete?: boolean       // Delete when no consumers
    messageTtl?: number        // Message TTL in milliseconds
    expires?: number           // Queue expiry time
    deadLetterExchange?: string // Dead letter routing
    deadLetterRoutingKey?: string
    maxLength?: number         // Maximum queue size
    maxPriority?: number       // Message priority levels
    arguments?: any           // Custom queue arguments
}

// Example with options
const topology = new RabbitDefine()
    .define_queue('user.tasks', {
        durable: true,
        messageTtl: 3600000,    // 1 hour TTL
        maxLength: 1000,
        deadLetterExchange: 'failed.tasks',
        deadLetterRoutingKey: 'failed'
    })
```

## Using Topology in Applications

Register topology with your producers and consumers:

```typescript
import { RabbitDefine, RabbitDefineToken } from '@tarpit/rabbitmq'

const ecommerce_topology = new RabbitDefine()
    .define_exchange('ecommerce.events', 'topic', { durable: true })
    .define_queue('orders.created', { durable: true })
    .bind_queue('ecommerce.events', 'orders.created', 'order.created')

@TpProducer({
    providers: [
        { provide: RabbitDefineToken, useValue: ecommerce_topology, multi: true }
    ]
})
class OrderProducer {
    
    @Publish('ecommerce.events', 'order.created')
    async order_created(order: Order) {
        return order
    }
}

@TpConsumer({
    providers: [
        { provide: RabbitDefineToken, useValue: ecommerce_topology, multi: true }
    ]
})
class OrderConsumer {
    
    @Consume('orders.created')
    async handle_order_created(message: RabbitMessage<Order>) {
        // Process order
    }
}
```

## Complex Topology Example

```typescript
// Define a complete e-commerce message topology
const ecommerce_topology = new RabbitDefine()
    // Main business events exchange
    .define_exchange('ecommerce.events', 'topic', { durable: true })
    
    // Dead letter exchange for failed messages
    .define_exchange('ecommerce.failed', 'direct', { durable: true })
    
    // Order processing queues
    .define_queue('orders.created', { 
        durable: true,
        deadLetterExchange: 'ecommerce.failed',
        deadLetterRoutingKey: 'orders.failed'
    })
    .define_queue('orders.paid', { durable: true })
    .define_queue('orders.shipped', { durable: true })
    
    // Inventory management
    .define_queue('inventory.updates', { 
        durable: true,
        maxPriority: 10
    })
    
    // Notification queues
    .define_queue('notifications.email', { durable: true })
    .define_queue('notifications.sms', { durable: true })
    
    // Analytics and reporting
    .define_queue('analytics.events', { 
        durable: true,
        messageTtl: 86400000  // 24 hours
    })
    
    // Failed message handling
    .define_queue('failed.orders', { durable: true })
    
    // Bind order events
    .bind_queue('ecommerce.events', 'orders.created', 'order.created')
    .bind_queue('ecommerce.events', 'orders.paid', 'order.paid')
    .bind_queue('ecommerce.events', 'orders.shipped', 'order.shipped')
    
    // Bind inventory events
    .bind_queue('ecommerce.events', 'inventory.updates', 'inventory.*')
    
    // Bind notification events
    .bind_queue('ecommerce.events', 'notifications.email', 'notification.email.*')
    .bind_queue('ecommerce.events', 'notifications.sms', 'notification.sms.*')
    
    // Bind analytics (catch all)
    .bind_queue('ecommerce.events', 'analytics.events', '#')
    
    // Failed message handling
    .bind_queue('ecommerce.failed', 'failed.orders', 'orders.failed')
```

## Dead Letter Exchanges

Handle failed message processing:

```typescript
const topology = new RabbitDefine()
    // Main processing exchange
    .define_exchange('main.processing', 'direct', { durable: true })
    
    // Dead letter exchange
    .define_exchange('failed.processing', 'direct', { durable: true })
    
    // Main queue with dead letter configuration
    .define_queue('main.tasks', {
        durable: true,
        deadLetterExchange: 'failed.processing',
        deadLetterRoutingKey: 'failed',
        messageTtl: 300000  // 5 minutes before moving to DLX
    })
    
    // Dead letter queue
    .define_queue('failed.tasks', { durable: true })
    
    .bind_queue('main.processing', 'main.tasks', 'process')
    .bind_queue('failed.processing', 'failed.tasks', 'failed')

@TpConsumer()
class TaskProcessor {
    
    @Consume('main.tasks')
    async process_task(message: RabbitMessage<any>) {
        // If this throws an exception, message goes to dead letter queue
        await this.do_work(message.data)
    }
    
    @Consume('failed.tasks')
    async handle_failed_task(message: RabbitMessage<any>) {
        // Handle failed messages
        console.log('Task failed:', message.data)
        await this.log_failure(message.data)
    }
}
```

## Best Practices

1. **Use durable exchanges and queues** for important messages
2. **Set up dead letter exchanges** for error handling
3. **Use appropriate exchange types** for your messaging patterns
4. **Set message TTL** to prevent queue buildup
5. **Configure max queue length** to prevent memory issues
6. **Use descriptive names** for exchanges and queues
7. **Plan your routing key patterns** carefully
8. **Test topology configurations** before production 