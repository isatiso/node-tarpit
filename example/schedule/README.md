# Tarpit Schedule Module Examples

This directory contains examples demonstrating the Tarpit Schedule module's task scheduling capabilities.

## Examples Overview

### 1. Basic Scheduler (`basic-scheduler.ts`)

A comprehensive example showcasing:
- **System Health Monitoring**: High-frequency health checks (every 10 seconds)
- **Data Processing**: Hourly data processing tasks
- **Maintenance Tasks**: Daily maintenance with timezone support
- **Business Logic**: Conditional tasks that run only during business hours
- **Error Handling**: Retry logic and crash handling
- **Task Management**: Manual task execution and monitoring

**Features Demonstrated:**
- Multiple task frequencies (seconds, minutes, hours, daily)
- Timezone-aware scheduling (`Asia/Shanghai`)
- Dependency injection with services
- Task context usage for data storage
- Error handling with retry and crash strategies
- Task inspection and manual execution

### 2. Simple Test (`simple-test.ts`)

A minimal example for testing basic functionality:
- **Simple Task**: Runs every 5 seconds with execution counting
- **Minute Task**: Runs every minute with data processing simulation
- **Monitoring**: Real-time task execution monitoring
- **Statistics**: Execution rate and performance metrics

**Features Demonstrated:**
- Basic task scheduling
- Task context data storage
- Task inspection and monitoring
- Execution statistics

## Running the Examples

### Prerequisites

Make sure you're in the project root directory and have installed dependencies:

```bash
cd /path/to/node-tarpit
yarn install
```

### Running Basic Scheduler

```bash
# From project root
yarn tarpit example/schedule/basic-scheduler.ts
```

**What to expect:**
- Platform startup and task registration
- Task listing and details display
- Manual task execution demonstration
- Automatic task execution every 10 seconds (health check)
- 60-second monitoring period showing scheduled execution
- Clean shutdown

**Sample Output:**
```
=== Tarpit Schedule Basic Example ===

🔧 Building platform...
✅ Platform started successfully

📋 === Active Scheduled Tasks ===

   1. system_health_check
      ID: [task-id]
      Cron: */10 * * * * *
      Position: BasicScheduler.system_health_check
      Next run: [timestamp]

🔄 [system_health_check] Running system health check...
   🔍 Checking database health...
   ✅ Database is healthy
   📊 Collecting system metrics...
   💻 CPU: 45%, Memory: 62%, Disk: 23%
✅ [system_health_check] Health check completed successfully
```

### Running Simple Test

```bash
# From project root
yarn tarpit example/schedule/simple-test.ts
```

**What to expect:**
- Quick platform startup
- Task registration and status display
- 30-second monitoring period
- Real-time execution counting
- Performance statistics

**Sample Output:**
```
=== Tarpit Schedule Simple Test ===

🔧 Building platform...
✅ Platform started successfully

📋 === Active Tasks ===
1. simple_test_task (*/5 * * * * *)
   Next run: [timestamp]
2. minute_task (0 * * * * *)
   Next run: [timestamp]

🔄 [simple_test_task] Execution #1
   📅 Current time: 2024-01-15T10:30:05.123Z
   🔢 Failure count: 0
   📍 Position: SimpleTestScheduler.simple_test_task
   ⏰ Cron: */5 * * * * *
✅ [simple_test_task] Completed execution #1
```

## Understanding the Output

### Task Execution Logs

The schedule module provides detailed logging for each task execution:

```
[timestamp] duration    status   task_name <details>
```

- **timestamp**: ISO format execution time
- **duration**: Task execution duration in milliseconds
- **status**: `success`, `retry`, `crash`, or `ignore`
- **task_name**: Human-readable task identifier
- **details**: Additional context (error codes, retry counts, etc.)

### Task Status Information

Each task displays:
- **ID**: Unique task identifier
- **Name**: Human-readable task name
- **Cron**: Cron expression defining schedule
- **Position**: Class and method location
- **Next Execution**: Formatted next run time
- **Time Until**: Countdown to next execution

