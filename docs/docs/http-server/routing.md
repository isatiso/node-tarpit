---
sidebar_position: 2
---

# Routing

:::info Working Examples
See [basic-routing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/basic-routing.ts) and [path-parameters.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/path-parameters.ts) for complete working examples.
:::

Routing determines how an application responds to client requests to specific endpoints. In Tarpit, routing is defined using decorators on router classes and their methods, making URL handling declarative and type-safe.

## Basic Routing

### TpRouter Decorator

The `@TpRouter()` decorator marks a class as an HTTP router and defines the base path:

:::info Complete Example
[basic-routing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/basic-routing.ts)
:::

```typescript
import { TpRouter, Get, Post, Put, Delete } from '@tarpit/http'

@TpRouter('/api/users')
class UserRouter {
    @Get('list')
    async list_users() {
        return { users: [] }
    }
    
    @Post('create')
    async create_user() {
        return { id: 1, name: 'New User' }
    }
}
```

**URL Structure**: `{router_path}/{method_path}`

- Router path: `/api/users`
- Method path: `list` 
- Final URL: `/api/users/list`

### HTTP Method Decorators

Tarpit supports all standard HTTP methods:

:::info Complete Example
[basic-routing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/basic-routing.ts)
:::

```typescript
@TpRouter('/api/resources')
class ResourceRouter {
    @Get('list')           // GET /api/resources/list
    async get_resources() {
        return { method: 'GET', resources: [] }
    }

    @Post('create')        // POST /api/resources/create
    async create_resource() {
        return { method: 'POST', id: 1 }
    }

    @Put('update')         // PUT /api/resources/update
    async update_resource() {
        return { method: 'PUT', updated: true }
    }

    @Delete('remove')      // DELETE /api/resources/remove
    async delete_resource() {
        return { method: 'DELETE', deleted: true }
    }
}
```

### Default Method Names

If no path is specified, the method name is used:

```typescript
@TpRouter('/api/users')
class UserRouter {
    @Get()           // Uses method name: GET /api/users/list
    async list() {
        return []
    }
    
    @Post()          // Uses method name: POST /api/users/create
    async create() {
        return { id: 1 }
    }
}
```

## Path Parameters

### Basic Path Parameters

Use `:parameter` syntax for dynamic URL segments:

:::info Complete Example
[path-parameters.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/path-parameters.ts)
:::

```typescript
import { PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        return { id, name: `User ${id}` }
    }
    
    @Put(':id/profile')
    async update_profile(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        return { id, updated: true }
    }
}
```

### Multiple Path Parameters

Handle multiple parameters in a single route:

:::info Complete Example
[path-parameters.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/path-parameters.ts)
:::

```typescript
@TpRouter('/api/teams')
class TeamRouter {
    @Get(':team_id/members/:member_id')
    async get_team_member(args: PathArgs<{ team_id: string, member_id: string }>) {
        const team_id = args.ensure('team_id', Jtl.string)
        const member_id = args.ensure('member_id', Jtl.string)
        
        return {
            team_id,
            member_id,
            name: `Member ${member_id} of Team ${team_id}`
        }
    }
}
```

### Type Validation

Use `@tarpit/judge` for runtime type validation:

```typescript
import { Jtl } from '@tarpit/judge'

@TpRouter('/api/posts')
class PostRouter {
    @Get(':id')
    async get_post(args: PathArgs<{ id: string }>) {
        // Validate and convert to number
        const id = args.ensure('id', Jtl.integer.min(1))
        return { id, title: `Post ${id}` }
    }
}
```

## Query Parameters

### Basic Query Parameters

Access query parameters using `TpRequest`:

```typescript
import { TpRequest } from '@tarpit/http'

@TpRouter('/api/posts')
class PostRouter {
    @Get('search')
    async search_posts(req: TpRequest) {
        const query = req.query.get('q') || ''
        const page = parseInt(req.query.get('page') || '1')
        const limit = parseInt(req.query.get('limit') || '10')
        
        return {
            query,
            page,
            limit,
            results: []
        }
    }
}
```

### Query Parameter Validation

Use validation for type-safe query parameters:

```typescript
import { QueryParam } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

@TpRouter('/api/posts')
class PostRouter {
    @Get('search')
    async search_posts(
        @QueryParam('q') query: string = '',
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 10
    ) {
        return {
            query,
            page: Math.max(1, page),
            limit: Math.min(100, Math.max(1, limit)),
            results: []
        }
    }
}
```

## Route Organization

### Multiple Routers

Organize your application with multiple router classes:

