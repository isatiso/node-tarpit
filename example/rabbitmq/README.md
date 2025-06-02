# RabbitMQ Examples

This directory contains examples demonstrating the Tarpit RabbitMQ module functionality.

## Prerequisites

- A running RabbitMQ server
- Node.js and Yarn installed
- Access to the RabbitMQ instance

## Available Examples

### 1. Basic Producer-Consumer (`basic-producer-consumer.ts`)

Demonstrates the fundamental patterns of message publishing and consumption:

- **Producers**: Send user events and notifications
- **Consumers**: Process user creation/update events and notifications
- **Features**: Exchange routing, queue binding, email notifications
- **Topology**: Topic exchange with routing keys

**Run the example:**
```bash
npx ts-node basic-producer-consumer.ts
```

**What it demonstrates:**
- `@TpProducer` and `@TpConsumer` decorators
- `@Publish` with exchange and routing key
- `@Enqueue` for direct queue publishing
- `@Consume` with prefetch configuration
- Message topology definition with `RabbitDefine`
- Dependency injection in consumers

### 2. Error Handling (`error-handling.ts`)

Shows comprehensive error handling and message acknowledgment strategies:

- **Manual Acknowledgment**: Using `ack_message()`, `requeue_message()`, `kill_message()`
- **Exception-based**: Using `Ack`, `MessageRequeue`, `MessageDead` exceptions
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Validation**: Strict input validation with permanent failure handling

**Run the example:**
```bash
npx ts-node error-handling.ts
```

**What it demonstrates:**
- Different acknowledgment strategies
- Retry logic with maximum attempt limits
- Permanent vs temporary error handling
- Message validation and rejection
- Error classification and routing

## Configuration

Both examples are configured to connect to:
- **Host**: `10.11.11.3:5672`
- **Credentials**: `user:password`
- **Protocol**: AMQP

To use a different RabbitMQ instance, modify the connection URL in each example:

```typescript
const config = load_config<TpConfigSchema>({
    rabbitmq: {
        url: 'amqp://username:password@hostname:port',
        prefetch: 20,
        timeout: 10000
    }
})
```

## Testing the Examples

### 1. Start Basic Producer-Consumer

```bash
# Terminal 1
npx ts-node basic-producer-consumer.ts
```

Expected output:
- Platform startup messages
- User creation and update events
- Email notifications being processed
- Consumer acknowledgments

### 2. Start Error Handling Demo

```bash
# Terminal 2  
npx ts-node error-handling.ts
```

Expected output:
- Normal task processing (all succeed)
- Retry task processing (some fail and retry)
- Error-prone task processing (various error types)
- Validation task processing (some pass, some fail)

### 3. Monitor RabbitMQ Management UI

If your RabbitMQ instance has the management plugin enabled, you can monitor:
- Queue lengths and message rates
- Exchange bindings and routing
- Consumer connections and acknowledgments
- Dead letter queues (if configured)

Access at: `http://10.11.11.3:15672` (default management UI port)

## Message Flow Examples

### User Event Flow (basic-producer-consumer.ts)

```
UserService.create_user()
    ↓
UserProducer.user_created() → [user.events exchange] → [user.events.created queue]
    ↓                                                      ↓
NotificationProducer.send_notification()              UserEventConsumer.handle_user_created()
    ↓                                                      ↓
[user.notifications queue]                            EmailService.send_email()
    ↓
NotificationConsumer.handle_notification()
    ↓
EmailService.send_email()
```

### Error Handling Flow (error-handling.ts)

```
TaskProducer.send_retry_task()
    ↓
[tasks.retry queue] → TaskConsumer.handle_retry_task()
    ↓
[Processing fails] → requeue_message() → [Back to queue for retry]
    ↓
[Max retries exceeded] → kill_message() → [Dead letter queue]
```

## Debugging

### Enable Debug Logging

Add logging configuration to see internal RabbitMQ operations:

```typescript
// In your main function
console.log('Debug: Connection status, message acknowledgments, etc.')
```

### Common Issues

1. **Connection Errors**
   - Check RabbitMQ server status
   - Verify credentials and network access
   - Check firewall settings

2. **Message Not Consumed**
   - Verify queue names match between producer and consumer
   - Check exchange bindings and routing keys
   - Ensure consumers are properly registered

3. **TypeScript Errors**
   - Some decorator-related errors are expected during compilation
   - Runtime functionality should work correctly
   - Use `--skipLibCheck` if needed

## Advanced Features

Both examples demonstrate:

- **Topology Management**: Automatic exchange and queue creation
- **Message Serialization**: JSON serialization with type safety
- **Error Boundaries**: Graceful error handling and recovery
- **Resource Cleanup**: Proper connection and channel management
- **Dependency Injection**: Full DI integration with other services

## Related Documentation

- [RabbitMQ Client Documentation](../../docs-temp/en/3-rabbitmq-client/)
- [Basic Usage Guide](../../docs-temp/en/3-rabbitmq-client/1-basic-usage.md)
- [Message Acknowledgment Strategies](../../docs-temp/en/3-rabbitmq-client/3-acknowledgment.md)

## Troubleshooting

### Port Issues
If you get connection errors, verify:
- RabbitMQ is running on the specified host and port
- No firewall blocking the connection
- Correct credentials

### Message Processing
If messages aren't being processed:
- Check consumer registration in the platform
- Verify queue bindings and routing keys
- Check prefetch settings and consumer capacity

### Performance
For high-throughput scenarios:
- Adjust prefetch values based on processing speed
- Use connection pooling for multiple channels
- Monitor memory usage and message backlog 