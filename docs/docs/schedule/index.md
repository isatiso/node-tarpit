---
sidebar_position: 1
---

# Schedule Module

:::info Working Examples
See [schedule examples](https://github.com/isatiso/node-tarpit/blob/main/example/schedule/) for complete working examples.
:::

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

const platform = new Platform({}).import(MyScheduler)
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

## Best Practices

### 1. Use Descriptive Task Names

```typescript
// ✅ Good - Clear, descriptive names
@Task('0 0 2 * * *', 'cleanup_expired_sessions')
@Task('0 */15 * * * *', 'sync_user_analytics')
@Task('0 0 9 * * 1', 'weekly_inventory_report')

// ❌ Avoid - Vague names
@Task('0 0 2 * * *', 'task1')
@Task('0 */15 * * * *', 'sync')
```

### 2. Handle Errors Gracefully

```typescript
@Task('0 */5 * * * *', 'data_processor')
async process_data(context: TaskContext) {
    try {
        await this.data_service.process_batch()
        mission_completed() // Mark as successful
    } catch (error) {
        if (error instanceof NetworkError && context.count < 3) {
            throw_task_retry() // Retry up to 3 times
        } else {
            console.error('Task failed permanently:', error)
            throw_task_crash() // Mark as crashed
        }
    }
}
```

### 3. Use Appropriate Scheduling Intervals

```typescript
// ✅ Good - Reasonable intervals
@Task('0 */10 * * * *', 'health_check')          // Every 10 minutes
@Task('0 0 1 * * *', 'daily_backup')             // Daily at 1 AM
@Task('0 0 9 * * 1', 'weekly_report')            // Weekly on Mondays

// ❌ Avoid - Too frequent for heavy tasks
@Task('*/5 * * * * *', 'expensive_operation')    // Every 5 seconds (too frequent)
```

### 4. Use Dependency Injection

```typescript
@TpService()
class EmailService {
    async send_report(data: any) {
        // Send email logic
    }
}

@TpSchedule({
    imports: [ScheduleModule]
})
class ReportScheduler {
    constructor(private email_service: EmailService) {}

    @Task('0 0 9 * * 1', 'weekly_sales_report')
    async send_weekly_report(context: TaskContext) {
        const report_data = await this.generate_report()
        await this.email_service.send_report(report_data)
    }
}
```

## Configuration

Configure the schedule module in your application:

```typescript
const config = load_config({
    schedule: {
        enable: true,
        timezone: 'Asia/Shanghai',      // Default timezone
        max_retries: 3,                 // Default max retry count
        retry_delay: 5000,              // Delay between retries (ms)
        task_timeout: 300000,           // Task timeout (5 minutes)
        hooks: {
            enable_logging: true,        // Enable task logging
            log_level: 'info'           // Log level
        }
    }
})
```

## Next Steps

- Check out the [examples repository](https://github.com/isatiso/node-tarpit/tree/main/example/schedule) for real-world use cases
- Learn about error handling and task management strategies
- Explore the Schedule module API documentation
