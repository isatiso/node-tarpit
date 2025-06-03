# Core Concepts Examples

This directory contains examples demonstrating the core concepts of the Tarpit framework, including dependency injection, decorators, providers, and platform lifecycle management.

## Examples Overview

### Dependency Injection (`di/` directory)

Contains all dependency injection related examples:

#### 1. Dependency Injection Basic (`di/dependency-injection-basic.ts`)

**Purpose**: Demonstrates the fundamental dependency injection workflow.

**Key Concepts**:
- Service declaration with `@TpService()`
- Constructor injection
- Service registration with Platform
- Service resolution and usage

**Run**: `npx ts-node di/dependency-injection-basic.ts`

#### 2. Dependency Resolution (`di/dependency-resolution.ts`)

**Purpose**: Shows how complex dependency chains are resolved and singleton behavior.

**Key Concepts**:
- Multi-level dependency chains
- Singleton service instances
- Shared dependencies across services

**Run**: `npx ts-node di/dependency-resolution.ts`

#### 3. Type-Based Injection (`di/implicit-injection.ts`)

**Purpose**: Demonstrates implicit injection using TypeScript types as tokens.

**Key Concepts**:
- Automatic type-based dependency resolution
- Class types as injection tokens
- Simple constructor injection without decorators

**Run**: `npx ts-node di/implicit-injection.ts`

#### 4. Token-Based Injection (`di/explicit-injection.ts`)

**Purpose**: Shows explicit injection using custom tokens.

**Key Concepts**:
- `@Inject()` decorator usage
- Symbol tokens for non-class dependencies
- Custom token registration

**Run**: `npx ts-node di/explicit-injection.ts`

#### 5. Reflect Metadata (`di/reflect-metadata-example.ts`)

**Purpose**: Explains how TypeScript metadata reflection works behind the scenes.

**Key Concepts**:
- Constructor parameter type extraction
- Runtime type information
- Why classes work as tokens

**Run**: `npx ts-node di/reflect-metadata-example.ts`

### Other Core Concepts

#### 6. Best Practices (`best-practices.ts`)

**Purpose**: Shows dependency injection best practices and common patterns.

**Key Concepts**:
- Interface abstraction with dependency injection
- Optional dependencies with `@Optional()`
- Avoiding circular dependencies
- Constructor injection vs manual creation

**Run**: `npx ts-node best-practices.ts`

#### 7. Decorators (`decorators.ts`)

**Purpose**: Demonstrates various decorators and their usage patterns.

**Key Concepts**:
- `@TpService()` for service marking
- `@TpModule()` for grouping services
- `@Inject()` for token-based injection
- `@Optional()` for optional dependencies
- `@OnTerminate()` for cleanup hooks

**Run**: `npx ts-node decorators.ts`

#### 8. Providers (`providers.ts`)

**Purpose**: Shows different provider types and advanced dependency configuration.

**Key Concepts**:
- ClassProvider for conditional implementations
- FactoryProvider for dynamic service creation
- ValueProvider for simple values
- Interface-based dependency injection

**Run**: `npx ts-node providers.ts`

#### 9. Platform Lifecycle (`platform-lifecycle.ts`)

**Purpose**: Demonstrates platform lifecycle management and error handling.

**Key Concepts**:
- Platform creation and startup
- Service instantiation order
- Lifecycle hooks with `@OnTerminate()`
- Graceful shutdown
- Error handling for missing dependencies

**Run**: `npx ts-node platform-lifecycle.ts`

#### 10. Quick Start (`quick-start.ts`)

**Purpose**: Simple getting started example.

**Key Concepts**:
- Basic service setup
- Platform initialization
- Simple dependency injection

**Run**: `npx ts-node quick-start.ts`

## Running All Examples

To run all examples in sequence:

```bash
# Dependency Injection Examples
npx ts-node di/dependency-injection-basic.ts
npx ts-node di/dependency-resolution.ts
npx ts-node di/implicit-injection.ts
npx ts-node di/explicit-injection.ts
npx ts-node di/reflect-metadata-example.ts

# Other Core Concepts
npx ts-node best-practices.ts
npx ts-node decorators.ts
npx ts-node providers.ts
npx ts-node platform-lifecycle.ts
npx ts-node quick-start.ts
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