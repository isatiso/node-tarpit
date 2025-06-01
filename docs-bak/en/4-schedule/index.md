---
layout: default
title: Schedule
nav_order: 5
has_children: true
---

# Schedule Module

The Tarpit Schedule module provides powerful task scheduling capabilities using cron expressions. It supports precise timing control, error handling, task management, and monitoring features.

## Features

- **Cron-based Scheduling**: Full cron expression support with timezone handling
- **Error Handling**: Comprehensive error types (retry, crash, ignore, done)
- **Task Management**: Start, stop, cancel, and reload tasks dynamically
- **Monitoring**: Inspect running and suspended tasks
- **Hooks**: Lifecycle hooks for custom logic
- **Dependency Injection**: Full integration with Tarpit's DI system

## Quick Start

```typescript
import { Platform } from '@tarpit/core'
import { ScheduleModule, TpSchedule, Task, TaskContext } from '@tarpit/schedule'

@TpSchedule({
    imports: [ScheduleModule]
})
class MyScheduler {
    
    @Task('0 */10 * * * *', 'data_cleanup')
    async cleanup_old_data(context: TaskContext) {
        console.log('Cleaning up old data...')
        // Task implementation
    }
    
    @Task('0 0 9 * * MON-FRI', 'daily_report', { tz: 'Asia/Shanghai' })
    async send_daily_report(context: TaskContext) {
        console.log('Sending daily report...')
        // Send report logic
    }
}

const platform = new Platform({}).bootstrap(MyScheduler)
await platform.start()
```

## Core Concepts

### 1. Task Decorators

The `@Task` decorator defines scheduled tasks with cron expressions:

```typescript
@Task(crontab, name, options?)
```

- **crontab**: Standard cron expression (6 fields: second minute hour day month weekday)
- **name**: Human-readable task name for logging and management
- **options**: Additional configuration (timezone, UTC mode)

### 2. Task Context

Every task receives a `TaskContext` object providing:

```typescript
interface TaskContext<T = any> {
    readonly unit: TaskUnit        // Task metadata
    readonly count: number         // Failure count for retries
    get<K extends keyof T>(key: K): T[K]
    set<K extends keyof T>(key: K, value: T[K]): void
}
```

### 3. Error Handling

Tasks can throw special exceptions to control execution flow:

- `TaskDone` / `mission_completed()`: Mark task as completed
- `TaskRetry` / `throw_task_retry()`: Retry task execution
- `TaskIgnore` / `throw_task_ignore()`: Skip current execution
- `TaskCrash` / `throw_task_crash()`: Mark task as crashed

## Architecture

The schedule system consists of several key components:

### Schedule Hub
- Central task coordinator
- Manages task queue and execution timing
- Handles task suspension and reloading

### Schedule Inspector
- Provides task introspection capabilities
- Lists running and suspended tasks
- Allows manual task control

### Schedule Hooks
- Lifecycle event handlers
- Customizable logging and monitoring
- Performance tracking

### Task Units
- Individual task definitions
- Cron expression parsing
- Execution metadata

## Cron Expression Format

Tarpit uses 6-field cron expressions:

```
┌─────────────── second (0-59)
│ ┌───────────── minute (0-59)
│ │ ┌─────────── hour (0-23)
│ │ │ ┌───────── day of month (1-31)
│ │ │ │ ┌─────── month (1-12)
│ │ │ │ │ ┌───── day of week (0-7, 0=Sunday)
│ │ │ │ │ │
* * * * * *
```

### Common Patterns

```typescript
// Every 10 seconds
@Task('*/10 * * * * *', 'frequent_check')

// Every minute
@Task('0 * * * * *', 'minute_task')

// Every hour at 30 minutes
@Task('0 30 * * * *', 'hourly_task')

// Daily at 3:00 AM
@Task('0 0 3 * * *', 'daily_maintenance')

// Weekly on Mondays at 9:00 AM
@Task('0 0 9 * * 1', 'weekly_report')

// Monthly on the 1st at midnight
@Task('0 0 0 1 * *', 'monthly_cleanup')

// Weekdays at 9:00 AM
@Task('0 0 9 * * 1-5', 'business_hours')

// Multiple times per day
@Task('0 0 9,12,18 * * *', 'three_times_daily')
```

## Timezone Support

