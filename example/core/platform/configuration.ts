import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpConfigData } from '@tarpit/core'

@TpService()
class ConfigurableService {
    constructor(private config: TpConfigData) {
        console.log('ConfigurableService created with configuration')
    }
    
    show_config() {
        const full_config = this.config.get()
        console.log('Current configuration:', full_config)
        return full_config
    }
}

async function basic_configuration() {
    console.log('=== Basic Configuration ===\n')
    
    const config = load_config<TpConfigSchema>({})
    
    console.log('Configuration loaded successfully')
    
    const platform = new Platform(config)
        .import(ConfigurableService)
    
    await platform.start()
    
    const service = platform.expose(ConfigurableService)
    if (service) {
        service.show_config()
    }
    
    await platform.terminate()
    console.log('Platform with configuration completed')
}

async function file_based_configuration() {
    console.log('\n=== File-based Configuration ===\n')
    
    // This would load from tarpit.json if it exists
    // For demo purposes, we'll use an empty object
    const config = load_config<TpConfigSchema>({})
    
    console.log('File-based configuration loaded')
    
    const platform = new Platform(config)
        .import(ConfigurableService)
    
    await platform.start()
    console.log('Platform started with file-based configuration')
    await platform.terminate()
}

async function main() {
    await basic_configuration()
    await file_based_configuration()
    
    console.log('\n=== Configuration Examples Completed ===')
    console.log('Note: To use custom configuration, extend TpConfigSchema interface')
    console.log('and declare your configuration properties in your application.')
}

if (require.main === module) {
    main().catch(console.error)
} 