/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector } from '@tarpit/core'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_http from 'chai-http'
import { HttpServerModule, Post, RawBody, TpRouter } from '../src'
import { HttpServer } from '../src/services/http-server'

chai.use(cap)
chai.use(chai_http)

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Post('buffer')
    async add_user_by_buffer(body: RawBody) {
        return { length: body.byteLength }
    }
}

describe('max-byte-length case', function() {

    const platform = new Platform({ http: { port: 31254, expose_error: true, body: { max_length: 10 } } })
        .bootstrap(TempRouter)

    const inspector = platform.expose(TpInspector)!
    const http_server = platform.expose(HttpServer)!

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

    it('should get error of 413', async function() {
        await chai.request(http_server.server)
            .post('/user/buffer')
            .type('buffer')
            .send('abc12345678')
            .then(function(res) {
                expect(res).to.have.status(413)
                expect(res.text).to.equal('Payload Too Large')
            })
    })

    it('should act as normal if body not too large', async function() {
        await chai.request(http_server.server)
            .post('/user/buffer')
            .type('buffer')
            .send(Buffer.from('abc1234567'))
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.eql({ length: 10 })
            })
    })
})
