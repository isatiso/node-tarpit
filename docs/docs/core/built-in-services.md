---
sidebar_position: 5
---

# Built-in Services

Tarpit provides several built-in services that are automatically available in every application. The most important built-in services are **TpConfigData** for configuration access and **TpLoader** for lifecycle management.

## TpConfigData

TpConfigData provides access to the application configuration loaded during platform initialization. It's automatically injected and extends ConfigData with Tarpit-specific functionality.

### Basic Usage

:::info Complete Example
[example/core/built-in/01-tp-config-data-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/01-tp-config-data-basic.ts)
:::

```typescript
import { TpService, TpConfigData } from '@tarpit/core'

@TpService()
class DatabaseService {
    constructor(private config: TpConfigData) {}
    
    connect() {
        // Access configuration using JSON path notation
        const host = this.config.get('database.host') ?? 'localhost'
        const port = this.config.get('database.port') ?? 5432
        console.log(`Connecting to database: ${host}:${port}`)
    }
}
```

### Typed Configuration

Extend TpConfigSchema to define your configuration structure:

```typescript
// Extend the global TpConfigSchema interface
declare module '@tarpit/core' {
    interface TpConfigSchema {
        database: {
            host: string
            port: number
            name: string
        }
        redis: {
            host: string
            port: number
        }
        debug: boolean
    }
}

@TpService()
class DatabaseService {
    constructor(private config: TpConfigData) {}
    
    connect() {
        // TypeScript knows the exact shape of config when using paths
        const host = this.config.get('database.host')
        const port = this.config.get('database.port')
        const name = this.config.get('database.name')
        console.log(`Connecting to ${host}:${port}/${name}`)
    }
    
    get_full_database_config() {
        // Get entire database section
        const dbConfig = this.config.get('database')
        return dbConfig
    }
    
    get_all_config() {
        // Get entire configuration object
        return this.config.get()
    }
}
```

### Configuration Patterns

:::info Complete Example
[example/core/built-in/02-tp-config-data-patterns.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/02-tp-config-data-patterns.ts)
:::

#### Environment-Specific Behavior

```typescript
@TpService()
class LoggerService {
    constructor(private config: TpConfigData) {}
    
    log(message: string) {
        const debug = this.config.get('debug') ?? false
        if (debug) {
            console.log(`[DEBUG] ${message}`)
        } else {
            // Production logging
            this.send_to_external_logger(message)
        }
    }
    
    private send_to_external_logger(message: string) {
        // Send to external logging service
    }
}
```

#### Configuration Validation

```typescript
@TpService()
class EmailService {
    constructor(private config: TpConfigData) {
        this.validate_config()
    }
    
    private validate_config() {
        const apiKey = this.config.get('email.apiKey')
        if (!apiKey) {
            throw new Error('Email API key is required')
        }
        
        const fromAddress = this.config.get('email.fromAddress')
        if (!fromAddress) {
            throw new Error('Email from address is required')
        }
    }
    
    async send_email(to: string, subject: string, body: string) {
        const apiKey = this.config.get('email.apiKey')
        const fromAddress = this.config.get('email.fromAddress')
        // Email sending logic using apiKey and fromAddress
    }
}
```

#### Feature Toggles

```typescript
@TpService()
class NotificationService {
    constructor(private config: TpConfigData) {}
    
    async send_notification(message: string) {
        const emailEnabled = this.config.get('features.emailNotifications') ?? false
        if (emailEnabled) {
            await this.send_email_notification(message)
        }
        
        const smsEnabled = this.config.get('features.smsNotifications') ?? false
        if (smsEnabled) {
            await this.send_sms_notification(message)
        }
        
        const pushEnabled = this.config.get('features.pushNotifications') ?? false
        if (pushEnabled) {
            await this.send_push_notification(message)
        }
    }
    
    private async send_email_notification(message: string) {
        // Email notification logic
    }
    
    private async send_sms_notification(message: string) {
        // SMS notification logic
    }
    
    private async send_push_notification(message: string) {
        // Push notification logic
    }
}
```

#### Configuration-Based Service Selection

