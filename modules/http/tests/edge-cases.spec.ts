/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import axios from 'axios'
import { IncomingMessage, ServerResponse } from 'http'
import net, { AddressInfo } from 'net'
import { Duplex } from 'stream'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { Get, HttpServerModule, TpRouter } from '../src'
import { HttpRouters } from '../src/services/http-routers'
import { HttpServer } from '../src/services/http-server'

@TpRouter('/', { imports: [HttpServerModule] })
class TempRouter {
    @Get()
    async get() {
        await new Promise(resolve => setTimeout(resolve, 300))
        return 'ok'
    }
}

describe('edge cases', () => {

    describe('http-routers', () => {
        let platform: Platform
        let port: number
        let http_routers: HttpRouters

        beforeAll(async () => {
            vi.spyOn(console, 'debug').mockImplementation(() => undefined)
            vi.spyOn(console, 'log').mockImplementation(() => undefined)
            vi.spyOn(console, 'info').mockImplementation(() => undefined)
            vi.spyOn(console, 'warn').mockImplementation(() => undefined)
            vi.spyOn(console, 'error').mockImplementation(() => undefined)
            platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0 } }))
                .import(TempRouter)
            await platform.start()
            const http_server = platform.expose(HttpServer)!
            port = (http_server.server!.address() as AddressInfo).port
            http_routers = platform.expose(HttpRouters)!
        })

        afterAll(async () => {
            await platform.terminate()
        })

        it('should handle request with no url or method', async () => {
            const req = new IncomingMessage(null as any)
            const res = new ServerResponse(req)
            req.url = undefined
            req.method = undefined
            await http_routers.request_listener(req, res)
            expect(res.statusCode).toBe(400)
        })

        it('should handle upgrade with no url or method', async () => {
            const req = new IncomingMessage(null as any)
            req.url = undefined
            req.method = undefined
            const socket = new Duplex()
            const head = Buffer.from('')
            const result = await http_routers.upgrade_listener(req, socket, head)
            expect(result).toBeUndefined()
        })

        it('should handle upgrade with empty pathname', async () => {
            const req = new IncomingMessage(null as any)
            req.url = 'http://localhost/'
            req.method = 'GET'
            const socket = new Duplex()
            const head = Buffer.from('')
            const destroy_spy = vi.spyOn(socket, 'destroy')
            await http_routers.upgrade_listener(req, socket, head)
            expect(destroy_spy).toHaveBeenCalled()
        })

        it('should handle OPTIONS * request', async () => {
            const response = await new Promise<string>((resolve, reject) => {
                const client = net.connect({ port }, () => {
                    client.write('OPTIONS * HTTP/1.1\r\nHost: localhost\r\n\r\n')
                })
                let data = ''
                client.on('data', (chunk) => {
                    data += chunk.toString()
                    client.end()
                })
                client.on('end', () => {
                    resolve(data)
                })
                client.on('error', reject)
            })

            expect(response).toContain('HTTP/1.1 204 No Content')
            expect(response).toContain('Allow: OPTIONS,HEAD,GET,POST,PUT,DELETE')
        })
    })

    describe('http-server terminating cases', () => {

        it('should handle terminate timeout and destroy hanging sockets', async () => {
            const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, server: { terminate_timeout: 100 } } }))
                .import(TempRouter)
            await platform.start()
            const http_server = platform.expose(HttpServer)!
            const port = (http_server.server!.address() as AddressInfo).port
            const r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })
            r.get('/').catch(() => {
            })
            await new Promise(resolve => setTimeout(resolve, 50))
            await platform.terminate()
        })

        it('should reject new http requests and close existing connections when terminating', async () => {
            const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, server: { terminate_timeout: 100 } } }))
                .import(TempRouter)
            await platform.start()
            const http_server = platform.expose(HttpServer)!
            const port = (http_server.server!.address() as AddressInfo).port
            const r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })

            const ongoing_request1 = r.get('/get')
            await new Promise(resolve => setTimeout(resolve, 50))
            const termination_promise = platform.terminate()
            await new Promise(resolve => setTimeout(resolve, 50))
            const ongoing_request2 = r.get('/get')

            const err = await ongoing_request1.catch(err => err)
            expect(err.code).toBe('ECONNRESET')

            const response = await ongoing_request2
            expect(response.headers).toHaveProperty('connection', 'close')

            await termination_promise
        })

        it('should reject new websocket connections when terminating', async () => {
            const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, server: { terminate_timeout: 100 } } }))
                .import(TempRouter)
            await platform.start()
            const http_server = platform.expose(HttpServer)!
            const port = (http_server.server!.address() as AddressInfo).port

            platform.terminate()

            const ws = new WebSocket(`ws://localhost:${port}`)
            const error: Error = await new Promise(resolve => ws.on('error', resolve))
            expect(error.message).toBe('socket hang up')
        })
    })
})
