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
import chai_spies from 'chai-spies'
import { WebSocket } from 'ws'
import { finish, Get, HttpServerModule, throw_bad_request, throw_http_finish, throw_unauthorized, TpHttpFinish, TpRouter, TpWebSocket, WS } from '../src'
import { HTTP_STATUS } from '../src/tools/http-status'

chai.use(cap)
chai.use(chai_spies)

@TpRouter('/error', { imports: [HttpServerModule] })
class NormalRouter {

    @Get('standard')
    async test_standard() {
        throw_unauthorized()
    }

    @Get('explicit-standard')
    async test_explicit_standard() {
        throw new TpHttpFinish({ status: 401, code: '401', msg: HTTP_STATUS.message_of(401) })
    }

    @Get('http')
    async test_http() {
        throw new TpHttpFinish({ code: 'PURE_ERROR', msg: 'some message', status: 500 })
    }

    @Get('unauthorized')
    async test_unauthorized() {
        throw_unauthorized()
    }

    @Get('bad-request')
    async test_bad_request() {
        throw_bad_request()
    }

    @Get('finish-called')
    async test_finish_called() {
        finish({})
    }

    @Get('finish-thrown')
    async test_finish_thrown() {
        // throw new Finish({})
        throw_http_finish(200, { body: {} })
    }

    @WS()
    async subscribe(ws: TpWebSocket) {
        ws.on('message', data => {
            ws.send(data.toString())
        })
    }

    @WS()
    async subscribe_with_error() {
        throw new Error('test subscribe with error')
    }
}

describe('errors case', function() {

    const platform = new Platform({ http: { port: 31254, expose_error: true } })
        .bootstrap(NormalRouter)

    const inspector = platform.expose(TpInspector)!
    const r = axios.create({ baseURL: 'http://localhost:31254/error', proxy: false })

    const tmp = console.log

    before(async function() {
        // console.log = (..._args: any[]) => undefined
        platform.start()
        await inspector.wait_start()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        console.log = tmp
    })

    it('should throw standard error', async function() {

        await r.get('/standard', {}).catch(err => {
            expect(err.response.status).to.equal(401)
            expect(err.response.data).to.have.property('error').which.include({ code: '401', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/explicit-standard', {}).catch(err => {
            expect(err.response.status).to.equal(401)
            expect(err.response.data).to.have.property('error').which.include({ code: '401', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/unauthorized', {}).catch(err => {
            expect(err.response.status).to.equal(401)
            expect(err.response.data).to.have.property('error').which.include({ code: '401', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/bad-request', {}).catch(err => {
            expect(err.response.status).to.equal(400)
            expect(err.response.data).to.have.property('error').which.include({ code: '400', msg: 'Bad Request', status: 400 })
        })
    })

    it('should throw http error', async function() {
        await r.get('/http', {}).catch(err => {
            expect(err.response.status).to.equal(500)
            expect(err.response.data).to.have.property('error').which.include({ code: 'PURE_ERROR', msg: 'some message', status: 500 })
        })
    })

    it('should finish', async function() {
        await r.get('/finish-called', {}).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({})
        })
        await r.get('/finish-thrown', {}).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({})
        })
    })

    it('should throw error when socket api not found', function(done) {
        const ws = new WebSocket('ws://localhost:31254/not_exist')
        ws.on('error', err => {
            expect(err).to.be.instanceof(Error)
            done()
        })
    })

    it('should close socket when socket api throw an error during handshake', function(done) {
        const ws = new WebSocket('ws://localhost:31254/error/subscribe_with_error')
        ws.on('close', (code, reason) => {
            expect(code).to.equal(1011)
            expect(reason.toString()).to.equal('Error: test subscribe with error')
            done()
        })
    })
})
