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
│   └── TpEntry (Entry point services - dependency tree endpoints)
│       │
│       └── @TpRoot (Injection hierarchy boundaries - creates child injectors)
│
└── TpUnit (Special method markers)
    │
    ├── @OnStart (Lifecycle initialization)
    │
    └── @OnTerminate (Cleanup operations)
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

**⚡ TpEntry** - *Entry Point Services*

- Always instantiated when loaded
- Dependency tree endpoints
- Functional entry points for specific features

*Example: `@TpRouter()`, `@TpConsumer()`*

</div>

<div>

**🚪 TpRoot** - *Injection Boundaries*

- Creates child injectors
- Module isolation boundaries
- Hierarchical dependency management

*Example: `@TpRoot()`*

</div>

</div>

<div className="grid grid-cols-1 md:grid-cols-1 gap-8 my-8">

<div>

**⚙️ TpUnit** - *Method Markers*

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

## Abstract Decorators

The following are abstract base classes that form the foundation of Tarpit's decorator system. These are not used directly but provide the inheritance hierarchy for concrete decorators.

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

### TpEntry - Entry Point Services

`TpEntry` extends `TpAssembly` to mark **entry point services** that serve as functional endpoints in the dependency tree. These components are always instantiated when loaded:

- **Always instantiated** - Instance created regardless of dependency usage
- **Dependency tree endpoints** - Located at the leaf nodes of the dependency tree
- **Functional entry points** - Serve as entry points for specific application features like routing, message consumption, etc.

### TpRoot - Injection Boundaries

:::note Why TpRoot appears here
While `TpRoot` is a concrete decorator (not abstract), it appears in this section because it plays a fundamental architectural role in the decorator hierarchy. As the only decorator that creates child injectors, understanding `TpRoot`'s architectural behavior is essential before learning its practical usage patterns.
:::

`TpRoot` extends `TpEntry` to create **injection hierarchy boundaries**. When the platform encounters a `TpRoot`, it creates a child injector, enabling:

- **Module isolation** - Different modules can have separate dependency implementations
- **Scoped services** - Services limited to specific application parts
- **Hierarchical structure** - Organized dependency management across application layers

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
    inject_root: true,        // Inject from root injector instead of current
    echo_dependencies: true   // Log dependency information during initialization
})
class UserRepository {
    // This service will be injected from root injector
    // and will output dependency information when created
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
    inject_root: true                          // Optional: inject from root injector
})
class UserModule {}
```

**Module capabilities:**
- **Provider registration** - Declare which services the module provides
- **Module composition** - Import functionality from other modules  
- **Root injection** - Optionally inject from root injector instead of current scope
- **Dependency organization** - Group related functionality

:::note Module Exports
Unlike some DI systems, Tarpit modules don't use explicit `exports`. All providers declared in a module are automatically available to modules that import it. This simplifies module organization and reduces configuration overhead.
:::

### @TpRoot (extends TpEntry)

The `@TpRoot()` decorator defines application entry points and creates isolated dependency scopes:

```typescript
import { TpRoot } from '@tarpit/core'

@TpRoot({
    imports: [UserModule, DatabaseModule],    // Modules to import
    entries: [UserRouter, TaskScheduler],     // Entry point services to instantiate  
    providers: [GlobalService]               // Additional services for this scope
})
class AppRoot {}

// Start the application using import
const platform = new Platform(config)
    .import(AppRoot)

await platform.start()
```

**Practical uses:**
- **Application bootstrap** - Define the main entry point for your application
- **Module isolation** - Create separate contexts for different parts of your application (web server, background jobs, testing)
- **Entry point management** - Automatically instantiate and manage entry point services like routers and consumers
- **Configuration scoping** - Provide different service implementations for different environments

:::note TpRoot and inject_root
`@TpRoot` does not support the `inject_root` option because it conflicts with TpRoot's core purpose of creating injection boundaries. TpRoot instances are always created in their own child injector context.
:::

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

Mark classes, methods, or parameters to be skipped by specific modules:

```typescript
import { Disabled, TpService } from '@tarpit/core'

@TpService()
class FileService {
    constructor(
        private logger: LoggerService,
        @Disabled() private base_dir: string = '/tmp'  // Marked to be skipped by DI system
    ) {}
    
    @Disabled()
    deprecated_method() {
        // This method might be skipped by certain processing modules
    }
}

@Disabled()
@TpService()
class LegacyService {
    // This entire service might be skipped by certain modules
}
```

**Key characteristics:**
- **Marker decorator** - Simply adds metadata, doesn't change behavior directly
- **Module-specific behavior** - How it's handled depends on the consuming module
- **General meaning** - Signals that the decorated element should be skipped during processing

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
    providers: [DatabaseService, UserRepository]
})
class DatabaseModule {}

@TpModule({
    imports: [DatabaseModule],
    providers: [UserService]
})
class UserModule {}

// Injection boundary with entry point services (TpRoot extends TpEntry)
@TpRoot({
    imports: [UserModule],
    entries: [UserController]  // UserController is an entry point service - always instantiated
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

Use `TpRoot` decorators to create isolated injector scopes:

```typescript
// Global scope
@TpService()
class GlobalConfigService { /* ... */ }

// HTTP request scope - separate injector  
@TpRoot({
    imports: [UserModule],
    providers: [RequestContextService],  // Scoped to this injector
    entries: [HttpController]           // Entry point service for HTTP handling
})
class HttpRequestHandler {}

// Background job scope - separate injector
@TpRoot({
    imports: [UserModule], 
    providers: [JobContextService],     // Different instance than HTTP scope
    entries: [JobProcessor]             // Entry point service for job processing
})
class BackgroundJobHandler {}
```