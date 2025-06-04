---
sidebar_position: 3
---

# Providers



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

The most common provider type - tells DI to create instances using a class constructor.

ClassProvider has two definition forms:

**Shorthand Form (Recommended)**
```typescript
@TpService()
class DatabaseService {
    connect() {
        console.log('Connected to database')
    }
}

// Shorthand: directly pass the class
// Equivalent to { provide: DatabaseService, useClass: DatabaseService }
platform.import(DatabaseService)
```

**Explicit Object Form**
```typescript
// Explicit form: when token and implementation are the same
platform.import({
    provide: DatabaseService,
    useClass: DatabaseService
})

// Explicit form: when token and implementation are different  
platform.import({
    provide: 'database-service',    // Token to inject with
    useClass: DatabaseService      // Implementation class
})

// Explicit form: interface-based injection
interface PaymentProcessor {
    process(amount: number): Promise<void>
}

@TpService()
class StripePaymentProcessor implements PaymentProcessor {
    async process(amount: number) {
        // Stripe implementation
    }
}

platform.import({
    provide: 'PaymentProcessor',        // String token
    useClass: StripePaymentProcessor    // Concrete implementation
})
```

**Usage Examples**
```typescript
@TpService()
class UserService {
    constructor(
        private db: DatabaseService,                           // Injected via shorthand form
        @Inject('database-service') private db2: DatabaseService, // Injected via string token
        @Inject('PaymentProcessor') private payment: PaymentProcessor // Injected via interface
    ) {}
}
```

:::info Complete Example
[example/core/providers/01-class-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/01-class-provider.ts)
:::

### 2. ValueProvider

Provides a pre-existing value or object:

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

:::info Complete Example
[example/core/providers/02-value-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/02-value-provider.ts)
:::

### 3. FactoryProvider

Uses a function to create the dependency:

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

:::info Complete Example
[example/core/providers/03-factory-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/03-factory-provider.ts)
:::

## Provider Registration

### Using .import()

The `.import()` method accepts various provider formats:

```typescript
// Class (creates ClassProvider)
platform.import(UserService)

// Import multiple services individually
platform.import(UserService)
platform.import(OrderService)
platform.import(PaymentService)

// Explicit provider object
platform.import({
    provide: UserService,
    useClass: UserService
})

// Import multiple providers individually
platform.import(UserService)
platform.import({ provide: 'api-key', useValue: 'secret-key' })
platform.import({ provide: 'database', useFactory: () => new Database() })
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
    useFactory: (config: TpConfigData) => {
        const paymentProvider = config.get('payment.provider')
        if (paymentProvider === 'stripe') {
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

:::info Complete Example
[example/core/providers/04-multi-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/04-multi-provider.ts)
:::

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
    useFactory: (config: TpConfigData) => {
        const debug = config.get('debug') ?? false
        return debug ? new ConsoleLogger() : new FileLogger()
    },
    deps: [TpConfigData]
})

// ❌ Avoid - Complex factory with side effects
platform.import({
    provide: 'complex-service',
    useFactory: (config: TpConfigData) => {
        // Too much logic in factory
        const service = new ComplexService()
        service.configure(config.get())
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