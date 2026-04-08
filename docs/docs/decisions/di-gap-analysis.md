---
sidebar_position: 1
title: DI Gap Analysis
---

# DI Framework Gap Analysis

Comparison with mainstream DI frameworks: NestJS, InversifyJS, tsyringe, Angular DI, awilix.

## Core Features Already Implemented

- ClassProvider (singleton) / ValueProvider (supports `multi: true`) / FactoryProvider (transient)
- Constructor injection + `@Inject` + `@Optional` decorators
- Hierarchical Injector (`@TpRoot` for scope isolation)
- `@TpModule` module system (providers + imports)
- `@OnStart` / `@OnTerminate` lifecycle hooks
- Runtime circular dependency detection
- Decorator inheritance system (`make_decorator` / `make_abstract_decorator` for framework extension)
- Provider override (`Injector.set()` uses `Map.set()` semantics, later registration overrides earlier)
- Startup dependency graph validation (`TpAssembly` / `TpEntry` immediately `create()` on load, triggering full dependency chain resolution)
- Type-safe injection (`Injector.get<T>(token: Constructor<T>)` overload signatures, class tokens auto-infer types)
- Diagnostic tools (`inspect_injector()` tree output, `check_usage` unused provider detection, `detect_cycle_ref` circular dependency detection)

## Gap Assessment Against Mainstream Frameworks

### High Priority (None Required)

| Feature | Decision | Rationale |
|---|---|---|
| ~~Transient Scope~~ | Not needed | ClassProvider is naturally singleton, FactoryProvider is naturally transient. Both needs are covered by choosing the appropriate provider type. For cacheable factory scenarios, wrap in a class and register as ClassProvider. |
| ~~Request Scope~~ | Not needed | HTTP module already creates `TpRequest`/`HttpContext` and other request-level objects manually in request closures, bypassing the Injector, naturally achieving request-level lifecycle. For deep service access to request context, use `AsyncLocalStorage`. |
| ~~Async FactoryProvider~~ | Not needed | `@OnStart` hooks already cover async initialization scenarios (e.g., database connection pools, remote config loading), executed uniformly during `Platform.start()`. Making `Provider.create()` async would require the entire dependency resolution chain to become async — a breaking change with costs far outweighing benefits. |
| ~~Dynamic Module~~ | Not now | NestJS's `forRoot(config)` essentially passes hardcoded constants at decorator execution time; runtime config still requires `forRootAsync` + FactoryProvider. tarpit's `TpConfigData` + FactoryProvider already covers runtime configuration needs. Will reconsider if specific scenarios prove current implementation too cumbersome. |
| ~~Property Injection~~ | Not needed | Breaking circular dependencies should be solved through refactoring; reducing constructor parameters is a code smell of excessive responsibility. Angular's `inject()` function introduces global context dependency; mixing with constructor injection increases cognitive load; full adoption prevents all classes from being testable outside the container. Mainstream communities (Angular v14+, NestJS) are also de-emphasizing property injection. Constructor injection is a cleaner design constraint. |

### Medium Priority (None Required)

| Feature | Decision | Rationale |
|---|---|---|
| ~~ForwardRef~~ | Not needed | Essentially a circular dependency issue — even if load order is resolved, runtime instantiation remains a dead loop, requiring property injection to break. Since property injection is not planned, `forwardRef` alone solves only half the problem. Circular dependencies should be eliminated through refactoring. |
| ~~Provider Override~~ | Already supported | `Injector.set()` uses `Map.set()` semantics; later registration of the same token directly overrides the previous one. For testing, simply `platform.import({ provide: Token, useValue: mock })` after importing the module. |
| ~~Explicit Module Exports~~ | Not needed | tarpit is not targeting very large applications. The current design where all providers are visible to parent modules is simple and practical enough, no need to introduce `exports: []` configuration complexity. |
| ~~Lazy Injection~~ | Not needed | ClassProvider is singleton and created only once; dependency tree depth is limited; startup performance is not a concern. Conditional branch dependencies can be solved through FactoryProvider or service splitting. Introducing Proxy wrappers adds debugging complexity with limited benefit. |

### Low Priority (Mostly Implemented)

| Feature | Current Status | Gap |
|---|---|---|
| Startup dependency graph validation | `TpAssembly`/`TpEntry` immediately `create()` on load, triggering full dependency chain resolution | FactoryProvider `deps` referencing non-existent tokens won't fail early (rare edge case) |
| Type-safe Token | `Injector.get<T>()` already has type inference for class tokens | string/symbol tokens lack `InjectionToken<T>` wrapper (rarely used) |
| Diagnostic tools | `inspect_injector()` tree output, `check_usage` function, `detect_cycle_ref` all implemented | `check_usage` not integrated into startup flow; visualization format could be improved |

## Conclusion

tarpit's DI core implementation covers the vast majority of mainstream framework features. Some seemingly missing features are actually addressed through different design approaches (e.g., FactoryProvider is naturally transient, HTTP closures naturally provide request scope, `@OnStart` covers async initialization). The differences from mainstream frameworks are design trade-offs rather than functional gaps. The current design achieves a reasonable balance between simplicity and practicality.
