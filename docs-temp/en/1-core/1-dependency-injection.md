---
layout: default
title: Dependency Injection
parent: Core Concepts
nav_order: 1
---

# Dependency Injection
{:.no_toc}

> **💡 Working Examples**: See [dependency-injection-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-injection-basic.ts) and [dependency-resolution.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-resolution.ts) for complete working examples.

Dependency Injection (DI) is the core mechanism of the Tarpit framework. It automatically resolves and injects dependencies where they are needed, making your code more modular, testable, and maintainable.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

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

> **📁 Example**: [dependency-injection-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-injection-basic.ts)

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

> **📁 Example**: [injection-tokens.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/injection-tokens.ts)

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

> **📁 Example**: [injection-tokens.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/injection-tokens.ts)

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

When Tarpit needs to create an instance, it follows this resolution process:

1. **Analyze Constructor** - Examine constructor parameters and their types
2. **Resolve Dependencies** - Find providers for each dependency
3. **Create Instances** - Instantiate dependencies recursively
4. **Inject and Create** - Inject dependencies and create the final instance

### Resolution Example

> **📁 Example**: [dependency-resolution.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-resolution.ts)

```typescript
@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

@TpService()
class DatabaseService {
    constructor(private logger: LoggerService) {}
    
    query(sql: string) {
        this.logger.log(`Executing query: ${sql}`)
        return []
    }
}

@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        private logger: LoggerService
    ) {}
    
    find_user(id: string) {
        this.logger.log(`Finding user ${id}`)
        return this.db.query(`SELECT * FROM users WHERE id = '${id}'`)
    }
}

// When UserService is requested:
// 1. Tarpit sees UserService needs DatabaseService and LoggerService
// 2. DatabaseService needs LoggerService
// 3. Creates LoggerService (no dependencies)
// 4. Creates DatabaseService with LoggerService
// 5. Creates UserService with DatabaseService and LoggerService (same instance)
```

## Singleton Behavior

By default, services are **singletons** - only one instance is created per injector:

> **📁 Example**: [dependency-resolution.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/dependency-resolution.ts)

```typescript
@TpService()
class CounterService {
    private count = 0
    
    increment() {
        return ++this.count
    }
}

@TpService()
class ServiceA {
    constructor(private counter: CounterService) {}
    
    do_something() {
        return this.counter.increment() // Returns 1
    }
}

@TpService()
class ServiceB {
    constructor(private counter: CounterService) {}
    
    do_something() {
        return this.counter.increment() // Returns 2 (same instance!)
    }
}
```

## Circular Dependencies

Tarpit detects and prevents circular dependencies:

```typescript
@TpService()
class ServiceA {
    constructor(private serviceB: ServiceB) {} // ❌ Circular dependency
}

@TpService()
class ServiceB {
    constructor(private serviceA: ServiceA) {} // ❌ Circular dependency
}
```

**Solution**: Use optional dependencies or refactor the design:

```typescript
import { Optional } from '@tarpit/core'

@TpService()
class ServiceA {
    constructor(@Optional() private serviceB?: ServiceB) {}
}
```

## Best Practices

### 1. Use Constructor Injection

```typescript
// ✅ Good - Constructor injection
@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
}

// ❌ Avoid - Manual dependency creation
@TpService()
class UserService {
    private db = new DatabaseService()
}
```

### 2. Use Interfaces for Abstraction

> **📁 Example**: [best-practices.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/best-practices.ts)

```typescript
// Define interface
interface IEmailService {
    send(to: string, message: string): void
}

// Token for the interface
const EMAIL_SERVICE = Symbol('EMAIL_SERVICE')

// Implementation
@TpService()
class EmailService implements IEmailService {
    send(to: string, message: string) {
        console.log(`Email sent to ${to}`)
    }
}

// Registration
platform.import({ provide: EMAIL_SERVICE, useClass: EmailService })

// Usage
@TpService()
class UserService {
    constructor(@Inject(EMAIL_SERVICE) private emailService: IEmailService) {}
}
```

### 3. Use Descriptive Token Names

```typescript
// ✅ Good - Descriptive tokens
const DATABASE_CONNECTION_STRING = Symbol('DATABASE_CONNECTION_STRING')
const MAX_RETRY_ATTEMPTS = Symbol('MAX_RETRY_ATTEMPTS')

// ❌ Avoid - Generic tokens
const TOKEN1 = Symbol('TOKEN1')
const CONFIG = Symbol('CONFIG')
```

## Next Steps

- Learn about [Decorators](2-decorators.html) to understand how to mark classes
- Explore [Providers](4-providers.html) for different ways to register dependencies
- See [Platform & Lifecycle](3-platform-lifecycle.html) for application management 