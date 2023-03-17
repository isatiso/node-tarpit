/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpInspector, TpService } from '@tarpit/core'
import axios from 'axios'
import chai from 'chai'
import cap from 'chai-as-promised'
import { Get, HttpAuthenticator, HttpBodyFormatter, HttpCacheProxy, HttpHooks, HttpServerModule, TpRouter } from '../src'

chai.use(cap)

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

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31254, expose_error: true } }))
        .bootstrap(NormalRouter)

    const inspector = platform.expose(TpInspector)!

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        platform.start()
        await inspector.wait_start()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        sandbox.restore(console)
    })

    it('should throw business error', async function() {
        await axios.get('http://localhost:31254/service/test', { proxy: false })
    })
})
