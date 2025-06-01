---
layout: default
title: Message Acknowledgment
parent: RabbitMQ Client
nav_order: 3
---

# Message Acknowledgment

Message acknowledgment is crucial for reliable message processing in RabbitMQ. The Tarpit RabbitMQ module provides multiple acknowledgment strategies to handle different scenarios.

## Overview

When a consumer receives a message, it must acknowledge the message to inform RabbitMQ about the processing result. The acknowledgment determines what happens to the message:

- **Ack**: Message processed successfully, remove from queue
- **Nack/Requeue**: Message failed, put back in queue for retry
- **Nack/Kill**: Message failed permanently, remove from queue (send to dead letter if configured)

## Acknowledgment Strategies

### 1. Automatic Acknowledgment (Default)

Messages are automatically acknowledged when the consumer method completes successfully:

```typescript
@TpConsumer()
class OrderConsumer {
    
    @Consume('orders.processing')
    async process_order(message: RabbitMessage<Order>) {
        const order = message.data
        
        // Process the order
        await this.fulfill_order(order)
        
        // Message is automatically acknowledged on successful return
        return { status: 'processed', order_id: order.id }
    }
    
    private async fulfill_order(order: Order) {
        // Order processing logic
    }
}
```

**Behavior:**
- Success: Method returns normally → Message acknowledged
- Error: Method throws exception → Message killed (nacked without requeue)

### 2. Manual Acknowledgment Functions

Use manual acknowledgment functions for fine-grained control:

```typescript
import { ack_message, requeue_message, kill_message } from '@tarpit/rabbitmq'

@TpConsumer()
class PaymentConsumer {
    
    @Consume('payments.processing')
    async process_payment(message: RabbitMessage<Payment>) {
        const payment = message.data
        
        try {
            const result = await this.charge_payment(payment)
            
            if (result.success) {
                // Successful processing
                ack_message()
                console.log(`Payment ${payment.id} processed successfully`)
                
            } else if (result.retryable) {
                // Temporary failure, retry later
                requeue_message()
                console.log(`Payment ${payment.id} failed, will retry`)
                
            } else {
                // Permanent failure
                kill_message()
                console.log(`Payment ${payment.id} failed permanently`)
            }
            
        } catch (error) {
            // Handle unexpected errors
            if (this.is_network_error(error)) {
                requeue_message()
            } else {
                kill_message()
            }
        }
    }
    
    private async charge_payment(payment: Payment) {
        // Payment processing logic
        return { success: true, retryable: false }
    }
    
    private is_network_error(error: any): boolean {
        return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT'
    }
}
```

### 3. Exception-Based Acknowledgment

Use exceptions for cleaner error handling:

```typescript
import { Ack, MessageRequeue, MessageDead } from '@tarpit/rabbitmq'

@TpConsumer()
class EmailConsumer {
    
    @Consume('emails.outbound')
    async send_email(message: RabbitMessage<EmailMessage>) {
        const email = message.data
        
        try {
            await this.email_service.send(email)
            
            // Success - throw Ack exception
            throw new Ack()
            
        } catch (error) {
            if (error instanceof Ack) {
                // Re-throw Ack to acknowledge
                throw error
            }
            
            if (this.is_temporary_error(error)) {
                // Temporary failure - requeue with details
                throw new MessageRequeue({
                    code: 'TEMP_FAILURE',
                    msg: `Email delivery failed temporarily: ${error.message}`
                })
            } else {
                // Permanent failure - kill with details
                throw new MessageDead({
                    code: 'PERM_FAILURE',
                    msg: `Email delivery failed permanently: ${error.message}`
                })
            }
        }
    }
    
    private is_temporary_error(error: any): boolean {
        return error.code === 'RATE_LIMITED' || 
               error.code === 'SERVICE_UNAVAILABLE'
    }
}
```

## Retry Logic Patterns

### Basic Retry with Counting

```typescript
@TpConsumer()
class TaskConsumer {
    
    @Consume('tasks.processing')
    async process_task(message: RabbitMessage<Task>) {
        const task = message.data
        const retry_count = task.retry_count || 0
        const max_retries = 3
        
        try {
            await this.execute_task(task)
            ack_message()
            
        } catch (error) {
            if (retry_count < max_retries && this.is_retryable(error)) {
                // Increment retry count and requeue
                task.retry_count = retry_count + 1
                console.log(`Task ${task.id} failed, retry ${retry_count + 1}/${max_retries}`)
                requeue_message()
            } else {
                // Max retries exceeded or permanent failure
                console.log(`Task ${task.id} failed permanently`)
                kill_message()
            }
        }
    }
    
    private is_retryable(error: any): boolean {
        return !error.message.includes('INVALID_DATA')
    }
}
```

### Exponential Backoff with Delay

