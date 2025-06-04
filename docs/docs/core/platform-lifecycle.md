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
[platform-lifecycle.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/platform-lifecycle.ts)
:::

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

## Application Lifecycle

### Startup Phase

During startup, the platform:

1. **Loads Configuration** - Processes the provided configuration
2. **Creates DI Container** - Sets up the dependency injection system
3. **Registers Providers** - Registers all imported services and modules
4. **Resolves Dependencies** - Creates instances and injects dependencies
5. **Calls Lifecycle Hooks** - Triggers `@OnInit` methods on services

### Running Phase

Once started, the platform:

- **Manages Service Instances** - Keeps track of all created services
- **Handles Service Resolution** - Provides services via `.expose()`
- **Monitors Lifecycle** - Manages ongoing operations

### Shutdown Phase

During termination, the platform:

1. **Calls Cleanup Hooks** - Triggers `@OnTerminate` methods
2. **Releases Resources** - Frees up memory and connections
3. **Closes Connections** - Shuts down database, network connections
4. **Cleans DI Container** - Clears all service instances

## Lifecycle Hooks

### @OnInit

Called when a service is first created:

```typescript
import { TpService, OnInit } from '@tarpit/core'

@TpService()
class DatabaseService implements OnInit {
    
    async on_init() {
        console.log('DatabaseService: Initializing connection...')
        await this.connect()
    }
    
    private async connect() {
        // Database connection logic
    }
}
```

### @OnTerminate

Called when the platform is shutting down:

```typescript
import { TpService, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService implements OnTerminate {
    
    async on_terminate() {
        console.log('DatabaseService: Closing connection...')
        await this.disconnect()
    }
    
    private async disconnect() {
        // Database disconnection logic
    }
}
```

## Error Handling

### Startup Errors

If an error occurs during startup, the platform will:

```typescript
try {
    await platform.start()
} catch (error) {
    console.error('Failed to start platform:', error)
    // Platform automatically cleans up on startup failure
}
```

### Runtime Errors

Handle errors in service methods:

```typescript
@TpService()
class UserService {
    
    async create_user(data: any) {
        try {
            // Service logic
            return await this.database.save(data)
        } catch (error) {
            console.error('Error creating user:', error)
            throw error
        }
    }
}
```

## Best Practices

### 1. Use Configuration Objects

Always use configuration objects for customizable behavior:

```typescript
// ✅ Good - Configurable
const config = load_config<MyAppConfig>({
    database: { url: process.env.DATABASE_URL },
    debug: process.env.NODE_ENV === 'development'
})

const platform = new Platform(config)
```

### 2. Implement Lifecycle Hooks

Use lifecycle hooks for proper resource management:

```typescript
// ✅ Good - Proper lifecycle management
@TpService()
class RedisService implements OnInit, OnTerminate {
    
    async on_init() {
        await this.connect()
    }
    
    async on_terminate() {
        await this.disconnect()
    }
}
```

### 3. Handle Errors Gracefully

Always handle startup and shutdown errors:

```typescript
// ✅ Good - Error handling
async function start_application() {
    try {
        await platform.start()
        console.log('Application started successfully')
    } catch (error) {
        console.error('Failed to start application:', error)
        process.exit(1)
    }
}

// Handle shutdown signals
process.on('SIGTERM', async () => {
    try {
        await platform.terminate()
        console.log('Application stopped gracefully')
    } catch (error) {
        console.error('Error during shutdown:', error)
    }
    process.exit(0)
})
```

## Next Steps

- [**Providers**](./providers) - Learn about different provider types
- [**Decorators**](./decorators) - Explore available decorators
- [**Built-in Services**](./built-in-services) - Discover core services 