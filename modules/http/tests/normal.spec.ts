/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import axios, { AxiosInstance } from 'axios'
import { IncomingMessage } from 'http'
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { Delete, Get, HttpInspector, HttpServerModule, Params, PathArgs, Post, Put, RequestHeaders, TpHttpFinish, TpRequest, TpResponse, TpRouter, TpWebSocket, WS } from '../src'
import { HttpServer } from '../src/services/http-server'

@TpRouter('/', { imports: [HttpServerModule] })
class NormalRouter {

    constructor() {
    }

    @Get('user/:user_id')
    async get_user(params: Params<{ id: string }>, args: PathArgs<{ user_id: string }>) {
        const id = params.get_first('id')
        const user_id = args.ensure('user_id', Jtl.string)
        return new TpHttpFinish({ status: 200, code: 'OK', msg: 'OK', body: { id, user_id } })
    }

    @Get('user_redirect')
    async redirect(res: TpResponse) {
        res.redirect('/user/1111' + '?' + res.request.query_string)
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
        platform: Platform,
        incoming_message: IncomingMessage,
        request: TpRequest,
        headers: RequestHeaders,
        params: Params<{ id: string }>
    ) {
        ws.on('message', data => {
            ws.send(JSON.stringify({
                message: data.toString(),
                time: platform.start_time,
                method: incoming_message.method,
                request: request.method,
                header: headers.get_first('tarpit'),
                param_id: params.get_first('id'),
            }))
        })
    }
}

describe('normal case', function() {

    let platform: Platform
    let r: AxiosInstance
    let port: number
    let http_inspector: HttpInspector

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true } }))
            .import(NormalRouter)
        http_inspector = platform.expose(HttpInspector)!
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should create GET,POST,PUT,DELETE handler on /user', async function() {
        const routers = http_inspector.list_router()
        expect(routers).toEqual(expect.arrayContaining([
            { method: 'GET', path: '/user/:user_id' },
            { method: 'GET', path: '/user_redirect' },
            { method: 'POST', path: '/user' },
            { method: 'PUT', path: '/user' },
            { method: 'DELETE', path: '/user' },
            { method: 'SOCKET', path: '/subscribe-user/:id' },
            { method: 'SOCKET', path: '/subscribe-user' },
        ]))
    })

    it('should handle GET request on /user', async function() {
        await r.get('/user/u123', { params: { id: 'a' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ id: 'a', user_id: 'u123' })
        })
    })

    it('should redirect request to /user', async function() {
        await r.get('/user_redirect', { params: { id: 'a' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ id: 'a', user_id: '1111' })
        })
    })

    it('should handle POST request on /user', async function() {
        await r.post('/user', {}, { params: { id: 'a' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ id: 'a' })
        })
    })

    it('should handle PUT request on /user', async function() {
        await r.put('/user', {}, { params: { id: 'a' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ id: 'a' })
        })
    })

    it('should handle DELETE request on /user', async function() {
        await r.delete('/user', { params: { id: 'a' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.data).toEqual({ id: 'a' })
        })
    })

    it('should handler upgrade 1', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/subscribe-user/123`)
        const msg = 'some specified message randomly'
        await new Promise<void>((resolve, reject) => {
            ws.on('error', err => {
                reject(err)
            })
            ws.on('message', data => {
                expect(data.toString()).toEqual(msg + '123')
                ws.close()
                resolve()
            })
            ws.on('open', () => {
                ws.send(msg)
            })
        })
    })

    it('should handler upgrade with handler-book cache', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/subscribe-user/123`)
        const msg = 'some specified message randomly'
        await new Promise<void>((resolve, reject) => {
            ws.on('error', err => {
                reject(err)
            })
            ws.on('message', data => {
                expect(data.toString()).toEqual(msg + '123')
                ws.close()
                resolve()
            })
            ws.on('open', () => {
                ws.send(msg)
            })
        })
    })

    it('should handler upgrade with handler-book cache', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/subscribe-user?id=qwe987`, { headers: { 'Tarpit': 'abc' } })
        const msg = 'some specified message randomly'
        await new Promise<void>((resolve, reject) => {
            ws.on('error', err => {
                reject(err)
            })
            ws.on('message', data => {
                const obj = JSON.parse(data.toString())
                expect(obj).toEqual({
                    message: msg,
                    time: platform.start_time,
                    method: 'GET',
                    request: 'GET',
                    param_id: 'qwe987',
                    header: 'abc'
                })
                ws.close()
                resolve()
            })
            ws.on('open', () => {
                ws.send(msg)
            })
        })
    })
})