```typescript
@TpConsumer()
class RetryConsumer {
    
    @Consume('tasks.retry')
    async process_with_backoff(message: RabbitMessage<RetryTask>) {
        const task = message.data
        const retry_count = task.retry_count || 0
        const max_retries = 5
        
        // Calculate exponential backoff delay
        const delay_ms = Math.min(1000 * Math.pow(2, retry_count), 30000) // Max 30s
        
        try {
            await this.process_task(task)
            ack_message()
            
        } catch (error) {
            if (retry_count < max_retries) {
                // Schedule retry with delay
                task.retry_count = retry_count + 1
                task.next_retry = new Date(Date.now() + delay_ms)
                
                console.log(`Retrying task ${task.id} in ${delay_ms}ms`)
                
                // Use message properties for delay (if supported by broker)
                throw new MessageRequeue({
                    code: 'RETRY_WITH_DELAY',
                    msg: `Retry after ${delay_ms}ms`
                })
            } else {
                kill_message()
            }
        }
    }
}
```

### Circuit Breaker Pattern

```typescript
@TpService()
class CircuitBreaker {
    private failure_count = 0
    private last_failure_time = 0
    private readonly failure_threshold = 5
    private readonly reset_timeout = 60000 // 1 minute
    
    is_open(): boolean {
        if (this.failure_count >= this.failure_threshold) {
            return Date.now() - this.last_failure_time < this.reset_timeout
        }
        return false
    }
    
    record_success() {
        this.failure_count = 0
    }
    
    record_failure() {
        this.failure_count++
        this.last_failure_time = Date.now()
    }
}

@TpConsumer()
class ExternalServiceConsumer {
    
    constructor(private circuit_breaker: CircuitBreaker) {}
    
    @Consume('external.api.calls')
    async call_external_api(message: RabbitMessage<ApiCall>) {
        const api_call = message.data
        
        if (this.circuit_breaker.is_open()) {
            console.log('Circuit breaker is open, requeuing message')
            requeue_message()
            return
        }
        
        try {
            const result = await this.make_api_call(api_call)
            this.circuit_breaker.record_success()
            ack_message()
            
        } catch (error) {
            this.circuit_breaker.record_failure()
            
            if (this.is_service_down_error(error)) {
                // Service is down, requeue all messages
                requeue_message()
            } else {
                // Individual message problem
                kill_message()
            }
        }
    }
    
    private is_service_down_error(error: any): boolean {
        return error.code === 'SERVICE_UNAVAILABLE' || 
               error.code === 'CONNECTION_REFUSED'
    }
}
```

## Dead Letter Queue Handling

### Automatic Dead Letter Configuration

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

### Dead Letter Processing

```typescript
@TpConsumer()
class DeadLetterConsumer {
    
    @Consume('failed.tasks')
    async process_failed_task(message: RabbitMessage<any>) {
        const failed_data = message.data
        const death_reason = message.properties.headers?.['x-death']
        
        console.log('Processing failed message:', {
            data: failed_data,
            death_reason: death_reason
        })
        
        // Log failure for analysis
        await this.log_failure(failed_data, death_reason)
        
        // Optionally try to recover or alert
        if (this.can_recover(failed_data)) {
            await this.attempt_recovery(failed_data)
        } else {
            await this.alert_operators(failed_data)
        }
        
        ack_message()
    }
    
    private async log_failure(data: any, reason: any) {
        // Log to database or monitoring system
    }
    
    private can_recover(data: any): boolean {
        // Determine if recovery is possible
        return false
    }
    
    private async attempt_recovery(data: any) {
        // Try to fix and republish
    }
    
    private async alert_operators(data: any) {
        // Send alert to operations team
    }
}
```

## Message Deduplication

### Idempotent Processing

```typescript
@TpConsumer()
class IdempotentConsumer {
    
    @Consume('orders.processing')
    async process_order(message: RabbitMessage<Order>) {
        const order = message.data
        
        // Check if already processed
        const existing = await this.get_processed_order(order.id)
        if (existing) {
            console.log(`Order ${order.id} already processed, skipping`)
            ack_message()
            return existing
        }
        
        try {
            // Process order
            const result = await this.fulfill_order(order)
            
            // Store result to prevent reprocessing
            await this.store_processed_order(order.id, result)
            
            ack_message()
            return result
            
        } catch (error) {
            // Don't store failures to allow retry
            requeue_message()
        }
    }
    
    private async get_processed_order(order_id: string) {
        // Check database for existing processing result
        return null
    }
    
    private async store_processed_order(order_id: string, result: any) {
        // Store processing result in database
    }
}
```

### Message Fingerprinting

```typescript
import { createHash } from 'crypto'

@TpConsumer()
class DedupConsumer {
    private processed_hashes = new Set<string>()
    
    @Consume('data.processing')
    async process_data(message: RabbitMessage<DataMessage>) {
        const data = message.data
        
        // Create fingerprint
        const fingerprint = this.create_fingerprint(data)
        
        if (this.processed_hashes.has(fingerprint)) {
            console.log('Duplicate message detected, skipping')
            ack_message()
            return
        }
        
        try {
            await this.process_unique_data(data)
            this.processed_hashes.add(fingerprint)
            ack_message()
            
        } catch (error) {
            requeue_message()
        }
    }
    
    private create_fingerprint(data: any): string {
        const content = JSON.stringify(data, Object.keys(data).sort())
        return createHash('sha256').update(content).digest('hex')
    }
}
```

