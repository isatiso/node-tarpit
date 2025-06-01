---
sidebar_position: 4
---

# Decorators

:::info Working Examples
See [decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts) for complete working examples.
:::

Tarpit uses TypeScript decorators to mark classes and methods, making the dependency injection system declarative and easy to understand. Decorators tell Tarpit how to treat your classes and what role they play in your application.

## Overview

Tarpit provides several decorators for different purposes:

- **Component Decorators** - Mark classes for DI system
- **Parameter Decorators** - Control dependency injection behavior
- **Lifecycle Decorators** - Hook into application lifecycle events

## Component Decorators

### @TpService

The `@TpService()` decorator marks a class as an injectable service:

```typescript
import { TpService } from '@tarpit/core'

@TpService()
class UserService {
    private users: User[] = []
    
    create_user(name: string): User {
        const user = { id: Date.now(), name }
        this.users.push(user)
        return user
    }
    
    find_user(id: number): User | undefined {
        return this.users.find(u => u.id === id)
    }
}
```

**Key characteristics:**
- Can be injected into other services
- Singleton by default (one instance per injector)
- Can have dependencies injected via constructor

#### Service Options

```typescript
@TpService({
    scope: 'transient',  // Create new instance each time
    tags: ['database', 'repository']  // Optional tags for organization
})
class UserRepository {
    // New instance created for each injection
}
```

### @TpModule

The `@TpModule()` decorator groups related services and provides configuration:

```typescript
import { TpModule, TpService } from '@tarpit/core'

@TpService()
class UserService { /* ... */ }

@TpService()
class OrderService { /* ... */ }

@TpModule({
    providers: [UserService, OrderService],
    imports: [DatabaseModule]
})
class UserModule {}
```

**Module options:**
- `providers` - Services provided by this module
- `imports` - Other modules to import
- `exports` - Services to make available to importing modules

### @TpRoot

The `@TpRoot()` decorator marks an entry point for bootstrapping applications:

```typescript
import { TpRoot } from '@tarpit/core'
import { HttpServerModule } from '@tarpit/http'

@TpRoot({
    imports: [HttpServerModule, UserModule],
    entries: [UserController]
})
class AppRoot {}

// Bootstrap the application
const platform = new Platform(config)
    .bootstrap(AppRoot)
    .start()
```

**Root options:**
- `imports` - Modules to import
- `entries` - Entry point classes (like HTTP routers)
- `providers` - Additional services

## Parameter Decorators

### @Inject

Use `@Inject()` to specify custom injection tokens:

:::info Complete Example
[decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts)
:::

```typescript
import { Inject, TpService } from '@tarpit/core'

// Define tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_RETRIES = Symbol('MAX_RETRIES')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_RETRIES) private maxRetries: number
    ) {}
}

// Register the values
platform
    .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432' })
    .import({ provide: MAX_RETRIES, useValue: 3 })
    .import(DatabaseService)
```

### @Optional

Mark dependencies as optional with `@Optional()`:

:::info Complete Example
[decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts)
:::

```typescript
import { Optional, TpService } from '@tarpit/core'

@TpService()
class EmailService {
    constructor(
        private logger: LoggerService,
        @Optional() private metrics?: MetricsService
    ) {}
    
    send_email(to: string, subject: string) {
        this.logger.log(`Sending email to ${to}`)
        
        // Metrics service might not be available
        this.metrics?.increment('emails_sent')
    }
}
```

### @Disabled

The `@Disabled()` decorator marks a parameter to be skipped during injection:

```typescript
import { Disabled, TpService } from '@tarpit/core'

@TpService()
class FileService {
    constructor(
        private logger: LoggerService,
        @Disabled() private baseDir: string = '/tmp'
    ) {}
}
```

## Lifecycle Decorators

### @OnInit

Mark methods to be called when a service is created:

:::info Complete Example
[decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts)
:::

```typescript
import { OnInit, TpService } from '@tarpit/core'

@TpService()
class DatabaseService implements OnInit {
    private connection: any
    
    async on_init() {
        console.log('DatabaseService: Connecting to database...')
        this.connection = await this.createConnection()
        console.log('DatabaseService: Connected successfully')
    }
    
    private async createConnection() {
        // Database connection logic
    }
}
```

### @OnTerminate

Mark methods to be called during application shutdown:

:::info Complete Example
[decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts)
:::

```typescript
import { OnTerminate, TpService } from '@tarpit/core'

@TpService()
class DatabaseService implements OnTerminate {
    private connection: any
    
    async on_terminate() {
        console.log('DatabaseService: Closing connection...')
        if (this.connection) {
            await this.connection.close()
        }
        console.log('DatabaseService: Connection closed')
    }
}
```