## Customizing Examples

### Modifying Task Schedules

Change cron expressions to test different frequencies:

```typescript
// Every 3 seconds
@Task('*/3 * * * * *', 'fast_task')

// Every 30 seconds
@Task('*/30 * * * * *', 'medium_task')

// Every 2 minutes
@Task('0 */2 * * * *', 'slow_task')

// Daily at specific time
@Task('0 0 14 * * *', 'afternoon_task')
```

### Adding Custom Tasks

Add new tasks to the scheduler classes:

```typescript
@Task('0 */15 * * * *', 'custom_monitoring')
async custom_monitoring(context: TaskContext) {
    console.log('Custom monitoring task')
    // Your custom logic here
}
```

### Timezone Testing

Test different timezones:

```typescript
@Task('0 0 9 * * *', 'tokyo_morning', { tz: 'Asia/Tokyo' })
@Task('0 0 9 * * *', 'london_morning', { tz: 'Europe/London' })
@Task('0 0 9 * * *', 'utc_morning', { utc: true })
```

## Error Handling Examples

### Retry Logic

```typescript
@Task('0 */5 * * * *', 'unreliable_task')
async unreliable_task(context: TaskContext) {
    try {
        // Simulate unreliable operation
        if (Math.random() < 0.3) {
            throw new Error('Random failure')
        }
        console.log('Task succeeded')
    } catch (error) {
        if (context.count < 3) {
            throw_task_retry(1, `Retry attempt ${context.count + 1}`)
        } else {
            throw_task_crash('MAX_RETRIES', 'Too many failures')
        }
    }
}
```

### Conditional Execution

```typescript
@Task('0 0 2 * * *', 'maintenance_window')
async maintenance_window(context: TaskContext) {
    const hour = new Date().getHours()
    
    if (hour < 2 || hour > 6) {
        throw_task_ignore('OUTSIDE_WINDOW', 'Not in maintenance window')
    }
    
    // Perform maintenance
    console.log('Running maintenance')
}
```

## Performance Considerations

### Task Duration

Keep tasks lightweight:
- Avoid long-running operations
- Use async/await for I/O operations
- Consider breaking large tasks into smaller chunks

### Memory Usage

For tasks that process large datasets:
- Clean up resources explicitly
- Use streaming for large data
- Monitor memory usage

### Concurrent Execution

Be aware of task overlap:
- Check if previous execution is still running
- Use task context to store state
- Consider using locks for critical sections

## Troubleshooting

### Common Issues

1. **Tasks Not Running**
   - Check cron expression syntax
   - Verify timezone settings
   - Check for task crashes

2. **High Memory Usage**
   - Review task implementations
   - Check for memory leaks
   - Monitor task execution duration

3. **Timezone Issues**
   - Use explicit timezone settings
   - Test with UTC for consistency
   - Verify system timezone configuration

### Debug Mode

Enable detailed logging by modifying the examples:

```typescript
// Add debug logging
@Task('*/10 * * * * *', 'debug_task')
async debug_task(context: TaskContext) {
    console.log('Debug info:', {
        task_name: context.unit.task_name,
        cron: context.unit.crontab_str,
        position: context.unit.position,
        count: context.count
    })
}
```

## Next Steps

After running these examples:

1. **Read the Documentation**: Check out the full documentation in `docs-temp/en/4-schedule/`
2. **Explore Advanced Features**: Look into custom hooks and error handling
3. **Integration**: Learn how to integrate with other Tarpit modules
4. **Production Usage**: Review best practices for production deployments

## Related Documentation

- [Basic Usage](../../docs-temp/en/4-schedule/1-basic-usage.md)
- [Cron Expressions](../../docs-temp/en/4-schedule/2-cron-expressions.md)
- [Error Handling](../../docs-temp/en/4-schedule/3-error-handling.md)
- [Task Management](../../docs-temp/en/4-schedule/4-task-management.md) 