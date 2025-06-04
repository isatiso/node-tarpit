---
sidebar_position: 5
---

# Built-in Services

:::info Related Examples
See [platform-lifecycle.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/platform-lifecycle.ts) and [decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts) for examples using built-in services.
:::

Tarpit provides several built-in services that are automatically available in every application. These services provide core functionality like configuration access, module loading, and lifecycle management.

## Overview

Built-in services are automatically registered by the Platform and can be injected into any service without explicit registration. They provide essential functionality that most applications need.

### Available Built-in Services

- **TpConfigData** - Access to application configuration
- **TpLoader** - Lifecycle management and module loading hooks
- **TpInspector** - Runtime introspection and debugging
- **Platform** - Direct access to the platform instance

## TpConfigData

Provides access to the application configuration loaded during platform initialization.

### Basic Usage

```typescript
import { TpService, TpConfigData } from '@tarpit/core'

@TpService()
class DatabaseService {
    constructor(private config: TpConfigData) {}
    
    connect() {
        console.log(`Connecting to database: ${this.config.name}`)
        // Access configuration properties
    }
}
```

### Configuration Types

TpConfigData is typed based on your configuration schema:

```typescript
interface MyAppConfig extends TpConfigSchema {
    database: {
        host: string
        port: number
        name: string
    }
    redis: {
        host: string
        port: number
    }
}

const config = load_config<MyAppConfig>({
    database: {
        host: 'localhost',
        port: 5432,
        name: 'myapp'
    },
    redis: {
        host: 'localhost',
        port: 6379
    }
})

@TpService()
class DatabaseService {
    constructor(private config: TpConfigData<MyAppConfig>) {}
    
    connect() {
        // TypeScript knows the shape of config
        const dbConfig = this.config.database
        console.log(`Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`)
    }
}
```

### Configuration Patterns

#### Environment-Specific Configuration

```typescript
@TpService()
class LoggerService {
    constructor(private config: TpConfigData) {}
    
    log(message: string) {
        if (this.config.debug) {
            console.log(`[DEBUG] ${message}`)
        } else {
            // Production logging (file, external service, etc.)
        }
    }
}
```

#### Validation in Services

```typescript
@TpService()
class EmailService {
    constructor(private config: TpConfigData<AppConfig>) {}
    
    private validate_config() {
        if (!this.config.email?.apiKey) {
            throw new Error('Email API key is required')
        }
        
        if (!this.config.email?.fromAddress) {
            throw new Error('From address is required')
        }
    }
    
    async send_email(to: string, subject: string, body: string) {
        this.validate_config()
        // Send email...
    }
}
```

## TpLoader

Manages the application lifecycle and provides hooks for initialization and cleanup operations.

### Lifecycle Hooks

```typescript
import { TpService, TpLoader } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    constructor(private loader: TpLoader) {
        // Register lifecycle hooks
        this.loader.on_startup(this.initialize.bind(this))
        this.loader.on_shutdown(this.cleanup.bind(this))
    }
    
    private async initialize() {
        console.log('Initializing database connection')
        this.connection = await createDatabaseConnection()
    }
    
    private async cleanup() {
        console.log('Closing database connection')
        if (this.connection) {
            await this.connection.close()
        }
    }
}
```

### Hook Registration

TpLoader provides several hook registration methods:

```typescript
@TpService()
class ApplicationService {
    constructor(private loader: TpLoader) {
        // Startup hooks - called when platform starts
        this.loader.on_startup(this.load_data.bind(this))
        this.loader.on_startup(this.start_background_tasks.bind(this))
        
        // Shutdown hooks - called when platform terminates
        this.loader.on_shutdown(this.save_state.bind(this))
        this.loader.on_shutdown(this.stop_background_tasks.bind(this))
    }
    
    private async load_data() {
        console.log('Loading initial data')
    }
    
    private async start_background_tasks() {
        console.log('Starting background tasks')
    }
    
    private async save_state() {
        console.log('Saving application state')
    }
    
    private async stop_background_tasks() {
        console.log('Stopping background tasks')
    }
}
```

### Hook Execution Order

Hooks are executed in the order they were registered:

```typescript
@TpService()
class ServiceA {
    constructor(private loader: TpLoader) {
        this.loader.on_startup(() => console.log('ServiceA startup'))
        this.loader.on_shutdown(() => console.log('ServiceA shutdown'))
    }
}

@TpService()
class ServiceB {
    constructor(private loader: TpLoader) {
        this.loader.on_startup(() => console.log('ServiceB startup'))
        this.loader.on_shutdown(() => console.log('ServiceB shutdown'))
    }
}

// Output during startup:
// ServiceA startup
// ServiceB startup

// Output during shutdown:
// ServiceA shutdown  
// ServiceB shutdown
```

## TpInspector

Provides runtime introspection capabilities for debugging and monitoring.

### Service Inspection

```typescript
import { TpService, TpInspector } from '@tarpit/core'

@TpService()
class DebugService {
    constructor(private inspector: TpInspector) {}
    
    debug_dependencies() {
        // Get all registered services
        const services = this.inspector.get_services()
        console.log('Registered services:', services.map(s => s.name))
        
        // Get dependency graph
        const dependencies = this.inspector.get_dependency_graph()
        console.log('Dependency relationships:', dependencies)
    }
    
    check_service_health() {
        // Check if specific services are available
        const hasDatabase = this.inspector.has_service('DatabaseService')
        const hasCache = this.inspector.has_service('CacheService')
        
        console.log(`Database available: ${hasDatabase}`)
        console.log(`Cache available: ${hasCache}`)
    }
}
```

### Performance Monitoring

