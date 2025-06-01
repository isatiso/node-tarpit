import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { load_config } from '@tarpit/config'
import { 
    ScheduleModule, 
    TpSchedule, 
    Task, 
    TaskContext,
    ScheduleInspector,
    throw_task_retry,
    throw_task_crash,
    mission_completed
} from '@tarpit/schedule'

// Example services for demonstration
@TpService()
class DatabaseService {
    private connection_healthy = true
    
    async cleanup_old_records(): Promise<number> {
        console.log('   🗑️  Cleaning up old database records...')
        await new Promise(resolve => setTimeout(resolve, 500))
        const cleaned = Math.floor(Math.random() * 100) + 50
        console.log(`   ✅ Cleaned up ${cleaned} old records`)
        return cleaned
    }
    
    async backup_data(): Promise<{ size: string, duration: number }> {
        console.log('   💾 Starting database backup...')
        const start = Date.now()
        await new Promise(resolve => setTimeout(resolve, 1000))
        const duration = Date.now() - start
        console.log(`   ✅ Backup completed in ${duration}ms`)
        return { size: '145MB', duration }
    }
    
    async check_health(): Promise<boolean> {
        console.log('   🔍 Checking database health...')
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Simulate occasional health issues
        if (Math.random() < 0.1) {
            this.connection_healthy = false
            console.log('   ❌ Database health check failed')
            return false
        }
        
        this.connection_healthy = true
        console.log('   ✅ Database is healthy')
        return true
    }
}

@TpService()
class EmailService {
    async send_report(report: any): Promise<void> {
        console.log('   📧 Sending email report...')
        console.log(`   📄 Report type: ${report.type}`)
        console.log(`   📊 Data points: ${report.data_points}`)
        await new Promise(resolve => setTimeout(resolve, 300))
        console.log('   ✅ Email sent successfully')
    }
    
    async send_alert(alert: { type: string, message: string }): Promise<void> {
        console.log(`   🚨 ALERT: ${alert.type} - ${alert.message}`)
        await new Promise(resolve => setTimeout(resolve, 100))
    }
}

@TpService()
class MonitoringService {
    private metrics = {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0
    }
    
    async collect_system_metrics() {
        console.log('   📊 Collecting system metrics...')
        
        // Simulate metric collection
        this.metrics = {
            cpu_usage: Math.floor(Math.random() * 100),
            memory_usage: Math.floor(Math.random() * 100),
            disk_usage: Math.floor(Math.random() * 100)
        }
        
        console.log(`   💻 CPU: ${this.metrics.cpu_usage}%, Memory: ${this.metrics.memory_usage}%, Disk: ${this.metrics.disk_usage}%`)
        
        return this.metrics
    }
    
    get_metrics() {
        return this.metrics
    }
}

// Main scheduler demonstrating various patterns
@TpSchedule({
    imports: [ScheduleModule],
    providers: [DatabaseService, EmailService, MonitoringService]
})
class BasicScheduler {
    
    constructor(
        private database: DatabaseService,
        private email: EmailService,
        private monitoring: MonitoringService
    ) {}
    
    // High-frequency monitoring task
    @Task('*/10 * * * * *', 'system_health_check')
    async system_health_check(context: TaskContext) {
        console.log(`🔄 [${context.unit.task_name}] Running system health check...`)
        
        try {
            // Check database health
            const db_healthy = await this.database.check_health()
            
            // Collect system metrics
            const metrics = await this.monitoring.collect_system_metrics()
            
            // Check for critical issues
            if (!db_healthy) {
                throw new Error('Database health check failed')
            }
            
            if (metrics.cpu_usage > 90 || metrics.memory_usage > 90) {
                await this.email.send_alert({
                    type: 'HIGH_RESOURCE_USAGE',
                    message: `CPU: ${metrics.cpu_usage}%, Memory: ${metrics.memory_usage}%`
                })
            }
            
            console.log(`✅ [${context.unit.task_name}] Health check completed successfully`)
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error(`❌ [${context.unit.task_name}] Health check failed:`, errorMessage)
            
            if (context.count < 3) {
                throw_task_retry(1, `Health check failed: ${errorMessage}`)
            } else {
                // Send critical alert after 3 failures
                await this.email.send_alert({
                    type: 'CRITICAL_SYSTEM_FAILURE', 
                    message: 'Health check failed repeatedly'
                })
                throw_task_crash('CRITICAL_FAILURE', 'Health check failed too many times')
            }
        }
    }
    