## Decorator Combinations

### Common Patterns

You can combine multiple decorators for powerful effects:

```typescript
import { TpService, Optional, Inject, OnInit, OnTerminate } from '@tarpit/core'

@TpService()
class AdvancedService implements OnInit, OnTerminate {
    constructor(
        private logger: LoggerService,
        @Optional() @Inject('feature-flag') private featureEnabled?: boolean,
        @Disabled() private debugMode: boolean = false
    ) {}
    
    async on_init() {
        this.logger.log('AdvancedService initializing...')
        if (this.featureEnabled) {
            await this.enableAdvancedFeatures()
        }
    }
    
    async on_terminate() {
        this.logger.log('AdvancedService shutting down...')
        await this.cleanup()
    }
    
    private async enableAdvancedFeatures() {
        // Feature initialization
    }
    
    private async cleanup() {
        // Cleanup logic
    }
}
```

### Service with Complex Dependencies

```typescript
@TpService()
class OrderService implements OnInit {
    constructor(
        private userService: UserService,
        private paymentService: PaymentService,
        @Inject('order-config') private config: OrderConfig,
        @Optional() private notificationService?: NotificationService,
        @Optional() @Inject('analytics-enabled') private analyticsEnabled?: boolean
    ) {}
    
    async on_init() {
        console.log('OrderService initialized with config:', this.config)
        if (this.analyticsEnabled) {
            console.log('Analytics tracking enabled')
        }
    }
    
    async create_order(userId: number, items: OrderItem[]) {
        const user = await this.userService.find_user(userId)
        if (!user) throw new Error('User not found')
        
        const payment = await this.paymentService.process(items)
        const order = { user, items, payment, createdAt: new Date() }
        
        // Optional notification
        if (this.notificationService) {
            await this.notificationService.notify_order_created(order)
        }
        
        return order
    }
}
```

## Best Practices

### 1. Use Descriptive Service Names

```typescript
// ✅ Good - Clear, descriptive names
@TpService()
class UserRegistrationService {}

@TpService()
class EmailDeliveryService {}

// ❌ Avoid - Vague names
@TpService()
class Manager {}

@TpService()
class Handler {}
```

### 2. Implement Lifecycle Interfaces

```typescript
// ✅ Good - Explicit interface implementation
@TpService()
class DatabaseService implements OnInit, OnTerminate {
    async on_init() { /* ... */ }
    async on_terminate() { /* ... */ }
}

// ❌ Less clear - Just the decorator without interface
@TpService()
class DatabaseService {
    async on_init() { /* ... */ }  // Not obvious this is a lifecycle method
}
```

### 3. Use Optional Judiciously

```typescript
// ✅ Good - Truly optional features
@TpService()
class EmailService {
    constructor(
        private sender: EmailSender,
        @Optional() private analytics?: AnalyticsService  // Feature enhancement
    ) {}
}

// ❌ Avoid - Core dependencies as optional
@TpService()
class UserService {
    constructor(
        @Optional() private database?: DatabaseService  // Required for basic functionality
    ) {}
}
```

### 4. Organize with Modules

```typescript
// ✅ Good - Logical grouping
@TpModule({
    providers: [
        UserService,
        UserRepository,
        UserValidator
    ],
    exports: [UserService]  // Only expose the main service
})
class UserModule {}

@TpModule({
    providers: [
        OrderService,
        PaymentService,
        InventoryService
    ],
    imports: [UserModule],  // Use services from other modules
    exports: [OrderService]
})
class OrderModule {}
```

## Debugging Decorators

### Development Helpers

You can create custom decorators for debugging:

```typescript
function Debug(target: any) {
    console.log(`Creating service: ${target.name}`)
    return target
}

@TpService()
@Debug
class UserService {
    // Will log when this service is created
}
```

### Service Tags

Use tags to organize and debug services:

```typescript
@TpService({ tags: ['repository', 'database'] })
class UserRepository {}

@TpService({ tags: ['service', 'business-logic'] })
class UserService {}

@TpService({ tags: ['controller', 'http'] })
class UserController {}
```

## TypeScript Configuration

:::caution Required Configuration
Decorators require specific TypeScript configuration:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}
```
:::

## Next Steps

- [**Built-in Services**](./built-in-services) - Discover core services provided by Tarpit
- [**Providers**](./providers) - Learn about different provider types
- [**Platform & Lifecycle**](./platform-lifecycle) - Understand application lifecycle 