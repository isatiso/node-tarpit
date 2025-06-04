import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpService, TpLoader } from '@tarpit/core'

// Extend configuration schema for conditional features
declare module '@tarpit/core' {
    interface TpConfigSchema {
        advanced_features: {
            enable_feature_a: boolean
            enable_feature_b: boolean
            enable_feature_c: boolean
        }
        worker_count: number
    }
}

@TpService()
class AdvancedService {
    private features: string[] = []
    private workers: any[] = []
    
    constructor(private loader: TpLoader) {
        // Only use this approach when decorators are not sufficient
        // For example, when registering hooks conditionally
        this.register_conditional_hooks()
        this.register_dynamic_hooks()
    }
    
    private register_conditional_hooks() {
        console.log('AdvancedService: Registering conditional hooks based on configuration')
        
        // Conditional hook registration based on configuration
        if (this.should_enable_feature_a()) {
            console.log('AdvancedService: Feature A enabled, registering hooks')
            this.loader.on_start(this.initialize_feature_a.bind(this))
            this.loader.on_terminate(this.cleanup_feature_a.bind(this))
        }
        
        if (this.should_enable_feature_b()) {
            console.log('AdvancedService: Feature B enabled, registering hooks')
            this.loader.on_start(this.initialize_feature_b.bind(this))
            this.loader.on_terminate(this.cleanup_feature_b.bind(this))
        }
        
        if (this.should_enable_feature_c()) {
            console.log('AdvancedService: Feature C enabled, registering hooks')
            this.loader.on_start(this.initialize_feature_c.bind(this))
            this.loader.on_terminate(this.cleanup_feature_c.bind(this))
        }
    }
    
    private register_dynamic_hooks() {
        console.log('AdvancedService: Registering dynamic hooks')
        
        // Dynamic hook registration in loops
        const workerCount = this.get_worker_count()
        for (let i = 0; i < workerCount; i++) {
            this.loader.on_start(async () => {
                console.log(`AdvancedService: Starting worker ${i + 1}`)
                const worker = await this.create_worker(i + 1)
                this.workers.push(worker)
            })
            
            this.loader.on_terminate(async () => {
                console.log(`AdvancedService: Stopping worker ${i + 1}`)
                const worker = this.workers[i]
                if (worker) {
                    await worker.stop()
                }
            })
        }
    }
    
    private should_enable_feature_a(): boolean {
        // Mock configuration check
        return Math.random() > 0.3 // 70% chance
    }
    
    private should_enable_feature_b(): boolean {
        // Mock configuration check
        return Math.random() > 0.5 // 50% chance
    }
    
    private should_enable_feature_c(): boolean {
        // Mock configuration check
        return Math.random() > 0.7 // 30% chance
    }
    
    private get_worker_count(): number {
        // Mock configuration-based worker count
        return 2 + Math.floor(Math.random() * 3) // 2-4 workers
    }
    
    private async initialize_feature_a() {
        console.log('AdvancedService: Initializing Feature A')
        this.features.push('Feature A')
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('AdvancedService: Feature A initialized')
    }
    
    private async cleanup_feature_a() {
        console.log('AdvancedService: Cleaning up Feature A')
        this.features = this.features.filter(f => f !== 'Feature A')
        await new Promise(resolve => setTimeout(resolve, 50))
        console.log('AdvancedService: Feature A cleaned up')
    }
    
    private async initialize_feature_b() {
        console.log('AdvancedService: Initializing Feature B')
        this.features.push('Feature B')
        await new Promise(resolve => setTimeout(resolve, 80))
        console.log('AdvancedService: Feature B initialized')
    }
    
    private async cleanup_feature_b() {
        console.log('AdvancedService: Cleaning up Feature B')
        this.features = this.features.filter(f => f !== 'Feature B')
        await new Promise(resolve => setTimeout(resolve, 40))
        console.log('AdvancedService: Feature B cleaned up')
    }
    
    private async initialize_feature_c() {
        console.log('AdvancedService: Initializing Feature C')
        this.features.push('Feature C')
        await new Promise(resolve => setTimeout(resolve, 120))
        console.log('AdvancedService: Feature C initialized')
    }
    
    private async cleanup_feature_c() {
        console.log('AdvancedService: Cleaning up Feature C')
        this.features = this.features.filter(f => f !== 'Feature C')
        await new Promise(resolve => setTimeout(resolve, 60))
        console.log('AdvancedService: Feature C cleaned up')
    }
    
