---
sidebar_position: 1
---

# Dependency Injection

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
[example/core/di/dependency-injection-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/dependency-injection-basic.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// 1. Declaration - Mark classes as injectable services
@TpService()
class DatabaseService {
    connect() {
        console.log('Connected to database')
    }
    
    query(sql: string) {
        console.log(`Executing query: ${sql}`)
        return []
    }
}

@TpService()
class UserService {
    // 2. Dependency will be injected automatically
    constructor(private db: DatabaseService) {}
    
    create_user(name: string) {
        this.db.connect()
        const result = this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        console.log(`Created user: ${name}`)
        return { id: Date.now(), name }
    }
    
    find_user(name: string) {
        this.db.connect()
        const result = this.db.query(`SELECT * FROM users WHERE name = '${name}'`)
        console.log(`Found user: ${name}`)
        return result
    }
}

// 3. Registration - Register services with platform
const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import(DatabaseService)
    .import(UserService)

await platform.start()

// 4. Resolution - Get fully injected instances
const user_service = platform.expose(UserService)
if (!user_service) {
    throw new Error('UserService not found')
}

// Output: Creating users...
user_service.create_user('Alice') // Connected to database, Executing query: INSERT INTO users (name) VALUES ('Alice'), Created user: Alice
user_service.create_user('Bob')   // Connected to database, Executing query: INSERT INTO users (name) VALUES ('Bob'), Created user: Bob

// Output: Finding users...
user_service.find_user('Alice')   // Connected to database, Executing query: SELECT * FROM users WHERE name = 'Alice', Found user: Alice
```

## Injection Points

An **injection point** is a location where dependencies can be injected. Tarpit supports injection at:

### Constructor Parameters

The most common injection point is constructor parameters. TypeScript's type annotations are used to determine what to inject:

```typescript
@TpService()
class OrderService {
    constructor(
        private user: UserService,     // Inject UserService
        private payment: PaymentService, // Inject PaymentService
        private email: EmailService    // Inject EmailService
    ) {}
}

@TpService()
class ReportService {
    constructor(
        private user_service: UserService,      // Inject UserService
        private order_service: OrderService,    // Inject OrderService
        private logger_service: LoggerService    // Inject LoggerService
    ) {}
}
```

:::tip Other Injection Points
While constructor parameters are the most common injection point in the core module, other Tarpit modules like `@tarpit/http` provide additional injection points such as route handlers, middleware, and guards. These will be covered in their respective documentation sections.
:::

## Injection Tokens

An **injection token** is a unique identifier used to register and retrieve dependencies. There are two ways to specify injection tokens:

### 1. Token-Based Injection (Explicit)

Token-based injection uses the `@Inject()` decorator to explicitly specify the token used to locate the target provider. The injection token can be any value that supports strict equality comparison (`===`), including symbols, strings, classes, or other primitive values.

This approach provides maximum flexibility and control over the dependency resolution process, allowing you to decouple dependencies from their concrete implementations and support multiple providers of the same type.

:::info Complete Example
[example/core/di/explicit-injection.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/explicit-injection.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, Inject } from '@tarpit/core'

// Define custom tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_CONNECTIONS = Symbol('MAX_CONNECTIONS')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_CONNECTIONS) private max_connections: number
    ) {}
    
    connect() {
        console.log(`Connecting to database: ${this.url}`)
        console.log(`Max connections: ${this.max_connections}`)
    }
}

// Register with custom tokens
const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/mydb' })
    .import({ provide: MAX_CONNECTIONS, useValue: 10 })
    .import(DatabaseService)

await platform.start()

const db_service = platform.expose(DatabaseService)
if (!db_service) {
    throw new Error('DatabaseService not found')
}

db_service.connect() // Connecting to database: postgresql://localhost:5432/mydb, Max connections: 10
```

### 2. Type-Based Injection (Implicit)

Type-based injection is the most commonly used dependency injection pattern in Tarpit, as it provides cleaner and more intuitive code without explicit decorators. In this approach, the DI system automatically uses the parameter's TypeScript type as the injection token, eliminating the need for manual token specification.

The system follows a simple rule: the class type itself serves as both the type annotation and the injection token. This works because TypeScript classes are both compile-time types and runtime values, making them perfect identifiers for dependency resolution.

:::info Complete Example
[example/core/di/implicit-injection.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/implicit-injection.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

@TpService()
class EmailService {
    send(to: string, message: string) {
        console.log(`Sending email to ${to}: ${message}`)
    }
}

@TpService()
class UserService {
    // EmailService class is used as the injection token
    constructor(private email: EmailService) {}
    
    notify_user(email: string, message: string) {
        this.email.send(email, message)
    }
}

const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import(EmailService)
    .import(UserService)

await platform.start()

const user_service = platform.expose(UserService)
if (!user_service) {
    throw new Error('UserService not found')
}

user_service.notify_user('user@example.com', 'Welcome to our platform!') // Sending email to user@example.com: Welcome to our platform!
```

### How Reflect Metadata Works

Behind the scenes, Tarpit uses `reflect-metadata` to extract constructor parameter types at runtime. Here's what happens when TypeScript decorators and metadata reflection work together:

:::info Complete Example
[example/core/di/reflect-metadata-example.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/reflect-metadata-example.ts)
:::

```typescript
import 'reflect-metadata'
import { TpService } from '@tarpit/core'

class DatabaseService {}
interface IUserService {}

@TpService()
class ExampleService {
    constructor(
        private db: DatabaseService,        // Class type
        private config: IUserService,       // Interface type  
        private name: string,               // Primitive type
        private port: number,               // Primitive type
        private enabled: boolean            // Primitive type
    ) {}
}

// What reflect-metadata returns for constructor parameter types:
const param_types = Reflect.getMetadata('design:paramtypes', ExampleService)
console.log(param_types)
// Output: [
//   [class DatabaseService],
//   [Function: Object],
//   [Function: String],
//   [Function: Number],
//   [Function: Boolean]
// ]
//
// Breakdown:
// - DatabaseService → [class DatabaseService] (class constructor function)
// - IUserService → [Function: Object] (interfaces become Object at runtime)  
// - string → [Function: String] (primitive type constructor)
// - number → [Function: Number] (primitive type constructor)
// - boolean → [Function: Boolean] (primitive type constructor)
```

This is why only classes work seamlessly as injection tokens - they retain their identity at runtime, while interfaces become generic `Object` and primitives become their constructor functions without corresponding providers.

### Why Classes Work as Tokens

In TypeScript, classes are both types and values, making them perfect injection tokens:

| Declaration Type | Can be Type | Can be Value | Usable as Token |
|:-----------------|:-----------:|:------------:|:---------------:|
| Class            | ✅          | ✅           | ✅              |
| Interface        | ✅          | ❌           | ❌              |
| Type Alias       | ✅          | ❌           | ❌              |
| Enum             | ✅          | ✅           | ✅              |

```typescript
class DatabaseService {}
interface IUserService {}

// ✅ This works - Class is both type and value
@TpService()
class ExampleService {
    constructor(private db: DatabaseService) {} // Tarpit gets: [class DatabaseService]
}

// ❌ This doesn't work - Interface is only a type
@TpService()
class ExampleService {
    constructor(private config: IUserService) {} // Tarpit gets: [Function: Object]
}

// ❌ This doesn't work - Primitive types don't have providers
@TpService()
class ExampleService {
    constructor(
        private name: string,        // Tarpit gets: [Function: String], but no provider registered
        private port: number,        // Tarpit gets: [Function: Number], but no provider registered
        private enabled: boolean     // Tarpit gets: [Function: Boolean], but no provider registered
    ) {}
}

// ✅ This works with explicit tokens
enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

@TpService()
class ExampleService {
    constructor(@Inject(UserRole.ADMIN) private role: string) {} // Works with explicit token
}
```

## Dependency Resolution

The DI system follows a specific resolution process:

### Resolution Order

1. **Check cache** - Return cached instance if available
2. **Check providers** - Look for registered provider
3. **Create instance** - Instantiate and resolve dependencies
4. **Cache result** - Store for future use

### Dependency Resolution Example

:::info Complete Example
[example/core/di/dependency-resolution.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/dependency-resolution.ts)
:::

Here's how the DI system resolves complex dependency chains:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// Bottom layer - no dependencies
@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

// Second layer - depends on LoggerService
@TpService()
class DatabaseService {
    constructor(private logger: LoggerService) {}
    
    connect() {
        this.logger.log('Database connected')
        return true
    }
    
    query(sql: string) {
        this.logger.log(`Query executed: ${sql}`)
        return { rows: [], count: 0 }
    }
}

// Third layer - depends on DatabaseService (which depends on LoggerService)
@TpService()
class UserRepository {
    constructor(
        private db: DatabaseService,
        private logger: LoggerService
    ) {}
    
    find_by_id(id: number) {
        this.logger.log(`Finding user by ID: ${id}`)
        this.db.connect()
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`)
    }
    
    create(name: string) {
        this.logger.log(`Creating user: ${name}`)
        this.db.connect()
        return this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
    }
}