Tasks can specify timezone for execution:

```typescript
@Task('0 0 9 * * *', 'morning_task', { tz: 'Asia/Shanghai' })
@Task('0 0 9 * * *', 'utc_task', { utc: true })
@Task('0 0 9 * * *', 'ny_task', { tz: 'America/New_York' })
```

## Task Management

### Manual Task Control

```typescript
import { ScheduleInspector } from '@tarpit/schedule'

@TpService()
class TaskManager {
    
    constructor(private inspector: ScheduleInspector) {}
    
    async manage_tasks() {
        // List all active tasks
        const tasks = this.inspector.list_task()
        console.log('Active tasks:', tasks)
        
        // Get specific task info
        const task = this.inspector.get_task('task-id')
        if (task) {
            console.log('Task details:', task)
        }
        
        // Cancel a task
        await this.inspector.cancel('task-id')
        
        // Run a task immediately
        await this.inspector.run('task-id')
        
        // Reload a suspended task
        await this.inspector.reload('task-id')
        
        // List suspended tasks
        const suspended = this.inspector.list_suspended()
        console.log('Suspended tasks:', suspended)
    }
}
```

## Error Handling Patterns

### Retry on Failure

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class RetryScheduler {
    
    @Task('0 */5 * * * *', 'unreliable_task')
    async unreliable_operation(context: TaskContext) {
        try {
            await this.call_external_api()
            
        } catch (error) {
            if (context.count < 3) {
                // Retry up to 3 times
                throw_task_retry('API_ERROR', `API call failed: ${error.message}`)
            } else {
                // Give up after 3 retries
                throw_task_crash('MAX_RETRIES', 'Too many failures, giving up')
            }
        }
    }
    
    private async call_external_api() {
        // Simulate API call that might fail
        if (Math.random() < 0.3) {
            throw new Error('Network timeout')
        }
    }
}
```

### Conditional Execution

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class ConditionalScheduler {
    
    @Task('0 0 2 * * *', 'maintenance_task')
    async maintenance_check(context: TaskContext) {
        const is_maintenance_window = await this.check_maintenance_window()
        
        if (!is_maintenance_window) {
            // Skip execution during business hours
            throw_task_ignore('BUSINESS_HOURS', 'Skipping during business hours')
        }
        
        // Perform maintenance
        await this.run_maintenance()
        
        // Mark as completed
        mission_completed()
    }
    
    private async check_maintenance_window(): Promise<boolean> {
        const hour = new Date().getHours()
        return hour >= 2 && hour <= 6
    }
}
```

## Custom Hooks

Implement custom lifecycle hooks for monitoring and logging:

```typescript
import { ScheduleHooks, TaskContext } from '@tarpit/schedule'

@TpService({ inject_root: true })
class CustomScheduleHooks extends ScheduleHooks {
    
    async on_init(context: TaskContext): Promise<void> {
        // Set up custom context data
        context.set('start_time', Date.now())
        context.set('metrics', { calls: 0, errors: 0 })
        
        console.log(`[TASK START] ${context.unit.task_name}`)
    }
    
    async on_finish<T>(context: TaskContext, result: T): Promise<void> {
        const duration = Date.now() - context.get('start_time')
        const metrics = context.get('metrics')
        
        console.log(`[TASK SUCCESS] ${context.unit.task_name} completed in ${duration}ms`)
        
        // Custom metrics collection
        await this.record_metrics(context.unit.task_name, {
            duration,
            success: true,
            ...metrics
        })
    }
    
    async on_error(context: TaskContext, error: any): Promise<void> {
        const duration = Date.now() - context.get('start_time')
        const metrics = context.get('metrics')
        metrics.errors++
        
        console.error(`[TASK ERROR] ${context.unit.task_name} failed after ${duration}ms:`, error)
        
        // Error tracking
        await this.record_metrics(context.unit.task_name, {
            duration,
            success: false,
            error: error.message,
            ...metrics
        })
    }
    
    private async record_metrics(task_name: string, data: any) {
        // Send to monitoring system
        console.log(`[METRICS] ${task_name}:`, data)
    }
}
```

## Best Practices

### 1. Task Naming

Use descriptive names for easy identification:

