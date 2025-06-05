import 'reflect-metadata'
import { Platform, TpService, Inject, TpConfigSchema } from '@tarpit/core'
import { load_config } from '@tarpit/config'

// Plugin interfaces
interface Plugin {
    name: string
    initialize(): void
    execute(data: any): Promise<any>
}

interface Middleware {
    name: string
    process(request: any, next: () => any): any
}

interface EventHandler {
    event_name: string
    handle(event: any): void
}

// Plugin implementations
class AuthPlugin implements Plugin {
    name = 'auth'
    
    initialize() {
        console.log('AuthPlugin: Initialized')
    }
    
    async execute(data: any) {
        console.log('AuthPlugin: Authenticating user...')
        await new Promise(resolve => setTimeout(resolve, 50))
        return { ...data, authenticated: true, user_id: 'user-123' }
    }
}

class LoggingPlugin implements Plugin {
    name = 'logging'
    
    initialize() {
        console.log('LoggingPlugin: Initialized')
    }
    
    async execute(data: any) {
        console.log(`LoggingPlugin: Logging action: ${data.action || 'unknown'}`)
        return { ...data, logged_at: new Date().toISOString() }
    }
}

class CachePlugin implements Plugin {
    name = 'cache'
    
    initialize() {
        console.log('CachePlugin: Initialized')
    }
    
    async execute(data: any) {
        console.log('CachePlugin: Caching data...')
        return { ...data, cached: true, cache_key: `cache_${Date.now()}` }
    }
}

// Middleware implementations
class CorsMiddleware implements Middleware {
    name = 'cors'
    
    process(request: any, next: () => any) {
        console.log('CorsMiddleware: Adding CORS headers')
        request.headers = { ...request.headers, 'Access-Control-Allow-Origin': '*' }
        return next()
    }
}

class SecurityMiddleware implements Middleware {
    name = 'security'
    
    process(request: any, next: () => any) {
        console.log('SecurityMiddleware: Adding security headers')
        request.headers = { ...request.headers, 'X-Security-Check': 'passed' }
        return next()
    }
}

class CompressionMiddleware implements Middleware {
    name = 'compression'
    
    process(request: any, next: () => any) {
        console.log('CompressionMiddleware: Compressing response')
        const result = next()
        return { ...result, compressed: true }
    }
}

// Event handler implementations
class UserEventHandler implements EventHandler {
    event_name = 'user.*'
    
    handle(event: any) {
        console.log(`UserEventHandler: Handling user event: ${event.type}`)
        console.log(`UserEventHandler: User ID: ${event.user_id}`)
    }
}

class SystemEventHandler implements EventHandler {
    event_name = 'system.*'
    
    handle(event: any) {
        console.log(`SystemEventHandler: Handling system event: ${event.type}`)
        console.log(`SystemEventHandler: Severity: ${event.severity}`)
    }
}

class AuditEventHandler implements EventHandler {
    event_name = '*'
    
    handle(event: any) {
        console.log(`AuditEventHandler: Auditing event: ${event.type}`)
        console.log(`AuditEventHandler: Timestamp: ${event.timestamp}`)
    }
}

// Define tokens for multi-providers
const PLUGIN_TOKEN = Symbol('PLUGINS')
const MIDDLEWARE_TOKEN = Symbol('MIDDLEWARE')
const EVENT_HANDLER_TOKEN = Symbol('EVENT_HANDLERS')

@TpService()
class PluginManager {
    constructor(@Inject(PLUGIN_TOKEN) private plugins: Plugin[]) {
        console.log(`PluginManager: Loaded ${plugins.length} plugins`)
    }
    
    initialize_all() {
        console.log('\nPluginManager: Initializing all plugins...')
        this.plugins.forEach(plugin => plugin.initialize())
    }
    
    async execute_pipeline(data: any) {
        console.log('\nPluginManager: Executing plugin pipeline...')
        let result = data
        
        for (const plugin of this.plugins) {
            console.log(`PluginManager: Executing ${plugin.name} plugin`)
            result = await plugin.execute(result)
        }
        
        return result
    }
    
    get_plugin_names() {
        return this.plugins.map(p => p.name)
    }
}

@TpService()
class MiddlewareStack {
    constructor(@Inject(MIDDLEWARE_TOKEN) private middleware_list: Middleware[]) {
        console.log(`MiddlewareStack: Loaded ${middleware_list.length} middleware`)
    }
    
    process_request(request: any) {
        console.log('\nMiddlewareStack: Processing request through middleware...')
        let index = 0
        
        const next = () => {
            if (index < this.middleware_list.length) {
                const middleware = this.middleware_list[index++]
                console.log(`MiddlewareStack: Executing ${middleware.name} middleware`)
                return middleware.process(request, next)
            }
            return { body: 'Request processed', headers: request.headers }
        }
        
        return next()
    }
    
