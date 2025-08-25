/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import axios, { AxiosInstance } from 'axios'
import { IncomingMessage, ServerResponse } from 'http'
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { Get, HttpContext, HttpServerModule, RequestHeaders, TpRequest, TpResponse, TpRouter } from '../src'
import { HttpServer } from '../src/services/http-server'

@TpService()
class SomeService {

    async some_method(...args: any[]) {
        return args
    }
}

@TpRouter('/user', { imports: [HttpServerModule], providers: [SomeService] })
class TempRouter {

    constructor(
        private service: SomeService
    ) {
    }

    @Get('service')
    async test_service(
        service: SomeService,
    ) {
        return { result: service === this.service }
    }

    @Get('request')
    async test_request(
        request: TpRequest,
        req: IncomingMessage,
    ) {
        return {
            request: request.constructor.name,
            req: req.constructor.name,
        }
    }

    @Get('response')
    async test_response(
        response: TpResponse,
        res: ServerResponse,
    ) {
        return {
            response: response.constructor.name,
            res: res.constructor.name,
        }
    }

    @Get('context')
    async test_context(
        context: HttpContext,
    ) {
        return {
            context: context.constructor.name,
        }
    }

    @Get('headers')
    async test_headers(
        headers: RequestHeaders,
    ) {
        return {
            headers: headers.constructor.name,
        }
    }

    @Get('error')
    async test_error() {
        throw new Error('some exception')
    }
}

describe('context case', function() {

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
        r = axios.create({ baseURL: `http://localhost:${port}/user`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should inject service to constructor parameters and unit function parameters', async function() {
        await r.get('/service').then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ result: true })
        })
    })

    it('should inject TpRequest and IncomingMessage to unit function parameters', async function() {
        await r.get('/request').then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ request: 'TpRequest', req: 'IncomingMessage' })
        })
    })

    it('should inject TpResponse and ServerResponse to unit function parameters', async function() {
        await r.get('/response').then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ response: 'TpResponse', res: 'ServerResponse' })
        })
    })

    it('should inject HttpContext to unit function parameters', async function() {
        await r.get('/context').then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ context: 'HttpContext' })
        })
    })

    it('should inject RequestHeaders to unit function parameters', async function() {
        await r.get('/headers').then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ headers: 'RequestHeaders' })
        })
    })

    it('should catch error and convert to StandardError', async function() {
        await r.get('/error').catch(err => {
            expect(err.response.status).toEqual(500)
            expect(err.response.data).toHaveProperty('error')
            expect(err.response.data.error).to.include({
                code: 'ERR.UNCAUGHT_ERROR',
                msg: 'Internal Server Error',
                status: 500
            })
        })
    })
})
