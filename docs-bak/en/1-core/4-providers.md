---
layout: default
title: Providers
parent: Core Concepts
nav_order: 4
---

# Providers
{:.no_toc}

> **💡 Working Examples**: See [providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts) for complete working examples.

Providers tell the dependency injection system how to create and supply dependencies. They are the foundation that makes dependency injection work, defining how services, values, and factories are registered and resolved.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## What are Providers?

A **provider** is a recipe that tells the DI system how to create an instance of a dependency. When a service requests a dependency, the DI system uses the appropriate provider to create or retrieve that dependency.

### Provider Concept

```typescript
// When this service is created...
@TpService()
class UserService {
    constructor(private db: DatabaseService) {} // How does DI get DatabaseService?
}

// The answer is: through a provider
platform.import(DatabaseService) // This creates a ClassProvider for DatabaseService
```

## Types of Providers

Tarpit supports several types of providers for different use cases:

### 1. ClassProvider

The most common provider type - tells DI to create instances using a class constructor:

> **📁 Example**: [providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts)

```typescript
import { TpService } from '@tarpit/core'

@TpService()
class DatabaseService {
    connect() {
        console.log('Connected to database')
    }
}

// Implicit ClassProvider
platform.import(DatabaseService)

// Explicit ClassProvider
platform.import({
    provide: DatabaseService,
    useClass: DatabaseService
})

// ClassProvider with different token
platform.import({
    provide: 'database',
    useClass: DatabaseService
})
```

### 2. ValueProvider

Provides a pre-existing value or object:

> **📁 Example**: [providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts)

```typescript
// Simple value
platform.import({
    provide: 'app-name',
    useValue: 'My Awesome App'
})

// Configuration object
platform.import({
    provide: 'database-config',
    useValue: {
        host: 'localhost',
        port: 5432,
        database: 'myapp'
    }
})

// Using with injection
@TpService()
class DatabaseService {
    constructor(
        @Inject('database-config') private config: any
    ) {}
}
```

### 3. FactoryProvider

Uses a function to create the dependency:

> **📁 Example**: [providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts)

```typescript
// Simple factory
platform.import({
    provide: 'timestamp',
    useFactory: () => Date.now()
})

// Factory with dependencies
platform.import({
    provide: 'database-connection',
    useFactory: (config: any) => {
        return new Database(config.host, config.port)
    },
    deps: ['database-config'] // Dependencies for the factory
})

// Complex factory
platform.import({
    provide: 'logger',
    useFactory: (config: AppConfig) => {
        if (config.debug) {
            return new ConsoleLogger()
        } else {
            return new FileLogger('/var/log/app.log')
        }
    },
    deps: [TpConfigData]
})
```

### 4. ExistingProvider (Alias)

Creates an alias to an existing provider:

```typescript
// Register the service
platform.import(EmailService)

// Create an alias
platform.import({
    provide: 'notification-service',
    useExisting: EmailService
})

// Both tokens resolve to the same instance
@TpService()
class UserService {
    constructor(
        private email: EmailService,                              // Same instance
        @Inject('notification-service') private notify: any      // Same instance
    ) {}
}
```

## Provider Registration

### Using .import()

The `.import()` method accepts various provider formats:

```typescript
// Class (creates ClassProvider)
platform.import(UserService)

// Array of classes
platform.import([UserService, OrderService, PaymentService])

// Explicit provider object
platform.import({
    provide: UserService,
    useClass: UserService
})

// Array of mixed providers
platform.import([
    UserService,
    { provide: 'api-key', useValue: 'secret-key' },
    { provide: 'database', useFactory: () => new Database() }
])
```

### Module Providers

Modules can declare their own providers:

```typescript
@TpModule({
    providers: [
        UserService,
        { provide: 'module-name', useValue: 'user-module' },
        {
            provide: UserRepository,
            useFactory: (db: DatabaseService) => new UserRepository(db),
            deps: [DatabaseService]
        }
    ]
})
class UserModule {}
```

## Injection Tokens

Injection tokens are unique identifiers used to register and request dependencies:

### Class Tokens

Classes work as tokens because they are both types and runtime values:

```typescript
@TpService()
class UserService {} // UserService is the token

platform.import(UserService) // Register with UserService token

@TpService()
class OrderService {
    constructor(private users: UserService) {} // Request UserService token
}
```

### Symbol Tokens

