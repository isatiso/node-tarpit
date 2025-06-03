import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpModule } from '@tarpit/core'

// A simple service
@TpService()
class GreetingService {
    greet(name: string) {
        return `Hello, ${name}!`
    }
}

// A module that provides the service
@TpModule({
    providers: [GreetingService]
})
class AppModule {
    constructor(private greeting: GreetingService) {}
    
    start() {
        console.log(this.greeting.greet('World'))
    }
}

async function main() {
    console.log('=== Quick Start Example ===\n')
    
    // Platform bootstraps everything
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(AppModule)
    
    await platform.start()
    
    // Get the module instance and run it
    const app_module = platform.expose(AppModule)
    if (app_module) {
        app_module.start()
    }
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 