```typescript
@TpService()
class CacheService {
    private cache_implementation: any
    
    constructor(private config: TpConfigData) {
        this.initialize_cache()
    }
    
    private initialize_cache() {
        const provider = this.config.get('cache.provider') ?? 'memory'
        
        switch (provider) {
            case 'redis':
                const redisConfig = this.config.get('redis')
                this.cache_implementation = new RedisCache(redisConfig)
                break
            case 'memcached':
                const memcachedConfig = this.config.get('memcached')
                this.cache_implementation = new MemcachedCache(memcachedConfig)
                break
            default:
                this.cache_implementation = new InMemoryCache()
        }
    }
    
    async get(key: string): Promise<any> {
        return this.cache_implementation.get(key)
    }
    
    async set(key: string, value: any, ttl?: number): Promise<void> {
        return this.cache_implementation.set(key, value, ttl)
    }
}
```

#### JSON Path Access Patterns

```typescript
@TpService()
class HttpConfigService {
    constructor(private config: TpConfigData) {}
    
    get_server_config() {
        // Deep nested path access
        const port = this.config.get('http.port') ?? 3000
        const hostname = this.config.get('http.hostname') ?? 'localhost'
        const corsEnabled = this.config.get('http.cors.enabled') ?? false
        const corsOrigin = this.config.get('http.cors.origin') ?? '*'
        
        return {
            port,
            hostname,
            cors: {
                enabled: corsEnabled,
                origin: corsOrigin
            }
        }
    }
    
    get_entire_http_config() {
        // Get entire http section
        return this.config.get('http')
    }
}
```

## TpLoader

TpLoader manages the application lifecycle and provides hooks for initialization and cleanup operations. It's essential for handling startup and shutdown sequences properly.

### Lifecycle Hooks with Decorators (Recommended)

:::info Complete Example
[example/core/built-in/03-tp-loader-decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/03-tp-loader-decorators.ts)
:::

The preferred way to register lifecycle hooks is using decorators:

```typescript
import { TpService, OnStart, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    @OnStart()
    async initialize() {
        console.log('Initializing database connection')
        this.connection = await this.create_database_connection()
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('Closing database connection')
        if (this.connection) {
            await this.connection.close()
        }
    }
    
    private async create_database_connection() {
        // Database connection logic
        return { close: async () => {} } // Mock connection
    }
}
```

### Complex Initialization and Cleanup

When you need to perform multiple operations during startup or shutdown, organize them within the lifecycle methods:

```typescript
@TpService()
class ApplicationService {
    private data: any[] = []
    private background_tasks: any[] = []
    private monitoring_tools: any[] = []
    
    @OnStart()
    async initialize() {
        console.log('Starting application initialization...')
        
        // Load initial data
        await this.load_initial_data()
        
        // Start background tasks
        await this.start_background_tasks()
        
        // Initialize monitoring
        await this.initialize_monitoring()
        
        console.log('Application initialization completed')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('Starting application cleanup...')
        
        // Save application state
        await this.save_application_state()
        
        // Stop background tasks
        await this.stop_background_tasks()
        
        // Cleanup resources
        await this.cleanup_resources()
        
        console.log('Application cleanup completed')
    }
    
    private async load_initial_data() {
        console.log('Loading initial application data')
        this.data = await this.fetch_initial_data()
    }
    
    private async start_background_tasks() {
        console.log('Starting background tasks')
        this.background_tasks = await this.initialize_workers()
    }
    
    private async initialize_monitoring() {
        console.log('Initializing monitoring and health checks')
        this.monitoring_tools = await this.setup_monitoring()
    }
    
    private async save_application_state() {
        console.log('Saving application state')
        await this.persist_data()
    }
    
    private async stop_background_tasks() {
        console.log('Stopping background tasks')
        for (const task of this.background_tasks) {
            await task.stop()
        }
        this.background_tasks = []
    }
    
    private async cleanup_resources() {
        console.log('Cleaning up resources')
        for (const tool of this.monitoring_tools) {
            await tool.cleanup()
        }
        this.monitoring_tools = []
    }
    
    private async fetch_initial_data() {
        // Data loading logic
        return []
    }
    
    private async initialize_workers() {
        // Worker initialization
        return []
    }
    
    private async setup_monitoring() {
        // Monitoring setup
        return []
    }
    
    private async persist_data() {
        // Data persistence logic
    }
}
```

### Resource Management Pattern