Symbols create unique tokens for non-class dependencies:

```typescript
// Define tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_CONNECTIONS = Symbol('MAX_CONNECTIONS')

// Register with symbol tokens
platform.import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432' })
platform.import({ provide: MAX_CONNECTIONS, useValue: 10 })

// Use symbol tokens
@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_CONNECTIONS) private maxConnections: number
    ) {}
}
```

### String Tokens

Strings can be used as tokens (though symbols are preferred):

```typescript
platform.import({ provide: 'app-version', useValue: '1.0.0' })

@TpService()
class AppService {
    constructor(@Inject('app-version') private version: string) {}
}
```

## Advanced Provider Features

### Multi Providers

Collect multiple values under the same token:

```typescript
interface IPlugin {
    name: string
    initialize(): void
}

const PLUGIN_TOKEN = Symbol('PLUGIN_TOKEN')

// Register multiple plugins
platform.import({ provide: PLUGIN_TOKEN, useClass: AuthPlugin, multi: true })
platform.import({ provide: PLUGIN_TOKEN, useClass: LoggingPlugin, multi: true })
platform.import({ provide: PLUGIN_TOKEN, useClass: CachePlugin, multi: true })

// Inject as array
@TpService()
class PluginManager {
    constructor(@Inject(PLUGIN_TOKEN) private plugins: IPlugin[]) {}
    
    initialize_all() {
        this.plugins.forEach(plugin => plugin.initialize())
    }
}
```

### Conditional Providers

Use factories for conditional logic:

```typescript
platform.import({
    provide: 'storage-service',
    useFactory: (config: AppConfig) => {
        if (config.storage.type === 'redis') {
            return new RedisStorage(config.storage.redis)
        } else if (config.storage.type === 'memory') {
            return new MemoryStorage()
        } else {
            return new FileStorage(config.storage.path)
        }
    },
    deps: [TpConfigData]
})
```

### Dynamic Providers

Create providers based on runtime conditions:

```typescript
class ModuleLoader {
    static load_providers(features: string[]) {
        const providers = [CoreService]
        
        if (features.includes('auth')) {
            providers.push(AuthService)
        }
        
        if (features.includes('cache')) {
            providers.push(CacheService)
        }
        
        return providers
    }
}

const features = ['auth', 'cache']
const dynamicProviders = ModuleLoader.load_providers(features)

platform.import(dynamicProviders)
```

## Provider Patterns

### Abstract Service Pattern

Use interfaces with providers for better abstraction:

```typescript
// Define interface
interface IEmailService {
    send(to: string, subject: string, body: string): Promise<void>
}

// Token for the interface
const EMAIL_SERVICE = Symbol('EMAIL_SERVICE')

// Implementations
@TpService()
class SendGridService implements IEmailService {
    async send(to: string, subject: string, body: string) {
        // SendGrid implementation
    }
}

@TpService()
class SMTPService implements IEmailService {
    async send(to: string, subject: string, body: string) {
        // SMTP implementation
    }
}

// Choose implementation based on environment
platform.import({
    provide: EMAIL_SERVICE,
    useClass: process.env.NODE_ENV === 'production' ? SendGridService : SMTPService
})

// Use interface in services
@TpService()
class UserService {
    constructor(@Inject(EMAIL_SERVICE) private emailService: IEmailService) {}
}
```

### Configuration Provider Pattern

Centralize configuration management:

```typescript
interface DatabaseConfig {
    host: string
    port: number
    database: string
    username: string
    password: string
}

const DATABASE_CONFIG = Symbol('DATABASE_CONFIG')

platform.import({
    provide: DATABASE_CONFIG,
    useFactory: (config: AppConfig) => {
        return {
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            username: config.database.user,
            password: config.database.password
        }
    },
    deps: [TpConfigData]
})

@TpService()
class DatabaseService {
    constructor(@Inject(DATABASE_CONFIG) private config: DatabaseConfig) {}
}
```

### Factory Service Pattern

Use services as factories for other objects:

```typescript
@TpService()
class ConnectionFactory {
    constructor(private config: DatabaseConfig) {}
    
    create_connection(): Connection {
        return new Connection(this.config)
    }
    
    create_read_only_connection(): Connection {
        return new Connection({
            ...this.config,
            readOnly: true
        })
    }
}

@TpService()
class UserRepository {
    constructor(private factory: ConnectionFactory) {}
    
    async find_user(id: string) {
        const conn = this.factory.create_read_only_connection()
        // Use connection...
    }
}
```

