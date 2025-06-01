---
layout: default
title: Built-in Services
parent: Core Concepts
nav_order: 5
---

# Built-in Services
{:.no_toc}

> **💡 Related Examples**: See [platform-lifecycle.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform-lifecycle.ts) and [decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts) for examples using built-in services.

Tarpit provides several built-in services that are automatically available in every application. These services provide core functionality like configuration access, module loading, and lifecycle management.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

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

Hooks are executed in the order they are registered:

```typescript
@TpService()
class ServiceA {
    constructor(private loader: TpLoader) {
        this.loader.on_startup(() => console.log('ServiceA startup'))
    }
}

@TpService()
class ServiceB {
    constructor(private loader: TpLoader) {
        this.loader.on_startup(() => console.log('ServiceB startup'))
    }
}

// During platform.start():
// Output: ServiceA startup
// Output: ServiceB startup
```

### Error Handling in Hooks

```typescript
@TpService()
class RobustService {
    constructor(private loader: TpLoader) {
        this.loader.on_startup(this.safe_initialization.bind(this))
        this.loader.on_shutdown(this.safe_cleanup.bind(this))
    }
    
    private async safe_initialization() {
        try {
            await this.initialize()
        } catch (error) {
            console.error('Failed to initialize service:', error)
            // Don't rethrow - allow other services to start
        }
    }
    
    private async safe_cleanup() {
        try {
            await this.cleanup()
        } catch (error) {
            console.error('Failed to cleanup service:', error)
            // Don't rethrow - allow other services to cleanup
        }
    }
}
```

## TpInspector

Provides runtime introspection capabilities for debugging and monitoring.

### Service Discovery

```typescript
import { TpService, TpInspector } from '@tarpit/core'

@TpService()
class DebugService {
    constructor(private inspector: TpInspector) {}
    
    list_all_services() {
        const services = this.inspector.get_all_services()
        console.log('Registered services:')
        services.forEach(service => {
            console.log(`- ${service.constructor.name}`)
        })
    }
    
    check_service_availability(serviceClass: any) {
        const exists = this.inspector.has_service(serviceClass)
        console.log(`Service ${serviceClass.name} is ${exists ? 'available' : 'not available'}`)
    }
}
```

### Dependency Graph Analysis

```typescript
@TpService()
class AnalyticsService {
    constructor(private inspector: TpInspector) {}
    
    analyze_dependencies() {
        const graph = this.inspector.get_dependency_graph()
        
        console.log('Dependency analysis:')
        graph.forEach((dependencies, service) => {
            console.log(`${service.name} depends on:`)
            dependencies.forEach(dep => {
                console.log(`  - ${dep.name}`)
            })
        })
    }
}
```

### Runtime Configuration Inspection

```typescript
@TpService()
class ConfigInspector {
    constructor(private inspector: TpInspector) {}
    
    dump_configuration() {
        const config = this.inspector.get_platform_config()
        console.log('Current configuration:')
        console.log(JSON.stringify(config, null, 2))
    }
    
    check_debug_mode() {
        const config = this.inspector.get_platform_config()
        return config.debug === true
    }
}
```

## Platform Access

In some cases, you might need direct access to the Platform instance:

```typescript
import { TpService, Platform } from '@tarpit/core'

@TpService()
class PlatformService {
    constructor(private platform: Platform) {}
    
    get_platform_info() {
        return {
            started: this.platform.started,
            config: this.platform.config,
            name: this.platform.config.name
        }
    }
    
    expose_service<T>(serviceClass: new (...args: any[]) => T): T {
        return this.platform.expose(serviceClass)
    }
}
```

**Note**: Direct Platform access should be used sparingly. Most functionality should be accessed through specific built-in services.

## Common Patterns

### Configuration-Driven Service Registration

```typescript
@TpService()
class PluginManager {
    constructor(
        private config: TpConfigData<AppConfig>,
        private loader: TpLoader
    ) {
        this.loader.on_startup(this.load_plugins.bind(this))
    }
    
    private async load_plugins() {
        const enabledPlugins = this.config.plugins?.enabled || []
        
        for (const pluginName of enabledPlugins) {
            try {
                const plugin = await import(`./plugins/${pluginName}`)
                await plugin.initialize()
                console.log(`Loaded plugin: ${pluginName}`)
            } catch (error) {
                console.error(`Failed to load plugin ${pluginName}:`, error)
            }
        }
    }
}
```

### Health Check Service

