---
layout: default
title: Platform
nav_order: 4
parent: Core
---

# Platform
{:.no_toc}

- TOC
{:toc}

Platform is the main entrypoint of Tarpit. A Tarpit program is always start with `new Platform(config)`.

## Configuration

Creating an instance of Platform requires specifying the way to load configuration.
There are four ways to specified configuration as below:

```typescript
const platform = new Platform()
// try to load file 'tarpit.json'

const platform = new platform('./path-to-config.json')
// try to load file './path-to-config.json'

const platform = new Platform({ http: { port: 3000 } })
// deliver configuration object directly

const platform = new Platform(() => { http: { port: 3000 } })
// load the result of function
```

See @tarpit/config

## Load Component

The primary responsibility of Platform is to manage Components, which means loading and exposing.
Loading component is the process of recording Token-Provider pairs to the injector.

A root Injector is created when Platform instantiating.

Here are the methods:

- `import` - to load components to the root Injector.
- `expose` - to expose service from root Injector.

E.g.
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

const platform = new Platform({}).import(FirstService).import(SecondService)

const service = platform.expose(SecondService)!
service.first.do_something() // I'm the First!
```

## Isolation

Sometimes you need the application split into parts.
You can use `bootstrap` method creating a new part and load component into it.
It will create a child injector from root Injector before loading.

E.g.
```typescript
@TpRoot({
    imports: [
        // modules ...
    ],
    providers: [
        // services ...
    ],
    entries: [
        SomeRouter,
    ],
})
class AppRoot {
}

const platform = new Platform({}).bootstrap(AppRoot)
```

## Start and Terminate

The methods `start` and `terminate` is to control the application.

See [TpLoader](/1-core/4-builtin.html#tploader).
