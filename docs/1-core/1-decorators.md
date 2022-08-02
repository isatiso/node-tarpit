---
layout: default
title: Decorators
nav_order: 2
parent: Core
---

# Decorators
{:.no_toc}

- TOC
{:toc}

## Component Decorator
{:.mb-5}

A Component Decorator is to mark a class as some Component of Tarpit.
Such as [TpService](#tpservice), [TpModule](#tpmodule), [TpRoot](#tproot), and so on.

### TpService

TpService is a decorator to mark the class as a [TpWorker](/1-core/#abstract-decorators) prepared to inject. 
The constructor of a TpService is an Injection Point. You can annotate dependencies here.

```typescript
@TpService()
class SomeService {
    constructor(
        private some_other: SomeOtherService
    ) {
    }
    
    do_something() {
        this.some_other.do_anything_else()
    }
}
```

TpService accept parameter `inject_root` as a property of options object. it means this services should add to the root injector.

```typescript
@TpService({ inject_root: true })
class SomeOtherService {
    do_anything_else() {
    }
}
```

### TpModule

TpModule is a decorator to mark the class as a [TpAssembly](/1-core/#abstract-decorators) wrapped TpServices and other TpModules.

```typescript
@TpModule({
    imports: [
        AModule,
        BModule,
        // ...
    ],
    providers: [
        AService,
        BService,
        CService,
        // ...
    ],
})
class SomeModule {
}
```

### TpRoot

TpRoot is a TpModule with a list of TpEntrys. A [TpEntry](/1-core/#abstract-decorators) maybe a router, a schedule and so on.

```typescript
@TpRoot({
    imports: [
        SomeModule,
        // ...
    ],
    providers: [
        AService,
        // ...
    ],
    entries: [
        SomeRouter,
        SomeSchedule,
        SomeProducer,
        SomeConsumer,
        // ...
    ],
})
class AppRoot {
}
```

## Unit Decorator
{:.mb-5}

Unit Decorator is to mark metadata of a [TpUnit](/1-core/#abstract-decorators).

### Disabled

Disabled is to mark a TpUnit should be skipped in the process of collect unit.

```typescript
@TpRouter('/')
class SomeRouter {

    @Get()
    async get_something() {
    }

    @Disabled()
    @Get()
    async method_been_skipped() {
    }
}

```

## Parameter Decorator
{:.mb-5}

Parameter Decorator is to control the dependency searching process.

### Inject

Inject is to replace Injection Token from the type annotation with the given one.

```typescript
@TpService()
class SomeService {
    constructor(
        @Inject(A_VALUE)
        private value: number
    ) {
    }   
}
```

### Optional

Optional is to mark the dependencies is not necessary. 
Tarpit will throw an error if the result of dependency searching is a null value without this decorator.

```typescript
@TpService()
class SomeService {
    constructor(
        @Optional()
        private some_other?: SomeOtherService
    ) {
    }
    
    do_something() {
        this.some_other?.do_anything_else()
    }
}
```

## Debug

Debug is to print dependencies of the place wherever you put this decorator.

```typescript
@Debug()
@TpService()
class SomeService {

    constructor(
        @Debug()
        private some_other: SomeOtherService
    ) {
    }
    
    do_something() {
        this.some_other?.do_anything_else()
    }
}
```