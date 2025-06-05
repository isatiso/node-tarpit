# Tarpit Core Platform Examples

This directory contains comprehensive examples demonstrating the Tarpit Platform's core functionality, lifecycle management, and best practices.

## Examples Overview

### 1. Basic Platform Usage (`platform/01-basic-usage.ts`)
Demonstrates fundamental platform operations:
- Creating a platform with configuration
- Importing services and modules
- Starting and using the platform
- Graceful shutdown procedures
- Service dependency injection

**Run:** `yarn ts-node example/core/platform/01-basic-usage.ts`

### 2. Configuration Management (`platform/02-configuration.ts`)
Shows configuration patterns and access:
- Environment-based configuration
- TpConfigSchema declaration merging
- Service configuration access with TpConfigData
- JSON path configuration retrieval
- Type-safe configuration handling

**Run:** `yarn ts-node example/core/platform/02-configuration.ts`

### 3. Platform Methods (`platform/03-platform-methods.ts`)
Covers all platform method usage:
- `.import()` - Service and provider registration
- `.start()` - Platform initialization
- `.expose()` - Service instance retrieval
- `.terminate()` - Graceful shutdown
- `.inspect_injector()` - Dependency tree debugging

**Run:** `yarn ts-node example/core/platform/03-platform-methods.ts`

### 4. Lifecycle Hooks (`platform/04-lifecycle-hooks.ts`)
Demonstrates lifecycle management:
- `@OnStart` hooks for service initialization
- `@OnTerminate` hooks for cleanup
- Resource management (files, connections, intervals)
- Error handling during lifecycle phases
- Service dependency ordering

**Run:** `yarn ts-node example/core/platform/04-lifecycle-hooks.ts`

### 5. Debugging & Monitoring (`platform/05-debugging-monitoring.ts`)
Shows debugging and monitoring features:
- Provider tree visualization
- Service usage tracking (✓ used, ○ unused)
- Built-in performance monitoring
- Debugging workflow and tips
- Dependency analysis

**Run:** `yarn ts-node example/core/platform/05-debugging-monitoring.ts`

### 6. Best Practices (`platform/06-best-practices.ts`)
Comprehensive best practices demonstration:
- Proper configuration patterns
- Lifecycle hook implementation
- Clear service dependencies
- Resource cleanup and error handling
- Configuration-aware services
- Validation and error handling

**Run:** `yarn ts-node example/core/platform/06-best-practices.ts`

## Providers Examples

The Tarpit framework provides a powerful dependency injection system through providers. The `providers/` directory contains comprehensive examples demonstrating all types of providers.

### Provider Types Overview

Providers are the foundation of Tarpit's dependency injection system. They tell the DI system how to create and supply dependencies when services request them.

### 1. ClassProvider Examples (`providers/01-class-provider.ts`)
Demonstrates the most common provider type - ClassProvider:

- **Shorthand form**: `platform.import(DatabaseService)` 
- **Explicit form**: `{ provide: DatabaseService, useClass: DatabaseService }`
- **Token-based injection**: Using string tokens and interface-based injection
- **Singleton behavior**: Verifying that providers create singleton instances

**Key Features:**
- Interface-based dependency injection
- String token injection with `@Inject()`
- Singleton instance verification

**Run:** `yarn ts-node example/core/providers/01-class-provider.ts`

### 2. ValueProvider Examples (`providers/02-value-provider.ts`)
Shows how to provide pre-existing values and configuration objects:

- Simple string/number values
- Complex configuration objects
- Feature flags and constants
- Direct value injection with `@Inject()`

**Key Features:**
- Configuration object injection
- Feature flag management
- Constants and application metadata
- Type-safe value injection

**Run:** `yarn ts-node example/core/providers/02-value-provider.ts`

### 3. FactoryProvider Examples (`providers/03-factory-provider.ts`)
Demonstrates using factory functions to create dependencies:

- Simple factories (timestamp generation)
- Factories with dependencies (conditional logger)
- Configuration-based conditional creation
- Cache provider selection based on config

**Key Features:**
- Conditional provider creation based on configuration
- Factory functions with `TpConfigData` dependencies
- Memory vs Redis cache selection
- Logger format selection (JSON vs text)

**Note:** Tarpit does not support async factory functions. All factories must be synchronous.

**Run:** `yarn ts-node example/core/providers/03-factory-provider.ts`

### 4. Multi-Provider Examples (`providers/04-multi-provider.ts`)
Shows how to register multiple values for the same token:

- Plugin system with multiple plugins
- Middleware stack with multiple middleware
- Event bus with multiple handlers
- Array injection of all registered providers

**Key Features:**
- Plugin pipeline execution
- Middleware chain processing
- Event pattern matching and dispatching
- Symbol tokens for type safety

