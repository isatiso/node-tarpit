---
layout: default
title: Injector and Provider
nav_order: 3
parent: Core
---

# Injector and Provider
{:.no_toc}

- TOC
{:toc}

## Injector
{:.mb-5}

Injector is the core object of tarpit; it records Token and Provider pairs and searches Provider by given Token.

Injector created with no parent called root injector, it has a fake parent as NullInjector.

NullInjector is an object with methods `get` and `has` which's function signature is as same as Injector except always finds nothing.

You can get the Injector from the Injection Point:

```typescript
@TpService()
class SomeService {
    constructor(
        private injector: Injector
    ) {
    }
    
    check_another() {
        return this.injector.has(AnotherService)
    }
}
```

### Methods of Injector

Injector has a write method `set`, and two read method `get` and `has`.

The method `set` will record Token-Provider pair to the injector itself.
The methods `get` and `has` both search self first, and then the parent, and the parent of the parent, until the NullInjector.

### Searching Process

E.g.

```typescript
const root_injector = Injector.create()
const child_injector = Injector.create(root_injector)


// Assume that FirstProvider is a ClassProvider of FirstService
root_injector.set(FirstService, FirstProvider) 
// Assume that SecondProvider is a ClassProvider of SecondService
child_injector.set(SecondService, SecondProvider) 

child_injector.has(SecondService) 
// true  ===> check child itself, exist -> return true

child_injector.has(FirstService) 
// true  ===> check child itself, not exist -> check parent(root_injector), exist -> return true

root_injector.has(FirstService) 
// true  ===> check root itself, exist -> return true

root_injector.has(SecondService) 
// false  ===> check root itself, not exist -> check parent(NullInjector) -> return false
```

### Event Bus

Another responsibility of the Injector is to act as an event bus.

E.g.

```typescript
@TpService()
class SomeService {
    constructor(
        private injector: Injector
    ) {
        this.injector.on('start', () => this.setup())
    }

    setup() {
        // do something to setup
    }
}
```

## Provider
{:.mb-5}

A Provider is the wrapper of the instance creation process. All kinds of Providers have the method `create()`. 
Tarpit will call this method to get the value that needs to be passed.

There three kind of Providers.

### ClassProvider

ClassProvider is a Provider for a class(the object with `new()` signature).
Tarpit will resolve dependencies of the class, and create instance for them.

ClassProvider uses a singleton pattern, which is to say that a ClassProvider will create the instance only once; 
it will return the same instance on every call of the method `create()`.
If you want to control more details, try [FactoryProvider](#factoryprovider).

Here are the properties of the ClassProvider definition.

| Property  | Description                                       |
|:----------|:--------------------------------------------------|
| provide   | Injection Token to search Provider.               |
| useClass  | Create instance with this class.                  |
| root      | If this Provider should add to the root injector. |

You can define a ClassProvider as below

```typescript
@TpModule({
    providers: [
        { provide: FirstService, useClass: ModifiedFirstService, root: true },
        { provide: FirstService, useClass: FirstService, root: true },
        { provide: FirstService, useClass: FirstService },
        FirstService // short for above
    ]
})
class SomeModule {
}
```

### FactoryProvider

FactoryProvider is a Provider that wraps a function of the creation process.
You can define the creation process by the delivered function.

Every time resolve the result of a FactoryProvider, the delivered function will be called.

Here are the properties of the FactoryProvider definition.

| Property  | Description                                       |
|:----------|:--------------------------------------------------|
| provide   | Injection Token to search Provider.               |
| useFactory| Create result by this function.                   |
| deps      | Dependencies of the function.                     |
| root      | If this Provider should add to the root injector. |

You can define a FactoryProvider as below

```typescript
const pre_created = new FirstService()

@TpModule({
    providers: [
        { provide: FirstService, useFactory: (a: AnotherService) => new FirstService(), deps: [ AnotherService ] },
        { provide: FirstService, useFactory: () => new FirstService() },
        { provide: FirstService, useFactory: () => pre_created },
    ]
})
class SomeModule {
}
```

### ValueProvider

ValueProvider is a Provider that wraps the constant.
It is usually for some configuration or state management.

Here are the properties of the FactoryProvider definition.

| Property  | Description                                                   |
|:----------|:--------------------------------------------------------------|
| provide   | Injection Token to search Provider.                           |
| useValue  | Constant to store, Provider.create() will return this value.  |
| root      | If this Provider should add to the root injector.             |
| multi     | If record multi value for this Token.                   |

If multi set to true, `Provider.create()` will return an array instead of single value.

You can define a ValueProvider as below

```typescript
@TpModule({
    providers: [
        { provide: Symbol.for('cc.tarpit.custom'), useValue: 3, root: true}, 
        { provide: Symbol.for('cc.tarpit.some_string'), useValue: 'sentence', multi: true }, 
    ]
})
class SomeModule {
}
```
