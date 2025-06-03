---
sidebar_position: 1
---

# Introduction

<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <img src="/img/tarpit-full.svg" alt="Tarpit Logo" style={{width: '40%', maxWidth: '300px'}} />
</div>

<div style={{textAlign: 'center', fontSize: '1.2rem', marginBottom: '2rem'}}>
🥦 Simple but Awesome <a href="https://www.typescriptlang.org/">TypeScript</a> DI Framework for Node.js 🥦
</div>

<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <a href="https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml"><img src="https://img.shields.io/github/check-runs/isatiso/node-tarpit/main" alt="build" /></a>
  
  <a href="https://codecov.io/gh/isatiso/node-tarpit"><img src="https://codecov.io/gh/isatiso/node-tarpit/branch/main/graph/badge.svg?token=9S3UQPNS3Y" alt="coverage" /></a>

  <a href="https://github.com/isatiso/node-tarpit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/isatiso/node-tarpit" alt="license:mit" /></a>
  
  <a href="https://www.npmjs.com/package/@tarpit/core"><img src="https://img.shields.io/npm/dm/@tarpit/core" alt="downloads" /></a>
  
  <a href="https://nodejs.org/en/"><img src="https://img.shields.io/node/v/@tarpit/core" alt="node" /></a>
</div>

## What is Tarpit?

Tarpit is a modern **Dependency Injection (DI) Framework** built specifically for TypeScript and Node.js applications. It provides a powerful platform for building **reusable**, **testable**, and **maintainable** server-side applications with a clean, decorator-based architecture.

### Key Features

- **🎯 Type-Safe DI**: Leverages TypeScript's type system for dependency resolution
- **🚀 Decorator-Based**: Clean, declarative syntax using TypeScript decorators
- **📦 Modular Architecture**: Built-in support for modules and component organization
- **🔧 Extensible**: Easy to extend with custom providers and modules
- **⚡ Lightweight**: Minimal overhead with focused functionality
- **🧪 Testing-Friendly**: Built with testability in mind

### Core Concepts

Tarpit's Dependency Injection system is built around three fundamental concepts:

**Platform** - The application container that manages the entire dependency injection system. It orchestrates module imports, controls the application lifecycle, and serves as the central registry for all services and providers.

**Providers** - The recipes that tell the DI system how to create and supply dependencies. Providers define how services, values, and factories are registered and resolved, whether through class constructors, factory functions, or pre-existing values.

**Injector** - The core engine that resolves dependencies by matching injection tokens to providers. It maintains a hierarchical chain of dependency lookups and acts as the runtime dependency resolution mechanism.

These three concepts work together: the **Platform** registers **Providers** with the **Injector**, which then resolves dependencies when services are requested.

## Quick Start

### Prerequisites

Before getting started, ensure you have:

- **Node.js** (v14.0.0 or higher)
- **TypeScript** (v4.0 or higher)
- **npm** or **yarn** package manager

:::tip Try the Examples
You can find complete working examples in the [`example/`](https://github.com/isatiso/node-tarpit/tree/main/example) directory of this repository, organized by module.
:::

### Installation

Create a new project directory:

```bash
mkdir my-tarpit-app
cd my-tarpit-app
```

Initialize your project:

```bash
npm init -y
tsc --init
```

Configure TypeScript for decorators in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true
  }
}
```

Install Tarpit HTTP module (includes core dependencies):

```bash
npm install @tarpit/http @tarpit/judge @tarpit/config reflect-metadata
```

### Hello World Example

:::info Complete Example
[`example/basic/hello-world.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/basic/hello-world.ts)
:::

Create `src/index.ts`:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

@TpRouter('/')
class HelloRouter {
    
    @Get('hello')
    async say_hello() {
        return { message: 'Hello, Tarpit!' }
    }
    
    @Get('user/:id')
    async get_user(args: PathArgs<{ id: string }>) {
        const user_id = args.ensure('id', Jtl.string)
        return { user_id, name: `User ${user_id}` }
    }
}

const config = load_config<TpConfigSchema>({ 
    http: { port: 4100 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(HelloRouter)
    .start()
```

Run your application:

```bash
npx ts-node src/index.ts
```

Test your endpoints:

```bash
# Basic hello endpoint
curl http://localhost:4100/hello

# Parameterized endpoint
curl http://localhost:4100/user/123
```

### Service Injection Example

:::info Complete Example
[`example/http-server/service-injection.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/service-injection.ts)
:::

Create reusable services with dependency injection:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, JsonBody, PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

// Business logic service
@TpService()
class UserService {
    private users = new Map<string, any>()
    
    create_user(user_data: any) {
        const id = Math.random().toString(36).substr(2, 9)
        this.users.set(id, { id, ...user_data })
        return this.users.get(id)
    }
    
    get_user(id: string) {
        return this.users.get(id)
    }
    
    list_users() {
        return Array.from(this.users.values())
    }
}

// HTTP controller with injected service
@TpRouter('/api/users')
class UserRouter {
    
    constructor(private user_service: UserService) {}
    
    @Get('list')
    async list_users() {
        return this.user_service.list_users()
    }
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        const user = this.user_service.get_user(id)
        return user || { error: 'User not found' }
    }
    
    @Post('create')
    async create_user(body: JsonBody) {
        const user_data = body.ensure('data', Jtl.object)
        return this.user_service.create_user(user_data)
    }
}

const config = load_config<TpConfigSchema>({ 
    http: { port: 4100 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(UserService)
    .import(UserRouter)
    .start()
```

This example demonstrates:
- **Service Definition**: `UserService` handles business logic
- **Dependency Injection**: `UserRouter` receives `UserService` automatically  
- **Automatic Wiring**: The platform connects everything together

## Next Steps

Ready to dive deeper? Check out our comprehensive guides:

- [**Core Concepts**](./core/) - Learn about dependency injection, providers, and the platform

:::tip More Modules Coming Soon
We're actively migrating more documentation modules. The following will be available soon:
- **HTTP Server** - Build web APIs with routing, middleware, and more
- **RabbitMQ Client** - Integrate message queuing  
- **Schedule** - Handle cron jobs and background tasks
- **Content Type** - Work with different data formats
:::
