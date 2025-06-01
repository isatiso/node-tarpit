# HTTP Server Examples

This directory contains examples demonstrating the `@tarpit/http` module features.

## Setup

```bash
npm install
```

## Examples

### Service Injection (`service-injection.ts`)

An advanced example demonstrating dependency injection and HTTP API development.

**Features:**
- Dependency injection with `@TpService`
- HTTP controllers with injected services
- JSON body parsing with validation
- CRUD operations
- Error handling with `TpHttpFinish`
- Path parameters

**Run:**
```bash
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

# List users again
curl http://localhost:4103/api/users/list

# Get specific user by ID
curl http://localhost:4103/api/users/{user_id}
``` 