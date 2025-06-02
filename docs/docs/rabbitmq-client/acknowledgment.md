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

### Exponential Backoff Strategy

```typescript
@TpConsumer()
class RetryConsumer {
    
    @Consume('tasks.retry')
    async process_with_backoff(message: RabbitMessage<RetryTask>) {
        const task = message.data
        const retry_count = task.retry_count || 0
        const max_retries = 5
        
        try {
            await this.risky_operation(task)
            ack_message()
            
        } catch (error) {
            if (retry_count < max_retries) {
                // Calculate delay: 2^retry_count seconds
                const delay_seconds = Math.pow(2, retry_count)
                
                task.retry_count = retry_count + 1
                task.next_retry = new Date(Date.now() + delay_seconds * 1000)
                
                console.log(`Task failed, retrying in ${delay_seconds}s`)
                
                // Schedule for later processing
                await this.schedule_retry(task, delay_seconds)
                ack_message() // Ack current message
                
            } else {
                kill_message()
                await this.handle_final_failure(task, error)
            }
        }
    }
    
    private async schedule_retry(task: RetryTask, delay: number) {
        // Send to a delay queue or scheduler
        await this.producer.schedule_task(task, delay)
    }
}
```

## Dead Letter Queue Handling

Set up dead letter queues for failed messages:

```typescript
// Topology with dead letter setup
const topology = new RabbitDefine()
    .define_exchange('main.processing', 'direct', { durable: true })
    .define_exchange('dead.letters', 'direct', { durable: true })
    
    .define_queue('main.tasks', {
        durable: true,
        deadLetterExchange: 'dead.letters',
        deadLetterRoutingKey: 'failed'
    })
    
    .define_queue('failed.tasks', { durable: true })
    
    .bind_queue('main.processing', 'main.tasks', 'process')
    .bind_queue('dead.letters', 'failed.tasks', 'failed')

@TpConsumer()
class MainProcessor {
    
    @Consume('main.tasks')
    async process_main_task(message: RabbitMessage<Task>) {
        // Process task - failures automatically go to dead letter
        await this.execute_task(message.data)
    }
}

@TpConsumer()
class DeadLetterProcessor {
    
    @Consume('failed.tasks')
    async handle_dead_letter(message: RabbitMessage<Task>) {
        // Handle permanently failed messages
        const task = message.data
        
        console.log(`Task ${task.id} failed permanently`)
        
        // Log for analysis
        await this.log_failure(task, message.properties)
        
        // Notify administrators
        await this.send_alert(task)
        
        // Acknowledge to remove from dead letter queue
        ack_message()
    }
    
    private async log_failure(task: Task, properties: any) {
        // Log failure details for debugging
    }
    
    private async send_alert(task: Task) {
        // Send notification about failed task
    }
}
```

## Acknowledgment Best Practices

### 1. Use Appropriate Strategy

```typescript
// For critical operations - use manual acknowledgment
@Consume('payments.processing')
async process_payment(message: RabbitMessage<Payment>) {
    try {
        await this.payment_gateway.charge(message.data)
        ack_message() // Explicit acknowledgment
    } catch (error) {
        if (error.retryable) {
            requeue_message()
        } else {
            kill_message()
        }
    }
}

// For simple operations - use automatic acknowledgment
@Consume('logs.processing')
async process_log(message: RabbitMessage<LogEntry>) {
    await this.logger.write(message.data)
    // Automatically acknowledged on return
}
```

### 2. Handle Poison Messages

```typescript
@TpConsumer()
class SafeConsumer {
    
    @Consume('tasks.processing')
    async safe_process(message: RabbitMessage<Task>) {
        const task = message.data
        
        // Check for poison message indicators
        if (this.is_poison_message(task)) {
            console.warn('Poison message detected, killing immediately')
            kill_message()
            return
        }
        
        const retry_count = task.retry_count || 0
        const max_retries = 3
        
        try {
            await this.process_task(task)
            ack_message()
            
        } catch (error) {
            if (retry_count >= max_retries) {
                // Send to analysis queue instead of dead letter
                await this.send_for_analysis(task, error)
                ack_message()
            } else {
                task.retry_count = retry_count + 1
                requeue_message()
            }
        }
    }
    
    private is_poison_message(task: Task): boolean {
        // Check for malformed data that would always fail
        return !task.id || task.retry_count > 10
    }
}
```

## Error Monitoring

```typescript
@TpConsumer()
class MonitoredConsumer {
    
    constructor(private metrics: MetricsService) {}
    
    @Consume('orders.processing')
    async process_order(message: RabbitMessage<Order>) {
        const start_time = Date.now()
        
        try {
            await this.order_service.process(message.data)
            
            // Record success metrics
            this.metrics.increment('orders.processed.success')
            this.metrics.timing('orders.processing_time', Date.now() - start_time)
            
            ack_message()
            
        } catch (error) {
            // Record failure metrics
            this.metrics.increment('orders.processed.failure')
            this.metrics.increment(`orders.error.${error.code}`)
            
            if (this.should_retry(error)) {
                requeue_message()
            } else {
                kill_message()
            }
        }
    }
}
```

## Summary

Choose the right acknowledgment strategy based on your use case:

1. **Automatic**: Simple operations with basic error handling
2. **Manual functions**: Fine-grained control over message fate  
3. **Exceptions**: Clean error handling with detailed context
4. **Dead letter queues**: Handle permanently failed messages
5. **Retry patterns**: Implement backoff and circuit breakers
6. **Monitoring**: Track success/failure rates and patterns 