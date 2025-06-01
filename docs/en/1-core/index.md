---
layout: default
title: Core Concepts
nav_order: 2
has_children: true
---

# Core Concepts
{:.no_toc}

The `@tarpit/core` module is the foundation of the Tarpit framework. It provides the essential dependency injection system, decorator-based architecture, and platform management that powers all Tarpit applications.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Overview

Tarpit's core is built around several key concepts:

- **Dependency Injection** - Automatic resolution and injection of dependencies
- **Decorators** - TypeScript decorators for marking classes and methods
- **Platform** - The main application container and lifecycle manager
- **Providers** - Various ways to provide dependencies to the DI system
- **Built-in Services** - Core services like configuration and module loading

## Quick Example

Here's a basic example showing the core concepts in action:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, TpModule } from '@tarpit/core'

@TpService()
class UserService {
    get_users() {
        return ['Alice', 'Bob', 'Charlie']
    }
}

@TpService()
class UserController {
    constructor(private user_service: UserService) {}
    
    list_users() {
        return this.user_service.get_users()
    }
}

@TpModule({
    providers: [UserService, UserController]
})
class AppModule {}

const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import(AppModule)
    .start()

// Access services from the platform
const controller = platform.expose(UserController)
console.log(controller.list_users()) // ['Alice', 'Bob', 'Charlie']
```

## Core Principles

### Type-Safe Dependency Injection

Tarpit leverages TypeScript's type system and decorators to provide compile-time type safety for dependency injection:

```typescript
@TpService()
class DatabaseService {
    connect() { /* ... */ }
}

@TpService()
class UserService {
    // TypeScript automatically infers the dependency type
    constructor(private db: DatabaseService) {}
}
```

### Decorator-Based Architecture

Use decorators to declare how classes should be treated by the DI system:

- `@TpService()` - Injectable service classes
- `@TpModule()` - Grouping and organization
- `@TpRoot()` - Application entry points

### Hierarchical Injectors

The DI system uses a hierarchical injector structure, allowing for scoped dependencies and module isolation.

### Lifecycle Management

The Platform class manages the entire application lifecycle with hooks for startup and shutdown operations.

## Next Steps

- Start with **[Dependency Injection](1-dependency-injection.html)** to understand the core concepts
- Explore **[Decorators](2-decorators.html)** to learn about the available annotations
- See **[Platform & Lifecycle](3-platform-lifecycle.html)** for application management
- Understand **[Providers](4-providers.html)** and different ways to register dependencies
- Check **[Built-in Services](5-builtin-services.html)** for core framework services
- Try the **[HTTP Server](/en/2-http-server/)** module for practical examples