```typescript
@TpService()
class HealthCheckService {
    private checks: Map<string, () => Promise<boolean>> = new Map()
    
    constructor(
        private config: TpConfigData,
        private inspector: TpInspector,
        private loader: TpLoader
    ) {
        this.loader.on_startup(this.register_default_checks.bind(this))
    }
    
    private register_default_checks() {
        this.add_check('platform', async () => {
            return this.inspector.get_platform_config() !== null
        })
        
        this.add_check('services', async () => {
            const services = this.inspector.get_all_services()
            return services.length > 0
        })
    }
    
    add_check(name: string, check: () => Promise<boolean>) {
        this.checks.set(name, check)
    }
    
    async run_all_checks() {
        const results: Record<string, boolean> = {}
        
        for (const [name, check] of this.checks) {
            try {
                results[name] = await check()
            } catch (error) {
                console.error(`Health check '${name}' failed:`, error)
                results[name] = false
            }
        }
        
        return results
    }
}
```

### Environment Service

```typescript
@TpService()
class EnvironmentService {
    constructor(private config: TpConfigData<AppConfig>) {}
    
    is_development(): boolean {
        return this.config.environment === 'development'
    }
    
    is_production(): boolean {
        return this.config.environment === 'production'
    }
    
    is_testing(): boolean {
        return this.config.environment === 'test'
    }
    
    get_database_config() {
        if (this.is_production()) {
            return this.config.database.production
        } else if (this.is_testing()) {
            return this.config.database.test
        } else {
            return this.config.database.development
        }
    }
}
```

### Metrics Collection Service

```typescript
@TpService()
class MetricsService {
    private metrics: Map<string, number> = new Map()
    
    constructor(
        private config: TpConfigData,
        private loader: TpLoader,
        private inspector: TpInspector
    ) {
        this.loader.on_startup(this.start_metrics_collection.bind(this))
        this.loader.on_shutdown(this.save_metrics.bind(this))
    }
    
    private start_metrics_collection() {
        if (!this.config.metrics?.enabled) {
            return
        }
        
        // Collect platform metrics
        setInterval(() => {
            const services = this.inspector.get_all_services()
            this.set_metric('services.count', services.length)
            this.set_metric('platform.uptime', process.uptime())
        }, 60000) // Every minute
    }
    
    private async save_metrics() {
        if (this.config.metrics?.persistToFile) {
            const metricsData = Object.fromEntries(this.metrics)
            await fs.writeFile('./metrics.json', JSON.stringify(metricsData, null, 2))
        }
    }
    
    set_metric(name: string, value: number) {
        this.metrics.set(name, value)
    }
    
    get_metric(name: string): number | undefined {
        return this.metrics.get(name)
    }
    
    get_all_metrics(): Record<string, number> {
        return Object.fromEntries(this.metrics)
    }
}
```

## Best Practices

### 1. Use Appropriate Built-in Services

```typescript
// ✅ Good - Use TpConfigData for configuration
@TpService()
class EmailService {
    constructor(private config: TpConfigData<AppConfig>) {}
}

// ❌ Avoid - Direct environment variable access
@TpService()
class EmailService {
    constructor() {
        this.apiKey = process.env.EMAIL_API_KEY // Not configuration-driven
    }
}
```

### 2. Register Lifecycle Hooks Early

```typescript
// ✅ Good - Register hooks in constructor
@TpService()
class DatabaseService {
    constructor(private loader: TpLoader) {
        this.loader.on_startup(this.initialize.bind(this))
        this.loader.on_shutdown(this.cleanup.bind(this))
    }
}

// ❌ Avoid - Late hook registration
@TpService()
class DatabaseService {
    constructor(private loader: TpLoader) {}
    
    some_method() {
        this.loader.on_startup(this.initialize.bind(this)) // Too late!
    }
}
```

### 3. Handle Hook Errors Gracefully

```typescript
// ✅ Good - Graceful error handling
private async startup_hook() {
    try {
        await this.risky_initialization()
    } catch (error) {
        console.error('Initialization failed:', error)
        // Continue with partial functionality
    }
}

// ❌ Avoid - Uncaught errors
private async startup_hook() {
    await this.risky_initialization() // Could crash the entire app
}
```

### 4. Use Inspector for Development Only

```typescript
// ✅ Good - Development-only debugging
@TpService()
class DebugService {
    constructor(
        private config: TpConfigData,
        private inspector: TpInspector
    ) {}
    
    debug_info() {
        if (this.config.debug) {
            return this.inspector.get_all_services()
        }
        return null
    }
}

// ❌ Avoid - Always using inspector in production
@TpService()
class ProductionService {
    constructor(private inspector: TpInspector) {
        // Using inspector in production code
    }
}
```

## Next Steps

- Explore [HTTP Server](/2-http-server/) to build web applications
- Learn about [Decorators](2-decorators.html) for advanced service configuration
- See [Platform & Lifecycle](3-platform-lifecycle.html) for more lifecycle management 