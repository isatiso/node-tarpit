/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { WebSocket } from 'ws'
import { HttpContext, HttpHooks, HttpServerModule, Post, RawBody, TpRequest, TpRouter, TpWebSocket, WS } from '../src'

chai.use(cap)

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
        throw new Error('socket close error')
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

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31254, expose_error: true, body: { max_length: 10 } } }))
        .import({ provide: HttpHooks, useClass: CustomHooks })
        .import(TempRouter)

    const r = axios.create({ baseURL: 'http://localhost:31254', proxy: false })

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        await platform.start()

    })

    after(async function() {
        await platform.terminate()
        sandbox.restore()
    })

    it('should catch error from on_init and on_finished called', async function() {
        await r.post('/user/buffer', Buffer.from('some thing')).then(res => {
            expect(res.status).to.equal(200)
        })
    })

    it('should catch error from on_error called', async function() {
        await r.post('/user/error', Buffer.from('some thing')).catch(err => {
            expect(err.response.status).to.equal(500)
        })
    })

    it('should catch error from on_ws_init and on_ws_close called', async function() {
        const ws = new WebSocket('ws://localhost:31254/user/subscribe')
        const msg: Buffer = await new Promise(resolve => ws.on('message', resolve))
        expect(msg.toString()).to.equal('message')
    })
})
