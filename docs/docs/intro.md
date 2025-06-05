---
title: Quick Start
sidebar_position: 1
hide_title: true
---

<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <img src="/img/tarpit-full.svg" alt="Tarpit Logo" style={{width: '40%', maxWidth: '300px'}} />
</div>

<div style={{textAlign: 'center', fontSize: '1.2rem', marginBottom: '2rem'}}>
🥦 Simple but Awesome <a href="https://www.typescriptlang.org/">TypeScript</a> DI Framework for Node.js 🥦
</div>

{/* Metrics Badges (with numbers) */}
<div style={{textAlign: 'center', marginBottom: '1rem'}}>
  <a href="https://www.npmjs.com/package/@tarpit/core"><img src="https://img.shields.io/npm/v/@tarpit/core" alt="NPM Version" /></a>
  {' '}
  <a href="https://www.npmjs.com/package/@tarpit/core"><img src="https://img.shields.io/npm/dm/@tarpit/core" alt="Monthly Downloads" /></a>
  {' '}
  <a href="https://nodejs.org/en/"><img src="https://img.shields.io/node/v/@tarpit/core" alt="Node.js Version" /></a>
  {' '}
  <a href="https://codecov.io/gh/isatiso/node-tarpit"><img src="https://codecov.io/gh/isatiso/node-tarpit/branch/main/graph/badge.svg?token=9S3UQPNS3Y" alt="Code Coverage" /></a>
  {' '}
  <a href="https://bundlephobia.com/package/@tarpit/core"><img src="https://img.shields.io/bundlephobia/minzip/@tarpit/core" alt="Bundle Size" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit/commits/main"><img src="https://img.shields.io/github/last-commit/isatiso/node-tarpit" alt="Last Commit" /></a>
</div>

{/* Status/Identity Badges (without numbers) */}
<div style={{textAlign: 'center', marginBottom: '1rem'}}>
  <a href="https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml"><img src="https://img.shields.io/github/check-runs/isatiso/node-tarpit/main" alt="Build Status" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit"><img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/isatiso/node-tarpit" alt="MIT License" /></a>
  {' '}
  <a href="https://lerna.js.org/"><img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="Lerna" /></a>
  {' '}
  <a href="https://deepwiki.com/isatiso/node-tarpit"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" /></a>
</div>

{/* Social Badges */}
<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <a href="https://github.com/isatiso/node-tarpit"><img src="https://img.shields.io/github/stars/isatiso/node-tarpit?style=social" alt="GitHub Stars" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit/network/members"><img src="https://img.shields.io/github/forks/isatiso/node-tarpit?style=social" alt="GitHub Forks" /></a>
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
```

Install TypeScript and development dependencies:

```bash
# Install TypeScript globally or as dev dependency
npm install -D typescript ts-node @types/node

# Initialize TypeScript configuration
npx tsc --init
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
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Install Tarpit HTTP module (includes core dependencies):

```bash
npm install @tarpit/http @tarpit/judge @tarpit/config reflect-metadata
```

:::note Why reflect-metadata?
`reflect-metadata` is required for TypeScript decorator metadata reflection. Tarpit's dependency injection system uses this to automatically detect constructor parameter types and enable type-safe dependency resolution.
:::

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

This example demonstrates:
- **Basic Routing**: Using `@TpRouter` to define route prefixes
- **HTTP Methods**: Using `@Get` decorator for GET endpoints
- **Path Parameters**: Extracting and validating URL parameters
- **JSON Responses**: Returning structured data from endpoints

### Service Injection Example

:::info Complete Example
[`example/basic/service-injection.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/basic/service-injection.ts)
:::

For more complex applications, you'll want to organize your code using dependency injection. Here's how to create injectable services with HTTP routing:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

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
    
    find_user(id: string) {
        console.log(`Finding user with ID: ${id}`)
        return { id, name: `User ${id}`, email: `user${id}@example.com` }
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
    
    get_user(id: string) {
        this.db.connect()
        return this.db.find_user(id)
    }
}

// 3. HTTP Router using injected services
@TpRouter('/api/users')
class UserRouter {
    // 4. Service injection in router
    constructor(private userService: UserService) {}
    
    @Get('')
    async list_users() {
        return { 
            message: 'User list endpoint',
            users: ['Alice', 'Bob', 'Charlie']
        }
    }
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const user_id = args.ensure('id', Jtl.string)
        const user = this.userService.get_user(user_id)
        return user
    }
    
    @Get('hello/:name')
    async greet_user(args: PathArgs<{ name: string }>) {
        const name = args.ensure('name', Jtl.string)
        this.userService.create_user(name)
        return { 
            message: `Hello, ${name}!`,
            user: { name, created: true }
    }
}
}

async function main() {
    // 5. Registration - Register services and router with platform
const config = load_config<TpConfigSchema>({ 
    http: { port: 4100 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
        .import(DatabaseService)
    .import(UserService)
    .import(UserRouter)
    
    await platform.start()
    
    console.log('Server started on http://localhost:4100')
    console.log('Try these endpoints:')
    console.log('  GET  http://localhost:4100/api/users')
    console.log('  GET  http://localhost:4100/api/users/123')
    console.log('  GET  http://localhost:4100/api/users/hello/Alice')
}

main().catch(console.error)
```

Run the example:

```bash
npx ts-node example/basic/service-injection.ts
```

Test the API endpoints:

```bash
# List all users
curl http://localhost:4100/api/users

# Get a specific user
curl http://localhost:4100/api/users/123

# Create and greet a user
curl http://localhost:4100/api/users/hello/Alice
```

This example demonstrates:
- **Service Declaration**: Using `@TpService()` to mark classes as injectable
- **Dependency Injection**: Automatic injection of dependencies through constructor parameters
- **Router Injection**: Injecting services into HTTP routers for API endpoints
- **Service Registration**: Importing services and routers into the platform
- **HTTP Integration**: Combining dependency injection with REST API endpoints
- **Path Parameters**: Extracting and validating URL parameters with type safety

## Next Steps

Ready to dive deeper? Explore our comprehensive documentation:

### Core Framework
- [**Core Concepts**](./core/) - Learn about dependency injection, providers, and the platform
- [**Platform Lifecycle**](./core/platform-lifecycle) - Understanding application startup and shutdown
- [**Dependency Injection**](./core/dependency-injection) - Advanced DI patterns and best practices

### HTTP Server Module
- [**HTTP Server**](./http-server/) - Web APIs, routing, middleware, and authentication
- [**Request Handling**](./http-server/request-handling) - Processing HTTP requests and responses

### Other Modules
- [**RabbitMQ Module**](./rabbitmq-client/) - Message queuing and event-driven architecture
- [**Schedule Module**](./schedule/) - Cron jobs and background tasks
- [**Content Type Module**](./content-type/) - Working with different data formats

:::tip Complete Example Repository
For hands-on learning, check out the [`example/`](https://github.com/isatiso/node-tarpit/tree/main/example) directory with runnable code samples for each module.
:::
