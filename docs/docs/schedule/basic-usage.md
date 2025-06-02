# Basic Usage

This guide covers the fundamentals of using the Tarpit Schedule module for task scheduling.

## Installation and Setup

The Schedule module is part of the Tarpit framework. To use it:

```typescript
import { Platform } from '@tarpit/core'
import { ScheduleModule, TpSchedule, Task, TaskContext } from '@tarpit/schedule'

// Create a scheduler class
@TpSchedule({
    imports: [ScheduleModule]
})
class MyScheduler {
    // Task definitions go here
}

// Bootstrap the platform
const platform = new Platform({}).bootstrap(MyScheduler)
await platform.start()
```

## Creating Your First Task

The simplest task uses the `@Task` decorator with a cron expression:

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class SimpleScheduler {
    
    @Task('*/5 * * * * *', 'hello_world')
    async say_hello(context: TaskContext) {
        console.log(`Hello from scheduled task at ${new Date().toISOString()}`)
    }
}
```

This task runs every 5 seconds and prints a greeting message.

## Task Context

Every task method receives a `TaskContext` parameter that provides:

```typescript
@Task('0 * * * * *', 'context_example')
async example_task(context: TaskContext) {
    // Task metadata
    console.log('Task name:', context.unit.task_name)
    console.log('Cron expression:', context.unit.crontab_str)
    console.log('Position:', context.unit.position)
    
    // Failure count (for retry scenarios)
    console.log('Failure count:', context.count)
    
    // Custom data storage
    context.set('start_time', Date.now())
    const start = context.get('start_time')
    
    // Your task logic here
    await this.do_work()
    
    const duration = Date.now() - start
    console.log(`Task completed in ${duration}ms`)
}
```

## Cron Expression Basics

Tarpit uses 6-field cron expressions (including seconds):

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └─ Day of week (0-7, 0=Sunday)
│ │ │ │ └─── Month (1-12)
│ │ │ └───── Day of month (1-31)
│ │ └─────── Hour (0-23)
│ └───────── Minute (0-59)
└─────────── Second (0-59)
```

### Common Examples

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class CronExamples {
    
    // Every 30 seconds
    @Task('*/30 * * * * *', 'every_30_seconds')
    async frequent_task() {
        console.log('Running every 30 seconds')
    }
    
    // Every minute at :00 seconds
    @Task('0 * * * * *', 'every_minute')
    async minute_task() {
        console.log('Running every minute')
    }
    
    // Every hour at 15 minutes past
    @Task('0 15 * * * *', 'hourly_at_15')
    async hourly_task() {
        console.log('Running at 15 minutes past every hour')
    }
    
    // Daily at 3:30 AM
    @Task('0 30 3 * * *', 'daily_maintenance')
    async daily_task() {
        console.log('Daily maintenance at 3:30 AM')
    }
    
    // Monday through Friday at 9:00 AM
    @Task('0 0 9 * * 1-5', 'weekday_morning')
    async weekday_task() {
        console.log('Weekday morning task')
    }
    
    // First day of every month at midnight
    @Task('0 0 0 1 * *', 'monthly_report')
    async monthly_task() {
        console.log('Monthly report generation')
    }
}
```

## Timezone Support

Specify timezone for tasks to ensure they run at the correct local time:

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class TimezoneExamples {
    
    // Run at 9 AM Beijing time
    @Task('0 0 9 * * *', 'beijing_morning', { tz: 'Asia/Shanghai' })
    async beijing_task() {
        console.log('Good morning from Beijing!')
    }
    
    // Run at 9 AM New York time
    @Task('0 0 9 * * *', 'ny_morning', { tz: 'America/New_York' })
    async ny_task() {
        console.log('Good morning from New York!')
    }
    
    // Run at 9 AM UTC
    @Task('0 0 9 * * *', 'utc_morning', { utc: true })
    async utc_task() {
        console.log('Good morning UTC!')
    }
    
    // System timezone (default)
    @Task('0 0 9 * * *', 'local_morning')
    async local_task() {
        console.log('Good morning local time!')
    }
}
```

## Task Dependencies

Tasks can use dependency injection to access services:

```typescript
import { TpService } from '@tarpit/core'

// Define a service
@TpService()
class DatabaseService {
    async cleanup_old_records() {
        console.log('Cleaning up old database records...')
        // Database cleanup logic
    }
    
    async backup_data() {
        console.log('Backing up data...')
        // Backup logic
    }
}

@TpService()
class EmailService {
    async send_report(data: any) {
        console.log('Sending email report:', data)
        // Email sending logic
    }
}

// Use services in scheduler
@TpSchedule({
    imports: [ScheduleModule],
    providers: [DatabaseService, EmailService]
})
class ServiceScheduler {
    
    constructor(
        private database_service: DatabaseService,
        private email_service: EmailService
    ) {}
    
    @Task('0 0 2 * * *', 'nightly_cleanup')
    async nightly_cleanup(context: TaskContext) {
        await this.database_service.cleanup_old_records()
        console.log('Nightly database cleanup completed')
    }
    
    @Task('0 0 6 * * 1', 'weekly_backup')
    async weekly_backup(context: TaskContext) {
        const data = await this.database_service.backup_data()
        await this.email_service.send_report(data)
        console.log('Weekly backup and report sent')
    }
}
```

## Error Handling and Retries

Tasks can handle errors and implement retry logic:

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class ErrorHandlingScheduler {
    
    @Task('*/10 * * * * *', 'retry_example')
    async task_with_retries(context: TaskContext) {
        const max_retries = 3
        
        if (context.count < max_retries) {
            try {
                await this.risky_operation()
                console.log('Task completed successfully')
            } catch (error) {
                console.log(`Attempt ${context.count + 1} failed:`, error.message)
                throw error // This will trigger a retry
            }
        } else {
            console.log('Max retries reached, giving up')
            // Log to error monitoring, send alert, etc.
        }
    }
    
    private async risky_operation() {
        // Simulated operation that might fail
        if (Math.random() > 0.7) {
            throw new Error('Random failure')
        }
        return 'Success'
    }
}
```

## Best Practices

1. **Use descriptive task names** for easy identification
2. **Handle errors gracefully** to prevent crashes
3. **Consider timezone requirements** for time-sensitive tasks
4. **Keep tasks lightweight** - offload heavy work to services
5. **Use dependency injection** for testability
6. **Log task execution** for monitoring and debugging
7. **Be careful with overlapping executions** - tasks may run longer than their interval 