// Fourth layer - depends on UserRepository (which depends on DatabaseService and LoggerService)
@TpService()
class UserService {
    constructor(
        private user_repo: UserRepository,
        private logger: LoggerService
    ) {}
    
    get_user(id: number) {
        this.logger.log(`UserService: Getting user ${id}`)
        return this.user_repo.find_by_id(id)
    }
    
    create_user(name: string) {
        this.logger.log(`UserService: Creating user ${name}`)
        return this.user_repo.create(name)
    }
}

// Top layer - depends on UserService (which has a deep dependency chain)
@TpService()
class UserController {
    constructor(
        private user_service: UserService,
        private logger: LoggerService
    ) {}
    
    handle_get_user(id: number) {
        this.logger.log(`UserController: Handling get user request for ID ${id}`)
        return this.user_service.get_user(id)
    }
    
    handle_create_user(name: string) {
        this.logger.log(`UserController: Handling create user request for ${name}`)
        return this.user_service.create_user(name)
    }
}

async function demonstrate_dependency_resolution() {
    console.log('Setting up platform with dependency chain...')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(LoggerService)      // No dependencies
        .import(DatabaseService)    // Depends on LoggerService
        .import(UserRepository)     // Depends on DatabaseService, LoggerService
        .import(UserService)        // Depends on UserRepository, LoggerService
        .import(UserController)     // Depends on UserService, LoggerService
    
    await platform.start()
    
    console.log('\nDependency resolution chain:')
    console.log('UserController → UserService → UserRepository → DatabaseService → LoggerService')
    
    // When we get UserController, all dependencies are resolved automatically
    const controller = platform.expose(UserController)
    if (!controller) {
        throw new Error('UserController not found')
    }
    
    console.log('\nExecuting operations (notice the dependency chain in action):')
    controller.handle_create_user('Alice')
    // Output shows the full dependency chain:
    // [LOG] UserController: Handling create user request for Alice
    // [LOG] UserService: Creating user Alice
    // [LOG] Creating user: Alice  
    // [LOG] Database connected
    // [LOG] Query executed: INSERT INTO users (name) VALUES ('Alice')
    
    controller.handle_get_user(1)
    // Output shows the full dependency chain:
    // [LOG] UserController: Handling get user request for ID 1
    // [LOG] UserService: Getting user 1
    // [LOG] Finding user by ID: 1
    // [LOG] Database connected
    // [LOG] Query executed: SELECT * FROM users WHERE id = 1
}

