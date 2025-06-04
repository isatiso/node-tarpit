---
sidebar_position: 4
---

# Decorators

Tarpit uses TypeScript decorators to create a powerful and hierarchical component system. Understanding the decorator architecture is key to mastering Tarpit's dependency injection and component organization.

## Decorator Architecture Overview

Tarpit's decorator system follows a clear inheritance hierarchy:

<div className="mb-8">

```
TpComponent (Base class for all Tp decorators)
│
├── TpWorker (Functional units - can be injected)
│   │
│   └── @TpService (Injectable services)
│
├── TpAssembly (Module assembly units - with imports/providers)
│   │
│   ├── @TpModule (Dependency organization modules)
│   │
│   └── TpEntry (Injection hierarchy boundaries - creates child injectors)
│       │
│       └── @TpRoot (Application entry points)
│
└── TpUnit (Special method markers)
    │
    ├── @OnStart (Lifecycle initialization)
    │
    ├── @OnTerminate (Cleanup operations)
    │
    └── HTTP decorators (in @tarpit/http)
```

</div>

### Core Component Types

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">

<div>

**🔧 TpWorker** - *Functional Units*

- Can be injected as dependencies
- Building blocks of application logic
- Singleton by default

*Example: `@TpService()`*

</div>

<div>

**📦 TpAssembly** - *Module Organization*

- Module assembly with imports/providers
- Controls service exposure
- Groups related functionality

*Example: `@TpModule()`*

</div>

</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">

<div>

**🚪 TpEntry** - *Injection Boundaries*

- Creates child injectors
- Application structure boundaries
- Scoped service isolation

*Example: `@TpRoot()`*

</div>

<div>

**⚡ TpUnit** - *Method Markers*

- Special method behaviors
- Lifecycle management
- Feature extensions

*Example: `@OnStart`, `@OnTerminate`*

</div>

</div>

### Key Benefits

- **Clear separation of concerns** - Each decorator type has a specific role
- **Predictable behavior** - Child decorators inherit parent capabilities  
- **Flexible composition** - Decorators can be combined effectively
- **Scalable architecture** - Easy to extend and maintain as applications grow

## Base Components

### TpComponent

`TpComponent` is the foundation of all Tarpit class decorators. It provides:

- **Unique identification** via tokens
- **Instance management** capabilities  
- **Integration with DI system**

All Tarpit class decorators inherit from `TpComponent`, ensuring consistent behavior across the framework.

### TpWorker - Functional Units

`TpWorker` extends `TpComponent` to represent **functional units** that can be injected as dependencies. Workers are the building blocks of your application logic.

### TpAssembly - Module Organization  

`TpAssembly` extends `TpComponent` to support **module assembly** with:

- **imports** - Ability to import other modules
- **providers** - Declaration of services provided by the module

### TpEntry - Injection Boundaries

`TpEntry` extends `TpAssembly` to create **injection hierarchy boundaries**. When the platform encounters a `TpEntry`, it creates a child injector, enabling:

- **Scoped services** - Services limited to specific parts of the application
- **Isolation** - Separate concerns across application layers

### TpUnit - Method Markers

`TpUnit` is used to mark **special methods** with specific behaviors, particularly for lifecycle management and feature extensions.

## Working Components

### @TpService (extends TpWorker)

The `@TpService()` decorator marks classes as injectable services:

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
- **Injectable** - Can be injected into other services via constructor
- **Singleton by default** - One instance per injector scope
- **Dependency resolution** - Dependencies injected automatically

#### Service Options

```typescript
@TpService({
    scope: 'transient',      // Create new instance each time
    tags: ['database', 'repository'],  // Optional tags for organization
    inject_root: true        // Inject from root injector instead of current
})
class UserRepository {
    // New instance created for each injection
}
```

### @TpModule (extends TpAssembly)

The `@TpModule()` decorator groups related services and manages dependencies:

```typescript
import { TpModule, TpService } from '@tarpit/core'

@TpService()
class UserService { /* ... */ }

@TpService()
class UserRepository { /* ... */ }

@TpModule({
    providers: [UserService, UserRepository],  // Services this module provides
    imports: [DatabaseModule],                 // Other modules to import
    exports: [UserService]                     // Services to expose to importers
})
class UserModule {}
```

**Module capabilities:**
- **Provider registration** - Declare which services the module provides
- **Module composition** - Import functionality from other modules  
- **Selective exposure** - Control which services are available to importers
- **Dependency organization** - Group related functionality

### @TpRoot (extends TpEntry)

The `@TpRoot()` decorator marks application entry points and creates injection boundaries:


```typescript
import { TpRoot } from '@tarpit/core'

@TpRoot({
    imports: [UserModule, DatabaseModule],    // Modules to import
    entries: [UserController],               // Entry point classes  
    providers: [GlobalService]               // Additional root-level services
})
class AppRoot {}

// Bootstrap the application
const platform = new Platform(config)
    .bootstrap(AppRoot)
    .start()
```

**Root characteristics:**
- **Creates child injector** - Establishes new injection scope
- **Entry point management** - Automatically loads specified entry classes
- **Application boundary** - Defines the top-level application structure

## Parameter Decorators

### @Inject

Use `@Inject()` to specify custom injection tokens:

```typescript
import { Inject, TpService } from '@tarpit/core'

// Define tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_RETRIES = Symbol('MAX_RETRIES')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_RETRIES) private max_retries: number
    ) {}
    
    connect() {
        console.log(`Connecting to: ${this.url} (max retries: ${this.max_retries})`)
    }
}

// Register the values
platform
    .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432' })
    .import({ provide: MAX_RETRIES, useValue: 3 })
    .import(DatabaseService)
```

