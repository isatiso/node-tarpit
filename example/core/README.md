# Core Concepts Examples

This directory contains examples demonstrating the core concepts of the Tarpit framework, including dependency injection, decorators, providers, and platform lifecycle management.

## Examples Overview

### 1. Dependency Injection Basic (`dependency-injection-basic.ts`)

**Purpose**: Demonstrates the fundamental dependency injection workflow.

**Key Concepts**:
- Service declaration with `@TpService()`
- Constructor injection
- Service registration with Platform
- Service resolution and usage

**Run**: `npx ts-node dependency-injection-basic.ts`

### 2. Dependency Resolution (`dependency-resolution.ts`)

**Purpose**: Shows how complex dependency chains are resolved and singleton behavior.

**Key Concepts**:
- Multi-level dependency chains
- Singleton service instances
- Shared dependencies across services

**Run**: `npx ts-node dependency-resolution.ts`

### 3. Injection Tokens (`injection-tokens.ts`)

**Purpose**: Demonstrates different types of injection tokens and their usage.

**Key Concepts**:
- Type-based injection (implicit tokens)
- Token-based injection (explicit tokens)
- Symbol tokens for non-class dependencies
- Custom token registration

**Run**: `npx ts-node injection-tokens.ts`

### 4. Best Practices (`best-practices.ts`)

**Purpose**: Shows dependency injection best practices and common patterns.

**Key Concepts**:
- Interface abstraction with dependency injection
- Optional dependencies with `@Optional()`
- Avoiding circular dependencies
- Constructor injection vs manual creation

**Run**: `npx ts-node best-practices.ts`

### 5. Decorators (`decorators.ts`)

**Purpose**: Demonstrates various decorators and their usage patterns.

**Key Concepts**:
- `@TpService()` for service marking
- `@TpModule()` for grouping services
- `@Inject()` for token-based injection
- `@Optional()` for optional dependencies
- `@OnTerminate()` for cleanup hooks

**Run**: `npx ts-node decorators.ts`

### 6. Providers (`providers.ts`)

**Purpose**: Shows different provider types and advanced dependency configuration.

**Key Concepts**:
- ClassProvider for conditional implementations
- FactoryProvider for dynamic service creation
- ValueProvider for simple values
- Interface-based dependency injection

**Run**: `npx ts-node providers.ts`

### 7. Platform Lifecycle (`platform-lifecycle.ts`)

**Purpose**: Demonstrates platform lifecycle management and error handling.

**Key Concepts**:
- Platform creation and startup
- Service instantiation order
- Lifecycle hooks with `@OnTerminate()`
- Graceful shutdown
- Error handling for missing dependencies

**Run**: `npx ts-node platform-lifecycle.ts`

## Running All Examples

To run all examples in sequence:

```bash
# Basic dependency injection
npx ts-node dependency-injection-basic.ts

# Dependency resolution and singletons
npx ts-node dependency-resolution.ts

# Injection tokens usage
npx ts-node injection-tokens.ts

# Best practices demonstration
npx ts-node best-practices.ts

# Decorator usage patterns
npx ts-node decorators.ts

# Provider types and patterns
npx ts-node providers.ts

# Platform lifecycle management
npx ts-node platform-lifecycle.ts
```

## Key Learning Points

1. **Dependency Injection**: Services are automatically injected based on TypeScript types
2. **Singleton Pattern**: All services are singletons by default
3. **Injection Tokens**: Use classes or symbols as tokens for dependency resolution
4. **Best Practices**: Use interfaces, avoid circular dependencies, prefer constructor injection
5. **Lifecycle Management**: Use `@OnTerminate()` for cleanup operations
6. **Flexible Configuration**: Multiple provider types for different use cases
7. **Type Safety**: Full TypeScript support with compile-time checking

## Next Steps

- Explore [HTTP Server Examples](../http-server/) for web application patterns
- See [Basic Examples](../basic/) for simple getting-started code
- Check the [Core Concepts Documentation](https://github.com/isatiso/node-tarpit/blob/main/docs-temp/en/1-core/) for detailed explanations 