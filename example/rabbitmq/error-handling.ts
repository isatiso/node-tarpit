import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { 
    RabbitmqModule, 
    TpProducer, 
    TpConsumer, 
    Enqueue, 
    Consume, 
    RabbitMessage,
    RabbitDefine,
    RabbitDefineToken,
    ack_message,
    requeue_message,
    kill_message,
    Ack,
    MessageRequeue,
    MessageDead
} from '@tarpit/rabbitmq'

// Define message topology for error handling demo
const error_topology = new RabbitDefine()
    .define_queue('tasks.normal', { durable: true })
    .define_queue('tasks.retry', { durable: true })
    .define_queue('tasks.error_prone', { durable: true })
    .define_queue('tasks.validation', { durable: true })

// Task interfaces
interface Task {
    id: string
    type: 'normal' | 'retry' | 'error_prone' | 'validation'
    data: any
    created_at: Date
    retry_count?: number
}

interface ProcessingResult {
    task_id: string
    status: 'success' | 'failed' | 'retried'
    message: string
    processed_at: Date
}

// Task processor service
@TpService()
class TaskProcessor {
    
    // Simulate different types of processing that might fail
    async process_normal_task(data: any): Promise<ProcessingResult> {
        console.log('   🔧 Processing normal task...')
        await new Promise(resolve => setTimeout(resolve, 100))
        
        return {
            task_id: data.id,
            status: 'success',
            message: 'Task completed successfully',
            processed_at: new Date()
        }
    }
    
    async process_retry_task(data: any): Promise<ProcessingResult> {
        console.log('   🔧 Processing retry task...')
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Simulate random failure (70% success rate)
        if (Math.random() < 0.7) {
            return {
                task_id: data.id,
                status: 'success',
                message: 'Task completed after retry',
                processed_at: new Date()
            }
        } else {
            throw new Error('Temporary processing failure')
        }
    }
    
    async process_error_prone_task(data: any): Promise<ProcessingResult> {
        console.log('   🔧 Processing error-prone task...')
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Simulate different types of errors
        const error_type = Math.random()
        
        if (error_type < 0.3) {
            // Network timeout (retryable)
            throw new Error('Network timeout')
        } else if (error_type < 0.6) {
            // Database connection error (retryable)
            throw new Error('Database connection failed')
        } else if (error_type < 0.8) {
            // Invalid data format (permanent failure)
            throw new Error('Invalid data format')
        } else {
            // Success
            return {
                task_id: data.id,
                status: 'success',
                message: 'Task completed despite being error-prone',
                processed_at: new Date()
            }
        }
    }
    
    async validate_task_data(data: any): Promise<void> {
        if (!data.id) {
            throw new Error('Missing task ID')
        }
        
        if (!data.payload) {
            throw new Error('Missing task payload')
        }
        
        if (typeof data.payload !== 'object') {
            throw new Error('Invalid payload format')
        }
    }
}

// Task producer
@TpProducer({
    providers: [
        { provide: RabbitDefineToken, useValue: error_topology, multi: true }
    ]
})
class TaskProducer {
    
    @Enqueue('tasks.normal')
    async send_normal_task(task: Task) {
        console.log(`📤 Sending normal task ${task.id}`)
        return task
    }
    
    @Enqueue('tasks.retry')
    async send_retry_task(task: Task) {
        console.log(`📤 Sending retry task ${task.id}`)
        return task
    }
    
    @Enqueue('tasks.error_prone')
    async send_error_prone_task(task: Task) {
        console.log(`📤 Sending error-prone task ${task.id}`)
        return task
    }
    
    @Enqueue('tasks.validation')
    async send_validation_task(task: Task) {
        console.log(`📤 Sending validation task ${task.id}`)
        return task
    }
}

// Task consumers with different error handling strategies
@TpConsumer({
    providers: [
        TaskProcessor,
        { provide: RabbitDefineToken, useValue: error_topology, multi: true }
    ]
})
class TaskConsumer {
    
    constructor(private task_processor: TaskProcessor) {}
    