```typescript
@TpService()
class MonitoringService {
    constructor(private inspector: TpInspector) {}
    
    monitor_service_creation() {
        this.inspector.on_service_created((serviceInfo) => {
            console.log(`Service created: ${serviceInfo.name} in ${serviceInfo.creationTime}ms`)
        })
    }
    
    get_platform_stats() {
        const stats = this.inspector.get_platform_stats()
        return {
            totalServices: stats.serviceCount,
            totalModules: stats.moduleCount,
            uptime: stats.uptime,
            memoryUsage: process.memoryUsage()
        }
    }
}
```

## Platform

Provides direct access to the Platform instance for advanced use cases.

### Service Access

```typescript
import { TpService, Platform } from '@tarpit/core'

@TpService()
class ServiceRegistry {
    constructor(private platform: Platform) {}
    
    get_service<T>(token: any): T {
        // Dynamically resolve services
        return this.platform.expose(token)
    }
    
    check_service_exists(token: any): boolean {
        try {
            this.platform.expose(token)
            return true
        } catch {
            return false
        }
    }
}
```

### Dynamic Module Loading

```typescript
@TpService()
class PluginManager {
    constructor(private platform: Platform) {}
    
    async load_plugin(pluginModule: any) {
        // Dynamically import and register a module
        this.platform.import(pluginModule)
        
        // Restart services if needed
        await this.platform.reload_services()
    }
    
    get_loaded_modules() {
        return this.platform.get_modules()
    }
}
```

## Usage Patterns

### Configuration-Driven Services

```typescript
@TpService()
class NotificationService {
    constructor(
        private config: TpConfigData<AppConfig>,
        private loader: TpLoader
    ) {
        this.loader.on_startup(this.initialize.bind(this))
    }
    
    private async initialize() {
        if (this.config.notifications?.email?.enabled) {
            await this.setup_email_notifications()
        }
        
        if (this.config.notifications?.sms?.enabled) {
            await this.setup_sms_notifications()
        }
        
        if (this.config.notifications?.push?.enabled) {
            await this.setup_push_notifications()
        }
    }
    
    private async setup_email_notifications() {
        // Initialize email service
    }
    
    private async setup_sms_notifications() {
        // Initialize SMS service
    }
    
    private async setup_push_notifications() {
        // Initialize push notification service
    }
}
```

### Health Checks

```typescript
@TpService()
class HealthCheckService {
    constructor(
        private inspector: TpInspector,
        private config: TpConfigData
    ) {}
    
    async perform_health_check() {
        const health = {
            status: 'healthy' as 'healthy' | 'unhealthy',
            services: {},
            platform: {},
            timestamp: new Date().toISOString()
        }
        
        // Check platform stats
        const stats = this.inspector.get_platform_stats()
        health.platform = {
            uptime: stats.uptime,
            serviceCount: stats.serviceCount,
            memoryUsage: process.memoryUsage()
        }
        
        // Check critical services
        const criticalServices = ['DatabaseService', 'CacheService', 'EmailService']
        for (const serviceName of criticalServices) {
            health.services[serviceName] = this.inspector.has_service(serviceName)
            if (!health.services[serviceName]) {
                health.status = 'unhealthy'
            }
        }
        
        return health
    }
}
```

### Development Tools

```typescript
@TpService()
class DevelopmentService {
    constructor(
        private config: TpConfigData,
        private inspector: TpInspector,
        private loader: TpLoader
    ) {
        if (this.config.debug) {
            this.setup_development_tools()
        }
    }
    
    private setup_development_tools() {
        // Log service creation in development
        this.inspector.on_service_created((info) => {
            console.log(`🔧 Service created: ${info.name}`)
        })
        
        // Add hot reload support
        this.loader.on_startup(() => {
            console.log('🚀 Development server started')
        })
        
        // Memory usage monitoring
        setInterval(() => {
            if (this.config.debug) {
                const usage = process.memoryUsage()
                console.log(`📊 Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`)
            }
        }, 10000)
    }
}
```

## Best Practices

### 1. Use Configuration for Behavior

```typescript
// ✅ Good - Configuration-driven behavior
@TpService()
class CacheService {
    constructor(private config: TpConfigData<AppConfig>) {}
    
    get(key: string) {
        if (this.config.cache?.enabled) {
            return this.redis_get(key)
        } else {
            return this.memory_get(key)
        }
    }
}

// ❌ Avoid - Hard-coded behavior
@TpService()
class CacheService {
    get(key: string) {
        return this.redis_get(key) // Always uses Redis
    }
}
```

### 2. Graceful Degradation

```typescript
// ✅ Good - Graceful handling of missing services
@TpService()
class LoggerService {
    constructor(
        private config: TpConfigData,
        private inspector: TpInspector
    ) {}
    
    log(message: string) {
        console.log(message)
        
        // Optional external logging
        if (this.inspector.has_service('ExternalLoggerService')) {
            const external = this.inspector.get_service('ExternalLoggerService')
            external.log(message)
        }
    }
}
```

### 3. Proper Resource Cleanup

```typescript
// ✅ Good - Proper cleanup
@TpService()
class DatabaseService {
    private connections: Connection[] = []
    
    constructor(private loader: TpLoader) {
        this.loader.on_shutdown(this.cleanup.bind(this))
    }
    
    private async cleanup() {
        for (const connection of this.connections) {
            await connection.close()
        }
        this.connections = []
    }
}
```

## Next Steps

- [**Dependency Injection**](./dependency-injection) - Review DI fundamentals  
- [**Platform & Lifecycle**](./platform-lifecycle) - Understand application lifecycle
- [**Providers**](./providers) - Learn about different provider types