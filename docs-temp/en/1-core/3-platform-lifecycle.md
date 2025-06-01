---
layout: default
title: Platform & Lifecycle
parent: Core Concepts
nav_order: 3
---

# Platform & Lifecycle
{:.no_toc}

> **💡 Working Examples**: See [platform-lifecycle.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform-lifecycle.ts) for complete working examples.

The Platform class is the heart of every Tarpit application. It manages the dependency injection container, handles module imports, and controls the application lifecycle from startup to shutdown.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Platform Overview

The Platform serves as:

- **DI Container Manager** - Creates and manages the dependency injection system
- **Module Orchestrator** - Handles module imports and dependency resolution
- **Lifecycle Manager** - Controls application startup, running, and shutdown phases
- **Service Registry** - Central registry for all services and providers

## Basic Platform Usage

### Creating a Platform

> **📁 Example**: [platform-lifecycle.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform-lifecycle.ts)

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'

const config = load_config<TpConfigSchema>({
    // Configuration options
})

const platform = new Platform(config)
```

### Importing Modules and Services

```typescript
import { UserService, UserModule } from './user'
import { DatabaseService } from './database'

const platform = new Platform(config)
    .import(DatabaseService)      // Import individual service
    .import(UserModule)           // Import entire module
    .import([                     // Import multiple at once
        EmailService,
        NotificationService
    ])
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

### TpConfigSchema

The basic configuration schema for Tarpit applications:

```typescript
import { load_config } from '@tarpit/config'
import { TpConfigSchema } from '@tarpit/core'

const config = load_config<TpConfigSchema>({
    // Core configuration options
    debug: false,           // Enable debug mode
    name: 'my-app',        // Application name
    version: '1.0.0'       // Application version
})
```

### Custom Configuration

Extend the schema for your application:

```typescript
interface MyAppConfig extends TpConfigSchema {
    database: {
        url: string
        poolSize: number
    }
    redis: {
        host: string
        port: number
    }
}

const config = load_config<MyAppConfig>({
    database: {
        url: 'postgresql://localhost:5432/myapp',
        poolSize: 10
    },
    redis: {
        host: 'localhost',
        port: 6379
    }
})
```

## Platform Methods

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

// Import multiple
platform.import([ServiceA, ServiceB, ServiceC])
```

### .start()

Start the platform and initialize all services:

```typescript
// Simple start
await platform.start()

// Start returns the platform for chaining
const runningPlatform = await platform.start()
```

### .expose()

Get an instance of a service from the platform:

```typescript
// Get a service instance
const userService = platform.expose(UserService)

// Use with custom token
const dbUrl = platform.expose(DATABASE_URL)
```

### .terminate()

Gracefully shutdown the platform:

```typescript
// Shutdown the platform
await platform.terminate()

// Calls @OnTerminate methods on all services
// Cleans up resources
```

### .bootstrap()

Bootstrap with a root module (alternative to .import()):

```typescript
@TpRoot({
    imports: [HttpServerModule, UserModule],
    entries: [UserController]
})
class AppRoot {}

const platform = new Platform(config)
    .bootstrap(AppRoot)
    .start()
```

## Application Lifecycle

### Startup Phase

During startup, the platform:

1. **Creates DI Container** - Initialize the dependency injection system
2. **Registers Providers** - Register all imported services and modules
3. **Resolves Dependencies** - Analyze and build the dependency graph
4. **Instantiates Services** - Create instances of all required services
5. **Calls Initializers** - Run any startup hooks or initializers

```typescript
@TpService()
class DatabaseService {
    private connection: any
    
    constructor() {
        console.log('1. DatabaseService created')
        this.connection = createConnection()
    }
}

@TpService()
class UserService {
    constructor(private db: DatabaseService) {
        console.log('2. UserService created with DatabaseService')
    }
}

const platform = new Platform(config)
    .import([DatabaseService, UserService])
    .start() // Output: 1. DatabaseService created, 2. UserService created...
```

### Running Phase

Once started, the platform:

- **Serves Requests** - If using HTTP or other entry points
- **Manages Services** - Keep services available for dependency injection
- **Handles Lifecycle** - Manage service lifecycles and scopes

### Shutdown Phase

During shutdown with `.terminate()`:

1. **Calls @OnTerminate Methods** - Execute cleanup methods on services
2. **Closes Resources** - Clean up connections, files, etc.
3. **Disposes Container** - Clean up the DI container

```typescript
@TpService()
class DatabaseService {
    private connection: any
    
    @OnTerminate()
    async close_connection() {
        console.log('Closing database connection')
        await this.connection.close()
    }
}