### @Optional

Mark dependencies as optional:

```typescript
import { Optional, TpService } from '@tarpit/core'

@TpService()
class EmailService {
    constructor(
        private logger: LoggerService,
        @Optional() private metrics?: MetricsService  // Optional dependency
    ) {}
    
    send_email(to: string, subject: string) {
        this.logger.log(`Sending email to ${to}`)
        
        // Safe to use - might be undefined
        this.metrics?.increment('emails_sent')
    }
}
```

### @Disabled

Skip injection for specific parameters:

```typescript
import { Disabled, TpService } from '@tarpit/core'

@TpService()
class FileService {
    constructor(
        private logger: LoggerService,
        @Disabled() private base_dir: string = '/tmp'  // Not injected, uses default
    ) {}
}
```

## Method Decorators (TpUnit-based)

### @OnStart

Mark methods to be called when a service is created:

```typescript
import { TpService, OnStart } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: Connecting to database...')
        this.connection = await this.create_connection()
        console.log('DatabaseService: Connected successfully')
    }
    
    private async create_connection() {
        // Database connection logic
    }
}
```

### @OnTerminate  

Mark methods to be called during application shutdown:

```typescript
import { TpService, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: Closing connection...')
        if (this.connection) {
            await this.connection.close()
        }
        console.log('DatabaseService: Connection closed')
    }
}
```

## Advanced Patterns

### Hierarchical Module Organization

Leverage the decorator hierarchy for clean architecture:

```typescript
// Low-level services (TpWorker)
@TpService()
class DatabaseService { /* ... */ }

@TpService() 
class UserRepository { /* ... */ }

// Mid-level module organization (TpAssembly)
@TpModule({
    providers: [DatabaseService, UserRepository],
    exports: [UserRepository]
})
class DatabaseModule {}

@TpModule({
    imports: [DatabaseModule],
    providers: [UserService],
    exports: [UserService]
})
class UserModule {}

// Top-level application entry (TpEntry) 
@TpRoot({
    imports: [UserModule],
    entries: [UserController]
})
class AppRoot {}
```

### Complex Service with Multiple Decorators

```typescript
@TpService({ inject_root: true })
class AdvancedService {
    constructor(
        private logger: LoggerService,
        @Optional() @Inject('feature-flag') private feature_enabled?: boolean,
        @Disabled() private debug_mode: boolean = false
    ) {}
    
    @OnStart()
    async initialize() {
        this.logger.log('AdvancedService initializing...')
        if (this.feature_enabled) {
            await this.enable_advanced_features()
        }
    }
    
    @OnTerminate()
    async cleanup() {
        this.logger.log('AdvancedService shutting down...')
        await this.perform_cleanup()
    }
    
    private async enable_advanced_features() {
        // Feature initialization
    }
    
    private async perform_cleanup() {
        // Cleanup logic
    }
}
```

### Injection Boundary Management

Use `TpEntry` decorators to create isolated scopes:

```typescript
// Global scope
@TpService()
class GlobalConfigService { /* ... */ }

// HTTP request scope  
@TpRoot({
    imports: [UserModule],
    providers: [RequestContextService]  // Scoped to this injector
})
class HttpRequestHandler {}

// Background job scope
@TpRoot({
    imports: [UserModule], 
    providers: [JobContextService]      // Different instance than HTTP scope
})
class BackgroundJobHandler {}
```

## Best Practices

### 1. Follow the Hierarchy

Understand which decorator to use based on purpose:

```typescript
// ✅ Good - Service for business logic
@TpService()
class UserService { /* ... */ }

// ✅ Good - Module for organization
@TpModule({
    providers: [UserService, UserRepository],
    exports: [UserService]
})
class UserModule {}

// ✅ Good - Root for application entry
@TpRoot({
    imports: [UserModule],
    entries: [AppController]
})
class AppRoot {}

// ❌ Wrong - Don't use TpService for modules
@TpService()  // Should be @TpModule
class UserModule {}
```

### 2. Organize by Domain

Group related services in modules:

```typescript
// User domain
@TpModule({
    providers: [UserService, UserRepository, UserValidator],
    exports: [UserService]
})
class UserModule {}

// Order domain  
@TpModule({
    providers: [OrderService, OrderRepository, PaymentService],
    imports: [UserModule],  // Use services from other domains
    exports: [OrderService]
})
class OrderModule {}
```

### 3. Use Injection Boundaries Strategically

Create child injectors for different contexts:

```typescript
// Main application
@TpRoot({
    imports: [DatabaseModule],
    providers: [GlobalService]
})
class MainApp {}

// Testing context - isolated from main app
@TpRoot({
    imports: [DatabaseModule],
    providers: [MockService]  // Different implementations
})
class TestApp {}
```

### 4. Implement Lifecycle Properly

Always implement interfaces for lifecycle methods:

```typescript
// ✅ Good - Interface provides type safety
@TpService()
class DatabaseService implements OnInit, OnTerminate {
    @OnStart()
    async on_init() { /* ... */ }
    
    @OnTerminate()
    async on_terminate() { /* ... */ }
}

// ❌ Less clear - No interface contract
@TpService()
class DatabaseService {
    @OnStart()
    async some_init_method() { /* ... */ }  // Not obvious this is lifecycle
}
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

- [**Dependency Injection**](./dependency-injection) - Master the injection system
- [**Platform & Lifecycle**](./platform-lifecycle) - Understand application lifecycle
- [**Providers**](./providers) - Learn advanced provider patterns 