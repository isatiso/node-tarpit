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
import { WebSocket } from 'ws'
import { HttpServer } from '../src/services/http-server'
import { finish, Get, HttpServerModule, throw_bad_request, throw_http_finish, throw_unauthorized, TpHttpFinish, TpRouter, TpWebSocket, WS } from '../src'
import { HTTP_STATUS } from '../src/tools/http-status'

@TpRouter('/error', { imports: [HttpServerModule] })
class NormalRouter {

    @Get('standard')
    async test_standard() {
        throw_unauthorized()
    }

    @Get('explicit-standard')
    async test_explicit_standard() {
        throw new TpHttpFinish({ status: 401, code: '401', msg: HTTP_STATUS.message_of(401) })
    }

    @Get('http')
    async test_http() {
        throw new TpHttpFinish({ code: 'PURE_ERROR', msg: 'some message', status: 500 })
    }

    @Get('unauthorized')
    async test_unauthorized() {
        throw_unauthorized()
    }

    @Get('bad-request')
    async test_bad_request() {
        throw_bad_request()
    }

    @Get('finish-called')
    async test_finish_called() {
        finish({})
    }

    @Get('finish-thrown')
    async test_finish_thrown() {
        // throw new Finish({})
        throw_http_finish(200, { body: {} })
    }

    @WS()
    async subscribe(ws: TpWebSocket) {
        ws.on('message', data => {
            ws.send(data.toString())
        })
    }

    @WS()
    async subscribe_with_error() {
        throw new Error('test subscribe with error')
    }
}

describe('errors case', function() {

    let platform: Platform
    let r: AxiosInstance
    let port: number

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true } }))
            .import(NormalRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}/error`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should throw standard error', async function() {

        await r.get('/standard', {}).catch(err => {
            expect(err.response.status).toEqual(401)
            expect(err.response.data).toHaveProperty('error')
            expect(err.response.data.error).to.include({ code: '401', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/explicit-standard', {}).catch(err => {
            expect(err.response.status).toEqual(401)
            expect(err.response.data).toHaveProperty('error')
            expect(err.response.data.error).to.include({ code: '401', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/unauthorized', {}).catch(err => {
            expect(err.response.status).toEqual(401)
            expect(err.response.data).toHaveProperty('error')
            expect(err.response.data.error).to.include({ code: '401', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/bad-request', {}).catch(err => {
            expect(err.response.status).toEqual(400)
            expect(err.response.data).toHaveProperty('error')
            expect(err.response.data.error).to.include({ code: '400', msg: 'Bad Request', status: 400 })
        })
    })

    it('should throw http error', async function() {
        await r.get('/http', {}).catch(err => {
            expect(err.response.status).toEqual(500)
            expect(err.response.data).toHaveProperty('error')
            expect(err.response.data.error).to.include({ code: 'PURE_ERROR', msg: 'some message', status: 500 })
        })
    })

    it('should finish', async function() {
        await r.get('/finish-called', {}).then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({})
        })
        await r.get('/finish-thrown', {}).then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({})
        })
    })

    it('should throw error when socket api not found', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/not_exist`)
        await new Promise<void>(resolve => {
            ws.on('error', err => {
                expect(err).toBeInstanceOf(Error)
                resolve()
            })
        })
    })

    it('should close socket when socket api throw an error during handshake', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/error/subscribe_with_error`)
        await new Promise<void>(resolve => {
            ws.on('close', (code, reason) => {
                expect(code).toEqual(1011)
                expect(reason.toString()).toEqual('Error: test subscribe with error')
                resolve()
            })
        })
    })
})
