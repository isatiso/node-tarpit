import { Platform, TpConfigSchema } from '@tarpit/core'
import { load_config } from '@tarpit/config'
import { 
    ScheduleModule, 
    TpSchedule, 
    Task, 
    TaskContext,
    ScheduleInspector
} from '@tarpit/schedule'

// Simple test scheduler
@TpSchedule({
    imports: [ScheduleModule]
})
class SimpleTestScheduler {
    private execution_count = 0
    
    @Task('*/5 * * * * *', 'simple_test_task')
    async simple_test_task(context: TaskContext<{ execution_number: number, execution_time: number }>) {
        this.execution_count++
        
        console.log(`🔄 [${context.unit.task_name}] Execution #${this.execution_count}`)
        console.log(`   📅 Current time: ${new Date().toISOString()}`)
        console.log(`   🔢 Failure count: ${context.count}`)
        console.log(`   📍 Position: ${context.unit.position}`)
        console.log(`   ⏰ Cron: ${context.unit.crontab_str}`)
        
        // Store execution data in context
        context.set('execution_number', this.execution_count)
        context.set('execution_time', Date.now())
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log(`✅ [${context.unit.task_name}] Completed execution #${this.execution_count}`)
        
        return {
            execution_number: this.execution_count,
            timestamp: new Date().toISOString(),
            success: true
        }
    }
    
    @Task('0 * * * * *', 'minute_task')
    async minute_task(context: TaskContext) {
        console.log(`⏰ [${context.unit.task_name}] Running minute task`)
        console.log(`   🕐 Current minute: ${new Date().getMinutes()}`)
        
        // Simulate minute-based processing
        const minute_data = {
            minute: new Date().getMinutes(),
            hour: new Date().getHours(),
            processed_items: Math.floor(Math.random() * 50) + 10
        }
        
        console.log(`   📊 Processed ${minute_data.processed_items} items`)
        console.log(`✅ [${context.unit.task_name}] Minute task completed`)
        
        return minute_data
    }
    
    get_execution_count(): number {
        return this.execution_count
    }
}

async function main() {
    console.log('=== Tarpit Schedule Simple Test ===\n')
    
    const config = load_config<TpConfigSchema>({})
    
    const platform = new Platform(config)
        .import(ScheduleModule)
        .import(SimpleTestScheduler)
    
    try {
        console.log('🔧 Building platform...')
        await platform.start()
        console.log('✅ Platform started successfully')
        
        // Get the scheduler and inspector
        const scheduler = platform.expose(SimpleTestScheduler)!
        const inspector = platform.expose(ScheduleInspector)!
        
        console.log('\n📋 === Active Tasks ===')
        const tasks = inspector.list_task()
        tasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.name} (${task.crontab})`)
            console.log(`   Next run: ${task.next_exec_date_string}`)
        })
        
        console.log('\n🚀 Starting task monitoring...')
        console.log('   The simple_test_task runs every 5 seconds')
        console.log('   The minute_task runs every minute')
        console.log('   Watch the execution logs below...\n')
        
        // Monitor for 30 seconds
        const start_time = Date.now()
        const monitor_duration = 30000 // 30 seconds
        
        while (Date.now() - start_time < monitor_duration) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const elapsed = Math.floor((Date.now() - start_time) / 1000)
            const remaining = Math.floor((monitor_duration - (Date.now() - start_time)) / 1000)
            
            if (elapsed % 10 === 0) {
                console.log(`\n📊 === Status Update (${elapsed}s elapsed, ${remaining}s remaining) ===`)
                console.log(`   Total executions: ${scheduler.get_execution_count()}`)
                
                // Show current task status
                const current_tasks = inspector.list_task()
                current_tasks.forEach(task => {
                    const next_run = new Date(task.next_exec_ts)
                    const time_until = next_run.getTime() - Date.now()
                    const seconds_until = Math.floor(time_until / 1000)
                    
                    if (seconds_until > 0) {
                        console.log(`   ${task.name}: next run in ${seconds_until}s`)
                    } else {
                        console.log(`   ${task.name}: should run now`)
                    }
                })
                console.log('')
            }
        }
        
        console.log('\n📈 === Final Statistics ===')
        console.log(`   Total executions: ${scheduler.get_execution_count()}`)
        console.log(`   Test duration: ${monitor_duration / 1000} seconds`)
        console.log(`   Average execution rate: ${(scheduler.get_execution_count() / (monitor_duration / 1000)).toFixed(2)} executions/second`)
        
    } catch (error) {
        console.error('❌ Test failed:', error)
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