    // Normal task consumer - automatic acknowledgment on success
    @Consume('tasks.normal', { prefetch: 5 })
    async handle_normal_task(message: RabbitMessage<Task>) {
        const task = message.data
        if (!task) {
            console.log('❌ Received message without task data')
            kill_message()
            return
        }
        
        console.log(`📥 Processing normal task ${task.id}`)
        
        try {
            const result = await this.task_processor.process_normal_task(task)
            console.log(`✅ Normal task ${task.id} completed:`, result.message)
            ack_message()
            
        } catch (error) {
            console.log(`❌ Normal task ${task.id} failed:`, error)
            kill_message()
        }
    }
    
    // Retry task consumer - manual acknowledgment with retry logic
    @Consume('tasks.retry', { prefetch: 3 })
    async handle_retry_task(message: RabbitMessage<Task>) {
        const task = message.data
        if (!task) {
            console.log('❌ Received message without task data')
            kill_message()
            return
        }
        
        const retry_count = task.retry_count || 0
        const max_retries = 3
        
        console.log(`📥 Processing retry task ${task.id} (attempt ${retry_count + 1}/${max_retries + 1})`)
        
        try {
            const result = await this.task_processor.process_retry_task(task)
            console.log(`✅ Retry task ${task.id} completed:`, result.message)
            ack_message()
            
        } catch (error) {
            console.log(`⚠️ Retry task ${task.id} failed:`, error)
            
            if (retry_count < max_retries) {
                console.log(`🔄 Requeuing task ${task.id} for retry`)
                
                task.retry_count = retry_count + 1
                requeue_message()
            } else {
                console.log(`💀 Killing task ${task.id} - max retries exceeded or permanent error`)
                kill_message()
            }
        }
    }
    
    // Error-prone task consumer - using exception-based acknowledgment
    @Consume('tasks.error_prone', { prefetch: 2 })
    async handle_error_prone_task(message: RabbitMessage<Task>) {
        const task = message.data
        if (!task) {
            console.log('❌ Received message without task data')
            kill_message()
            return
        }
        
        const retry_count = task.retry_count || 0
        const max_retries = 2
        
        console.log(`📥 Processing error-prone task ${task.id} (attempt ${retry_count + 1}/${max_retries + 1})`)
        
        try {
            const result = await this.task_processor.process_error_prone_task(task)
            console.log(`✅ Error-prone task ${task.id} completed:`, result.message)
            ack_message()
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.log(`⚠️ Error-prone task ${task.id} failed:`, error)
            
            if (retry_count < max_retries && this.is_retryable_error(error)) {
                console.log(`🔄 Requeuing error-prone task ${task.id} for retry`)
                task.retry_count = retry_count + 1
                
                throw new MessageRequeue({
                    code: 'RETRY_ERROR',
                    msg: `Task failed, retrying: ${errorMessage}`
                })
            } else {
                console.log(`💀 Killing error-prone task ${task.id} - max retries exceeded`)
                
                throw new MessageDead({
                    code: 'PERM_ERROR',
                    msg: `Task permanently failed: ${errorMessage}`
                })
            }
        }
    }
    
    // Validation task consumer - strict validation with permanent failures
    @Consume('tasks.validation', { prefetch: 10 })
    async handle_validation_task(message: RabbitMessage<Task>) {
        const task = message.data
        if (!task) {
            console.log('❌ Received message without task data')
            kill_message()
            return
        }
        
        console.log(`📥 Processing validation task ${task.id}`)
        
        try {
            // Validate task data first
            await this.task_processor.validate_task_data(task.data)
            
            // Process if validation passes
            console.log(`✅ Validation task ${task.id} passed validation`)
            return { status: 'validated', task_id: task.id }
            
        } catch (error) {
            console.log(`❌ Validation task ${task.id} failed validation:`, error)
            
            // Data validation errors are permanent - don't retry
            throw new MessageDead({
                code: 'VALIDATION_ERROR',
                msg: 'Task data failed validation'
            })
        }
    }
    
    private is_retryable_error(error: any): boolean {
        const message = error.message?.toLowerCase() || ''
        return message.includes('timeout') || 
               message.includes('connection') || 
               message.includes('temporary')
    }
}

