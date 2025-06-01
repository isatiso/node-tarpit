---
layout: home
title: Introduction
nav_order: 1
---

![](/assets/tarpit-full.svg){:.full-size-logo}
{:.text-center }

🥦 Simple but Awesome [TypeScript](https://www.typescriptlang.org/) DI Framework for Node.js 🥦
{:.text-center }

[![build:?][build badge]][build link]{:.noop}
[![coverage:?][coverage badge]][coverage link]{:.noop}
[![license:mit][license badge]][license link]{:.noop}
[![downloads:?][downloads badge]][downloads link]{:.noop}
[![node:?][node badge]][node link]{:.noop}
{:.text-center}

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

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

**Services** (`@TpService`): Business logic components that can be injected into other services or controllers.

**Modules** (`@TpModule`): Organizational units that group related services and define their scope.

**Routers** (`@TpRouter`): HTTP endpoint controllers that handle web requests (when using HTTP module).

**Platform**: The main application container that manages the entire dependency graph.

## Quick Start

### Prerequisites

Before getting started, ensure you have:

- **Node.js** (v14.0.0 or higher)
- **TypeScript** (v4.0 or higher)
- **npm** or **yarn** package manager

> 💡 **Try the Examples**: You can find complete working examples in the [`example/`](https://github.com/isatiso/node-tarpit/tree/main/example) directory of this repository, organized by module.

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

> 📁 **Complete example**: [`example/basic/hello-world.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/basic/hello-world.ts)

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

> 📁 **Complete example**: [`example/http-server/service-injection.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/service-injection.ts)

Create reusable services with dependency injection:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, JsonBody, PathArgs, TpHttpFinish } from '@tarpit/http'
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
        if (!user) {
            throw new TpHttpFinish({ status: 404, code: '404', msg: 'User not found' })
        }
        return user
    }
    
    @Post('create')
    async create_user(body: JsonBody<{ name: string, email: string }>) {
        const name = body.ensure('name', Jtl.string)
        const email = body.ensure('email', Jtl.string)
        const user_data = { name, email }
        return this.user_service.create_user(user_data)
    }
}

// Application setup
const config = load_config<TpConfigSchema>({ 
    http: { port: 4100 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(UserService)      // Register service
    .import(UserRouter)       // Register router
    .start()
```

Test the API endpoints:

```bash
# List users (initially empty)
curl http://localhost:4100/api/users/list

# Create a new user
curl -X POST http://localhost:4100/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# List users again (should show the created user)
curl http://localhost:4100/api/users/list

# Get specific user by ID
curl http://localhost:4100/api/users/{user_id}
```

### Module Organization Example

Organize your application with modules:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpModule } from '@tarpit/core'
import { HttpServerModule } from '@tarpit/http'

@TpModule({
    providers: [UserService]
})
class UserModule {}

@TpModule({
    imports: [UserModule],
    providers: [UserRouter]
})
class ApiModule {}

// Application setup
const config = load_config<TpConfigSchema>({ 
    http: { port: 4100 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(ApiModule)
    .start()
```

## Built-in Modules

Tarpit comes with several production-ready modules:

### HTTP Server Module
- RESTful API development
- WebSocket support
- Static file serving
- Request/response handling
- Authentication and authorization

### Schedule Module
- Cron-style job scheduling
- Background task execution
- Interval-based operations

### RabbitMQ Module
- Message queue integration
- Producer/consumer patterns
- Event-driven architecture

### Content Type Module
- Request body parsing
- Response formatting
- MIME type handling

## Why Choose Tarpit?

### Developer Experience
- **IntelliSense Support**: Full TypeScript integration with autocomplete and type checking
- **Decorator Syntax**: Clean, readable code with minimal boilerplate
- **Development Tools**: Works seamlessly with ts-node for development

### Production Ready
- **Performance**: Optimized for high-throughput applications
- **Scalability**: Modular architecture supports large applications
- **Reliability**: Comprehensive error handling and logging

### Testing
- **Unit Testing**: Easy to mock and test individual components
- **Integration Testing**: Built-in support for testing entire modules
- **Dependency Injection**: Simplified test setup with injectable mocks

## Next Steps

Ready to dive deeper? Explore these topics:

- **[Core Concepts](/en/1-core/)** - Learn about DI mechanisms, services, and modules
- **[HTTP Server](/en/2-http-server/)** - Build REST APIs and web applications  
- **[RabbitMQ Client](/en/3-rabbitmq-client/)** - Implement message-driven architecture
- **[Schedule Module](/en/4-schedule/)** - Create background jobs and cron tasks
- **[Content Types](/en/5-content-type/)** - Handle request/response data transformation

## Community & Support

- **GitHub**: [isatiso/node-tarpit](https://github.com/isatiso/node-tarpit)
- **Documentation**: [tarpit.cc](https://www.tarpit.cc)
- **Issues**: Report bugs and request features on GitHub

[build badge]: https://img.shields.io/github/workflow/status/isatiso/node-tarpit/Build%20and%20Test?style=flat-square
[build link]: https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml
[coverage badge]: https://img.shields.io/codecov/c/github/isatiso/node-tarpit?style=flat-square
[coverage link]: https://app.codecov.io/gh/isatiso/node-tarpit
[license badge]: https://img.shields.io/npm/l/@tarpit/core?style=flat-square
[license link]: https://github.com/isatiso/node-tarpit/blob/main/LICENSE
[downloads badge]: https://img.shields.io/npm/dm/@tarpit/core?style=flat-square
[downloads link]: https://www.npmjs.com/package/@tarpit/core
[node badge]: https://img.shields.io/node/v-lts/@tarpit/core?style=flat-square
[node link]: https://www.npmjs.com/package/@tarpit/core
