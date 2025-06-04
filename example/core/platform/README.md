# Platform & Lifecycle Examples

This directory contains examples demonstrating the Platform class and application lifecycle management in Tarpit.

## Overview

The Platform class is the heart of every Tarpit application. It manages:
- Dependency injection container
- Module imports and service registration  
- Application lifecycle (startup, running, shutdown)
- Service resolution and access

## Examples

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates fundamental platform operations:
- Creating a platform with configuration
- Importing services
- Starting the platform
- Using services via `.expose()`
- Graceful shutdown

```bash
# Using tsx (recommended)
npx tsx basic-usage.ts

# Or using ts-node
npx ts-node basic-usage.ts
```

**Key concepts:**
- Platform creation and configuration
- Service import patterns
- Service resolution
- Platform lifecycle

### 2. Platform Lifecycle (`platform-lifecycle.ts`) 

Complete lifecycle demonstration with:
- Database, cache, and user services
- Constructor injection
- @OnTerminate cleanup hooks
- Service interdependencies

```bash
# Using tsx (recommended)
npx tsx platform-lifecycle.ts

# Or using ts-node
npx ts-node platform-lifecycle.ts
```

**Key concepts:**
- Service dependencies
- Lifecycle hooks
- Cleanup and resource management
- Service interaction patterns

### 3. Configuration (`configuration.ts`)

Shows configuration management:
- Basic TpConfigSchema usage
- Configuration injection via TpConfigData
- File-based configuration loading

```bash
# Using tsx (recommended)
npx tsx configuration.ts

# Or using ts-node
npx ts-node configuration.ts
```

**Key concepts:**
- Configuration schemas
- TpConfigData service
- Configuration access patterns

### 4. Error Handling (`error-handling.ts`)

Comprehensive error handling examples:
- Startup error recovery
- Runtime error handling
- Graceful shutdown
- Signal handling patterns

```bash
# Using tsx (recommended)
npx tsx error-handling.ts

# Or using ts-node
npx ts-node error-handling.ts
```

**Key concepts:**
- Error boundaries
- Recovery strategies
- Signal handling
- Cleanup on failures

## Running Examples

From the `example/core` directory:

```bash
# Install dependencies first
yarn install

# Run individual examples (tsx - recommended)
npx tsx platform/basic-usage.ts
npx tsx platform/platform-lifecycle.ts
npx tsx platform/configuration.ts
npx tsx platform/error-handling.ts

# Or run with ts-node
npx ts-node platform/basic-usage.ts
npx ts-node platform/platform-lifecycle.ts
npx ts-node platform/configuration.ts
npx ts-node platform/error-handling.ts

# Run all examples at once (tsx)
npx tsx platform/basic-usage.ts && \
npx tsx platform/platform-lifecycle.ts && \
npx tsx platform/configuration.ts && \
npx tsx platform/error-handling.ts

# Run all examples at once (ts-node)
npx ts-node platform/basic-usage.ts && \
npx ts-node platform/platform-lifecycle.ts && \
npx ts-node platform/configuration.ts && \
npx ts-node platform/error-handling.ts
```

## Key Platform Methods

### `.import(service | module | provider)`
Import services, modules, or custom providers into the platform.

### `.start()`
Start the platform and initialize all services. Returns a Promise.

### `.expose(ServiceClass)`
Get an instance of a service from the platform.

### `.terminate()`
Gracefully shutdown the platform and call cleanup hooks.

## Best Practices

1. **Use Configuration Objects**: Always configure your platform with proper configuration objects
2. **Implement Lifecycle Hooks**: Use @OnTerminate for cleanup
3. **Handle Errors Gracefully**: Implement proper error handling for startup and runtime
4. **Resource Management**: Always clean up resources in terminate hooks
5. **Signal Handling**: Handle process signals for graceful shutdown

## Related Documentation

- [Platform & Lifecycle Guide](../../../docs/docs/core/platform-lifecycle.md)
- [Configuration Documentation](../../../docs/docs/core/built-in-services.md#tpconfigdata)
- [Lifecycle Decorators](../../../docs/docs/core/decorators.md#method-decorators-tpunit-based)

## Notes

- All examples use `require.main === module` pattern for direct execution
- Examples demonstrate both successful and error scenarios
- Configuration examples show different loading patterns
- Error handling shows recovery and cleanup strategies
- Use `npx tsx` for faster execution or `npx ts-node` if tsx is not available 