    private async create_worker(id: number) {
        console.log(`AdvancedService: Creating worker ${id}`)
        await new Promise(resolve => setTimeout(resolve, 50))
        return {
            id,
            status: 'running',
            stop: async () => {
                console.log(`AdvancedService: Worker ${id} stopping`)
                await new Promise(resolve => setTimeout(resolve, 30))
                console.log(`AdvancedService: Worker ${id} stopped`)
            }
        }
    }
    
    get_active_features() {
        return [...this.features]
    }
    
    get_worker_status() {
        return this.workers.map(w => ({ id: w.id, status: w.status }))
    }
}

@TpService()
class ConfigDrivenService {
    private initialized_components: string[] = []
    
    constructor(private loader: TpLoader) {
        // Register hooks that depend on runtime conditions
        this.register_environment_specific_hooks()
    }
    
    private register_environment_specific_hooks() {
        const environment = process.env.NODE_ENV || 'development'
        console.log(`ConfigDrivenService: Environment detected: ${environment}`)
        
        if (environment === 'development') {
            this.loader.on_start(this.setup_development_tools.bind(this))
            this.loader.on_terminate(this.cleanup_development_tools.bind(this))
        } else if (environment === 'production') {
            this.loader.on_start(this.setup_production_monitoring.bind(this))
            this.loader.on_terminate(this.cleanup_production_monitoring.bind(this))
        }
        
        // Always register basic hooks
        this.loader.on_start(this.basic_initialization.bind(this))
        this.loader.on_terminate(this.basic_cleanup.bind(this))
    }
    
    private async setup_development_tools() {
        console.log('ConfigDrivenService: Setting up development tools')
        this.initialized_components.push('development_tools')
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('ConfigDrivenService: Development tools ready')
    }
    
    private async cleanup_development_tools() {
        console.log('ConfigDrivenService: Cleaning up development tools')
        this.initialized_components = this.initialized_components.filter(c => c !== 'development_tools')
        await new Promise(resolve => setTimeout(resolve, 50))
        console.log('ConfigDrivenService: Development tools cleaned up')
    }
    
    private async setup_production_monitoring() {
        console.log('ConfigDrivenService: Setting up production monitoring')
        this.initialized_components.push('production_monitoring')
        await new Promise(resolve => setTimeout(resolve, 150))
        console.log('ConfigDrivenService: Production monitoring ready')
    }
    
    private async cleanup_production_monitoring() {
        console.log('ConfigDrivenService: Cleaning up production monitoring')
        this.initialized_components = this.initialized_components.filter(c => c !== 'production_monitoring')
        await new Promise(resolve => setTimeout(resolve, 80))
        console.log('ConfigDrivenService: Production monitoring cleaned up')
    }
    
    private async basic_initialization() {
        console.log('ConfigDrivenService: Running basic initialization')
        this.initialized_components.push('basic_components')
        await new Promise(resolve => setTimeout(resolve, 60))
        console.log('ConfigDrivenService: Basic initialization complete')
    }
    
    private async basic_cleanup() {
        console.log('ConfigDrivenService: Running basic cleanup')
        this.initialized_components = this.initialized_components.filter(c => c !== 'basic_components')
        await new Promise(resolve => setTimeout(resolve, 40))
        console.log('ConfigDrivenService: Basic cleanup complete')
    }
    
    get_initialized_components() {
        return [...this.initialized_components]
    }
}

async function main() {
    console.log('=== TpLoader Advanced Usage Example ===\n')
    
    // Load configuration
    const config = load_config({
        advanced_features: {
            enable_feature_a: true,
            enable_feature_b: false,
            enable_feature_c: true
        },
        worker_count: 3
    })
    
    // Create platform with advanced services
    const platform = new Platform(config)
        .import(AdvancedService)
        .import(ConfigDrivenService)
    
    console.log('1. Starting platform (this will trigger conditional and dynamic hooks):')
    await platform.start()
    
    console.log('\n2. Checking service states after initialization:')
    const advancedService = platform.expose(AdvancedService)!
    const configDrivenService = platform.expose(ConfigDrivenService)!
    
    console.log('AdvancedService - Active features:', advancedService.get_active_features())
    console.log('AdvancedService - Worker status:', advancedService.get_worker_status())
    console.log('ConfigDrivenService - Initialized components:', configDrivenService.get_initialized_components())
    
    console.log('\n3. Terminating platform (this will trigger cleanup hooks):')
    await platform.terminate()
    
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 