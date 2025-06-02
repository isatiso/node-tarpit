---
sidebar_position: 1
---

# Dependency Injection

:::info Working Examples
See [dependency-injection-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-injection-basic.ts) and [dependency-resolution.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-resolution.ts) for complete working examples.
:::

Dependency Injection (DI) is the core mechanism of the Tarpit framework. It automatically resolves and injects dependencies where they are needed, making your code more modular, testable, and maintainable.

## What is Dependency Injection?

Dependency Injection is a design pattern where dependencies are provided to a class rather than the class creating them itself. This inversion of control makes code more flexible and easier to test.

### Traditional Approach (Without DI)

```typescript
class UserService {
    private database: Database
    
    constructor() {
        // UserService creates its own dependencies
        this.database = new Database('localhost', 5432)
    }
}
```

### With Dependency Injection

```typescript
@TpService()
class UserService {
    // Dependencies are injected automatically
    constructor(private database: Database) {}
}
```

## How DI Works in Tarpit

Tarpit's DI system works in three main steps:

1. **Declaration** - Mark classes as injectable services
2. **Registration** - Register services with the DI container
3. **Resolution** - Automatically inject dependencies when needed

### Basic Example

:::info Complete Example
[dependency-injection-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-injection-basic.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// 1. Declaration - Mark as injectable service
@TpService()
class DatabaseService {
    connect() {
        console.log('Connected to database')
    }
}

@TpService()
class UserService {
    // 2. Dependency will be injected automatically
    constructor(private db: DatabaseService) {}
    
    create_user(name: string) {
        this.db.connect()
        console.log(`Created user: ${name}`)
    }
}

// 3. Registration - Register with platform
const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import(DatabaseService)
    .import(UserService)
    .start()

// 4. Resolution - Get fully injected instance
const userService = platform.expose(UserService)
userService.create_user('Alice') // Connected to database, Created user: Alice
```

## Injection Points

An **injection point** is a location where dependencies can be injected. Tarpit supports injection at:

### Constructor Parameters

The most common injection point is constructor parameters:

```typescript
@TpService()
class OrderService {
    constructor(
        private userService: UserService,
        private paymentService: PaymentService,
        private emailService: EmailService
    ) {}
}
```

### With Type Annotations

TypeScript's type annotations are used to determine what to inject:

```typescript
@TpService()
class ReportService {
    constructor(
        private users: UserService,      // Inject UserService
        private orders: OrderService,    // Inject OrderService
        private logger: LoggerService    // Inject LoggerService
    ) {}
}
```

## Injection Tokens

An **injection token** is a unique identifier used to register and retrieve dependencies. There are two ways to specify injection tokens:

### 1. Type-Based Injection (Implicit)

Use the class type as the injection token:

:::info Complete Example
[injection-tokens.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/injection-tokens.ts)
:::

```typescript
@TpService()
class EmailService {
    send(to: string, message: string) {
        console.log(`Sending email to ${to}: ${message}`)
    }
}

@TpService()
class UserService {
    // EmailService class is used as the injection token
    constructor(private emailService: EmailService) {}
}
```

### 2. Token-Based Injection (Explicit)

Use explicit tokens for more control:

:::info Complete Example
[injection-tokens.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/injection-tokens.ts)
:::

```typescript
import { Inject } from '@tarpit/core'

// Define custom tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_CONNECTIONS = Symbol('MAX_CONNECTIONS')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_CONNECTIONS) private maxConnections: number
    ) {}
}

// Register with custom tokens
const platform = new Platform(config)
    .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/mydb' })
    .import({ provide: MAX_CONNECTIONS, useValue: 10 })
    .import(DatabaseService)
```

### Why Classes Work as Tokens

In TypeScript, classes are both types and values, making them perfect injection tokens:

| Declaration Type | Can be Type | Can be Value | Usable as Token |
|:-----------------|:-----------:|:------------:|:---------------:|
| Class            | ✅          | ✅           | ✅              |
| Interface        | ✅          | ❌           | ❌              |
| Type Alias       | ✅          | ❌           | ❌              |
| Enum             | ✅          | ✅           | ✅              |

```typescript
// This works - Class is both type and value
constructor(private service: UserService) {}

// This doesn't work - Interface is only a type
constructor(private service: IUserService) {} // ❌
```

## Dependency Resolution

The DI system follows a specific resolution process:

### Resolution Order

1. **Check cache** - Return cached instance if available
2. **Check providers** - Look for registered provider
3. **Create instance** - Instantiate and resolve dependencies
4. **Cache result** - Store for future use

### Circular Dependencies

Tarpit detects and prevents circular dependencies:

```typescript
@TpService()
class ServiceA {
    constructor(private serviceB: ServiceB) {}
}

@TpService()
class ServiceB {
    constructor(private serviceA: ServiceA) {} // ❌ Circular dependency
}
```

:::warning Circular Dependencies
Circular dependencies will cause runtime errors. Redesign your services to avoid circular references.
:::

## Best Practices

### 1. Use Constructor Injection

Prefer constructor injection over other patterns:

```typescript
// ✅ Good - Constructor injection
@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
}

// ❌ Avoid - Manual instantiation
@TpService()
class UserService {
    private db = new DatabaseService()
}
```

### 2. Depend on Abstractions

When possible, depend on interfaces rather than concrete classes:

```typescript
abstract class PaymentProvider {
    abstract process(amount: number): Promise<void>
}

@TpService()
class StripePaymentProvider extends PaymentProvider {
    async process(amount: number) {
        // Stripe implementation
    }
}

@TpService()
class OrderService {
    // Depend on abstraction, not implementation
    constructor(private payment: PaymentProvider) {}
}
```

### 3. Minimize Dependencies

Keep constructor parameters to a reasonable number:

```typescript
// ✅ Good - Few, focused dependencies
@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        private validator: ValidationService
    ) {}
}

// ❌ Too many dependencies - consider refactoring
@TpService()
class GodService {
    constructor(
        private db: DatabaseService,
        private cache: CacheService,
        private email: EmailService,
        private sms: SmsService,
        private logger: LoggerService,
        private config: ConfigService,
        private metrics: MetricsService
        // ... too many!
    ) {}
}
```

## Next Steps

- [**Platform & Lifecycle**](./platform-lifecycle) - Learn about the application container
- [**Providers**](./providers) - Explore different ways to provide dependencies
- [**Decorators**](./decorators) - Available decorators and their usage 