---
sidebar_position: 2
---

# Platform & Lifecycle

:::info Working Examples
See [platform examples](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/) for complete working examples.
:::

The Platform class is the heart of every Tarpit application. It manages the dependency injection container, handles module imports, and controls the application lifecycle from startup to shutdown.

## Platform Overview

The Platform serves as:

- **DI Container Manager** - Creates and manages the dependency injection system
- **Module Orchestrator** - Handles module imports and dependency resolution
- **Lifecycle Manager** - Controls application startup, running, and shutdown phases
- **Service Registry** - Central registry for all services and providers

## Basic Platform Usage

### Creating a Platform

:::info Complete Example
[example/core/platform/01-basic-usage.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/01-basic-usage.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'

const config = load_config<TpConfigSchema>({
    name: 'my-app',
    version: '1.0.0',
    debug: process.env.NODE_ENV === 'development'
})

const platform = new Platform(config)
```

### Importing Modules and Services

```typescript
import { UserService, UserModule } from './user'
import { DatabaseService } from './database'
import { EmailService, NotificationService } from './services'

const platform = new Platform(config)
    .import(DatabaseService)      // Import individual service
    .import(UserModule)           // Import entire module
    .import(EmailService)         // Import each service individually
    .import(NotificationService)  // import() doesn't support arrays
```

### Starting the Application

```typescript
// Start the platform
await platform.start()

// Access services after startup
const userService = platform.expose(UserService)
const result = userService.create_user('Alice')
```

## Platform Configuration

### Understanding TpConfigSchema and Declaration Merging

`TpConfigSchema` is the core of Tarpit's configuration system. It uses TypeScript's **Declaration Merging** feature to automatically combine configuration types from all loaded modules.

:::info Why HTTP Module as Example
We use `@tarpit/http` as our primary example because:
- It's one of the most commonly used Tarpit modules
- It provides clear, practical configuration options (port, hostname, CORS)
- It demonstrates the essential concept without complexity
- Most developers are familiar with HTTP server configuration
:::

#### Base TpConfigSchema (Empty)

The basic `TpConfigSchema` starts empty and gets extended by modules:

```typescript
import { load_config } from '@tarpit/config'
import { TpConfigSchema } from '@tarpit/core'

// Base TpConfigSchema has no predefined fields
interface TpConfigSchema {
    // Empty - gets extended by imported modules
}

// Without any modules, no configuration fields are available
const config = load_config<TpConfigSchema>({
    // No fields available in base TpConfigSchema
})

const platform = new Platform(config)
```

#### Adding HTTP Module Configuration

When you import `@tarpit/http`, it automatically extends `TpConfigSchema`:

```typescript
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'  // This import extends TpConfigSchema

// Now TpConfigSchema includes HTTP configuration options
const config = load_config<TpConfigSchema>({
    http: {
        port: 3000,
        hostname: '0.0.0.0',
        cors: {
            enabled: true,
            origin: '*'
        }
    }
})

const platform = new Platform(config)
```

#### How the HTTP Module Extends Configuration

Behind the scenes, `@tarpit/http` uses declaration merging:

```typescript
// Inside @tarpit/http module
declare module '@tarpit/core' {
    interface TpConfigSchema {
        http?: {
            port?: number
            hostname?: string
            cors?: {
                enabled?: boolean
                origin?: string | string[]
                credentials?: boolean
            }
        }
    }
}
```

#### Type Safety and IntelliSense

The declaration merging provides full TypeScript support:

```typescript
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'

const config = load_config<TpConfigSchema>({
    http: {
        port: 3000,           // ✅ TypeScript knows this should be number
        // port: '3000',      // ❌ TypeScript error: should be number
        hostname: '0.0.0.0',
        cors: {
            enabled: true,
            origin: ['http://localhost:3000', 'https://myapp.com']
            // origin: 123     // ❌ TypeScript error: should be string | string[]
        }
    }
})

const platform = new Platform(config)
```

### Environment-Based Configuration

:::info Complete Example
[example/core/platform/02-configuration.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/02-configuration.ts)
:::

A practical configuration pattern with environment variables:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'

const config = load_config<TpConfigSchema>({
    http: {
        port: parseInt(process.env.PORT || '3000'),
        hostname: process.env.HOST || '0.0.0.0',
        cors: {
            enabled: process.env.CORS_ENABLED !== 'false',
            origin: process.env.CORS_ORIGIN?.split(',') || '*',
            credentials: process.env.CORS_CREDENTIALS === 'true'
        }
    }
})

const platform = new Platform(config)
    .import(HttpModule)  // HTTP module will use the configuration
```

### Multiple Modules Configuration

When multiple modules are imported, their configurations merge automatically:

```typescript
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'
import '@tarpit/mongodb'

const config = load_config<TpConfigSchema>({
    // HTTP configuration (from @tarpit/http)
    http: {
        port: 3000,
        cors: { enabled: true }
    },
    
    // MongoDB configuration (from @tarpit/mongodb)  
    mongodb: {
        url: 'mongodb://localhost:27017',
        database: 'myapp',
        options: {
            maxPoolSize: 10
        }
    }
})

const platform = new Platform(config)
```

### Custom Configuration Extensions

You can extend configuration for your own application needs:

```typescript
// Extend TpConfigSchema for your application
declare module '@tarpit/core' {
    interface TpConfigSchema {
        database?: {
            url?: string
            poolSize?: number
        }
        features?: {
            emailEnabled?: boolean
            analyticsEnabled?: boolean
        }
    }
}

const config = load_config<TpConfigSchema>({
    // HTTP module configuration
    http: {
        port: 3000
    },
    
    // Your custom configuration
    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
    },
    
    features: {
        emailEnabled: process.env.EMAIL_ENABLED === 'true',
        analyticsEnabled: true
    }
})
```

### Configuration Access in Services

Services access configuration through `TpConfigData` using the `get()` method with JSON path notation:

```typescript
import { TpService, TpConfigData } from '@tarpit/core'

@TpService()
class HttpConfigService {
    
    constructor(private config: TpConfigData) {}
    
    get_server_port() {
        // Access nested configuration using JSON path
        return this.config.get('http.port') ?? 3000
    }
    
    get_cors_origin() {
        return this.config.get('http.cors.origin') ?? '*'
    }
    
    is_cors_enabled() {
        return this.config.get('http.cors.enabled') === true
    }
    
    get_file_manager_root() {
        return this.config.get('http.file_manager.root') ?? './data'
    }
}
```

#### JSON Path Configuration Access

The `get()` method supports deep nested path access using dot notation:

```typescript
@TpService()
class DatabaseConfigService {
    
    constructor(private config: TpConfigData) {}
    
    get_connection_config() {
        // Access MongoDB configuration
        const url = this.config.get('mongodb.url')
        const options = this.config.get('mongodb.options')
        const database = this.config.get('mongodb.database')
        
        return { url, options, database }
    }
    
    // Custom configuration access
    get_database_pool_size() {
        return this.config.get('database.poolSize') ?? 10
    }
    
    get_feature_flags() {
        return {
            emailEnabled: this.config.get('features.emailEnabled') ?? false,
            analyticsEnabled: this.config.get('features.analyticsEnabled') ?? false
        }
    }
}
```

#### Complete Configuration Access

To access the entire configuration object:

```typescript
@TpService()
class ConfigurationService {
    
    constructor(private config: TpConfigData) {}
    
    log_all_configuration() {
        // Get entire configuration without path
        const fullConfig = this.config.get()
        console.log('Complete configuration:', fullConfig)
        return fullConfig
    }
    
    log_specific_sections() {
        // Access specific configuration sections
        const httpConfig = this.config.get('http')
        const mongoConfig = this.config.get('mongodb')
        const customConfig = this.config.get('database')
        
        console.log('HTTP Configuration:', httpConfig)
        console.log('MongoDB Configuration:', mongoConfig)
        console.log('Custom Database Configuration:', customConfig)
    }
}
```

#### Type-Safe Configuration Access

The `get()` method provides full TypeScript type inference based on the configuration schema:

```typescript
// Extend configuration schema
declare module '@tarpit/core' {
    interface TpConfigSchema {
        database?: {
            url?: string
            poolSize?: number
        }
        features?: {
            emailEnabled?: boolean
            analyticsEnabled?: boolean
        }
    }
}

@TpService()
class TypeSafeConfigService {
    
    constructor(private config: TpConfigData) {}
    
    initialize() {
        // TypeScript provides full IntelliSense for these paths
        const httpPort = this.config.get('http.port')              // number | undefined
        const corsOrigin = this.config.get('http.cors.origin')     // string | string[] | undefined
        const dbUrl = this.config.get('database.url')              // string | undefined
        const emailEnabled = this.config.get('features.emailEnabled') // boolean | undefined
        
        // Use with default values
        const port = this.config.get('http.port') ?? 3000
        const poolSize = this.config.get('database.poolSize') ?? 10
        
        console.log(`Server starting on port ${port} with pool size ${poolSize}`)
    }
}
```

### Configuration Benefits

The declaration merging configuration system provides:

1. **Type Safety** - Full TypeScript checking for all configuration options
2. **Automatic Extension** - Modules automatically contribute their configuration
3. **IntelliSense Support** - Complete auto-completion in your IDE
4. **Environment Integration** - Easy integration with environment variables
5. **Modular Design** - Configuration grows with your application modules

## Platform Methods

:::info Complete Example
[example/core/platform/03-platform-methods.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/03-platform-methods.ts)
:::

### .import()

Import services, modules, or providers:

```typescript
// Import a service class
platform.import(UserService)

// Import a module
platform.import(UserModule)

// Import with custom provider
platform.import({
    provide: DATABASE_URL,
    useValue: 'postgresql://localhost:5432'
})

// Import factory provider
platform.import({
    provide: ApiClient,
    useFactory: (config: TpConfigData) => new ApiClient(config.api.baseUrl),
    deps: [TpConfigData]
})
```

### .start()

Start the platform and initialize all services:

```typescript
// Simple start
await platform.start()

// Start returns the platform for chaining
const runningPlatform = await platform.start()

// With error handling
try {
    await platform.start()
    console.log('Platform started successfully')
} catch (error) {
    console.error('Failed to start platform:', error)
    
    // Platform automatically cleans up on startup failure
    // No need to manually call terminate()
    
    // Log specific error details
    if (error.message.includes('dependency')) {
        console.error('Dependency injection error - check your service dependencies')
    } else if (error.message.includes('configuration')) {
        console.error('Configuration error - check your config values')
    }
    
    process.exit(1)
}
```

### .expose()

Get an instance of a service from the platform:

```typescript
// Get a service instance
const userService = platform.expose(UserService)

// Use with custom token
const dbUrl = platform.expose(DATABASE_URL)

// Check if service exists (returns undefined if not found)
const optionalService = platform.expose(OptionalService)
if (optionalService) {
    optionalService.doSomething()
}
```

### .terminate()

Gracefully shutdown the platform:

```typescript
// Shutdown the platform
await platform.terminate()

// With error handling
try {
    await platform.terminate()
    console.log('Platform terminated successfully')
} catch (error) {
    console.error('Error during platform termination:', error)
}
```

### .inspect_injector()

Debug the dependency injection hierarchy:

```typescript
// Before using any services
console.log('=== Provider Tree (Before) ===')
console.log(platform.inspect_injector())

// After starting the platform
await platform.start()

// Use some services
const userService = platform.expose(UserService)
const dbService = platform.expose(DatabaseService)

// Print the dependency tree
console.log('=== Provider Tree (After) ===')
console.log(platform.inspect_injector())

// Example output for debugging:
// Injector
// ├── ○ TpConfigData [Built-in]
// ├── ✓ TpLoader [Built-in]
// ├── ✓ DatabaseService [TpWorker → @TpService]
// ├── ○ CacheService [TpWorker → @TpService]
// ├── ✓ UserService [TpWorker → @TpService]
// └── Injector (UserModule)
//     ├── ○ UserRepository [TpWorker → @TpService]
//     ├── ○ UserValidator [TpWorker → @TpService]
//     └── ✓ UserModule [TpAssembly → @TpModule]
```

#### Used Status Analysis

The usage indicators help identify:
- **✓ Used services** - These have been instantiated and are active
- **○ Unused services** - These are registered but not yet needed
- **Performance optimization** - Remove unused services to reduce startup time
- **Dependency tracking** - Understand which services trigger others

## Application Lifecycle

The Platform manages the complete application lifecycle from startup to shutdown, providing hooks for services to participate in each phase.

### Lifecycle Phases

#### Startup Phase

During startup, the platform:

1. **Loads Configuration** - Processes the provided configuration
2. **Creates DI Container** - Sets up the dependency injection system
3. **Registers Providers** - Registers all imported services and modules
4. **Resolves Dependencies** - Creates instances and injects dependencies
5. **Calls Startup Hooks** - Triggers `on_start` methods on services

#### Running Phase

Once started, the platform:

- **Manages Service Instances** - Keeps track of all created services
- **Handles Service Resolution** - Provides services via `.expose()`
- **Monitors Lifecycle** - Manages ongoing operations

#### Shutdown Phase

During termination, the platform:

1. **Calls Cleanup Hooks** - Triggers `on_terminate` methods
2. **Releases Resources** - Frees up memory and connections
3. **Closes Connections** - Shuts down database, network connections
4. **Cleans DI Container** - Clears all service instances

### Service Lifecycle Hooks

:::info Complete Example
[example/core/platform/04-lifecycle-hooks.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/04-lifecycle-hooks.ts)
:::

Services can implement lifecycle hooks to manage their initialization and cleanup. These hooks are automatically called by the platform during the corresponding lifecycle phases.

#### Startup Hook: @OnStart

Called during the startup phase when services need to initialize:

```typescript
import { TpService, OnStart } from '@tarpit/core'

@TpService()
class DatabaseService {
    private isConnected = false
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: Starting connection...')
        await this.connect()
        this.isConnected = true
        console.log('DatabaseService: Connected successfully')
    }
    
    private async connect() {
        // Database connection logic
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}
```

#### Cleanup Hook: @OnTerminate

Called during the shutdown phase when services need to clean up:

```typescript
import { TpService, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connections: Connection[] = []
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: Closing connections...')
        
        // Close all connections
        await Promise.all(
            this.connections.map(conn => conn.close())
        )
        
        console.log('DatabaseService: All connections closed')
    }
}
```

#### Complete Lifecycle Example

A service that uses both startup and cleanup hooks:

```typescript
@TpService()
class CacheService {
    private cache = new Map<string, any>()
    private cleanupInterval?: NodeJS.Timeout
    
    @OnStart()
    async initialize() {
        console.log('CacheService: Initializing cache...')
        await this.load_initial_data()
        
        // Setup periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanup_expired_entries()
        }, 60000)
        
        console.log('CacheService: Cache initialized')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('CacheService: Shutting down...')
        
        try {
            // Clear the cleanup interval
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval)
            }
            
            // Save cache to persistent storage if needed
            await this.persist_cache_data()
            
            // Clear the cache
            this.cache.clear()
            
            console.log('CacheService: Shutdown complete')
        } catch (error) {
            console.error('CacheService: Error during cleanup:', error)
            // Don't throw - allow other services to terminate
        }
    }
    
    private async load_initial_data() {
        // Load initial cache data
    }
    
    private cleanup_expired_entries() {
        // Remove expired cache entries
    }
    
    private async persist_cache_data() {
        // Save cache data before shutdown
    }
}
```

## Debugging and Monitoring

:::info Complete Example
[example/core/platform/05-debugging-monitoring.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/05-debugging-monitoring.ts)
:::

### Provider Tree Visualization

Use `.inspect_injector()` to debug dependency injection:

```typescript
// Before using any services
console.log('=== Provider Tree (Before) ===')
console.log(platform.inspect_injector())

// After starting the platform
await platform.start()

// Use some services
const userService = platform.expose(UserService)
const dbService = platform.expose(DatabaseService)

// Print the dependency tree
console.log('=== Provider Tree (After) ===')
console.log(platform.inspect_injector())

// Example output for debugging:
// Injector
// ├── ○ TpConfigData [Built-in]
// ├── ✓ TpLoader [Built-in]
// ├── ✓ DatabaseService [TpWorker → @TpService]
// ├── ○ CacheService [TpWorker → @TpService]
// ├── ✓ UserService [TpWorker → @TpService]
// └── Injector (UserModule)
//     ├── ○ UserRepository [TpWorker → @TpService]
//     ├── ○ UserValidator [TpWorker → @TpService]
//     └── ✓ UserModule [TpAssembly → @TpModule]
```

#### Used Status Analysis

The usage indicators help identify:
- **✓ Used services** - These have been instantiated and are active
- **○ Unused services** - These are registered but not yet needed
- **Performance optimization** - Remove unused services to reduce startup time
- **Dependency tracking** - Understand which services trigger others

### Built-in Performance Monitoring

Platform automatically tracks startup and shutdown times:

```typescript
// Start the platform - returns startup time in seconds
const startupTime = await platform.start()
console.log(`Platform started in ${startupTime}s`)

// Access timing properties
console.log('Started at:', platform.started_at)  // timestamp
console.log('Startup duration:', platform.start_time)  // seconds

// Terminate the platform - returns shutdown time in seconds  
const shutdownTime = await platform.terminate()
console.log(`Platform terminated in ${shutdownTime}s`)

// Access shutdown timing
console.log('Terminated at:', platform.terminated_at)  // timestamp
console.log('Shutdown duration:', platform.terminate_time)  // seconds
```

Platform also automatically logs timing information:
```
Tarpit server started at 2023-12-01T10:30:45.123Z, during 0.234s
Tarpit server destroyed at 2023-12-01T10:35:20.456Z, during 0.067s
```

## Best Practices

:::info Complete Example
[example/core/platform/06-best-practices.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/06-best-practices.ts)
:::

### 1. Use Platform Configuration Properly

Always use the TpConfigSchema pattern for configurable behavior:

```typescript
// ✅ Good - Proper Platform configuration
const config = load_config<TpConfigSchema>({
    http: {
        port: parseInt(process.env.PORT || '3000'),
        hostname: process.env.HOST || '0.0.0.0'
    },
    // Add other module configurations as needed
})

const platform = new Platform(config)
```

Access configuration in services using TpConfigData:

```typescript
@TpService()
class ApiService {
    constructor(private config: TpConfigData) {}
    
    get_base_url() {
        const port = this.config.get('http.port') ?? 3000
        const hostname = this.config.get('http.hostname') ?? 'localhost'
        return `http://${hostname}:${port}/api`
    }
}
```

### 2. Implement Lifecycle Hooks

Use lifecycle hook decorators for proper resource management:

```typescript
// ✅ Good - Proper lifecycle management using decorators
@TpService()
class DatabaseService {
    private client?: DatabaseClient
    private tempFiles: string[] = []
    private activeStreams: Stream[] = []
    
