---
sidebar_position: 2
---

# Core Concepts

The `@tarpit/core` module is the foundation of the Tarpit framework. It provides the essential dependency injection system, decorator-based architecture, and platform management that powers all Tarpit applications.

## Overview

Tarpit's core is built around several key concepts:

- **Dependency Injection** - Automatic resolution and injection of dependencies
- **Decorators** - TypeScript decorators for marking classes and methods
- **Platform** - The main application container and lifecycle manager
- **Providers** - Various ways to provide dependencies to the DI system
- **Built-in Services** - Core services like logging, configuration, and event handling

:::tip Examples Repository
Working examples for core concepts can be found in [`example/basic/`](https://github.com/isatiso/node-tarpit/tree/main/example/basic).
:::

## Installation

```bash
npm install @tarpit/core reflect-metadata
```

:::caution TypeScript Configuration Required
Tarpit requires TypeScript decorators. Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
:::

## Quick Example

Here's a minimal example showing the core concepts in action:

```typescript
import { Platform, TpService, TpModule } from '@tarpit/core'

// A simple service
@TpService()
class GreetingService {
    greet(name: string) {
        return `Hello, ${name}!`
    }
}

// A module that provides the service
@TpModule({
    providers: [GreetingService]
})
class AppModule {
    constructor(private greeting: GreetingService) {}
    
    start() {
        console.log(this.greeting.greet('World'))
    }
}

// Platform bootstraps everything
new Platform()
    .import(AppModule)
    .start()
```

## Next Steps

Explore the core concepts in detail:

- [**Dependency Injection**](./dependency-injection) - Understanding DI principles and how they work in Tarpit
- [**Platform & Lifecycle**](./platform-lifecycle) - Application container and lifecycle management  
- [**Providers**](./providers) - Different ways to provide dependencies to the system
- [**Decorators**](./decorators) - Available decorators and how to use them
- [**Built-in Services**](./built-in-services) - Core services provided by the framework 