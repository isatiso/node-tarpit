/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpInspector } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { WebSocket } from 'ws'
import { Auth, Guard, HttpServerModule, Post, TpRouter, TpWebSocket, WS } from '../src'

chai.use(cap)

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Auth()
    @Post('need-auth')
    async do_something(guard: Guard) {
        const type = guard.get_if('type', Jtl.exist, null)
        const credentials = guard.get_if('credentials', Jtl.exist, null)
        return { type, credentials }
    }

    @Post('no-need')
    async do_something_else(guard: Guard) {
        const type = guard.get_if('type', Jtl.exist, null)
        const credentials = guard.get_if('credentials', Jtl.exist, null)
        return { type, credentials }
    }

    @Auth()
    @WS('socket-need-auth')
    async subscribe_something(guard: Guard, ws: TpWebSocket) {
        const type = guard.get_if('type', Jtl.exist, null)
        const credentials = guard.get_if('credentials', Jtl.exist, null)
        await ws.send(JSON.stringify({ type, credentials }))
    }

    @WS('socket-no-need')
    async subscribe_something_else(guard: Guard, ws: TpWebSocket) {
        const type = guard.get_if('type', Jtl.exist, null)
        const credentials = guard.get_if('credentials', Jtl.exist, null)
        await ws.send(JSON.stringify({ type, credentials }))
    }
}

describe('authenticate case', function() {

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31254, expose_error: true } }))
        .bootstrap(TempRouter)

    const inspector = platform.expose(TpInspector)!

    const r = axios.create({ baseURL: 'http://localhost:31254/user', proxy: false })

    const tmp = console.log

    before(async function() {
        console.log = (..._args: any[]) => undefined
        platform.start()
        await inspector.wait_start()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        console.log = tmp
    })

    it('should authenticate request in simple way if route under @Auth()', async function() {
        const res = await r.post('/need-auth', { a: 1 }, { auth: { username: 'admin', password: 'admin_password' } })
        expect(res.status).to.equal(200)
        expect(res.data).to.eql({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
    })

    it('should authenticate websocket upgrade in simple way if route under @Auth()', function(done) {
        const ws = new WebSocket('ws://localhost:31254/user/socket-need-auth', { auth: 'admin:admin_password' })
        ws.on('message', (data) => {
            const obj = JSON.parse(data.toString())
            expect(obj).to.eql({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
            ws.terminate()
            done()
        })
    })

    it('should throw 401 when header Authorization not found if route under @Auth()', async function() {
        const res = await r.post('/need-auth', { a: 1 }).catch(err => err)
        expect(res.response.status).to.equal(401)
    })

    it('should cut connection when header Authorization not found if route under @Auth()', function(done) {
        const ws = new WebSocket('ws://localhost:31254/user/socket-need-auth')
        ws.on('error', err => {
            expect(err).to.be.instanceof(Error).with.property('message').to.equal('socket hang up')
            done()
        })
    })

    it('should extract credentials if no @Auth() over the route but Guard is required', async function() {
        const res_with_auth = await r.post('/no-need', { a: 1 }, { auth: { username: 'admin', password: 'admin_password' } })
        expect(res_with_auth.status).to.equal(200)
        expect(res_with_auth.data).to.eql({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
        const res_without_auth = await r.post('/no-need', { a: 1 })
        expect(res_without_auth.status).to.equal(200)
        expect(res_without_auth.data).to.eql({ type: null, credentials: null })
    })
})
