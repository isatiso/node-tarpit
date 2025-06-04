import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpService, OnStart, OnTerminate } from '@tarpit/core'

@TpService()
class ServiceA {
    @OnStart()
    async initialize() {
        console.log('ServiceA: Starting initialization')
        // Fast operation
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('ServiceA: Initialization completed')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('ServiceA: Starting cleanup')
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('ServiceA: Cleanup completed')
    }
    
    do_work() {
        console.log('ServiceA: Doing work...')
        return 'ServiceA work result'
    }
}

@TpService()
class ServiceB {
    @OnStart()
    async initialize() {
        console.log('ServiceB: Starting initialization')
        // Slow operation
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('ServiceB: Initialization completed')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('ServiceB: Starting cleanup')
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('ServiceB: Cleanup completed')
    }
    
    do_work() {
        console.log('ServiceB: Doing work...')
        return 'ServiceB work result'
    }
}

@TpService()
class ServiceC {
    @OnStart()
    async initialize() {
        console.log('ServiceC: Starting initialization')
        // Medium operation
        await new Promise(resolve => setTimeout(resolve, 300))
        console.log('ServiceC: Initialization completed')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('ServiceC: Starting cleanup')
        await new Promise(resolve => setTimeout(resolve, 200))
        console.log('ServiceC: Cleanup completed')
    }
    
    do_work() {
        console.log('ServiceC: Doing work...')
        return 'ServiceC work result'
    }
}

async function main() {
    console.log('=== Hook Execution Order Example ===\n')
    console.log('This example demonstrates that hooks are triggered in registration order,')
    console.log('but completion order depends on each hook\'s execution time.\n')
    
    // Create platform with services
    const platform = new Platform(load_config({}))
        .import(ServiceA)  // Fast initialization (100ms)
        .import(ServiceB)  // Slow initialization (500ms) 
        .import(ServiceC)  // Medium initialization (300ms)
    
    console.log('1. Starting platform - watch the triggering vs completion order:')
    console.log('   Expected triggering order: A, B, C')
    console.log('   Expected completion order: A, C, B (fastest to slowest)\n')
    
    const startTime = Date.now()
    await platform.start()
    const startDuration = Date.now() - startTime
    
    console.log(`\nStartup completed in ${startDuration}ms\n`)
    
    console.log('2. Using services after initialization:')
    const serviceA = platform.expose(ServiceA)!
    const serviceB = platform.expose(ServiceB)!
    const serviceC = platform.expose(ServiceC)!
    
    console.log('Result A:', serviceA.do_work())
    console.log('Result B:', serviceB.do_work())
    console.log('Result C:', serviceC.do_work())
    
    console.log('\n3. Terminating platform - same behavior for cleanup:')
    console.log('   Expected triggering order: A, B, C')
    console.log('   Expected completion order: A, C, B (fastest to slowest)\n')
    
    const terminateTime = Date.now()
    await platform.terminate()
    const terminateDuration = Date.now() - terminateTime
    
    console.log(`\nTermination completed in ${terminateDuration}ms`)
    
    console.log('\n=== Key Takeaways ===')
    console.log('- Hook triggering follows service registration order')
    console.log('- Hook completion order depends on individual execution time')
    console.log('- All hooks run concurrently (Promise.allSettled)')
    console.log('- If one hook fails, others continue to execute')
    console.log('- For sequential execution, organize within a single service')
    
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 