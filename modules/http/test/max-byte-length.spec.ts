/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpInspector } from '@tarpit/core'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { HttpServerModule, Post, RawBody, TpRouter } from '../src'

chai.use(cap)

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Post('buffer')
    async add_user_by_buffer(body: RawBody) {
        return { length: body.byteLength }
    }
}

describe('max-byte-length case', function() {

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31254, expose_error: true, body: { max_length: 10 } } }))
        .bootstrap(TempRouter)

    const inspector = platform.expose(TpInspector)!
    const r = axios.create({ baseURL: 'http://localhost:31254/user', proxy: false })

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        platform.start()
        await inspector.wait_start()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        sandbox.restore()
    })

    it('should get error of 413', async function() {
        const res = await r.post('/buffer', 'abc12345678').catch(err => err)
        expect(res.response.status).to.equal(413)
        expect(res.response.statusText).to.equal('Payload Too Large')
    })

    it('should act as normal if body not too large', async function() {
        const res = await r.post('/buffer', 'abc1234567')
        expect(res.status).to.equal(200)
        expect(res.data).to.eql({ length: 10 })
    })
})
