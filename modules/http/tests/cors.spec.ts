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

describe('context case', function() {

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

    it('should serve OPTIONS request', async function() {
        await r.options('/cors').then(res => {
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
})