```typescript
@TpService()
class ResourceManager {
    private database_connections: any[] = []
    private cache_connections: any[] = []
    private background_processes: any[] = []
    
    @OnStart()
    async initialize() {
        console.log('Initializing all resources...')
        
        await this.initialize_database()
        await this.initialize_cache()
        await this.start_background_processes()
        
        console.log('All resources initialized successfully')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('Cleaning up all resources...')
        
        // Stop background processes first
        await this.stop_background_processes()
        
        // Then close connections
        await this.cleanup_connections()
        
        console.log('All resources cleaned up successfully')
    }
    
    private async initialize_database() {
        console.log('Initializing database connections')
        const connection = await this.create_database_connection()
        this.database_connections.push(connection)
    }
    
    private async initialize_cache() {
        console.log('Initializing cache connections')
        const connection = await this.create_cache_connection()
        this.cache_connections.push(connection)
    }
    
    private async start_background_processes() {
        console.log('Starting background processes')
        const data_processor = this.start_data_processor()
        const health_checker = this.start_health_checker()
        this.background_processes.push(data_processor, health_checker)
    }
    
    private async stop_background_processes() {
        console.log('Stopping background processes')
        for (const process of this.background_processes) {
            await process.stop()
        }
        this.background_processes = []
    }
    
    private async cleanup_connections() {
        console.log('Closing all connections')
        
        // Close cache connections
        for (const connection of this.cache_connections) {
            await connection.close()
        }
        
        // Close database connections
        for (const connection of this.database_connections) {
            await connection.close()
        }
        
        this.cache_connections = []
        this.database_connections = []
    }
    
    private async create_database_connection() {
        return { close: async () => {} } // Mock
    }
    
    private async create_cache_connection() {
        return { close: async () => {} } // Mock
    }
    
    private start_data_processor() {
        return { stop: async () => {} } // Mock
    }
    
    private start_health_checker() {
        return { stop: async () => {} } // Mock
    }
}
```

### Advanced: Using TpLoader Directly

:::info Complete Example
[example/core/built-in/04-tp-loader-advanced.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/04-tp-loader-advanced.ts)
:::

For advanced scenarios where you need more control over hook registration, you can inject TpLoader directly:

```typescript
import { TpService, TpLoader } from '@tarpit/core'

@TpService()
class AdvancedService {
    constructor(private loader: TpLoader) {
        // Only use this approach when decorators are not sufficient
        // For example, when registering hooks conditionally
        this.register_conditional_hooks()
    }
    
    private register_conditional_hooks() {
        // Conditional hook registration based on configuration
        if (this.should_enable_feature()) {
            this.loader.on_start(this.initialize_feature.bind(this))
            this.loader.on_terminate(this.cleanup_feature.bind(this))
        }
        
        // Dynamic hook registration in loops
        for (let i = 0; i < 3; i++) {
            this.loader.on_start(async () => {
                console.log(`Dynamic hook ${i}`)
            })
        }
    }
    
    private should_enable_feature(): boolean {
        // Some condition check
        return true
    }
    
    private async initialize_feature() {
        console.log('Initializing conditional feature')
    }
    
    private async cleanup_feature() {
        console.log('Cleaning up conditional feature')
    }
}
```

### Hook Execution Order

:::info Complete Example
[example/core/built-in/05-hook-execution-order.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/05-hook-execution-order.ts)
:::

Lifecycle hooks are triggered in the order services are registered, but the actual execution completion order depends on the individual hook implementation:

```typescript
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
}

// During startup, triggering order is guaranteed:
// ServiceA: Starting initialization
// ServiceB: Starting initialization
//
// But completion order depends on async operations:
// ServiceA: Initialization completed  (finishes first due to shorter delay)
// ServiceB: Initialization completed  (finishes second due to longer delay)

// During shutdown, same behavior:
// ServiceA: Starting cleanup
// ServiceB: Starting cleanup
// ServiceA: Cleanup completed
// ServiceB: Cleanup completed
```

:::warning Hook Execution Behavior
- **Triggering order**: Guaranteed to follow service registration order
- **Completion order**: Not guaranteed - depends on each hook's execution time
- **Error handling**: If one hook fails, others continue to execute
- **No dependencies**: Hooks run independently, don't wait for each other
:::

If you need guaranteed sequential execution, handle it within a single service or use explicit dependencies between services.

## Next Steps

- [**Dependency Injection**](./dependency-injection) - Review DI fundamentals  
- [**Platform & Lifecycle**](./platform-lifecycle) - Understand application lifecycle
- [**Providers**](./providers) - Learn about different provider types