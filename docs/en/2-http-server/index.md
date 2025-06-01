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

## What's Next

The HTTP Server documentation covers the following topics:

- **[Routing](1-routing.html)** - URL routing, path parameters, and HTTP methods
- **[Request Handling](2-request-handling.html)** - Parse bodies, headers, and query parameters
- **[Response Handling](3-response-handling.html)** - Send responses, set headers, and handle errors  
- **[Authentication](4-authentication.html)** - Implement authentication and authorization
- **[WebSocket](5-websocket.html)** - Real-time communication with WebSockets
- **[Static Files](6-static-files.html)** - Serve static assets and files
- **[Advanced Features](7-advanced.html)** - Caching, hooks, and middleware

## Examples

All HTTP Server concepts are demonstrated with working examples in the [http-server directory](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/). Each example can be run independently and shows real-world usage patterns.

## Directory

### Core Features
- [**Routing System**](./1-routing.md) - HTTP method decorators, path parameters, and route registration
- [**Request Handling**](./2-request-handling.md) - Request body parsing, validation, and file upload
- [**Response Handling**](./3-response-handling.md) - Response formatting, error handling, and streaming response

### Advanced Features  
- [**Static File Service**](./4-static-files.md) - Static resource service, cache control, and performance optimization
- [**File Manager**](./5-file-manager.md) - File operations, upload and download, and archive compression
- [**Authentication and Authorization**](./6-authentication.md) - Authentication, permission control, and session management
- [**Caching System**](./7-caching.md) - HTTP caching, proxy caching, and performance optimization

### Extended Features
- [**WebSocket Support**](./8-websocket.md) - Real-time communication and connection management
- [**Middleware System**](./9-middleware.md) - Request hooks, response handling, and global middleware
- [**CORS Configuration**](./10-cors.md) - Cross-origin resource sharing and security policies

## Configuration Options

### HTTP Server Configuration

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
}
```

### Static File Configuration

```typescript
interface HttpStaticConfig {
    scope?: string                 // Scope
    root?: string                 // Root directory
    index?: string[]              // Default files
    extensions?: `.${string}`[]   // Supported extensions
    cache_size?: number           // Cache size
    dotfile?: 'allow' | 'ignore' | 'deny'  // Hidden file handling
    vary?: string[] | '*'         // Vary header
    cache_control?: ResponseCacheControl    // Cache control
}
```

### File Manager Configuration

```typescript
interface HttpFileManagerConfig {
    root?: string                 // Data root directory
    download_limit?: number       // Download size limit
}
```

### CORS Configuration

```typescript
interface CorsConfig {
    allow_origin: string          // Allowed sources
    allow_headers: string         // Allowed headers
    allow_methods: string         // Allowed methods
    max_age: number              // Preflight request cache time
}
```

## Working Examples

View complete examples in the `example/http-server/` directory:

- [Basic Routing](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/basic-routing.ts) - HTTP methods and basic routing
- [Path Parameters](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/path-parameters.ts) - Dynamic routing and parameter handling
- [Request Parsing](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/request-parsing.ts) - Request body parsing and validation
- [Form Handling](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/form-handling.ts) - Form data and file upload
- [Static File Service](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/static-files.ts) - Static resource service
- [File Manager](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/file-manager.ts) - File operations and management
- [Authentication](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/authentication.ts) - User authentication and authorization

## Next Steps

1. Start with the [Routing System](./1-routing.md) to learn about the core concepts of the HTTP server
2. Explore the [Request Handling](./2-request-handling.md) to understand how to handle different types of requests
3. Dive into the [Static File Service](./4-static-files.md) and [File Manager](./5-file-manager.md) features
4. Deepen your understanding of the [Authentication](./6-authentication.md) and [Caching System](./7-caching.md) advanced features