```typescript
@Task('0 0 3 * * *', 'cleanup_expired_sessions')
@Task('0 */15 * * * *', 'health_check_external_services')
@Task('0 0 9 * * 1', 'weekly_performance_report')
```

### 2. Error Classification

Properly classify errors for appropriate handling:

```typescript
@Task('0 */10 * * * *', 'data_sync')
async sync_data(context: TaskContext) {
    try {
        await this.synchronize_data()
        
    } catch (error) {
        if (this.is_network_error(error)) {
            // Retry network errors
            throw_task_retry('NETWORK_ERROR', error.message)
            
        } else if (this.is_data_error(error)) {
            // Don't retry data validation errors
            throw_task_crash('DATA_ERROR', error.message)
            
        } else {
            // Unknown error - investigate
            console.error('Unknown error in data sync:', error)
            throw_task_crash('UNKNOWN_ERROR', 'Unexpected error occurred')
        }
    }
}
```

### 3. Resource Management

Clean up resources properly:

```typescript
@Task('0 0 1 * * *', 'database_maintenance')
async database_maintenance(context: TaskContext) {
    const connection = await this.create_db_connection()
    
    try {
        await this.optimize_tables(connection)
        await this.update_statistics(connection)
        
    } finally {
        // Always clean up
        await connection.close()
    }
}
```

### 4. Timezone Awareness

Be explicit about timezone requirements:

```typescript
// For global applications
@Task('0 0 9 * * *', 'asia_morning_report', { tz: 'Asia/Shanghai' })
@Task('0 0 9 * * *', 'europe_morning_report', { tz: 'Europe/London' })
@Task('0 0 9 * * *', 'us_morning_report', { tz: 'America/New_York' })

// For UTC-based systems
@Task('0 0 0 * * *', 'daily_global_sync', { utc: true })
```

## Integration with Other Modules

### Database Operations

```typescript
import { MongodbService } from '@tarpit/mongodb'

@TpSchedule({ 
    imports: [ScheduleModule, MongodbModule],
    providers: [MongodbService]
})
class DatabaseScheduler {
    
    constructor(private mongodb: MongodbService) {}
    
    @Task('0 0 2 * * *', 'backup_database')
    async backup_database(context: TaskContext) {
        const db = this.mongodb.db
        // Perform backup operations
    }
}
```

### HTTP Notifications

```typescript
import { HttpClient } from '@tarpit/http'

@TpSchedule({
    imports: [ScheduleModule, HttpModule],
    providers: [HttpClient]
})
class NotificationScheduler {
    
    constructor(private http: HttpClient) {}
    
    @Task('0 0 9 * * 1-5', 'send_weekly_report')
    async send_report(context: TaskContext) {
        const report = await this.generate_report()
        
        await this.http.post('/api/notifications', {
            type: 'weekly_report',
            data: report
        })
    }
}
```

## Performance Considerations

### 1. Task Duration

Keep tasks lightweight and fast:

```typescript
@Task('*/30 * * * * *', 'quick_health_check')
async health_check(context: TaskContext) {
    // This should complete in < 1 second
    const status = await this.ping_service()
    if (!status.healthy) {
        throw_task_retry('UNHEALTHY', 'Service health check failed')
    }
}
```

### 2. Concurrent Execution

Be aware of task overlap:

```typescript
@Task('0 */5 * * * *', 'data_processing')
async process_data(context: TaskContext) {
    // Check if previous execution is still running
    if (await this.is_processing_active()) {
        throw_task_ignore('STILL_RUNNING', 'Previous execution still active')
    }
    
    await this.process_large_dataset()
}
```

### 3. Memory Management

Clean up large objects:

```typescript
@Task('0 0 3 * * *', 'large_data_task')
async process_large_data(context: TaskContext) {
    let data = await this.load_large_dataset()
    
    try {
        await this.process_dataset(data)
        
    } finally {
        // Explicit cleanup for large objects
        data = null
        global.gc?.() // Force garbage collection if available
    }
}
```

## Next Steps

- [Basic Usage](./1-basic-usage.md) - Getting started with task scheduling
- [Cron Expressions](./2-cron-expressions.md) - Detailed cron expression guide
- [Error Handling](./3-error-handling.md) - Comprehensive error handling patterns
- [Task Management](./4-task-management.md) - Advanced task control and monitoring
- [Examples](./5-examples.md) - Real-world scheduling examples