    // Hourly data processing
    @Task('0 0 * * * *', 'hourly_data_processing')
    async hourly_data_processing(context: TaskContext<{ processed_records: number, processing_duration: number }>) {
        console.log(`📈 [${context.unit.task_name}] Starting hourly data processing...`)
        
        const hour = new Date().getHours()
        console.log(`   🕐 Processing data for hour: ${hour}`)
        
        try {
            // Simulate data processing
            const start_time = Date.now()
            const record_count = Math.floor(Math.random() * 1000) + 500
            
            console.log(`   📊 Processing ${record_count} records...`)
            await new Promise(resolve => setTimeout(resolve, 800))
            
            const duration = Date.now() - start_time
            console.log(`✅ [${context.unit.task_name}] Processed ${record_count} records in ${duration}ms`)
            
            // Store processing stats in context
            context.set('processed_records', record_count)
            context.set('processing_duration', duration)
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error(`❌ [${context.unit.task_name}] Data processing failed:`, errorMessage)
            throw_task_crash('PROCESSING_ERROR', 'Data processing failed')
        }
    }
    
    // Daily maintenance at 3 AM
    @Task('0 0 3 * * *', 'daily_maintenance', { tz: 'Asia/Shanghai' })
    async daily_maintenance(context: TaskContext) {
        console.log(`🔧 [${context.unit.task_name}] Starting daily maintenance...`)
        
        try {
            // Clean up old records
            const cleaned_count = await this.database.cleanup_old_records()
            
            // Backup data
            const backup_result = await this.database.backup_data()
            
            // Send maintenance report
            await this.email.send_report({
                type: 'daily_maintenance',
                data_points: cleaned_count,
                backup_size: backup_result.size,
                backup_duration: backup_result.duration,
                timestamp: new Date().toISOString()
            })
            
            console.log(`✅ [${context.unit.task_name}] Daily maintenance completed successfully`)
            mission_completed()
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error(`❌ [${context.unit.task_name}] Maintenance failed:`, errorMessage)
            
            // Send failure alert
            await this.email.send_alert({
                type: 'MAINTENANCE_FAILURE',
                message: `Daily maintenance failed: ${errorMessage}`
            })
            
            throw_task_crash('MAINTENANCE_ERROR', 'Daily maintenance failed')
        }
    }
    
    // Weekly report on Mondays at 9 AM
    @Task('0 0 9 * * 1', 'weekly_report', { tz: 'Asia/Shanghai' })
    async weekly_report(context: TaskContext) {
        console.log(`📊 [${context.unit.task_name}] Generating weekly report...`)
        
        try {
            // Collect weekly metrics
            const metrics = this.monitoring.get_metrics()
            const week_start = new Date()
            week_start.setDate(week_start.getDate() - 7)
            
            console.log('   📈 Analyzing weekly performance...')
            await new Promise(resolve => setTimeout(resolve, 600))
            
            const report_data = {
                type: 'weekly_performance',
                week_start: week_start.toISOString(),
                week_end: new Date().toISOString(),
                data_points: Math.floor(Math.random() * 10000) + 5000,
                avg_cpu: metrics.cpu_usage,
                avg_memory: metrics.memory_usage,
                avg_disk: metrics.disk_usage,
                uptime_percentage: 99.8 + Math.random() * 0.2
            }
            
            await this.email.send_report(report_data)
            
            console.log(`✅ [${context.unit.task_name}] Weekly report sent successfully`)
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error(`❌ [${context.unit.task_name}] Weekly report failed:`, errorMessage)
            throw_task_retry(1, 'Failed to generate weekly report')
        }
    }
    
    // Conditional task - only run during business hours
    @Task('0 */30 9-17 * * 1-5', 'business_hours_check')
    async business_hours_check(context: TaskContext) {
        console.log(`🏢 [${context.unit.task_name}] Business hours monitoring...`)
        
        const now = new Date()
        const hour = now.getHours()
        const day = now.getDay()
        
        // Double-check we're in business hours (Mon-Fri, 9-17)
        if (day === 0 || day === 6 || hour < 9 || hour >= 18) {
            console.log(`   ⏰ Outside business hours, skipping check`)
            return
        }
        
        console.log(`   🕒 Business hours active: ${hour}:${now.getMinutes().toString().padStart(2, '0')}`)
        
        // Perform business-specific monitoring
        const metrics = await this.monitoring.collect_system_metrics()
        
        // Alert if high load during business hours
        if (metrics.cpu_usage > 80) {
            await this.email.send_alert({
                type: 'BUSINESS_HOURS_HIGH_LOAD',
                message: `High CPU usage during business hours: ${metrics.cpu_usage}%`
            })
        }
        
        console.log(`✅ [${context.unit.task_name}] Business hours check completed`)
    }
}

// Task management service for demonstration
@TpService()
class TaskManager {
    
    constructor(private inspector: ScheduleInspector) {}
    
