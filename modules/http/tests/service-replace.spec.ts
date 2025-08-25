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
import { afterAll, beforeAll, describe, it, vi } from 'vitest'
import { HttpServer } from '../src/services/http-server'
import { Get, HttpAuthenticator, HttpBodyFormatter, HttpCacheProxy, HttpHooks, HttpServerModule, TpRouter } from '../src'

@TpService()
class CustomAuthenticator extends HttpAuthenticator {

}

@TpService()
class CustomCacheProxy extends HttpCacheProxy {

}

@TpService()
class CustomHooks extends HttpHooks {

}

@TpService()
class CustomBodyFormatter extends HttpBodyFormatter {

}

@TpRouter('/service', {
    imports: [HttpServerModule], providers: [
        { provide: HttpHooks, useClass: CustomHooks },
        { provide: HttpAuthenticator, useClass: CustomAuthenticator },
        { provide: HttpCacheProxy, useClass: CustomCacheProxy },
        { provide: HttpBodyFormatter, useClass: CustomBodyFormatter },
    ]
})
class NormalRouter {

    @Get()
    async test() {
        return {}
    }
}

describe('service replace case', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true } }))
            .import(NormalRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        const port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should throw business error', async function() {
        await r.get('/service/test')
    })
})
