---
sidebar_position: 3
---

# Providers

:::info Working Examples
See [providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts) for complete working examples.
:::

Providers tell the dependency injection system how to create and supply dependencies. They are the foundation that makes dependency injection work, defining how services, values, and factories are registered and resolved.

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

:::info Complete Example
[providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts)
:::

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

:::info Complete Example
[providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts)
:::

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

:::info Complete Example
[providers.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers.ts)
:::

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
        { provide: 'api-url', useValue: 'https://api.example.com' },
        {
            provide: 'http-client',
            useFactory: (url: string) => new HttpClient(url),
            deps: ['api-url']
        }
    ]
})
class ApiModule {}
```

## Provider Scopes

### Singleton (Default)

By default, all providers create singleton instances:

```typescript
@TpService()
class DatabaseService {
    constructor() {
        console.log('DatabaseService created') // Only logged once
    }
}

// Both services get the same instance
@TpService()
class UserService {
    constructor(private db: DatabaseService) {} // Same instance
}

@TpService()
class OrderService {
    constructor(private db: DatabaseService) {} // Same instance
}
```

### Transient Scope

Create a new instance every time:

```typescript
@TpService({ scope: 'transient' })
class RequestLogger {
    private id = Math.random()
    
    log(message: string) {
        console.log(`[${this.id}] ${message}`)
    }
}

// Each service gets a different instance
@TpService()
class UserService {
    constructor(private logger: RequestLogger) {} // Instance A
}

@TpService()
class OrderService {
    constructor(private logger: RequestLogger) {} // Instance B
}
```

## Advanced Provider Patterns

### Conditional Providers

Use factories to provide different implementations based on conditions:

```typescript
// Define interface
abstract class PaymentProcessor {
    abstract process(amount: number): Promise<void>
}

// Implementations
@TpService()
class StripeProcessor extends PaymentProcessor {
    async process(amount: number) {
        // Stripe implementation
    }
}

@TpService()
class PayPalProcessor extends PaymentProcessor {
    async process(amount: number) {
        // PayPal implementation
    }
}

// Conditional provider
platform.import({
    provide: PaymentProcessor,
    useFactory: (config: AppConfig) => {
        if (config.payment.provider === 'stripe') {
            return new StripeProcessor()
        } else {
            return new PayPalProcessor()
        }
    },
    deps: [TpConfigData]
})
```

### Multi-Providers

Provide multiple values for the same token:

```typescript
// Define token
const PLUGIN_TOKEN = Symbol('PLUGINS')

// Register multiple providers
platform.import({ provide: PLUGIN_TOKEN, useValue: new AuthPlugin(), multi: true })
platform.import({ provide: PLUGIN_TOKEN, useValue: new LoggingPlugin(), multi: true })
platform.import({ provide: PLUGIN_TOKEN, useValue: new CachePlugin(), multi: true })

// Inject all providers as an array
@TpService()
class PluginManager {
    constructor(@Inject(PLUGIN_TOKEN) private plugins: Plugin[]) {
        // plugins is an array of all registered plugins
    }
}
```

### Async Providers

Create providers that resolve asynchronously:

```typescript
platform.import({
    provide: 'database-connection',
    useFactory: async (config: DatabaseConfig) => {
        const connection = new DatabaseConnection(config)
        await connection.connect()
        return connection
    },
    deps: ['database-config']
})
```

## Best Practices

### 1. Use Descriptive Tokens

Use clear, descriptive tokens for your providers:

```typescript
// ✅ Good - Clear and descriptive
const DATABASE_CONNECTION_STRING = Symbol('DATABASE_CONNECTION_STRING')
const HTTP_CLIENT_TIMEOUT = Symbol('HTTP_CLIENT_TIMEOUT')

// ❌ Avoid - Vague or confusing
const CONFIG = Symbol('CONFIG')
const THING = Symbol('THING')
```

### 2. Prefer Class Providers

Use class providers when possible for better type safety:

```typescript
// ✅ Good - Type-safe class provider
@TpService()
class EmailService {
    send(to: string, message: string) { /* ... */ }
}

// ❌ Less ideal - Untyped value provider
platform.import({
    provide: 'email-service',
    useValue: {
        send: (to: string, message: string) => { /* ... */ }
    }
})
```

### 3. Keep Factories Simple

Keep factory functions focused and testable:

```typescript
// ✅ Good - Simple, focused factory
platform.import({
    provide: 'logger',
    useFactory: (config: AppConfig) => {
        return config.debug ? new ConsoleLogger() : new FileLogger()
    },
    deps: [TpConfigData]
})

// ❌ Avoid - Complex factory with side effects
platform.import({
    provide: 'complex-service',
    useFactory: (config: AppConfig) => {
        // Too much logic in factory
        const service = new ComplexService()
        service.configure(config)
        service.loadPlugins()
        service.initializeDatabase()
        return service
    },
    deps: [TpConfigData]
})
```

### 4. Use Interfaces for Abstraction

Define interfaces for better abstraction:

```typescript
// Define interface
interface Logger {
    log(message: string): void
}

// Implement interface
@TpService()
class ConsoleLogger implements Logger {
    log(message: string) {
        console.log(message)
    }
}

// Use interface as token
platform.import({
    provide: Logger,
    useClass: ConsoleLogger
})
```

## Next Steps

- [**Decorators**](./decorators) - Learn about available decorators
- [**Built-in Services**](./built-in-services) - Discover core services
- [**Dependency Injection**](./dependency-injection) - Review DI fundamentals 