---
layout: default
title: Concepts
nav_order: 1
parent: Core
---

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
1. TOC
{:toc}
</details>

---

# Dependency Injection

{:.mb-5}

As a DI Framework, there should be a mechanism to match dependencies and inject them into the place.
That is to say where and what to inject.

Usually, a process of dependency injection is as follows:

1. Declare services.

    ```typescript
    @TpService()
    class FirstService {
        do_something() {
            console.log("I'm the First!")
        }
    }

    @TpService()
    class SecondService {
        constructor(public first: FirstService) {}
    }
    ```

1. Deliver these services to Tarpit.

    ```typescript
    const platform = new Platform({}).import(FirstService).import(SecondService)
    ```

1. Get instance of services from Tarpit.

    ```typescript
    const service = platform.expose(SecondService)!
    service.first.do_something() // I'm the First!
    ```

It is a simplified process but contains all essentials.

## Where to Inject

{:.mb-5}

In Tarpit, we called the place to inject dependencies an Injection Point.

In the above example, the Injection Point is the parameter first of the constructor of SecondService.
With package reflect-metadata, Tarpit can get the type of first parameter which is FirstService.
Then, Tarpit search and found the Provider of FirstService, created an instance and delivered it to the constructor of SecondService.

Going further, a Injection Point could be a parameter of the TpComponent constructor or a TpUnit function.

## What to Inject

{:.mb-5}

There are two ways to mark dependencies:

1. Implicitly specified the dependency by type annotation as the above example.
2. Explicitly specified the dependency by decorator as follows.

    ```typescript
    @TpService()
    class SecondService {
        constructor(
            @Inject(MaxInstance) public max_instance: number
        ) {}
    }
    ```

   `@Inject(MaxInstance)` means this parameter needs the value of MaxInstance, which is a number.

We called the mark of dependency Injection Token. Tarpit uses Injection Token to find the matched Provider.
`FirstService` and `@Inject(MaxInstance)` mark each dependencies as FirstService and MaxInstance.

Injection Token should have a certain uniqueness, which could let you know what to offer by the given single value.
It's like you can't just say you need a number. No one knows what you actually need.

## Inject by Type Annotation

{:.mb-5}

This way usually uses the class as the Injection Token for reasons as follows.

It access the value that emitted from type annotation, meaning the mark should be a type that Tarpit can put at the place.
And also, The mark should be a value that can perform a comparison operation.

