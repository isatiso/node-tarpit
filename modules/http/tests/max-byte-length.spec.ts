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
import { HttpServerModule, Post, RawBody, TpRouter } from '../src'
import { HttpServer } from '../src/services/http-server'

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Post('buffer')
    async add_user_by_buffer(body: RawBody) {
        return { length: body.byteLength }
    }
}

describe('max-byte-length case', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true, body: { max_length: 10 } } }))
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

    it('should get error of 413', async function() {
        const res = await r.post('/buffer', 'abc12345678').catch(err => err)
        expect(res.response.status).toEqual(413)
        expect(res.response.statusText).toEqual('Payload Too Large')
    })

    it('should act as normal if body not too large', async function() {
        const res = await r.post('/buffer', 'abc1234567')
        expect(res.status).toEqual(200)
        expect(res.data).toEqual({ length: 10 })
    })
})
