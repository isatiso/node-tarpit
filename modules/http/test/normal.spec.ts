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
import chai_spies from 'chai-spies'
import { IncomingMessage } from 'http'
import { WebSocket } from 'ws'
import { Delete, Get, HttpInspector, HttpServerModule, Params, PathArgs, Post, Put, RequestHeaders, TpHttpFinish, TpRequest, TpRouter, TpWebSocket, WS } from '../src'

chai.use(cap)
chai.use(chai_spies)

@TpRouter('/', { imports: [HttpServerModule] })
class NormalRouter {

    @Get('user/:user_id')
    async get_user(params: Params<{ id: string }>, args: PathArgs<{ user_id: string }>) {
        const id = params.get_first('id')
        const user_id = args.ensure('user_id', Jtl.string)
        return new TpHttpFinish({ status: 200, code: 'OK', msg: 'OK', body: { id, user_id } })
    }

    @Post('user')
    async add_user(params: Params<{ id: string }>) {
        const id = params.get_first('id')
        return { id }
    }

    @Put('user')
    async modify_user(params: Params<{ id: string }>) {
        const id = params.get_first('id')
        return { id }
    }

    @Delete('user')
    async delete_user(params: Params<{ id: string }>) {
        const id = params.get_first('id')
        return { id }
    }

    @WS('subscribe-user/:id')
    async subscribe_user(ws: TpWebSocket, args: PathArgs<{ id: string }>) {
        const id = args.get_if('id', Jtl.string, '123')
        ws.on('message', data => {
            ws.send(data.toString() + id)
        })
    }

    @WS('subscribe-user')
    async subscribe_user2(
        ws: TpWebSocket,
        tp_inspector: TpInspector,
        incoming_message: IncomingMessage,
        request: TpRequest,
        headers: RequestHeaders,
        params: Params<{ id: string }>
    ) {
        ws.on('message', data => {
            ws.send(JSON.stringify({
                message: data.toString(),
                time: tp_inspector.start_time,
                method: incoming_message.method,
                request: request.method,
                header: headers.get_first('tarpit'),
                param_id: params.get_first('id'),
            }))
        })
    }
}

describe('normal case', function() {

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31254, expose_error: true } }))
        .bootstrap(NormalRouter)

    const inspector = platform.expose(TpInspector)!
    const http_inspector = platform.expose(HttpInspector)!
    const r = axios.create({ baseURL: 'http://localhost:31254', proxy: false })

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

    it('should create GET,POST,PUT,DELETE handler on /user', async function() {
        const routers = http_inspector.list_router()
        expect(routers).to.have.deep.members([
            { method: 'GET', path: '/user/:user_id' },
            { method: 'POST', path: '/user' },
            { method: 'PUT', path: '/user' },
            { method: 'DELETE', path: '/user' },
            { method: 'SOCKET', path: '/subscribe-user/:id' },
            { method: 'SOCKET', path: '/subscribe-user' },
        ])
    })

    it('should handle GET request on /user', async function() {
        await r.get('/user/u123', { params: { id: 'a' } }).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ id: 'a', user_id: 'u123' })
        })
    })

    it('should handle POST request on /user', async function() {
        await r.post('/user', {}, { params: { id: 'a' } }).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ id: 'a' })
        })
    })

    it('should handle PUT request on /user', async function() {
        await r.put('/user', {}, { params: { id: 'a' } }).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ id: 'a' })
        })
    })

    it('should handle DELETE request on /user', async function() {
        await r.delete('/user', { params: { id: 'a' } }).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ id: 'a' })
        })
    })

    it('should handler upgrade 1', function(done) {
        const ws = new WebSocket('ws://localhost:31254/subscribe-user/123')
        const msg = 'some specified message randomly'
        ws.on('error', err => {
            expect(err).not.to.be.instanceof(Error)
            done()
        })
        ws.on('message', data => {
            expect(data.toString()).to.equal(msg + '123')
            ws.close()
            done()
        })
        ws.on('open', () => {
            ws.send(msg)
        })
    })

    it('should handler upgrade with handler-book cache', function(done) {
        const ws = new WebSocket('ws://localhost:31254/subscribe-user/123')
        const msg = 'some specified message randomly'
        ws.on('error', err => {
            expect(err).not.to.be.instanceof(Error)
            done()
        })
        ws.on('message', data => {
            expect(data.toString()).to.equal(msg + '123')
            ws.close()
            done()
        })
        ws.on('open', () => {
            ws.send(msg)
        })
    })

    it('should handler upgrade with handler-book cache', function(done) {
        const ws = new WebSocket('ws://localhost:31254/subscribe-user?id=qwe987', { headers: { 'Tarpit': 'abc' } })
        const msg = 'some specified message randomly'
        ws.on('error', err => {
            expect(err).not.to.be.instanceof(Error)
            done()
        })
        ws.on('message', data => {
            const obj = JSON.parse(data.toString())
            expect(obj).to.eql({
                message: msg,
                time: inspector.start_time,
                method: 'GET',
                request: 'GET',
                param_id: 'qwe987',
                header: 'abc'
            })
            ws.close()
            done()
        })
        ws.on('open', () => {
            ws.send(msg)
        })
    })
})
