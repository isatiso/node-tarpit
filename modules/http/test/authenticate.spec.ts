/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_http from 'chai-http'
import { Auth, Guard, HttpServerModule, Post, TpRouter } from '../src'
import { HttpServer } from '../src/services'

chai.use(cap)
chai.use(chai_http)

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Auth()
    @Post('need-auth')
    async do_something(guard: Guard) {
        const type = guard.get_if('type', Jtl.exist, null)
        const credentials = guard.get_if('credentials', Jtl.exist, null)
        return { type, credentials }
    }

    @Post('no-need')
    async do_something_else(guard: Guard) {
        const type = guard.get_if('type', Jtl.exist, null)
        const credentials = guard.get_if('credentials', Jtl.exist, null)
        return { type, credentials }
    }
}

describe('authenticate case', function() {

    const platform = new Platform({ http: { port: 31254, expose_error: true } })
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

    it('should authenticate request in simple way if route under @Auth()', async function() {
        await chai.request(http_server.server)
            .post('/user/need-auth')
            .auth('admin', 'admin_password')
            .send({ a: 1 })
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.eql({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
            })
    })

    it('should throw 401 when header Authorization not found if route under @Auth()', async function() {
        await chai.request(http_server.server)
            .post('/user/need-auth')
            .send({ a: 1 })
            .then(function(res) {
                expect(res).to.have.status(401)
            })
    })

    it('should extract credentials if no @Auth() over the route but Guard is required', async function() {
        await chai.request(http_server.server)
            .post('/user/no-need')
            .auth('admin', 'admin_password')
            .send({ a: 1 })
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.eql({ type: 'Basic', credentials: Buffer.from('admin:admin_password').toString('base64') })
            })
        await chai.request(http_server.server)
            .post('/user/no-need')
            .send({ a: 1 })
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.eql({ type: null, credentials: null })
            })
    })
})
