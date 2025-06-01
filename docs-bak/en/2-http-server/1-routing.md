---
layout: default
title: Routing
nav_order: 1
parent: HTTP Server
---

# Routing
{:.no_toc}

> **💡 Working Examples**: See [basic-routing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/basic-routing.ts) and [path-parameters.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/path-parameters.ts) for complete working examples.

Routing determines how an application responds to client requests to specific endpoints. In Tarpit, routing is defined using decorators on router classes and their methods, making URL handling declarative and type-safe.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Basic Routing

### TpRouter Decorator

The `@TpRouter()` decorator marks a class as an HTTP router and defines the base path:

> **📁 Example**: [basic-routing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/basic-routing.ts)

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

> **📁 Example**: [basic-routing.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/basic-routing.ts)

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

> **📁 Example**: [path-parameters.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/path-parameters.ts)

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

> **📁 Example**: [path-parameters.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/path-parameters.ts)

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

Validate query parameters with proper error handling:

```typescript
@TpRouter('/api/users')
class UserRouter {
    @Get('list')
    async list_users(req: TpRequest) {
        const page_str = req.query.get('page')
        const limit_str = req.query.get('limit')
        
        // Validate with defaults
        const page = page_str ? Math.max(1, parseInt(page_str)) : 1
        const limit = limit_str ? Math.min(100, Math.max(1, parseInt(limit_str))) : 10
        
        return {
            page,
            limit,
            total: 0,
            users: []
        }
    }
}
```

## Route Registration

### Module-based Registration

Register routers through modules for better organization:

```typescript
import { TpModule } from '@tarpit/core'
import { HttpServerModule } from '@tarpit/http'

@TpModule({
    imports: [HttpServerModule],
    providers: [UserRouter, PostRouter, TeamRouter]
})
class ApiModule {}

const platform = new Platform(config)
    .import(ApiModule)
    .start()
```

### Direct Registration

Register individual routers directly:

```typescript
const platform = new Platform(config)
    .import(HttpServerModule)
    .import(UserRouter)
    .import(PostRouter)
    .start()
```

## Advanced Routing

### Nested Routes

Create hierarchical URL structures:

```typescript
@TpRouter('/api/v1')
class V1Router {
    @Get('status')
    async get_status() {
        return { version: 'v1', status: 'ok' }
    }
}

@TpRouter('/api/v2')
class V2Router {
    @Get('status')
    async get_status() {
        return { version: 'v2', status: 'ok', features: ['new-auth'] }
    }
}
```

### Route Patterns

Use various pattern matching for flexible routing:

```typescript
@TpRouter('/api/files')
class FileRouter {
    // Static routes
    @Get('list')
    async list_files() {
        return []
    }
    
    // Parameter routes
    @Get(':id')
    async get_file(args: PathArgs<{ id: string }>) {
        return { id: args.ensure('id', Jtl.string) }
    }
    
    // Nested parameters
    @Get(':folder/:filename')
    async get_file_in_folder(args: PathArgs<{ folder: string, filename: string }>) {
        return {
            folder: args.ensure('folder', Jtl.string),
            filename: args.ensure('filename', Jtl.string)
        }
    }
}
```

### Optional Parameters

Handle optional route segments:

```typescript
@TpRouter('/api/docs')
class DocsRouter {
    // Handle both /api/docs/page and /api/docs/page/section
    @Get('page/:section?')
    async get_docs(args: PathArgs<{ section?: string }>) {
        const section = args.get('section') // Returns undefined if not present
        
        if (section) {
            return { page: 'docs', section }
        } else {
            return { page: 'docs', sections: ['intro', 'api', 'examples'] }
        }
    }
}
```

## Route Conflicts and Resolution

### Resolution Order

Routes are matched in registration order. More specific routes should be registered first:

