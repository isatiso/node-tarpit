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
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { HttpServer } from '../src/services/http-server'
import { HttpContext, HttpHooks, HttpServerModule, Post, RawBody, TpRequest, TpRouter, TpWebSocket, WS } from '../src'

@TpService()
class CustomHooks extends HttpHooks {

    override async on_init(context: HttpContext): Promise<void> {
        throw new Error('lkj')
    }

    override async on_error(context: HttpContext): Promise<void> {
        throw new Error('lkj')
    }

    override async on_finish(context: HttpContext): Promise<void> {
        throw new Error('lkj')
    }

    override async on_ws_init(socket: TpWebSocket, req: TpRequest): Promise<void> {
        throw new Error('socket init error')
    }

    override async on_ws_close(socket: TpWebSocket, req: TpRequest, code: number): Promise<void> {
        console.log('socket close error')
    }
}

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Post('buffer')
    async add_user_by_buffer(body: RawBody) {
        return { length: body.byteLength }
    }

    @WS()
    async subscribe(ws: TpWebSocket) {
        await ws.send('message')
        await new Promise(resolve => setTimeout(resolve, 300))
        ws.close()
    }

    @Post('error')
    async throw_error() {
        throw new Error()
    }
}

describe('throw error in hooks case', function() {

    let platform: Platform
    let r: AxiosInstance
    let port: number

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true, body: { max_length: 10 } } }))
            .import({ provide: HttpHooks, useClass: CustomHooks })
            .import(TempRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should catch error from on_init and on_finished called', async function() {
        await r.post('/user/buffer', Buffer.from('some thing')).then(res => {
            expect(res.status).toEqual(200)
        })
    })

    it('should catch error from on_error called', async function() {
        await r.post('/user/error', Buffer.from('some thing')).catch(err => {
            expect(err.response.status).toEqual(500)
        })
    })

    it('should catch error from on_ws_init and on_ws_close called', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/user/subscribe`)
        ws.on('error', () => {
            // ignore error from server
        })
        const msg: Buffer = await new Promise(resolve => ws.on('message', resolve))
        expect(msg.toString()).toEqual('message')
    })
})
