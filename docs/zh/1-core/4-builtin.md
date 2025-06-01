---
layout: default
title: Builtin
nav_order: 5
parent: Core
---

# Builtin
{:.no_toc}

- TOC
{:toc}

This topic is about builtin services.

## TpLoader

TpLoader help develop Modules.

## TpInspector

```typescript
const platform = new Platform().import(HttpServerModule)
const inspector = platform.expose(TpInspector)

platform.start()
await inspector.wait_start()
```

## TpLogger

You can provide a custom TpLogger to do something after started or after terminated

```typescript
new Platform().import({ provide: TpLogger, useClass: CustomLogger })
```