## Monitoring and Metrics

### Acknowledgment Metrics

```typescript
@TpService()
class MessageMetrics {
    private ack_count = 0
    private nack_count = 0
    private requeue_count = 0
    
    record_ack() { this.ack_count++ }
    record_nack() { this.nack_count++ }
    record_requeue() { this.requeue_count++ }
    
    get_stats() {
        return {
            ack: this.ack_count,
            nack: this.nack_count,
            requeue: this.requeue_count,
            total: this.ack_count + this.nack_count + this.requeue_count
        }
    }
}

@TpConsumer()
class MetricsConsumer {
    
    constructor(private metrics: MessageMetrics) {}
    
    @Consume('monitored.queue')
    async process_with_metrics(message: RabbitMessage<any>) {
        try {
            await this.process_message(message.data)
            this.metrics.record_ack()
            ack_message()
            
        } catch (error) {
            if (this.should_retry(error)) {
                this.metrics.record_requeue()
                requeue_message()
            } else {
                this.metrics.record_nack()
                kill_message()
            }
        }
    }
}
```

## Best Practices

### 1. Choose the Right Strategy

```typescript
// For critical business operations
@Consume('payments.processing')
async process_payment(message: RabbitMessage<Payment>) {
    // Use manual acknowledgment with careful error handling
    try {
        await this.charge_payment(message.data)
        ack_message()
    } catch (error) {
        if (this.is_retryable(error)) {
            requeue_message()
        } else {
            kill_message()
        }
    }
}

// For non-critical operations
@Consume('analytics.events')
async track_event(message: RabbitMessage<Event>) {
    // Automatic acknowledgment is fine
    await this.analytics.track(message.data)
    // Auto-acknowledged on return
}
```

### 2. Handle Poison Messages

```typescript
@Consume('user.tasks')
async process_task(message: RabbitMessage<Task>) {
    const task = message.data
    
    // Validate message format
    if (!this.is_valid_task(task)) {
        console.log('Invalid task format, killing message')
        kill_message()
        return
    }
    
    // Process normally
    await this.execute_task(task)
    ack_message()
}

private is_valid_task(task: any): boolean {
    return task && task.id && task.type
}
```

### 3. Implement Timeouts

```typescript
@Consume('long.running.tasks')
async process_long_task(message: RabbitMessage<LongTask>) {
    const timeout_ms = 30000 // 30 seconds
    
    try {
        await Promise.race([
            this.execute_long_task(message.data),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('TIMEOUT')), timeout_ms)
            )
        ])
        
        ack_message()
        
    } catch (error) {
        if (error.message === 'TIMEOUT') {
            requeue_message()
        } else {
            kill_message()
        }
    }
}
```

### 4. Graceful Shutdown

```typescript
@TpConsumer()
class GracefulConsumer {
    private processing_count = 0
    private shutting_down = false
    
    @Consume('graceful.tasks')
    async process_gracefully(message: RabbitMessage<Task>) {
        if (this.shutting_down) {
            // Don't start new work during shutdown
            requeue_message()
            return
        }
        
        this.processing_count++
        
        try {
            await this.process_task(message.data)
            ack_message()
        } catch (error) {
            requeue_message()
        } finally {
            this.processing_count--
        }
    }
    
    async shutdown() {
        this.shutting_down = true
        
        // Wait for in-flight messages to complete
        while (this.processing_count > 0) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Messages Not Being Acknowledged**
   - Check for unhandled exceptions
   - Verify acknowledgment function calls
   - Check consumer registration

2. **Messages Stuck in Unacked State**
   - Look for long-running or hung consumers
   - Check for missing acknowledgment calls
   - Verify connection health

3. **Too Many Requeues**
   - Implement retry limits
   - Check for systematic failures
   - Review error classification logic

### Debug Acknowledgments

```typescript
@Consume('debug.messages')
async debug_ack(message: RabbitMessage<any>) {
    console.log('Message received:', message.fields.deliveryTag)
    
    try {
        await this.process_message(message.data)
        console.log('Processing successful, acknowledging')
        ack_message()
        
    } catch (error) {
        console.log('Processing failed:', error.message)
        
        if (this.should_retry(error)) {
            console.log('Requeuing message')
            requeue_message()
        } else {
            console.log('Killing message')
            kill_message()
        }
    }
}
```

## Next Steps

- [Error Handling](./4-error-handling.md) - Comprehensive error handling patterns
- [Advanced Patterns](./5-advanced-patterns.md) - Complex messaging patterns
- [Basic Usage](./1-basic-usage.md) - Return to basic concepts 