demonstrate_dependency_resolution()
```

**Key Points About Resolution:**

1. **Single Instance**: Each service is created only once (singleton pattern)
2. **Automatic Resolution**: Dependencies are resolved recursively
3. **Order Independence**: Services can be registered in any order
4. **Shared Dependencies**: `LoggerService` is shared across all services that need it

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

#### What Actually Happens with Circular Dependencies

When circular dependencies occur, the problem isn't in the dependency resolution process itself, but rather in how TypeScript handles forward references. Here's the technical detail:

```typescript
// This is what happens at runtime with circular dependencies:

@TpService()
class ServiceA {
    constructor(private serviceB: ServiceB) {}
    //                           ^^^^^^^^
    //                           This might be undefined!
}

@TpService()
class ServiceB {
    constructor(private serviceA: ServiceA) {}
    //                           ^^^^^^^^  
    //                           This might be undefined!
}

// When reflect-metadata tries to get parameter types:
const serviceA_params = Reflect.getMetadata('design:paramtypes', ServiceA)
console.log(serviceA_params) // [undefined] ← ServiceB is undefined due to hoisting

const serviceB_params = Reflect.getMetadata('design:paramtypes', ServiceB)  
console.log(serviceB_params) // [class ServiceA] ← ServiceA is defined because it comes first
```

#### Why This Happens

The issue occurs due to JavaScript's class hoisting behavior:

1. **Class declarations are hoisted** - but their initialization happens in order
2. **When ServiceA is defined**, ServiceB hasn't been fully initialized yet
3. **The metadata reflection** captures `undefined` instead of the actual ServiceB class
4. **The DI system** tries to resolve `undefined` as a token and fails

#### Real Example with Error

```typescript
@TpService()
class OrderService {
    constructor(private user: UserService) {}
    
