/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpService } from '@tarpit/core'
import axios from 'axios'
import chai from 'chai'
import cap from 'chai-as-promised'
import { Get, HttpAuthenticator, HttpCacheProxy, HttpErrorFormatter, HttpHooks, HttpResponseFormatter, HttpServerModule, TpRouter } from '../src'

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
class CustomErrorFormatter extends HttpErrorFormatter {

}

@TpService()
class CustomResponseFormatter extends HttpResponseFormatter {

}

@TpRouter('/service', {
    imports: [HttpServerModule], providers: [
        { provide: HttpHooks, useClass: CustomHooks },
        { provide: HttpAuthenticator, useClass: CustomAuthenticator },
        { provide: HttpCacheProxy, useClass: CustomCacheProxy },
        { provide: HttpErrorFormatter, useClass: CustomErrorFormatter },
        { provide: HttpResponseFormatter, useClass: CustomResponseFormatter },
    ]
})
class NormalRouter {

    @Get()
    async test() {
        return {}
    }
}

describe('service replace case', function() {

    const platform = new Platform({ http: { port: 31254, expose_error: true } })
        .bootstrap(NormalRouter)

    const inspector = platform.expose(TpInspector)!

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

    it('should throw business error', async function() {
        await axios.get('http://localhost:31254/service/test')
    })
})