**Run:** `yarn ts-node example/core/providers/04-multi-provider.ts`

### Provider Concepts Demonstrated

#### Provider Types
- **ClassProvider**: Creates instances using class constructors
- **ValueProvider**: Provides pre-existing values or objects
- **FactoryProvider**: Uses functions to create dependencies
- **Multi-Provider**: Registers multiple values for the same token

#### Injection Patterns
- Constructor injection with type inference
- String token injection with `@Inject()`
- Interface-based injection
- Array injection for multi-providers

#### Configuration Integration
- Using `TpConfigData` in factory functions
- Environment-based configuration
- Type-safe configuration access with `config.get()`

#### Advanced Patterns
- Conditional provider creation
- Plugin architecture
- Middleware chains
- Event handling systems

### Provider Best Practices Shown

1. **Use descriptive tokens**: Clear Symbol or string tokens
2. **Prefer ClassProviders**: Better type safety than value providers
3. **Keep factories simple**: Focused, testable factory functions
4. **Use interfaces**: Better abstraction and testability

## Prerequisites

Before running the examples, ensure you have:

```bash
# Install dependencies
yarn install

# Build the core module
yarn workspace @tarpit/core build
```

## Running Examples

### Individual Examples
Run any specific example directly:

```bash
# Basic usage
yarn ts-node example/core/platform/01-basic-usage.ts

# Configuration management
yarn ts-node example/core/platform/02-configuration.ts

# Platform methods
yarn ts-node example/core/platform/03-platform-methods.ts

# Lifecycle hooks
yarn ts-node example/core/platform/04-lifecycle-hooks.ts

# Debugging and monitoring
yarn ts-node example/core/platform/05-debugging-monitoring.ts

# Best practices
yarn ts-node example/core/platform/06-best-practices.ts
```

### All Examples
Run all examples in sequence:

```bash
# Run all platform examples
for file in example/core/platform/*.ts; do
  echo "=== Running $file ==="
  yarn ts-node "$file"
  echo ""
done

# Run all provider examples
for file in example/core/providers/*.ts; do
  echo "=== Running $file ==="
  yarn ts-node "$file"
  echo ""
done
```

## Key Concepts Demonstrated

### Platform Creation and Management
- Configuration loading with `load_config()`
- Platform instantiation with `new Platform(config)`
- Service and module imports with `.import()`
- Platform lifecycle with `.start()` and `.terminate()`

### Dependency Injection
- Service registration with `@TpService()` decorator
- Module creation with `@TpModule()` decorator
- Constructor-based dependency injection
- Provider tree visualization and debugging

### Configuration System
- Type-safe configuration with `TpConfigSchema`
- Declaration merging for modular configuration
- Environment variable integration
- Configuration access in services with `TpConfigData`

### Lifecycle Management
- Initialization hooks with `@OnStart()`
- Cleanup hooks with `@OnTerminate()`
- Resource management (connections, files, intervals)
- Graceful error handling during lifecycle phases

### Debugging and Monitoring
- Provider tree inspection with `.inspect_injector()`
- Service usage tracking
- Performance monitoring with built-in timing
- Debugging workflows and best practices

## Example Output Features

Each example includes:
- **Descriptive Console Output** - Clear logging of all operations
- **Step-by-Step Process** - Numbered steps showing progression
- **Success Indicators** - ✓ marks for completed operations
- **Error Handling** - Demonstration of proper error handling
- **Resource Cleanup** - Proper resource management examples
- **Performance Metrics** - Timing information where relevant

## Best Practices Highlighted

1. **Configuration Management**
   - Use environment variables for deployment-specific settings
   - Extend `TpConfigSchema` for type safety
   - Access configuration through `TpConfigData` service

2. **Service Design**
   - Clear constructor dependencies
   - Implement lifecycle hooks for resource management
   - Use proper error handling and cleanup

3. **Platform Usage**
   - Import all services before starting
   - Use `.expose()` to access service instances
   - Always call `.terminate()` for graceful shutdown

4. **Debugging**
   - Use `.inspect_injector()` to verify service registration
   - Monitor provider tree for dependency issues
   - Check startup/shutdown times for performance

## Related Documentation

- [Platform & Lifecycle Documentation](../../docs/docs/core/platform-lifecycle.md)
- [Providers Documentation](../../docs/docs/core/providers.md)
- [Decorators Documentation](../../docs/docs/core/decorators.md)
- [Built-in Services Documentation](../../docs/docs/core/built-in-services.md)
- [Dependency Injection Guide](../../docs/docs/core/dependency-injection.md)

## Support

For questions or issues with these examples:
1. Check the [platform documentation](../../docs/docs/core/platform-lifecycle.md)
2. Review the source code comments in each example
3. Run examples in isolation to understand specific concepts
4. Use the debugging features demonstrated in example 5 