    async list_all_tasks() {
        console.log('\n📋 === Active Scheduled Tasks ===')
        
        const tasks = this.inspector.list_task()
        
        if (tasks.length === 0) {
            console.log('   No active tasks found')
            return
        }
        
        tasks.forEach((task, index) => {
            console.log(`\n   ${index + 1}. ${task.name}`)
            console.log(`      ID: ${task.id}`)
            console.log(`      Cron: ${task.crontab}`)
            console.log(`      Position: ${task.pos}`)
            console.log(`      Next run: ${task.next_exec_date_string}`)
        })
        
        console.log(`\n   Total active tasks: ${tasks.length}`)
    }
    
    async get_task_details(task_name: string) {
        console.log(`\n🔍 === Task Details: ${task_name} ===`)
        
        const tasks = this.inspector.list_task()
        const task = tasks.find(t => t.name === task_name)
        
        if (!task) {
            console.log(`   Task '${task_name}' not found`)
            return
        }
        
        console.log(`   ID: ${task.id}`)
        console.log(`   Name: ${task.name}`)
        console.log(`   Cron Expression: ${task.crontab}`)
        console.log(`   Position: ${task.pos}`)
        console.log(`   Next Execution: ${task.next_exec_date_string}`)
        console.log(`   Next Timestamp: ${task.next_exec_ts}`)
        
        // Calculate time until next execution
        const next_run = new Date(task.next_exec_ts)
        const now = new Date()
        const time_until = next_run.getTime() - now.getTime()
        
        if (time_until > 0) {
            const seconds = Math.floor(time_until / 1000)
            const minutes = Math.floor(seconds / 60)
            const hours = Math.floor(minutes / 60)
            
            if (hours > 0) {
                console.log(`   Time until next run: ${hours}h ${minutes % 60}m ${seconds % 60}s`)
            } else if (minutes > 0) {
                console.log(`   Time until next run: ${minutes}m ${seconds % 60}s`)
            } else {
                console.log(`   Time until next run: ${seconds}s`)
            }
        } else {
            console.log(`   Next run: Overdue by ${Math.abs(Math.floor(time_until / 1000))}s`)
        }
    }
    
    async run_task_manually(task_name: string) {
        console.log(`\n▶️  === Manually Running Task: ${task_name} ===`)
        
        const tasks = this.inspector.list_task()
        const task = tasks.find(t => t.name === task_name)
        
        if (!task) {
            console.log(`   Task '${task_name}' not found`)
            return
        }
        
        try {
            console.log(`   🚀 Executing task: ${task.name}`)
            await this.inspector.run(task.id)
            console.log(`   ✅ Task executed successfully`)
        } catch (error) {
            console.error(`   ❌ Task execution failed:`, error)
        }
    }
}

// Demo runner
@TpService()
class ScheduleDemo {
    
    constructor(
        private task_manager: TaskManager
    ) {}
    
    async run_demo() {
        console.log('\n=== Tarpit Schedule Module Demo ===\n')
        
        console.log('🚀 Starting scheduler demo...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // List all active tasks
        await this.task_manager.list_all_tasks()
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Show details for specific tasks
        await this.task_manager.get_task_details('system_health_check')
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Manually run a task for demonstration
        console.log('\n🎯 Running a task manually for demonstration...')
        await this.task_manager.run_task_manually('hourly_data_processing')
        
        console.log('\n👀 Monitoring scheduled task execution...')
        console.log('   Watch the logs above to see tasks running automatically')
        console.log('   The system_health_check runs every 10 seconds')
        console.log('   Other tasks run according to their cron schedules')
        
        console.log('\n📝 Demo will run for 60 seconds to show task execution...')
    }
}

async function main() {
    console.log('=== Tarpit Schedule Basic Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    
    const platform = new Platform(config)
        .import(ScheduleModule)
        .import(BasicScheduler)
        .import(TaskManager)
        .import(ScheduleDemo)
    
    try {
        console.log('🔧 Building platform...')
        await platform.start()
        console.log('✅ Platform started successfully')
        
        // Run the demo
        const demo = platform.expose(ScheduleDemo)!
        await demo.run_demo()
        
        // Keep running for 60 seconds to show scheduled execution
        console.log('\n⏱️  Running for 60 seconds to demonstrate scheduling...')
        await new Promise(resolve => setTimeout(resolve, 60000))
        
    } catch (error) {
        console.error('❌ Demo failed:', error)
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack)
        }
    } finally {
        console.log('\n🛑 Stopping platform...')
        await platform.terminate()
        console.log('✅ Platform stopped cleanly')
        process.exit(0)
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Unhandled error:', error)
        process.exit(1)
    })
} 