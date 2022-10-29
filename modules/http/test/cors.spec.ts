/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector } from '@tarpit/core'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { HttpServerModule, Route, TpRouter } from '../src'

chai.use(cap)

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Route(['GET', 'POST'], 'cors')
    async test_cors() {
        return {}
    }
}

describe('context case', function() {

    const platform = new Platform({
        http: {
            port: 31260,
            cors: { allow_headers: 'Authorization', allow_methods: 'GET,POST', allow_origin: '*', max_age: 3600 },
            expose_error: true,
        }
    })
        .bootstrap(TempRouter)

    const inspector = platform.expose(TpInspector)!
    const r = axios.create({ baseURL: 'http://localhost:31260/user', proxy: false })

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

    it('should serve OPTIONS request', async function() {
        await r.options('/cors').then(res => {
            expect(res.status).to.equal(204)
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
