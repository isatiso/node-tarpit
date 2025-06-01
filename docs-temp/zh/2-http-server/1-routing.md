---
layout: default
title: Routing
nav_order: 1
parent: HTTP Server
---

# Routing
{:.no_toc}

- TOC
{:toc}

Routing refers to determining how an application responds to a client request to a particular endpoint, 
which is a URI (or path) and a specific HTTP request method (GET, POST, and so on).

## Basic Example
{:.mb-5}

Route definition takes the following structure:

```typescript
@TpRouter('/user')
class TempRouter {
    @Get() async get() {
    }
}
```

where:

- `@TpRouter()` - marks class to be a Router with the basic url `/user`.
- `@Get()` - marks the method `get` of `TempRouter` is a handler of a request with HTTP method GET, and URL `/user/get`.

## Request URL
{:.mb-5}

A TpRouter accepts the parameter `path` which should start with '/'.

The decorators like Get, Post..., accept the parameter `path_tail`, which will use the property name if given value is empty.
The final url is `path + '/' + path_tail`.

## Methods
{:.mb-5}

Supported methods are GET, POST, PUT, DELETE, HEAD, OPTIONS.

- **GET**

    A TpUnit with the decorator `@Get()` means this TpUnit will handle a GET request.

- **HEAD**

    A Handler handles method GET will also take method HEAD. It will execute the handler and response with no body.

- **POST**

    A TpUnit with the decorator `@Post()` means this TpUnit will handle a POST request.

- **PUT**

    A TpUnit with the decorator `@Put()` means this TpUnit will handle a PUT request.

- **DELETE**

    A TpUnit with the decorator `@Delete()` means this TpUnit will handle a DELETE request.

- **OPTIONS**

    The method OPTIONS is handled by Tarpit. If the request URL exists,
    It will return the CORS Headers as configuration and Header Allow contains allowed method.

E.g.
```typescript
import { Platform, TpInspector } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, Put, Delete } from '@tarpit/http'
import axios from 'axios'

@TpRouter('/user', { imports: [HttpServerModule] })
class FirstRouter {

    @Get()
    async get() {
        return { method: 'GET' }
    }

    @Post()
    async create() {
        return { method: 'POST' }
    }

    @Put()
    async modify() {
        return { method: 'PUT' }
    }

    @Delete()
    async remove() {
        return { method: 'DELETE' }
    }
}

const platform = new Platform({ http: { port: 3000 } })
    .import(FirstRouter)
    .start()

const inspector = platform.expose(TpInspector)!

;(async () => {
    await inspector.wait_start()
    const res_get = await axios.get('http://localhost:3000/user/get')
    console.log(res_get.data) // { method: 'GET' }
    const res_post = await axios.post('http://localhost:3000/user/create')
    console.log(res_post.data) // { method: 'POST' }
    const res_put = await axios.put('http://localhost:3000/user/modify')
    console.log(res_put.data) // { method: 'PUT' }
    const res_delete = await axios.delete('http://localhost:3000/user/remove')
    console.log(res_delete.data) // { method: 'DELETE' }
    const res_head = await axios.head('http://localhost:3000/user/get')
    console.log(res_head.headers)
    // {
    //   'content-length': '16',
    //   connection: 'keep-alive',
    //   'content-type': 'application/json; charset=utf-8',
    //   date: 'Mon, 01 Aug 2022 13:37:59 GMT',
    //   'keep-alive': 'timeout=4',
    //   'proxy-connection': 'keep-alive',
    //   'x-duration': '0'
    // }
    const res_options = await axios.options('http://localhost:3000/user/get')
    console.log(res_options.headers)
    // {
    //   allow: 'OPTIONS,HEAD,GET',
    //   connection: 'keep-alive',
    //   date: 'Mon, 01 Aug 2022 13:37:59 GMT',
    //   'keep-alive': 'timeout=4',
    //   'proxy-connection': 'keep-alive'
    // }
    platform.terminate()
    await inspector.wait_terminate()
})()
```