// Demo runner for error handling scenarios
@TpService()
class ErrorHandlingDemo {
    
    constructor(private task_producer: TaskProducer) {}
    
    async run_demo() {
        console.log('\n=== RabbitMQ Error Handling Demo ===\n')
        
        console.log('Starting error handling demo in 3 seconds...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        try {
            // 1. Send normal tasks (should all succeed)
            console.log('\n1️⃣ Sending normal tasks...')
            for (let i = 1; i <= 3; i++) {
                await this.task_producer.send_normal_task({
                    id: `normal-${i}`,
                    type: 'normal',
                    data: { payload: { value: i * 10 } },
                    created_at: new Date()
                })
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 2. Send retry tasks (some will fail and retry)
            console.log('\n2️⃣ Sending retry tasks...')
            for (let i = 1; i <= 3; i++) {
                await this.task_producer.send_retry_task({
                    id: `retry-${i}`,
                    type: 'retry',
                    data: { payload: { retry_value: i } },
                    created_at: new Date(),
                    retry_count: 0
                })
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // 3. Send error-prone tasks (will demonstrate different error handling)
            console.log('\n3️⃣ Sending error-prone tasks...')
            for (let i = 1; i <= 4; i++) {
                await this.task_producer.send_error_prone_task({
                    id: `error-prone-${i}`,
                    type: 'error_prone',
                    data: { payload: { error_test: i } },
                    created_at: new Date(),
                    retry_count: 0
                })
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // 4. Send validation tasks (some valid, some invalid)
            console.log('\n4️⃣ Sending validation tasks...')
            
            // Valid tasks
            await this.task_producer.send_validation_task({
                id: 'validation-valid-1',
                type: 'validation',
                data: { id: 'valid-1', payload: { data: 'valid' } },
                created_at: new Date()
            })
            
            // Invalid tasks
            await this.task_producer.send_validation_task({
                id: 'validation-invalid-1',
                type: 'validation',
                data: { payload: { data: 'missing id' } }, // Missing ID
                created_at: new Date()
            })
            
            await this.task_producer.send_validation_task({
                id: 'validation-invalid-2',
                type: 'validation',
                data: { id: 'invalid-2' }, // Missing payload
                created_at: new Date()
            })
            
            await this.task_producer.send_validation_task({
                id: 'validation-invalid-3',
                type: 'validation',
                data: { id: 'invalid-3', payload: 'not an object' }, // Invalid payload format
                created_at: new Date()
            })
            
            console.log('\n✅ All demo tasks sent!')
            console.log('Watch the logs above to see different error handling strategies in action.')
            
        } catch (error) {
            console.error('❌ Demo failed:', error)
        }
    }
}

async function main() {
    console.log('=== Tarpit RabbitMQ Error Handling Example ===\n')
    
    const config = load_config<TpConfigSchema>({
        rabbitmq: {
            url: 'amqp://user:password@10.11.11.3:5672',
            prefetch: 10,
            timeout: 10000
        }
    })
    
    const platform = new Platform(config)
        .import(RabbitmqModule)
        .import(TaskProcessor)
        .import(TaskProducer)
        .import(TaskConsumer)
        .import(ErrorHandlingDemo)
    
    try {
        console.log('🚀 Starting platform...')
        await platform.start()
        console.log('✅ Platform started successfully')
        
        console.log('🔗 Connected to RabbitMQ at 10.11.11.3:5672')
        
        // Run the error handling demo
        const demo = platform.expose(ErrorHandlingDemo)!
        await demo.run_demo()
        
        // Keep the application running to process all messages including retries
        console.log('\n⏱️  Waiting for all message processing and retries to complete...')
        await new Promise(resolve => setTimeout(resolve, 10000))
        
    } catch (error) {
        console.error('❌ Application failed:', error)
    } finally {
        console.log('\n🛑 Stopping platform...')
        await platform.terminate()
        console.log('✅ Platform stopped')
        process.exit(0)
    }
}

if (require.main === module) {
    main().catch(console.error)
} 