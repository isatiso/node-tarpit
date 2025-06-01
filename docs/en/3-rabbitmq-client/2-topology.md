---
layout: default
title: Exchange and Queue Management
parent: RabbitMQ Client
nav_order: 2
---

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

## Complex Topology Example

```typescript
import { RabbitDefine, RabbitDefineToken } from '@tarpit/rabbitmq'

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

// Use in producers and consumers
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
    
    @Publish('ecommerce.events', 'order.paid')
    async order_paid(payment: Payment) {
        return payment
    }
}
```

## Multi-Module Topology

For larger applications, you can split topology definitions across modules:

```typescript
// user-topology.ts
export const user_topology = new RabbitDefine()
    .define_exchange('user.events', 'topic', { durable: true })
    .define_queue('user.created', { durable: true })
    .define_queue('user.updated', { durable: true })
    .bind_queue('user.events', 'user.created', 'user.created')
    .bind_queue('user.events', 'user.updated', 'user.updated')

// order-topology.ts  
export const order_topology = new RabbitDefine()
    .define_exchange('order.events', 'topic', { durable: true })
    .define_queue('order.processing', { durable: true })
    .bind_queue('order.events', 'order.processing', 'order.*')

// main-topology.ts
import { user_topology } from './user-topology'
import { order_topology } from './order-topology'

export const main_topology = new RabbitDefine()
    .merge(user_topology)
    .merge(order_topology)
    // Add cross-module bindings
    .bind_queue('user.events', 'order.processing', 'user.created')
```

## Dynamic Topology

You can also create topology dynamically based on configuration:

```typescript
function create_tenant_topology(tenant_id: string): RabbitDefine {
    return new RabbitDefine()
        .define_exchange(`tenant.${tenant_id}.events`, 'topic', { durable: true })
        .define_queue(`tenant.${tenant_id}.notifications`, { durable: true })
        .define_queue(`tenant.${tenant_id}.analytics`, { durable: true })
        .bind_queue(`tenant.${tenant_id}.events`, `tenant.${tenant_id}.notifications`, 'notification.*')
        .bind_queue(`tenant.${tenant_id}.events`, `tenant.${tenant_id}.analytics`, '#')
}

// Use in multi-tenant application
const tenants = ['acme', 'globex', 'stark']
const topology = new RabbitDefine()

tenants.forEach(tenant => {
    topology.merge(create_tenant_topology(tenant))
})
```

## Type Safety

The `RabbitDefine` class provides type safety for exchange and queue names:

```typescript
const topology = new RabbitDefine()
    .define_exchange('user.events', 'topic')
    .define_queue('user.notifications')

// Type-safe access to defined names
const exchange_name = topology.X['user.events']  // 'user.events'
const queue_name = topology.Q['user.notifications']  // 'user.notifications'

// Use in decorators
@Publish(topology.X['user.events'], 'user.created')
async user_created(event: UserEvent) {
    return event
}

@Consume(topology.Q['user.notifications'])
async handle_notification(message: RabbitMessage<Notification>) {
    // Handle notification
}
```

## Default Exchanges

RabbitMQ provides several built-in exchanges that you can use without definition:

```typescript
type DefaultRabbitmqExchange = 'amq.direct' | 'amq.topic' | 'amq.headers' | 'amq.fanout'

// Use default exchanges directly
@Publish('amq.topic', 'logs.info.application')
async log_info(message: LogMessage) {
    return message
}
```

## Best Practices

### 1. Use Durable Resources for Production

```typescript
const topology = new RabbitDefine()
    .define_exchange('prod.events', 'topic', { durable: true })
    .define_queue('prod.tasks', { durable: true })
```

### 2. Plan Your Routing Keys

```typescript
// Good: Hierarchical routing keys
'user.created'
'user.updated.profile'
'user.updated.preferences'
'order.created.paid'
'order.created.pending'

// Better: Use wildcards effectively
'user.*'           // All user events
'*.created'        // All creation events
'order.*.paid'     // All paid orders
'#'                // Everything (use sparingly)
```

### 3. Dead Letter Queues

```typescript
const topology = new RabbitDefine()
    .define_exchange('main.events', 'topic', { durable: true })
    .define_exchange('failed.events', 'direct', { durable: true })
    
    .define_queue('main.tasks', {
        durable: true,
        deadLetterExchange: 'failed.events',
        deadLetterRoutingKey: 'failed.tasks'
    })
    .define_queue('failed.tasks', { durable: true })
    
    .bind_queue('failed.events', 'failed.tasks', 'failed.tasks')
```

### 4. Queue Size Limits

```typescript
const topology = new RabbitDefine()
    .define_queue('high.volume.queue', {
        durable: true,
        maxLength: 10000,
        arguments: {
            'x-overflow': 'reject-publish'  // or 'drop-head'
        }
    })
```

### 5. Message TTL

```typescript
const topology = new RabbitDefine()
    .define_queue('temp.notifications', {
        durable: true,
        messageTtl: 300000,  // 5 minutes
        autoDelete: true
    })
```

## Monitoring and Management

The topology definitions are automatically applied when the platform starts. You can monitor them through:

1. **RabbitMQ Management UI**: View exchanges, queues, and bindings
2. **Application Logs**: Topology creation is logged during startup
3. **Health Checks**: Verify topology exists and is healthy

## Troubleshooting

### Common Issues

1. **Exchange/Queue Already Exists with Different Properties**
   - Solution: Delete existing resources or match properties exactly

2. **Permission Denied**
   - Solution: Ensure RabbitMQ user has configure permissions

3. **Binding Failures**
   - Solution: Verify exchange and queue exist before creating bindings

### Debug Topology

```typescript
const topology = new RabbitDefine()
    .define_exchange('debug.events', 'topic')
    .define_queue('debug.messages')

// Inspect definitions before use
console.log('Exchanges:', topology.exchange_defines)
console.log('Queues:', topology.queue_defines)
console.log('Bindings:', topology.queue_bindings)
```

## Next Steps

- [Message Acknowledgment](./3-acknowledgment.md) - Learn about message acknowledgment strategies
- [Error Handling](./4-error-handling.md) - Comprehensive error handling patterns
- [Advanced Patterns](./5-advanced-patterns.md) - Complex messaging patterns 