    get_middleware_names() {
        return this.middleware_list.map(m => m.name)
    }
}

@TpService()
class EventBus {
    constructor(@Inject(EVENT_HANDLER_TOKEN) private handlers: EventHandler[]) {
        console.log(`EventBus: Loaded ${handlers.length} event handlers`)
    }
    
    emit(event: any) {
        console.log(`\nEventBus: Emitting event: ${event.type}`)
        
        // Find matching handlers
        const matching_handlers = this.handlers.filter(handler => {
            if (handler.event_name === '*') return true
            return event.type.startsWith(handler.event_name.replace('*', ''))
        })
        
        console.log(`EventBus: Found ${matching_handlers.length} matching handlers`)
        
        matching_handlers.forEach(handler => {
            console.log(`EventBus: Dispatching to ${handler.constructor.name}`)
            handler.handle(event)
        })
    }
    
    get_handler_info() {
        return this.handlers.map(h => ({
            name: h.constructor.name,
            pattern: h.event_name
        }))
    }
}

async function demonstrate_multi_providers() {
    console.log('=== Multi-Provider Examples ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(PluginManager)
        .import(MiddlewareStack)
        .import(EventBus)
        
        // Register multiple plugins for the same token
        .import({ provide: PLUGIN_TOKEN, useValue: new AuthPlugin(), multi: true })
        .import({ provide: PLUGIN_TOKEN, useValue: new LoggingPlugin(), multi: true })
        .import({ provide: PLUGIN_TOKEN, useValue: new CachePlugin(), multi: true })
        
        // Register multiple middleware for the same token
        .import({ provide: MIDDLEWARE_TOKEN, useValue: new CorsMiddleware(), multi: true })
        .import({ provide: MIDDLEWARE_TOKEN, useValue: new SecurityMiddleware(), multi: true })
        .import({ provide: MIDDLEWARE_TOKEN, useValue: new CompressionMiddleware(), multi: true })
        
        // Register multiple event handlers for the same token
        .import({ provide: EVENT_HANDLER_TOKEN, useValue: new UserEventHandler(), multi: true })
        .import({ provide: EVENT_HANDLER_TOKEN, useValue: new SystemEventHandler(), multi: true })
        .import({ provide: EVENT_HANDLER_TOKEN, useValue: new AuditEventHandler(), multi: true })
    
    await platform.start()
    console.log('1. Platform started with Multi-Providers')
    
    // Demonstrate plugin manager
    const plugin_manager = platform.expose(PluginManager)
    if (plugin_manager) {
        console.log('\n2. Demonstrating PluginManager with multiple plugins...')
        console.log('Loaded plugins:', plugin_manager.get_plugin_names())
        
        plugin_manager.initialize_all()
        
        const result = await plugin_manager.execute_pipeline({
            action: 'create_user',
            username: 'john_doe'
        })
        
        console.log('Pipeline result:', result)
    }
    
    // Demonstrate middleware stack
    const middleware_stack = platform.expose(MiddlewareStack)
    if (middleware_stack) {
        console.log('\n3. Demonstrating MiddlewareStack with multiple middleware...')
        console.log('Loaded middleware:', middleware_stack.get_middleware_names())
        
        const response = middleware_stack.process_request({
            url: '/api/users',
            method: 'GET',
            headers: {}
        })
        
        console.log('Middleware response:', response)
    }
    
    // Demonstrate event bus
    const event_bus = platform.expose(EventBus)
    if (event_bus) {
        console.log('\n4. Demonstrating EventBus with multiple handlers...')
        console.log('Loaded handlers:', event_bus.get_handler_info())
        
        // Emit different types of events
        event_bus.emit({
            type: 'user.created',
            user_id: 'user-123',
            timestamp: new Date().toISOString()
        })
        
        event_bus.emit({
            type: 'system.startup',
            severity: 'info',
            timestamp: new Date().toISOString()
        })
        
        event_bus.emit({
            type: 'payment.processed',
            amount: 29.99,
            timestamp: new Date().toISOString()
        })
    }
    
    // Demonstrate direct multi-provider access
    console.log('\n5. Direct access to multi-provider arrays...')
    const plugins = platform.expose(PLUGIN_TOKEN) as Plugin[]
    const middleware = platform.expose(MIDDLEWARE_TOKEN) as Middleware[]
    const handlers = platform.expose(EVENT_HANDLER_TOKEN) as EventHandler[]
    
    console.log(`Direct plugin access: Found ${plugins?.length || 0} plugins`)
    console.log(`Direct middleware access: Found ${middleware?.length || 0} middleware`)
    console.log(`Direct handler access: Found ${handlers?.length || 0} handlers`)
    
    await platform.terminate()
    console.log('\n6. Platform terminated')
    
    console.log('\n=== Multi-Provider Examples Complete ===')
}

async function main() {
    await demonstrate_multi_providers()
}

if (require.main === module) {
    main().catch(console.error)
} 