```typescript
@TpRouter('/api/users')
class UserRouter {
    // Specific route - register first
    @Get('profile')
    async get_current_user_profile() {
        return { profile: 'current user' }
    }
    
    // Parameter route - register after specific routes
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        return { id: args.ensure('id', Jtl.string) }
    }
}
```

### Avoiding Conflicts

Design routes to avoid ambiguity:

```typescript
// ✅ Good - Clear distinction
@TpRouter('/api/users')
class UserRouter {
    @Get('search')        // /api/users/search
    async search() {}
    
    @Get(':id')          // /api/users/123
    async get_by_id() {}
    
    @Get(':id/posts')    // /api/users/123/posts
    async get_user_posts() {}
}

// ❌ Avoid - Potential conflicts
@TpRouter('/api/users')
class ConflictingRouter {
    @Get(':action')      // Could conflict with specific routes
    async handle_action() {}
    
    @Get('search')       // This might not be reachable
    async search() {}
}
```

## Error Handling

### Route Not Found

Tarpit automatically returns 404 for unmatched routes. You can customize this behavior:

```typescript
import { TpHttpFinish } from '@tarpit/http'

@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        
        // Simulate user lookup
        const user = await this.find_user(id)
        if (!user) {
            throw new TpHttpFinish({ 
                status: 404, 
                code: 'USER_NOT_FOUND',
                msg: `User with id ${id} not found` 
            })
        }
        
        return user
    }
}
```

### Parameter Validation Errors

Handle invalid path parameters gracefully:

```typescript
@TpRouter('/api/posts')
class PostRouter {
    @Get(':id')
    async get_post(args: PathArgs<{ id: string }>) {
        try {
            const id = args.ensure('id', Jtl.integer.min(1))
            return { id, title: `Post ${id}` }
        } catch (error) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_POST_ID',
                msg: 'Post ID must be a positive integer'
            })
        }
    }
}
```

## Best Practices

### 1. Use Consistent Naming

```typescript
// ✅ Good - Consistent and descriptive
@TpRouter('/api/users')
class UserRouter {
    @Get('list')         // GET /api/users/list
    @Post('create')      // POST /api/users/create
    @Get(':id')         // GET /api/users/:id
    @Put(':id')         // PUT /api/users/:id
    @Delete(':id')      // DELETE /api/users/:id
}

// ❌ Avoid - Inconsistent naming
@TpRouter('/api/users')
class InconsistentRouter {
    @Get('getAll')      // Inconsistent with REST conventions
    @Post('new')        // Should be 'create'
    @Get(':id/show')    // Redundant 'show'
}
```

### 2. Group Related Routes

```typescript
// ✅ Good - Logical grouping
@TpRouter('/api/users')
class UserRouter {
    // User CRUD operations
}

@TpRouter('/api/posts')
class PostRouter {
    // Post CRUD operations
}

@TpRouter('/api/auth')
class AuthRouter {
    // Authentication operations
}
```

### 3. Use Descriptive Parameter Names

```typescript
// ✅ Good - Clear parameter names
@Get(':user_id/posts/:post_id/comments/:comment_id')
async get_comment(args: PathArgs<{ user_id: string, post_id: string, comment_id: string }>) {
    // Clear what each parameter represents
}

// ❌ Avoid - Generic parameter names
@Get(':id1/:id2/:id3')
async get_something(args: PathArgs<{ id1: string, id2: string, id3: string }>) {
    // Unclear what each parameter represents
}
```

### 4. Validate Input Early

```typescript
@TpRouter('/api/users')
class UserRouter {
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        // Validate immediately
        const id = args.ensure('id', Jtl.integer.min(1))
        
        // Continue with business logic
        return await this.user_service.find_by_id(id)
    }
}
```

## Next Steps

- Learn about [Request Handling](2-request-handling.html) for parsing request bodies and headers
- Explore [Response Handling](3-response-handling.html) for sending responses and handling errors
- See [Authentication](4-authentication.html) for securing your routes
