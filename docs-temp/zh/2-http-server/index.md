---
layout: default
title: HTTP Server
nav_order: 3
has_children: true
---
<!-- 
# HTTP Server
{:.mb-5.no_toc}

- TOC
{:toc}

## TpRouter
{:.mb-5}

TpRouter is a TpEntry, 

```typescript
import { Platform } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get } from '@tarpit/http'

@TpRouter('/', { imports: [ HttpServerModule ] })
class FirstRouter {
    @Get()
    async hello() {
        return 'Hello World!'
    }
}

const platform = new Platform({ http: { port: 3000 } })
        .import(FirstRouter)
        .start()
``` -->
