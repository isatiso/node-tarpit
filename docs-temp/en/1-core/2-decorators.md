---
layout: default
title: Decorators
parent: Core Concepts
nav_order: 2
---

# Decorators
{:.no_toc}

> **💡 Working Examples**: See [decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts) for complete working examples.

Tarpit uses TypeScript decorators to mark classes and methods, making the dependency injection system declarative and easy to understand. Decorators tell Tarpit how to treat your classes and what role they play in your application.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Overview

Tarpit provides several decorators for different purposes:

- **Component Decorators** - Mark classes for DI system
- **Parameter Decorators** - Control dependency injection behavior
- **Utility Decorators** - Additional features like debugging and lifecycle hooks

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

> **📁 Example**: [decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts)

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

> **📁 Example**: [decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts)

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

### @OnTerminate

Mark methods to be called during application shutdown:

> **📁 Example**: [decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/decorators.ts)

```typescript
import { OnTerminate, TpService } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    constructor() {
        this.connection = createConnection()
    }
    
    @OnTerminate()
    async cleanup() {
        await this.connection.close()
        console.log('Database connection closed')
    }
}
```

**Important notes:**
- Methods can be async
- Called automatically during `platform.terminate()`
- Useful for cleanup operations

## Utility Decorators

### @Debug

Enable debug logging for a class:

```typescript
import { Debug, TpService } from '@tarpit/core'

@Debug()
@TpService()
class UserService {
    create_user(name: string) {
        // Debug information will be logged automatically
        return { id: Date.now(), name }
    }
}
```

## Decorator Composition

You can combine multiple decorators on the same class:

```typescript
import { Debug, TpService, OnTerminate } from '@tarpit/core'

@Debug()
@TpService()
class ComplexService {
    constructor(
        private logger: LoggerService,
        @Optional() private cache?: CacheService
    ) {}
    
    do_work() {
        this.logger.log('Working...')
        this.cache?.set('last_work', Date.now())
    }
    
    @OnTerminate()
    async shutdown() {
        this.logger.log('Service shutting down')
        await this.cache?.clear()
    }
}
```

## Advanced Usage

### Module Re-exports

Modules can re-export services from imported modules:

```typescript
@TpModule({
    imports: [DatabaseModule],
    providers: [UserService],
    exports: [UserService] // Make UserService available to importing modules
})
class UserModule {}

@TpModule({
    imports: [UserModule], // Now has access to UserService
    providers: [OrderService]
})
class OrderModule {
    // OrderService can inject UserService
}
```

### Provider Overrides

Override services in modules:

```typescript
@TpModule({
    imports: [ThirdPartyModule],
    providers: [
        // Override a service from ThirdPartyModule
        { provide: ThirdPartyService, useClass: CustomThirdPartyService }
    ]
})
class CustomModule {}
```

### Factory Providers with Dependencies

Create services using factory functions that have dependencies:

```typescript
const CONFIG_TOKEN = Symbol('CONFIG_TOKEN')

@TpModule({
    providers: [
        DatabaseService,
        {
            provide: CONFIG_TOKEN,
            useFactory: (db: DatabaseService) => {
                return db.load_config()
            },
            deps: [DatabaseService] // Specify dependencies for the factory
        }
    ]
})
class ConfigModule {}
```

## Best Practices

### 1. Use Descriptive Module Names

```typescript
// ✅ Good - Clear purpose
@TpModule({ /* ... */ })
class UserManagementModule {}

@TpModule({ /* ... */ })
class PaymentProcessingModule {}

// ❌ Avoid - Generic names
@TpModule({ /* ... */ })
class Module1 {}
```

### 2. Keep Modules Focused

```typescript
// ✅ Good - Single responsibility
@TpModule({
    providers: [UserService, UserRepository, UserValidator]
})
class UserModule {}

// ❌ Avoid - Too many responsibilities
@TpModule({
    providers: [UserService, OrderService, PaymentService, EmailService]
})
class EverythingModule {}
```

### 3. Use Interfaces with Tokens

```typescript
// ✅ Good - Interface abstraction
interface INotificationService {
    send(message: string): void
}

const NOTIFICATION_SERVICE = Symbol('NOTIFICATION_SERVICE')

@TpModule({
    providers: [
        { provide: NOTIFICATION_SERVICE, useClass: EmailNotificationService }
    ]
})
class NotificationModule {}

// ❌ Avoid - Direct class coupling
@TpModule({
    providers: [EmailNotificationService] // Hard to switch implementations
})
class NotificationModule {}
```

### 4. Use @Optional Carefully

```typescript
// ✅ Good - Truly optional feature
@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        @Optional() private analytics?: AnalyticsService // Optional feature
    ) {}
}

// ❌ Avoid - Required dependency marked as optional
@TpService()
class UserService {
    constructor(
        @Optional() private db?: DatabaseService // Database is required!
    ) {}
}
```

## Common Patterns

### Service Inheritance

```typescript
abstract class BaseService {
    constructor(protected logger: LoggerService) {}
    
    protected log(message: string) {
        this.logger.log(`[${this.constructor.name}] ${message}`)
    }
}

@TpService()
class UserService extends BaseService {
    create_user(name: string) {
        this.log(`Creating user: ${name}`)
        // ...
    }
}
```

### Plugin Architecture

```typescript
interface IPlugin {
    initialize(): void
    getName(): string
}

const PLUGIN_TOKEN = Symbol('PLUGIN_TOKEN')

@TpService()
class PluginManager {
    constructor(@Inject(PLUGIN_TOKEN) private plugins: IPlugin[]) {}
    
    initialize_all() {
        this.plugins.forEach(plugin => plugin.initialize())
    }
}

// Register multiple plugins
platform
    .import({ provide: PLUGIN_TOKEN, useClass: AuthPlugin, multi: true })
    .import({ provide: PLUGIN_TOKEN, useClass: LoggingPlugin, multi: true })
    .import(PluginManager)
```

## Next Steps

- Learn about [Platform & Lifecycle](3-platform-lifecycle.html) for application management
- Explore [Providers](4-providers.html) for different ways to register dependencies
- See [Dependency Injection](1-dependency-injection.html) for core DI concepts 