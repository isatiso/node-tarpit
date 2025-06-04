import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, OnTerminate } from '@tarpit/core'

@TpService()
class ReliableService {
    private connection_status = false
    
    constructor() {
        console.log('ReliableService: Constructor called')
    }
    
    async connect() {
        console.log('ReliableService: Connecting...')
        // Simulate connection
        this.connection_status = true
        console.log('ReliableService: Connected successfully')
    }
    
    async process_data(data: any) {
        if (!this.connection_status) {
            throw new Error('Service not connected')
        }
        
        console.log('ReliableService: Processing data:', data)
        
        // Simulate potential runtime error
        if (data.trigger_error) {
            throw new Error('Simulated processing error')
        }
        
        return { processed: true, data }
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('ReliableService: Cleanup started')
        this.connection_status = false
        console.log('ReliableService: Cleanup completed')
    }
}

@TpService()
class ProblematicService {
    constructor() {
        console.log('ProblematicService: Constructor called')
        // This service will simulate startup issues
    }
    
    async initialize() {
        throw new Error('ProblematicService failed to initialize')
    }
}

// Example 1: Successful startup and operation
async function successful_operation() {
    console.log('=== Successful Operation ===\n')
    
    try {
        const config = load_config<TpConfigSchema>({})
        const platform = new Platform(config)
            .import(ReliableService)
        
        console.log('1. Starting platform...')
        await platform.start()
        console.log('Platform started successfully')
        
        console.log('\n2. Using services...')
        const service = platform.expose(ReliableService)
        if (service) {
            await service.connect()
            
            // Process some data successfully
            const result1 = await service.process_data({ id: 1, value: 'test' })
            console.log('Result:', result1)
        }
        
        console.log('\n3. Shutting down...')
        await platform.terminate()
        console.log('Platform shutdown successfully')
        
    } catch (error) {
        console.error('Unexpected error:', (error as Error).message)
    }
}

// Example 2: Runtime error handling
async function runtime_error_handling() {
    console.log('\n=== Runtime Error Handling ===\n')
    
    try {
        const config = load_config<TpConfigSchema>({})
        const platform = new Platform(config)
            .import(ReliableService)
        
        await platform.start()
        console.log('Platform started for runtime error demo')
        
        const service = platform.expose(ReliableService)
        if (service) {
            await service.connect()
            
            try {
                // This will trigger a runtime error
                await service.process_data({ trigger_error: true })
            } catch (error) {
                console.log('Caught runtime error:', (error as Error).message)
                console.log('Service continues to operate after error')
                
                // Service should still work for valid data
                const result = await service.process_data({ id: 2, value: 'valid' })
                console.log('Recovery result:', result)
            }
        }
        
        await platform.terminate()
        console.log('Platform shutdown after runtime errors')
        
    } catch (error) {
        console.error('Platform error:', (error as Error).message)
    }
}

// Example 3: Startup error demonstration
async function startup_error_handling() {
    console.log('\n=== Startup Error Handling ===\n')
    
    try {
        const config = load_config<TpConfigSchema>({})
        const platform = new Platform(config)
            .import(ProblematicService)  // This service will cause startup issues
        
        console.log('Attempting to start platform with problematic service...')
        await platform.start()
        
        console.log('This should not be reached if service fails properly')
        
    } catch (error) {
        console.log('Caught startup error:', (error as Error).message)
        console.log('Platform startup failed as expected')
    }
}

// Example 4: Graceful shutdown with signal handling
async function graceful_shutdown_demo() {
    console.log('\n=== Graceful Shutdown Demo ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(ReliableService)
    
    // Setup signal handlers for graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}, initiating graceful shutdown...`)
        try {
            await platform.terminate()
            console.log('Graceful shutdown completed')
            process.exit(0)
        } catch (error) {
            console.error('Error during shutdown:', (error as Error).message)
            process.exit(1)
        }
    }
    
    // In a real application, these would handle actual signals
    // process.on('SIGTERM', () => shutdown('SIGTERM'))
    // process.on('SIGINT', () => shutdown('SIGINT'))
    
    try {
        await platform.start()
        console.log('Platform started (in real app, would wait for signals)')
        
        // Simulate running for a while, then shutdown
        console.log('Simulating graceful shutdown...')
        await shutdown('SIMULATED')
        
    } catch (error) {
        console.error('Error in graceful shutdown demo:', (error as Error).message)
    }
}

async function main() {
    await successful_operation()
    await runtime_error_handling()
    await startup_error_handling()
    await graceful_shutdown_demo()
    
    console.log('\n=== Error Handling Examples Completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 