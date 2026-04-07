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
import { HttpServerModule, Route, TpRouter } from '../src'
import { HttpServer } from '../src/services/http-server'

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Route(['GET', 'POST'], 'cors')
    async test_cors() {
        return {}
    }
}

describe('cors - wildcard origin', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({
            http: {
                port: 0,
                cors: { allow_headers: 'Authorization', allow_methods: 'GET,POST', allow_origin: '*', max_age: 3600 },
                expose_error: true,
            }
        }))
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

    it('should serve OPTIONS request with cors headers', async function() {
        await r.options('/cors', { headers: { Origin: 'https://example.com' } }).then(res => {
            expect(res.status).toEqual(204)
            expect(res.headers).to.include({
                'access-control-allow-headers': 'Authorization',
                'access-control-allow-methods': 'GET,POST',
                'access-control-allow-origin': '*',
                'access-control-max-age': '3600',
                allow: 'OPTIONS,HEAD,GET,POST',
            })
        })
    })

    it('should include cors headers on normal request', async function() {
        await r.get('/cors', { headers: { Origin: 'https://example.com' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['access-control-allow-origin']).toEqual('*')
        })
    })
})

describe('cors - exact origin match', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({
            http: {
                port: 0,
                cors: { allow_headers: 'Authorization', allow_methods: 'GET,POST', allow_origin: 'https://foo.com', max_age: 0 },
                expose_error: true,
            }
        }))
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

    it('should echo origin when it matches', async function() {
        await r.options('/cors', { headers: { Origin: 'https://foo.com' } }).then(res => {
            expect(res.status).toEqual(204)
            expect(res.headers['access-control-allow-origin']).toEqual('https://foo.com')
        })
    })

    it('should not set allow-origin when origin does not match', async function() {
        await r.options('/cors', { headers: { Origin: 'https://evil.com' } }).then(res => {
            expect(res.status).toEqual(204)
            expect(res.headers['access-control-allow-origin']).toBeUndefined()
        })
    })
})

describe('cors - credentials and expose_headers', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({
            http: {
                port: 0,
                cors: {
                    allow_headers: 'Authorization',
                    allow_methods: 'GET,POST',
                    allow_origin: 'https://example.com',
                    max_age: 0,
                    credentials: true,
                    expose_headers: 'X-Custom-Header',
                },
                expose_error: true,
            }
        }))
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

    it('should include credentials header on preflight, no expose_headers', async function() {
        await r.options('/cors', { headers: { Origin: 'https://example.com' } }).then(res => {
            expect(res.status).toEqual(204)
            expect(res.headers['access-control-allow-credentials']).toEqual('true')
            expect(res.headers['access-control-expose-headers']).toBeUndefined()
        })
    })

    it('should include credentials and expose_headers on normal request', async function() {
        await r.get('/cors', { headers: { Origin: 'https://example.com' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['access-control-allow-credentials']).toEqual('true')
            expect(res.headers['access-control-expose-headers']).toEqual('X-Custom-Header')
        })
    })
})
