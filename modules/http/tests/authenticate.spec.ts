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
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { Auth, Guard, HttpServerModule, Post, TpRouter, TpWebSocket, WS } from '../src'
import { HttpServer } from '../src/services/http-server'

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
            .import(TempRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}/user`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should authenticate request in simple way if route under @Auth()', async function() {
        const res = await r.post('/need-auth', { a: 1 }, { auth: { username: 'admin', password: 'admin_password' } })
        expect(res.status).toEqual(200)
        expect(res.data).toEqual({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
    })

    it('should authenticate websocket upgrade in simple way if route under @Auth()', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/user/socket-need-auth`, { auth: 'admin:admin_password' })
        await new Promise<void>(resolve => {
            ws.on('message', (data) => {
                const obj = JSON.parse(data.toString())
                expect(obj).toEqual({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
                ws.terminate()
                resolve()
            })
        })
    })

    it('should throw 401 when header Authorization not found if route under @Auth()', async function() {
        const res = await r.post('/need-auth', { a: 1 }).catch(err => err)
        expect(res.response.status).toEqual(401)
    })

    it('should cut connection when header Authorization not found if route under @Auth()', async function() {
        const ws = new WebSocket(`ws://localhost:${port}/user/socket-need-auth`)
        await new Promise<void>(resolve => {
            ws.on('error', err => {
                expect(err).toBeInstanceOf(Error)
                expect(err.message).toEqual('socket hang up')
                resolve()
            })
        })
    })

    it('should extract credentials if no @Auth() over the route but Guard is required', async function() {
        const res_with_auth = await r.post('/no-need', { a: 1 }, { auth: { username: 'admin', password: 'admin_password' } })
        expect(res_with_auth.status).toEqual(200)
        expect(res_with_auth.data).toEqual({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
        const res_without_auth = await r.post('/no-need', { a: 1 })
        expect(res_without_auth.status).toEqual(200)
        expect(res_without_auth.data).toEqual({ type: null, credentials: null })
    })
})
