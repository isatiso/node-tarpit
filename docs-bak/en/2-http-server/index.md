---
layout: default
title: HTTP Server
nav_order: 3
has_children: true
---

# HTTP Server
{:.no_toc}

> **💡 Working Examples**: See the [http-server examples](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/) for complete working examples.

Tarpit's HTTP module provides a comprehensive web server framework with routing, request handling, static file serving, file management, authentication, caching, and other enterprise-grade features.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Overview

The HTTP module includes:

- **Declarative Routing** - Use decorators to define routes and HTTP methods
- **Dependency Injection** - Inject services into your controllers automatically
- **Type-Safe Handlers** - Full TypeScript support for request/response handling
- **Request Parsing** - Built-in support for JSON, form data, and raw bodies
- **Authentication** - Flexible authentication system
- **WebSocket Support** - Real-time communication capabilities
- **Static File Serving** - Serve static assets efficiently

## Quick Start

Here's a minimal HTTP server example:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get } from '@tarpit/http'

@TpRouter('/api')
class ApiRouter {
    @Get('hello')
    async hello() {
        return { message: 'Hello, World!' }
    }
}

const config = load_config<TpConfigSchema>({ 
    http: { port: 3000 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(ApiRouter)
    .start()
```

## Key Concepts

### TpRouter

`@TpRouter` marks a class as an HTTP router that handles requests for a specific path prefix:

```typescript
@TpRouter('/users') // All routes in this class start with /users
class UserRouter {
    @Get('list')    // Handles GET /users/list
    async list() {
        return []
    }
    
    @Post('create') // Handles POST /users/create
    async create() {
        return { id: 1 }
    }
}
```

### HTTP Method Decorators

Use method decorators to define which HTTP methods a handler responds to:

- `@Get()` - Handle GET requests
- `@Post()` - Handle POST requests  
- `@Put()` - Handle PUT requests
- `@Delete()` - Handle DELETE requests

### Dependency Injection

HTTP routers can inject services just like any other Tarpit service:

```typescript
@TpService()
class UserService {
    find_all() {
        return []
    }
}

@TpRouter('/users')
class UserRouter {
    constructor(private user_service: UserService) {}
    
    @Get('list')
    async list() {
        return this.user_service.find_all()
    }
}
```

## Configuration

Configure the HTTP server in your application config:

```typescript
const config = load_config<TpConfigSchema>({
    http: {
        port: 3000,                    // Server port
        expose_error: false,           // Expose error details in responses
        cors: {                        // CORS configuration
            allow_origin: '*',
            allow_headers: 'Content-Type',
            allow_methods: 'GET,POST,PUT,DELETE',
            max_age: 86400
        },
        body: {
            max_length: 1048576        // Maximum request body size (1MB)
        }
    }
})
```

### Configuration Options

```typescript
interface HttpConfig {
    port: number                    // Server port
    proxy?: ProxyConfig            // Proxy configuration
    expose_error?: boolean         // Whether to expose error details
    server?: {
        keepalive_timeout?: number  // Keep-alive timeout
        terminate_timeout?: number  // Terminate timeout
    }
    body?: {
        max_length?: number        // Maximum request body size
    }
    cors?: {                       // CORS configuration
        allow_origin: string       // Allowed origins
        allow_headers: string      // Allowed headers
        allow_methods: string      // Allowed methods
        max_age: number           // Preflight cache time
    }
}
```

## Next Steps

### Core Features
- **[Routing](1-routing.html)** - HTTP method decorators, path parameters, and route registration
- **[Request Handling](2-request-handling.html)** - Request body parsing, validation, and file upload
- **[Response Handling](3-response-handling.html)** - Response formatting, error handling, and streaming
- **[Static File Service](4-static-files.html)** - Static resource serving and cache control

Start with [Routing](1-routing.html) to understand the fundamentals, then explore the other features based on your application needs.
