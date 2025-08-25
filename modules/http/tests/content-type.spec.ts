/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import axios, { AxiosInstance } from 'axios'
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HttpServer } from '../src/services/http-server'
import { ContentType, Get, HttpServerModule, TpResponse, TpRouter } from '../src'

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Get()
    @ContentType('text/html')
    async html() {
        return '<body>HTML BODY</body>'
    }

    @Get()
    @ContentType('text/plain')
    async plain() {
        return '<body>HTML BODY</body>'
    }

    @Get()
    async plain_with_no_declaration() {
        return '<body>HTML BODY</body>'
    }

    @Get()
    async json_with_no_declaration() {
        return { a: 1, b: 2 }
    }

    @Get()
    @ContentType('text/plain')
    async json_as_text_plain() {
        return { a: 1, b: 2 }
    }

    @Get()
    @ContentType('text/plain')
    async json_with_inner_declaration(response: TpResponse) {
        response.content_type = 'application/json'
        return { a: 1, b: 2 }
    }
}

describe('content type case', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true } }))
            .import(TempRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        const port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
    })

    it('should set Content-Type by annotation', async function() {

        await r.get('/user/html').then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
            expect(res.data).toEqual('<body>HTML BODY</body>')
        })

        await r.get('/user/plain').then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-type']).toEqual('text/plain; charset=utf-8')
            expect(res.data).toEqual('<body>HTML BODY</body>')
        })
    })

    it('should set Content-Type as text/plain if not specified when response is text', async function() {

        await r.get('/user/plain_with_no_declaration').then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-type']).toEqual('text/plain; charset=utf-8')
            expect(res.data).toEqual('<body>HTML BODY</body>')
        })
    })

    it('should set Content-Type as application/json if not specified when response is an object', async function() {

        await r.get('/user/json_with_no_declaration').then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-type']).toEqual('application/json; charset=utf-8')
            expect(res.data).toEqual({ a: 1, b: 2 })
        })
    })

    it('should set Content-Type as text/plain as specified whatever the type of the response is', async function() {

        await r.get('/user/json_as_text_plain').then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-type']).toEqual('text/plain; charset=utf-8')
        })
    })

    it('should cover the ContentType setting when explicitly set inside the handler', async function() {

        await r.get('/user/json_with_inner_declaration').then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-type']).toEqual('application/json; charset=utf-8')
            expect(res.data).toEqual({ a: 1, b: 2 })
        })
    })
})