    create_order(user_id: number, items: string[]) {
        const user = this.user.get_user(user_id) // This will fail!
        console.log(`Creating order for ${user.name}`)
    }
}

@TpService()
class UserService {
    constructor(private order: OrderService) {}
    
    get_user(id: number) {
        return { id, name: 'Alice' }
    }
    
    get_user_orders(user_id: number) {
        return this.order.get_orders_by_user(user_id) // This will fail too!
    }
}

// Runtime error when trying to resolve:
// Error: Cannot resolve dependency at index 0 of class OrderService
// Reason: No provider found for token: undefined
//         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//         The actual error - undefined token, not circular detection
```

#### How to Fix Circular Dependencies

**1. Redesign Service Boundaries**

```typescript
// ❌ Bad - Circular dependency
class UserService {
    constructor(private order: OrderService) {}
}
class OrderService {
    constructor(private user: UserService) {}
}

// ✅ Good - Introduce a shared service
@TpService()
class DatabaseService {
    query_users() { /* ... */ }
    query_orders() { /* ... */ }
}

@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
}

@TpService()
class OrderService {
    constructor(private db: DatabaseService) {}
}
```

**2. Use Higher-Level Orchestration Service**

```typescript
// ✅ Better - Orchestration service that depends on both
@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
    get_user(id: number) { /* ... */ }
}

@TpService()
class OrderService {
    constructor(private db: DatabaseService) {}
    create_order(user_id: number, items: string[]) { /* ... */ }
}

@TpService()
class UserOrderService {
    constructor(
        private user: UserService,
        private order: OrderService
    ) {}
    
    create_order_for_user(user_id: number, items: string[]) {
        const user = this.user.get_user(user_id)
        return this.order.create_order(user_id, items)
    }
}
```

**3. Use Events/Messaging Pattern**

```typescript
@TpService()
class EventBus {
    private handlers = new Map()
    
    emit(event: string, data: any) {
        const handler = this.handlers.get(event)
        if (handler) handler(data)
    }
    
    on(event: string, handler: Function) {
        this.handlers.set(event, handler)
    }
}

@TpService()
class UserService {
    constructor(private events: EventBus) {}
    
    create_user(name: string) {
        const user = { id: Date.now(), name }
        this.events.emit('user.created', user)
        return user
    }
}

@TpService()
class OrderService {
    constructor(private events: EventBus) {
        // Listen for user events instead of directly depending on UserService
        this.events.on('user.created', (user: any) => {
            console.log(`Ready to process orders for user: ${user.name}`)
        })
    }
}
```

:::warning Circular Dependencies
Remember: The error occurs because one of the dependency tokens becomes `undefined` due to JavaScript's class initialization order, not because the DI system detects cycles. Always redesign your services to avoid circular references.
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