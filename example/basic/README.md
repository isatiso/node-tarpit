# Basic Examples

Basic examples to get started with Tarpit framework fundamentals.

## Prerequisites

- Node.js (v14+)
- TypeScript (v4+)
- Basic understanding of TypeScript decorators

## Setup

```bash
npm install
```

## Examples

### Hello World (`hello-world.ts`)

Simple HTTP server with basic routing.

**Run:**
```bash
npx ts-node hello-world.ts
```

**Test:**
```bash
curl http://localhost:4100/hello
curl http://localhost:4100/user/123
``` 

**What you'll learn:**
- Platform setup and HTTP routing
- Path parameters and JSON responses

### Service Injection (`service-injection.ts`)

Dependency injection with HTTP APIs.

**Run:**
```bash
npx ts-node service-injection.ts
```

**Test:**
```bash
curl http://localhost:4100/api/users
curl http://localhost:4100/api/users/123
curl http://localhost:4100/api/users/hello/Alice
```

**What you'll learn:**
- Service declaration with `@TpService()`
- Dependency injection patterns
- Multi-layer service architecture

## Troubleshooting

**Port in use:**
```bash
lsof -ti:4100 | xargs kill -9
```

**TypeScript issues:**
Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Next Steps

- [Core Examples](../core/) - Advanced dependency injection
- [HTTP Server Examples](../http-server/) - Complex web features
- [Documentation](../../docs/) - Complete framework guide 