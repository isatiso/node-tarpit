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
    RabbitDefineToken
} from '@tarpit/rabbitmq'

// Simple message interface
interface TestMessage {
    id: string
    content: string
    timestamp: Date
}

// Define simple topology
const test_topology = new RabbitDefine()
    .define_queue('test.messages', { durable: true })

// Simple producer
@TpProducer({
    providers: [
        { provide: RabbitDefineToken, useValue: test_topology, multi: true }
    ]
})
class TestProducer {
    
    @Enqueue('test.messages')
    async send_test_message(message: TestMessage) {
        console.log(`📤 [PRODUCER] Sending test message: ${message.id}`)
        return message
    }
}

// Simple consumer
@TpConsumer({
    providers: [
        { provide: RabbitDefineToken, useValue: test_topology, multi: true }
    ]
})
class TestConsumer {
    
    @Consume('test.messages', { prefetch: 2 })
    async handle_test_message(message: RabbitMessage<TestMessage>) {
        if (!message.data) {
            console.log('❌ [CONSUMER] Received message without data')
            return
        }
        
        const { id, content, timestamp } = message.data
        
        console.log(`📥 [CONSUMER] Starting to process test message: ${id}`)
        console.log(`   Content: ${content}`)
        console.log(`   Timestamp: ${timestamp}`)
        console.log(`   Delivery Tag: ${message.fields.deliveryTag}`)
        console.log(`   Redelivered: ${message.fields.redelivered}`)
        
        // Simulate processing with visible progress
        console.log(`   🔄 [CONSUMER] Processing message ${id}...`)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log(`✅ [CONSUMER] Test message ${id} processed successfully`)
        
        // Return success result
        return { processed: true, message_id: id }
    }
}

// Statistics service
@TpService()
class MessageStats {
    private sent_count = 0
    private processed_count = 0
    
    increment_sent() {
        this.sent_count++
        console.log(`📊 [STATS] Messages sent: ${this.sent_count}`)
    }
    
    increment_processed() {
        this.processed_count++
        console.log(`📊 [STATS] Messages processed: ${this.processed_count}`)
    }
    
    get_summary() {
        return {
            sent: this.sent_count,
            processed: this.processed_count,
            pending: this.sent_count - this.processed_count
        }
    }
}

// Enhanced test runner
@TpService()
class TestRunner {
    
    constructor(
        private test_producer: TestProducer,
        private stats: MessageStats
    ) {}
    
    async run_test() {
        console.log('\n=== RabbitMQ Enhanced Simple Test ===\n')
        
        console.log('🔧 Initializing test in 3 seconds...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        try {
            console.log('\n📤 Phase 1: Sending test messages...')
            
            // Send test messages with delays to observe processing
            for (let i = 1; i <= 7; i++) {
                const message = {
                    id: `test-msg-${i.toString().padStart(3, '0')}`,
                    content: `This is test message number ${i} with some additional content to make it interesting`,
                    timestamp: new Date()
                }
                
                await this.test_producer.send_test_message(message)
                this.stats.increment_sent()
                
                // Stagger message sending to see queue behavior
                if (i % 2 === 0) {
                    console.log(`   ⏸️  Pausing for ${i * 100}ms...`)
                    await new Promise(resolve => setTimeout(resolve, i * 100))
                }
            }
            
            console.log('\n✅ All test messages sent!')
            console.log('📋 Current stats:', this.stats.get_summary())
            
        } catch (error) {
            console.error('❌ Test failed during message sending:', error)
        }
    }
    
    async monitor_progress() {
        console.log('\n👀 Starting progress monitoring...')
        
        // Monitor for 15 seconds
        for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const stats = this.stats.get_summary()
            console.log(`⏱️  [T+${i + 1}s] Stats: ${stats.processed}/${stats.sent} processed, ${stats.pending} pending`)
            
            if (stats.pending === 0 && stats.sent > 0) {
                console.log('🎉 All messages processed!')
                break
            }
        }
    }
}

async function main() {
    console.log('=== Tarpit RabbitMQ Enhanced Simple Test ===\n')
    
    const config = load_config<TpConfigSchema>({
        rabbitmq: {
            url: 'amqp://user:password@10.11.11.3:5672',
            prefetch: 5,
            timeout: 10000
        }
    })
    
    console.log('🔧 Building platform...')
    const platform = new Platform(config)
        .import(RabbitmqModule)
        .import(MessageStats)
        .import(TestProducer)
        .import(TestConsumer)
        .import(TestRunner)
    
    try {
        console.log('🚀 Starting platform...')
        await platform.start()
        console.log('✅ Platform started successfully')
        
        console.log('🔗 Connected to RabbitMQ at 10.11.11.3:5672')
        console.log('🎯 Queue topology created and consumers registered')
        
        // Get services
        const test_runner = platform.expose(TestRunner)!
        
        // Run the test
        await test_runner.run_test()
        
        // Monitor progress
        await test_runner.monitor_progress()
        
        // Final stats
        const stats = platform.expose(MessageStats)!
        console.log('\n📈 Final Statistics:', stats.get_summary())
        
    } catch (error) {
        console.error('❌ Application failed:', error)
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