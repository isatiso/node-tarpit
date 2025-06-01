---
layout: default
title: Basic Usage
parent: Schedule
nav_order: 1
---

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
        private database: DatabaseService,
        private email: EmailService
    ) {}
    
    @Task('0 0 2 * * *', 'nightly_cleanup')
    async nightly_maintenance(context: TaskContext) {
        console.log('Starting nightly maintenance...')
        
        // Clean up old records
        await this.database.cleanup_old_records()
        
        // Backup data
        await this.database.backup_data()
        
        console.log('Nightly maintenance completed')
    }
    
    @Task('0 0 9 * * 1', 'weekly_report')
    async send_weekly_report(context: TaskContext) {
        console.log('Generating weekly report...')
        
        const report_data = {
            week: new Date().toISOString().substring(0, 10),
            summary: 'Weekly operations summary'
        }
        
        await this.email.send_report(report_data)
        console.log('Weekly report sent')
    }
}
```

## Configuration

Configure the platform and scheduler with custom options:

```typescript
import { load_config } from '@tarpit/config'

// Configuration interface
interface AppConfig {
    schedule?: {
        timezone?: string
        max_retries?: number
    }
    database?: {
        url: string
    }
}

// Load configuration
const config = load_config<AppConfig>({
    schedule: {
        timezone: 'Asia/Shanghai',
        max_retries: 3
    },
    database: {
        url: 'mongodb://localhost:27017/myapp'
    }
})

// Use configuration in scheduler
@TpSchedule({
    imports: [ScheduleModule],
    providers: [DatabaseService]
})
class ConfigurableScheduler {
    
    constructor(
        private database: DatabaseService,
        @ConfigValue('schedule.timezone') private timezone: string,
        @ConfigValue('schedule.max_retries') private max_retries: number
    ) {}
    
    @Task('0 0 8 * * *', 'morning_sync')
    async morning_sync(context: TaskContext) {
        console.log(`Running morning sync in timezone: ${this.timezone}`)
        
        try {
            await this.database.sync_data()
        } catch (error) {
            if (context.count < this.max_retries) {
                throw_task_retry('SYNC_ERROR', `Sync failed: ${error.message}`)
            } else {
                throw_task_crash('MAX_RETRIES', 'Max retries exceeded')
            }
        }
    }
}

const platform = new Platform(config).bootstrap(ConfigurableScheduler)
```

## Error Handling Basics

Handle errors in tasks using throw functions or return patterns:

```typescript
import { throw_task_retry, throw_task_crash, mission_completed } from '@tarpit/schedule'

@TpSchedule({ imports: [ScheduleModule] })
class ErrorHandlingScheduler {
    
    @Task('0 */10 * * * *', 'api_health_check')
    async check_api_health(context: TaskContext) {
        try {
            const response = await this.ping_api()
            
            if (response.status === 'healthy') {
                console.log('API is healthy')
                mission_completed() // Mark as successfully completed
            } else {
                throw new Error('API returned unhealthy status')
            }
            
        } catch (error) {
            console.error('Health check failed:', error.message)
            
            if (context.count < 3) {
                // Retry up to 3 times
                throw_task_retry('API_DOWN', `Health check failed: ${error.message}`)
            } else {
                // Give up after 3 retries
                throw_task_crash('API_CRITICAL', 'API health check failed repeatedly')
            }
        }
    }
    
    @Task('0 0 * * * *', 'data_processing')
    async process_hourly_data(context: TaskContext) {
        const data = await this.fetch_hourly_data()
        
        if (data.length === 0) {
            console.log('No data to process this hour')
            return // Normal completion, no special handling needed
        }
        
        try {
            await this.process_data(data)
            console.log(`Processed ${data.length} records`)
            
        } catch (error) {
            console.error('Data processing failed:', error)
            
            // For data processing errors, don't retry
            throw_task_crash('PROCESSING_ERROR', 'Data processing failed')
        }
    }
    
    private async ping_api() {
        // Simulate API ping
        if (Math.random() < 0.8) {
            return { status: 'healthy' }
        } else {
            throw new Error('Connection timeout')
        }
    }
    
    private async fetch_hourly_data() {
        // Simulate data fetching
        return Array.from({ length: Math.floor(Math.random() * 10) }, (_, i) => ({ id: i }))
    }
    
    private async process_data(data: any[]) {
        // Simulate data processing
        await new Promise(resolve => setTimeout(resolve, 100))
    }
}
```

## Multiple Schedulers

You can organize tasks into multiple scheduler classes:

```typescript
// Database-related tasks
@TpSchedule({
    imports: [ScheduleModule],
    providers: [DatabaseService]
})
class DatabaseScheduler {
    
    constructor(private database: DatabaseService) {}
    
    @Task('0 0 3 * * *', 'backup_database')
    async backup() {
        await this.database.backup_data()
    }
    
    @Task('0 30 2 * * *', 'cleanup_logs')
    async cleanup() {
        await this.database.cleanup_old_records()
    }
}

// Notification-related tasks
@TpSchedule({
    imports: [ScheduleModule],
    providers: [EmailService]
})
class NotificationScheduler {
    
    constructor(private email: EmailService) {}
    
    @Task('0 0 9 * * 1-5', 'daily_summary')
    async daily_summary() {
        await this.email.send_report({ type: 'daily' })
    }
    
    @Task('0 0 9 * * 1', 'weekly_report')
    async weekly_report() {
        await this.email.send_report({ type: 'weekly' })
    }
}