Refer to the [table from the TypeScript document](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#basic-concepts) below.
Only class and enum satisfy the condition to be both types and values.

| Declaration Type | Namespace | Type | Value |
|:-----------------|:---------:|:----:|:-----:|
| Namespace        | X         |      | X     |
| Class            |           | X    | X     |
| Enum             |           | X    | X     |
| Interface        |           | X    |       |
| Type Alias       |           | X    |       |
| Function         |           |      | X     |
| Variable         |           |      | X     |

E.g.

```typescript
enum Colors {
   red = '#ff0000',
   green = '#00ff00',
   blue = '#0000ff',
}

@TpService()
class XXService {
   constructor(
           a: SomeService,                 // a -> [class SomeService]
           b: number,                      // b -> [Function: Number]
           c: string,                      // c -> [Function: String]
           d: { a: string, b: number },    // d -> [Function: Object]
           e: Colors,                      // e -> [Function: String]
   ) {
   }
}
```

Only type of parameter **a** indicates the exact value to provide which should be an instance of **class SomeService**.

Class is the only choice.

## Inject by Decorator

{:.mb-5}

In this situation, we put the token directly on the Injection Point with barely a limit to the token.
Usually, use string or symbol as the token as they are lightweight and meaningful.

```typescript
const DecompressorToken = Symbol.for('cc.tarpit.DecompressorToken')

@TpService()
class XXService {
   constructor(
           @Inject(Location) location: string,
           @Inject(DecompressorToken) decompressor: Function,
   ) {
   }
}
```

---

# Decorator

{:.mb-5}

There are five types of decorators：

- Class Decorator
- Method Decorator
- Property Decorator
- Accessor Decorator
- Paramerter Decorator

Type of the decorator means the position where the decorator is placed.

E.g.

```typescript
@ClassDecorator
class Temp {
   constructor(
           @ParameterDecorator private a: number
   ) {
   }

   @PropertyDecorator
   public producer: Producer

   @AccessorDecorator
   set property() {
   }

   @MethodDecorator
   async do_something(
           @ParameterDecorator id: string
   ) {
   }
}
```

## Abstract Decorators

{:.mb-5}

Tarpit use decorator to mark the way to use class, and there are five abstract decorators:

1. **TpComponent**

   A TpComponent is the most basic abstract class decorator.
   All decorators that mark the type of the class here are inherited from the TpComponent.

1. **TpWorker**

   A TpWorker is an abstract class decorator inherited from TpComponent,
   indicating that the class is pure and could be collected and injected.

1. **TpAssembly**

   A TpAssembly is an abstract class decorator inherited from TpComponent,
   indicating that the class is a worker container that bundles workers together.

1. **TpEntry**

   A TpEntry is an abstract class decorator inherited from TpAssembly,
   indicating that the class is a worker container with a list of functional entry points.

1. **TpUnit**

   A TpUnit is a most basic abstract method decorator.
   It is used to mark the entry point of the class.

## Implements

{:.mb-5}

Based on the above concepts, let's see what tools Tarpit provided.

1. **TpService**

   It is an implement of TpWorker, as same as TpWorker.

1. **TpModule**

   It is an implement of TpAssembly, as same as TpAssembly.

1. **TpRoot**

   It is an implement of TpEntry, as same as TpEntry.

---

# Provider

{:.mb-5}

A Provider is a wrapper of dependency which generate value as defined.
There are three types of Providers:

1. **ClassProvider**

   It provides the instance of the given class.

    ```typescript
    platform.import({ provide: FirstService, useClass: SecondService })

    platform.import(FirstService)
    // equals to
    platform.import({ provide: FirstService, useClass: FirstService })
    ```

1. **FactoryProvider**

   It provides the result of the given function.

    ```typescript
    platform.import({ provide: FirstService, useFactory: () => new FirstService() })
    ```

1. **ValueProvider**

   It provides the given value.

    ```typescript
    platform.import({ provide: 'locale', useValue: 'zh-CN' })
    ```

---

# Injector

{:.mb-5}

An injector is the record of Tokens and Providers, which provides the method to search dependencies.

The first injector created by Platform is called the **root injector**. All other injectors are its child.

An injector should have a parent, the parent of the root injector is the **NullInjector**,
which is an injector-like object that provides the same search method as an injector except all result is null.
And an injector maybe have children.

You can record the Token and Provider pair to the injector.

When you request a dependency from Injector, the injector searches itself first, then its parent, the parent of the parent, and so on. Until the Null injector.

As a special case, you always got the injector itself if you are searching for an injector.

---

# Platform

{:.mb-5}

The class Platform is a runtime container which provide several method to interact with framework.

When you create an instance of Platform, it loads config data and creates an injector with NullInjector as the parent.

```typescript
const platform = new Platform({})
```

### As DI Controller

It provides two methods to load components which are `import` and `bootstrap`. They are both record providers.
The difference is that `import` record to the root injector, and `bootstrap` will create a child from the root injector first.

```typescript
platform.import(FirstService) // this will record FirstService to the root injector.
platform.bootstrap(FirstEntry) // this will create a child injector and record First to it.
```

Because dependency looking up doesn't include the brother injector, `bootstrap` means to create an isolation area.

You can expose a service from root injector directly.

```typescript
platform.expose(FirstService)!
```

### As Application Controller

It provides methods `start` and `terminate` to control the Application.