// During platform.terminate()
// Output: Closing database connection
```

## Error Handling

### Startup Errors

Handle errors during platform startup:

```typescript
try {
    await platform.start()
    console.log('Platform started successfully')
} catch (error) {
    console.error('Failed to start platform:', error)
    process.exit(1)
}
```

### Common Startup Issues

```typescript
// Missing dependencies
@TpService()
class UserService {
    constructor(private db: DatabaseService) {} // DatabaseService not imported
}

// Circular dependencies
@TpService()
class ServiceA {
    constructor(private b: ServiceB) {}
}

@TpService()
class ServiceB {
    constructor(private a: ServiceA) {} // Circular!
}

// Invalid configuration
const config = load_config<TpConfigSchema>({}) // Missing required config
```

## Advanced Platform Usage

### Multiple Platforms

You can create multiple platforms for different purposes:

```typescript
// Main application platform
const appPlatform = new Platform(appConfig)
    .import(AppModule)
    .start()

// Testing platform with different configuration
const testPlatform = new Platform(testConfig)
    .import(AppModule)
    .import(MockDatabaseService) // Override with mock
    .start()
```

### Platform Inspection

Inspect the platform state:

```typescript
// Check if platform is started
if (platform.started) {
    console.log('Platform is running')
}

// Get configuration
const config = platform.config
console.log('App name:', config.name)
```

### Custom Provider Registration

Register complex providers:

```typescript
const platform = new Platform(config)
    .import({
        provide: 'database-config',
        useFactory: () => {
            return {
                url: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production'
            }
        }
    })
    .import({
        provide: DatabaseService,
        useFactory: (config: any) => {
            return new DatabaseService(config)
        },
        deps: ['database-config']
    })
```

## Platform Patterns

### Factory Pattern

Create platforms using a factory:

```typescript
export class PlatformFactory {
    static create_development(): Platform {
        const config = load_config<AppConfig>({
            debug: true,
            database: { url: 'sqlite://dev.db' }
        })
        
        return new Platform(config)
            .import(DevelopmentModule)
    }
    
    static create_production(): Platform {
        const config = load_config<AppConfig>({
            debug: false,
            database: { url: process.env.DATABASE_URL }
        })
        
        return new Platform(config)
            .import(ProductionModule)
    }
}

// Usage
const platform = PlatformFactory.create_development()
await platform.start()
```

### Plugin Architecture

Use platforms for plugin systems:

```typescript
interface IPlugin {
    name: string
    initialize(platform: Platform): void
}

class PluginManager {
    private plugins: IPlugin[] = []
    
    add_plugin(plugin: IPlugin) {
        this.plugins.push(plugin)
    }
    
    async initialize_plugins(platform: Platform) {
        for (const plugin of this.plugins) {
            plugin.initialize(platform)
        }
    }
}

const manager = new PluginManager()
manager.add_plugin(new DatabasePlugin())
manager.add_plugin(new CachePlugin())

const platform = new Platform(config)
await manager.initialize_plugins(platform)
await platform.start()
```

### Testing with Platforms

Use platforms for testing:

```typescript
describe('UserService', () => {
    let platform: Platform
    let userService: UserService
    
    beforeEach(async () => {
        const config = load_config<TpConfigSchema>({})
        platform = new Platform(config)
            .import(UserService)
            .import({ provide: DatabaseService, useClass: MockDatabaseService })
        
        await platform.start()
        userService = platform.expose(UserService)
    })
    
    afterEach(async () => {
        await platform.terminate()
    })
    
    test('should create user', () => {
        const user = userService.create_user('Alice')
        expect(user.name).toBe('Alice')
    })
})
```

## Best Practices

### 1. Graceful Shutdown

Always handle shutdown gracefully:

```typescript
// Handle process signals
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully')
    await platform.terminate()
    process.exit(0)
})

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully')
    await platform.terminate()
    process.exit(0)
})
```

### 2. Error Recovery

Implement proper error handling:

```typescript
async function start_application() {
    const platform = new Platform(config)
    
    try {
        await platform
            .import(CoreModule)
            .import(HttpModule)
            .start()
            
        console.log('Application started successfully')
        return platform
    } catch (error) {
        console.error('Failed to start application:', error)
        
        // Attempt cleanup
        try {
            await platform.terminate()
        } catch (cleanupError) {
            console.error('Failed to cleanup:', cleanupError)
        }
        
        throw error
    }
}
```

### 3. Configuration Validation

Validate configuration before starting:

```typescript
function validate_config(config: AppConfig) {
    if (!config.database?.url) {
        throw new Error('Database URL is required')
    }
    
    if (!config.name) {
        throw new Error('Application name is required')
    }
}

const config = load_config<AppConfig>({...})
validate_config(config)

const platform = new Platform(config).start()
```

## Next Steps

- Learn about [Providers](4-providers.html) for different ways to register dependencies  
- Explore [Built-in Services](5-builtin-services.html) for core services like TpLoader
- See [Dependency Injection](1-dependency-injection.html) for core DI concepts 