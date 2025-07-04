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

    const platform = new Platform(load_config<TpConfigSchema>({
        http: {
            port: 31260,
            cors: { allow_headers: 'Authorization', allow_methods: 'GET,POST', allow_origin: '*', max_age: 3600 },
            expose_error: true,
        }
    }))
        .import(TempRouter)

    const r = axios.create({ baseURL: 'http://localhost:31260/user', proxy: false })

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        await platform.start()

    })

    after(async function() {
        await platform.terminate()

        sandbox.restore()
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