    @OnStart()
    async initialize() {
        this.client = await this.connect()
        console.log('DatabaseService: Connected successfully')
    }
    
    @OnTerminate()
    async cleanup() {
        // Close database connection
        if (this.client) {
            await this.client.close()
            console.log('DatabaseService: Connection closed')
        }
        
        // Close all active streams
        await Promise.all(
            this.activeStreams.map(stream => 
                new Promise(resolve => stream.destroy(resolve))
            )
        )
        
        // Clean up temporary files
        await Promise.all(
            this.tempFiles.map(file => fs.unlink(file).catch(console.error))
        )
        
        console.log('DatabaseService: Cleanup completed')
    }
    
    private async connect() {
        // Database connection logic
    }
}
```

### 3. Service Dependencies

Organize service dependencies clearly:

```typescript
// ✅ Good - Clear dependency structure
@TpService()
class UserService {
    constructor(
        private database: DatabaseService,
        private cache: CacheService,
        private validator: UserValidator,
        private config: TpConfigData
    ) {}
    
    async create_user(userData: any) {
        // Validate first
        await this.validator.validate(userData)
        
        // Save to database
        const user = await this.database.save(userData)
        
        // Update cache if enabled
        const cacheEnabled = this.config.get('cache.enabled') ?? false
        if (cacheEnabled) {
            await this.cache.set(`user:${user.id}`, user)
        }
        
        return user
    }
}
```

## Next Steps

- [**Providers**](./providers) - Learn about different provider types
- [**Decorators**](./decorators) - Explore available decorators
- [**Built-in Services**](./built-in-services) - Discover core services 
- [**Dependency Injection**](./dependency-injection) - Deep dive into DI concepts