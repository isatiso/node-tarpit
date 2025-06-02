# Basic Examples

This directory contains basic examples demonstrating core Tarpit framework concepts.

## Setup

```bash
npm install
```

## Examples

### Hello World (`hello-world.ts`)

A simple HTTP server demonstrating basic routing and response handling.

**Features:**
- Basic `@TpRouter` usage
- GET endpoints with `@Get`
- Path parameters
- JSON responses

**Run:**
```bash
npx ts-node hello-world.ts
```

**Test:**
```bash
curl http://localhost:4100/hello
curl http://localhost:4100/user/123
``` 