```typescript
// User management
@TpRouter('/api/users')
class UserRouter {
    @Get('list')
    async list() { /* ... */ }
    
    @Post('create')
    async create() { /* ... */ }
}

// Post management
@TpRouter('/api/posts')
class PostRouter {
    @Get('list')
    async list() { /* ... */ }
    
    @Post('create')
    async create() { /* ... */ }
}

// Register both routers
const platform = new Platform(config)
    .import(HttpServerModule)
    .import(UserRouter)
    .import(PostRouter)
    .start()
```

### Nested Routing

Create logical groupings with nested paths:

```typescript
@TpRouter('/api/admin')
class AdminRouter {
    @Get('dashboard')
    async dashboard() {
        return { admin: true, stats: {} }
    }
}

@TpRouter('/api/admin/users')
class AdminUserRouter {
    @Get('list')
    async list_all_users() {
        return { all_users: [] }
    }
    
    @Delete(':id')
    async delete_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        return { deleted: id }
    }
}
```

## Advanced Routing

### Wildcard Routes

Handle catch-all routes with wildcards:

```typescript
@TpRouter('/api')
class ApiRouter {
    @Get('*')
    async catch_all(req: TpRequest) {
        return {
            message: 'Route not found',
            path: req.url.pathname
        }
    }
}
```

### Route Priority

Routes are matched in registration order. More specific routes should be registered first:

```typescript
@TpRouter('/api/users')
class UserRouter {
    @Get('me')          // More specific - register first
    async get_current_user() {
        return { current: true }
    }
    
    @Get(':id')         // Less specific - register after
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        return { id }
    }
}
```

### Optional Parameters

Use optional parameters with default values:

```typescript
@TpRouter('/api/posts')
class PostRouter {
    @Get('list/:category?')
    async list_posts(args: PathArgs<{ category?: string }>) {
        const category = args.get('category') || 'all'
        return {
            category,
            posts: []
        }
    }
}
```

## Router Dependencies

### Service Injection

Inject services into routers like any Tarpit service:

```typescript
@TpService()
class UserService {
    find_all() {
        return [{ id: 1, name: 'John' }]
    }
    
    find_by_id(id: string) {
        return { id, name: 'John' }
    }
}

@TpRouter('/api/users')
class UserRouter {
    constructor(private user_service: UserService) {}
    
    @Get('list')
    async list() {
        return this.user_service.find_all()
    }
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        return this.user_service.find_by_id(id)
    }
}
```

### Configuration Access

Access application configuration in routers:

```typescript
import { TpConfigData } from '@tarpit/core'

@TpRouter('/api/info')
class InfoRouter {
    constructor(private config: TpConfigData) {}
    
    @Get('version')
    async get_version() {
        return {
            version: this.config.version || '1.0.0',
            environment: this.config.env || 'development'
        }
    }
}
```

## Best Practices

### 1. Use Clear Route Names

```typescript
// ✅ Good - Clear, descriptive routes
@TpRouter('/api/users')
class UserRouter {
    @Get('list')
    async list_users() {}
    
    @Get(':id/profile')
    async get_user_profile() {}
    
    @Post('create')
    async create_user() {}
}

// ❌ Avoid - Vague or inconsistent naming
@TpRouter('/api/u')
class UserRouter {
    @Get('get')
    async get() {}
    
    @Get('data')
    async stuff() {}
}
```

### 2. Validate Path Parameters

```typescript
// ✅ Good - Always validate path parameters
@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.integer.positive())
        return this.user_service.find_by_id(id)
    }
}

// ❌ Avoid - Using parameters without validation
@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.get('id') // No validation
        return this.user_service.find_by_id(id)
    }
}
```

### 3. Organize by Feature

```typescript
// ✅ Good - Feature-based organization
@TpRouter('/api/auth')
class AuthRouter {
    @Post('login')
    async login() {}
    
    @Post('logout')
    async logout() {}
    
    @Post('refresh')
    async refresh_token() {}
}

@TpRouter('/api/users')
class UserRouter {
    @Get('profile')
    async get_profile() {}
    
    @Put('profile')
    async update_profile() {}
}
```

### 4. Use TypeScript Types

```typescript
// ✅ Good - Type-safe parameter handling
interface UserParams {
    id: string
}

interface TeamMemberParams {
    team_id: string
    member_id: string
}

@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<UserParams>) {
        const id = args.ensure('id', Jtl.string)
        return { id }
    }
    
    @Get(':id/teams/:team_id')
    async get_user_team(args: PathArgs<UserParams & { team_id: string }>) {
        const id = args.ensure('id', Jtl.string)
        const team_id = args.ensure('team_id', Jtl.string)
        return { id, team_id }
    }
}
```

## Next Steps

- [**Request Handling**](./request-handling) - Learn about request body parsing and validation
- [**Response Handling**](./response-handling) - Understand response formatting and error handling
- [**Static Files**](./static-files) - Serve static assets efficiently 