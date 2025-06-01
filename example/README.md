# Tarpit Framework Examples

This directory contains working examples that demonstrate the core features of the Tarpit framework, organized by module.

## Prerequisites

- Node.js (v14.0.0 or higher)
- TypeScript (v4.0 or higher)

## Structure

The examples are organized into the following categories:

- **`basic/`** - Core framework concepts and basic usage
- **`http-server/`** - HTTP server module examples
- **`rabbitmq/`** - RabbitMQ client module examples
- **`schedule/`** - Schedule module examples
- **`content-type/`** - Content type module examples

## Setup

Each example directory contains its own `package.json` and `tsconfig.json`. Navigate to the specific example directory and install dependencies:

```bash
cd basic  # or http-server, rabbitmq, etc.
npm install
```

## Examples

### Basic Examples (`basic/`)

#### Hello World (`hello-world.ts`)

A basic HTTP server example demonstrating:
- Simple routing with `@TpRouter`
- GET endpoints with `@Get`
- Path parameters
- Basic response handling

**Run:**
```bash
cd basic
npx ts-node hello-world.ts
```

**Test:**
```bash
# Basic hello endpoint
curl http://localhost:4100/hello

# Parameterized endpoint
curl http://localhost:4100/user/123
```

### HTTP Server Examples (`http-server/`)

#### Service Injection (`service-injection.ts`)

A more advanced example demonstrating:
- Dependency injection with `@TpService`
- HTTP controllers with injected services
- JSON body parsing
- CRUD operations
- Error handling

**Run:**
```bash
cd http-server
npx ts-node service-injection.ts
```

**Test:**
```bash
# List users (initially empty)
curl http://localhost:4103/api/users/list

# Create a new user
curl -X POST http://localhost:4103/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# List users again (should show the created user)
curl http://localhost:4103/api/users/list

# Get specific user by ID (replace {user_id} with actual ID from create response)
curl http://localhost:4103/api/users/{user_id}
```

### RabbitMQ Examples (`rabbitmq/`)

*Coming soon...*

### Schedule Examples (`schedule/`)

*Coming soon...*

### Content Type Examples (`content-type/`)

*Coming soon...*

## Notes

- Each example uses a different port to avoid conflicts
- Examples are self-contained and can be run independently
- TypeScript configuration is already set up with decorators enabled
- Navigate to the specific example directory before running 