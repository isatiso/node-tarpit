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
import {
    BusinessError,
    CrashError,
    Finish,
    finish,
    Get,
    HttpServerModule,
    StandardError,
    throw_bad_request,
    throw_business,
    throw_crash,
    throw_standard_status,
    throw_unauthorized,
    TpHttpFinish,
    TpRouter
} from '../src'
import { HTTP_STATUS } from '../src/tools/http-status'

chai.use(cap)

@TpRouter('/error', { imports: [HttpServerModule] })
class NormalRouter {

    @Get('business')
    async test_business() {
        throw_business('ERR.some', 'some message')
    }

    @Get('explicit-business')
    async test_explicit_business() {
        throw new BusinessError('ERR.some', 'some message')
    }

    @Get('crash')
    async test_crash() {
        throw_crash('ERR.crash', 'some crash message')
    }

    @Get('explicit-crash')
    async test_explicit_crash() {
        throw new CrashError('ERR.crash', 'some crash message')
    }

    @Get('standard')
    async test_standard() {
        throw_standard_status(401)
    }

    @Get('explicit-standard')
    async test_explicit_standard() {
        throw new StandardError(401, HTTP_STATUS.message_of(401))
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
        throw new Finish({})
    }
}

describe('errors case', function() {

    const platform = new Platform({ http: { port: 31254, expose_error: true } })
        .bootstrap(NormalRouter)

    const inspector = platform.expose(TpInspector)!
    const r = axios.create({ baseURL: 'http://localhost:31254/error', proxy: false })

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
        await r.get('/business', {}).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.have.property('error').which.include({ code: 'ERR.some', msg: 'some message', status: 200 })
        })
        await r.get('/explicit-business', {}).then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.have.property('error').which.include({ code: 'ERR.some', msg: 'some message', status: 200 })
        })
    })

    it('should throw crash error', async function() {
        await r.get('/crash', {}).catch(err => {
            expect(err.response.status).to.equal(500)
            expect(err.response.data).to.have.property('error').which.include({ code: 'ERR.crash', msg: 'some crash message', status: 500 })
        })
        await r.get('/explicit-crash', {}).catch(err => {
            expect(err.response.status).to.equal(500)
            expect(err.response.data).to.have.property('error').which.include({ code: 'ERR.crash', msg: 'some crash message', status: 500 })
        })
    })

    it('should throw standard error', async function() {
        await r.get('/standard', {}).catch(err => {
            expect(err.response.status).to.equal(401)
            expect(err.response.data).to.have.property('error').which.include({ code: 'STANDARD_HTTP_ERROR', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/explicit-standard', {}).catch(err => {
            expect(err.response.status).to.equal(401)
            expect(err.response.data).to.have.property('error').which.include({ code: 'STANDARD_HTTP_ERROR', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/unauthorized', {}).catch(err => {
            expect(err.response.status).to.equal(401)
            expect(err.response.data).to.have.property('error').which.include({ code: 'STANDARD_HTTP_ERROR', msg: 'Unauthorized', status: 401 })
        })
        await r.get('/bad-request', {}).catch(err => {
            expect(err.response.status).to.equal(400)
            expect(err.response.data).to.have.property('error').which.include({ code: 'STANDARD_HTTP_ERROR', msg: 'Bad Request', status: 400 })
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
})