## Provider Scoping

### Singleton Scope (Default)

By default, providers create singleton instances:

```typescript
@TpService()
class CounterService {
    private count = 0
    
    increment() {
        return ++this.count
    }
}

// Both services get the same CounterService instance
@TpService()
class ServiceA {
    constructor(private counter: CounterService) {}
}

@TpService()
class ServiceB {
    constructor(private counter: CounterService) {}
}
```

### Multiple Instances with Factories

Use factories to create multiple instances:

```typescript
platform.import({
    provide: 'new-connection',
    useFactory: () => new DatabaseConnection(), // New instance each time
})

// Each injection gets a new connection
@TpService()
class ServiceA {
    constructor(@Inject('new-connection') private conn: DatabaseConnection) {}
}

@TpService()
class ServiceB {
    constructor(@Inject('new-connection') private conn: DatabaseConnection) {}
}
```

## Best Practices

### 1. Use Symbols for Non-Class Tokens

```typescript
// ✅ Good - Unique symbol
const DATABASE_URL = Symbol('DATABASE_URL')

// ❌ Avoid - String collision risk
const DATABASE_URL = 'database-url'
```

### 2. Use Interfaces for Abstraction

```typescript
// ✅ Good - Interface abstraction
interface ILogger {
    log(message: string): void
}

const LOGGER = Symbol('LOGGER')

// ❌ Avoid - Direct class coupling
platform.import(ConsoleLogger) // Hard to change implementation
```

### 3. Validate Factory Dependencies

```typescript
// ✅ Good - Clear dependencies
platform.import({
    provide: 'database-service',
    useFactory: (config: DatabaseConfig, logger: ILogger) => {
        return new DatabaseService(config, logger)
    },
    deps: [DATABASE_CONFIG, LOGGER] // Explicit dependencies
})

// ❌ Avoid - Hidden dependencies
platform.import({
    provide: 'database-service',
    useFactory: () => {
        const config = getConfig() // Hidden dependency!
        return new DatabaseService(config)
    }
})
```

### 4. Use Descriptive Provider Names

```typescript
// ✅ Good - Descriptive
const DATABASE_CONNECTION_POOL = Symbol('DATABASE_CONNECTION_POOL')
const USER_REPOSITORY = Symbol('USER_REPOSITORY')

// ❌ Avoid - Generic
const SERVICE = Symbol('SERVICE')
const THING = Symbol('THING')
```

## Common Provider Scenarios

### Environment-Specific Configuration

```typescript
const config = load_config<AppConfig>({})

platform.import({
    provide: 'storage-provider',
    useFactory: () => {
        if (config.environment === 'production') {
            return new S3StorageProvider(config.aws)
        } else {
            return new LocalStorageProvider(config.storage.path)
        }
    }
})
```

### Testing Overrides

```typescript
// Production providers
const productionProviders = [
    DatabaseService,
    EmailService,
    PaymentService
]

// Test providers (override implementations)
const testProviders = [
    { provide: DatabaseService, useClass: MockDatabaseService },
    { provide: EmailService, useClass: MockEmailService },
    { provide: PaymentService, useClass: MockPaymentService }
]

const providers = process.env.NODE_ENV === 'test' ? testProviders : productionProviders
platform.import(providers)
```

### Plugin Registration

```typescript
interface IPlugin {
    name: string
    version: string
    initialize(): void
}

const PLUGIN = Symbol('PLUGIN')

// Register plugins
platform
    .import({ provide: PLUGIN, useClass: AuthPlugin, multi: true })
    .import({ provide: PLUGIN, useClass: CachePlugin, multi: true })
    .import({ provide: PLUGIN, useClass: MetricsPlugin, multi: true })

@TpService()
class Application {
    constructor(@Inject(PLUGIN) private plugins: IPlugin[]) {}
    
    async start() {
        console.log(`Loading ${this.plugins.length} plugins`)
        for (const plugin of this.plugins) {
            plugin.initialize()
            console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`)
        }
    }
}
```

## Next Steps

- Learn about [Built-in Services](5-builtin-services.html) for core services like TpLoader
- Explore [Decorators](2-decorators.html) for marking classes and controlling injection
- See [Platform & Lifecycle](3-platform-lifecycle.html) for application management 