// Main application entry
@TpEntry({
    imports: [DatabaseScheduler, NotificationScheduler]
})
class App {
    // Main application logic
}

const platform = new Platform({}).bootstrap(App)
```

## Testing Scheduled Tasks

Test your scheduled tasks by calling them directly:

```typescript
import { Platform } from '@tarpit/core'
import { ScheduleModule, TaskContext } from '@tarpit/schedule'

// Create a test scheduler
@TpSchedule({ imports: [ScheduleModule] })
class TestScheduler {
    
    @Task('0 * * * * *', 'test_task')
    async test_task(context: TaskContext) {
        console.log('Test task executed')
        return { success: true, timestamp: Date.now() }
    }
}

// Test the scheduler
async function test_scheduler() {
    const platform = new Platform({}).bootstrap(TestScheduler)
    await platform.start()
    
    try {
        const scheduler = platform.expose(TestScheduler)!
        
        // Create a mock task context
        const mock_context = {
            unit: {
                task_name: 'test_task',
                crontab_str: '0 * * * * *',
                position: 'TestScheduler.test_task'
            },
            count: 0,
            get: () => undefined,
            set: () => {},
        } as TaskContext
        
        // Call the task directly
        const result = await scheduler.test_task(mock_context)
        console.log('Task result:', result)
        
    } finally {
        await platform.terminate()
    }
}

test_scheduler().catch(console.error)
```

## Monitoring and Logging

Monitor your scheduled tasks using the built-in logging:

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class MonitoredScheduler {
    
    @Task('0 */5 * * * *', 'monitored_task')
    async monitored_task(context: TaskContext) {
        const start_time = Date.now()
        
        console.log(`[${context.unit.task_name}] Starting execution`)
        console.log(`[${context.unit.task_name}] Previous failures: ${context.count}`)
        
        try {
            // Your task logic
            await this.do_work()
            
            const duration = Date.now() - start_time
            console.log(`[${context.unit.task_name}] Completed in ${duration}ms`)
            
        } catch (error) {
            const duration = Date.now() - start_time
            console.error(`[${context.unit.task_name}] Failed after ${duration}ms:`, error)
            throw error // Re-throw to trigger error handling
        }
    }
    
    private async do_work() {
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}
```

## Best Practices

### 1. Use Descriptive Task Names

```typescript
// Good
@Task('0 0 3 * * *', 'cleanup_expired_user_sessions')
@Task('0 */15 * * * *', 'health_check_external_apis')

// Avoid
@Task('0 0 3 * * *', 'task1')
@Task('0 */15 * * * *', 'check')
```

### 2. Keep Tasks Simple and Fast

```typescript
@Task('*/30 * * * * *', 'quick_health_check')
async health_check() {
    // This should complete quickly
    const status = await this.simple_ping()
    if (!status.ok) {
        throw_task_retry('HEALTH_FAIL', 'Health check failed')
    }
}
```

### 3. Handle Errors Appropriately

```typescript
@Task('0 0 2 * * *', 'data_backup')
async backup_data(context: TaskContext) {
    try {
        await this.perform_backup()
    } catch (error) {
        if (this.is_retryable(error)) {
            throw_task_retry('BACKUP_RETRY', error.message)
        } else {
            throw_task_crash('BACKUP_FAIL', error.message)
        }
    }
}
```

### 4. Use Appropriate Cron Expressions

```typescript
// For frequent monitoring
@Task('*/10 * * * * *', 'system_monitor')  // Every 10 seconds

// For regular maintenance
@Task('0 0 3 * * *', 'daily_cleanup')      // Daily at 3 AM

// For business processes
@Task('0 0 9 * * 1-5', 'business_report')  // Weekdays at 9 AM
```

## Common Patterns

### Data Processing Pipeline

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class DataPipeline {
    
    @Task('0 */10 * * * *', 'fetch_new_data')
    async fetch_data() {
        // Fetch new data every 10 minutes
    }
    
    @Task('0 0 * * * *', 'process_hourly_data')
    async process_data() {
        // Process accumulated data every hour
    }
    
    @Task('0 0 6 * * *', 'generate_daily_reports')
    async daily_reports() {
        // Generate reports at 6 AM daily
    }
}
```

### Health Monitoring

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class HealthMonitor {
    
    @Task('*/30 * * * * *', 'check_database_health')
    async db_health() {
        // Check database connectivity
    }
    
    @Task('0 * * * * *', 'check_api_endpoints')
    async api_health() {
        // Check external API health
    }
    
    @Task('0 */5 * * * *', 'system_resource_check')
    async resource_check() {
        // Monitor CPU, memory, disk usage
    }
}
```

### Cleanup and Maintenance

```typescript
@TpSchedule({ imports: [ScheduleModule] })
class MaintenanceScheduler {
    
    @Task('0 0 2 * * *', 'cleanup_temp_files')
    async cleanup_temp() {
        // Clean temporary files daily
    }
    
    @Task('0 0 3 * * 0', 'weekly_log_rotation')
    async rotate_logs() {
        // Rotate logs weekly
    }
    
    @Task('0 0 4 1 * *', 'monthly_archive')
    async monthly_archive() {
        // Archive old data monthly
    }
}
```

## Next Steps

- [Cron Expressions](./2-cron-expressions.md) - Detailed guide to cron expressions
- [Error Handling](./3-error-handling.md) - Advanced error handling patterns
- [Task Management](./4-task-management.md) - Managing and monitoring tasks
- [Examples](./5-examples.md) - Real-world examples and use cases 