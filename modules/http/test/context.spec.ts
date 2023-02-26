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
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { IncomingMessage, ServerResponse } from 'http'
import { Get, HttpContext, HttpServerModule, RequestHeaders, TpRequest, TpResponse, TpRouter } from '../src'

chai.use(cap)

@TpService()
class SomeService {

    async some_method(...args: any[]) {
        return args
    }
}

@TpRouter('/user', { imports: [HttpServerModule], providers: [SomeService] })
class TempRouter {

    constructor(
        private service: SomeService
    ) {
    }

    @Get('service')
    async test_service(
        service: SomeService,
    ) {
        return { result: service === this.service }
    }

    @Get('request')
    async test_request(
        request: TpRequest,
        req: IncomingMessage,
    ) {
        return {
            request: request.constructor.name,
            req: req.constructor.name,
        }
    }

    @Get('response')
    async test_response(
        response: TpResponse,
        res: ServerResponse,
    ) {
        return {
            response: response.constructor.name,
            res: res.constructor.name,
        }
    }

    @Get('context')
    async test_context(
        context: HttpContext,
    ) {
        return {
            context: context.constructor.name,
        }
    }

    @Get('headers')
    async test_headers(
        headers: RequestHeaders,
    ) {
        return {
            headers: headers.constructor.name,
        }
    }

    @Get('error')
    async test_error() {
        throw new Error('some exception')
    }
}

describe('context case', function() {

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31260, expose_error: true } }))
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

    it('should inject service to constructor parameters and unit function parameters', async function() {
        await r.get('/service').then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ result: true })
        })
    })

    it('should inject TpRequest and IncomingMessage to unit function parameters', async function() {
        await r.get('/request').then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ request: 'TpRequest', req: 'IncomingMessage' })
        })
    })

    it('should inject TpResponse and ServerResponse to unit function parameters', async function() {
        await r.get('/response').then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ response: 'TpResponse', res: 'ServerResponse' })
        })
    })

    it('should inject HttpContext to unit function parameters', async function() {
        await r.get('/context').then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ context: 'HttpContext' })
        })
    })

    it('should inject RequestHeaders to unit function parameters', async function() {
        await r.get('/headers').then(res => {
            expect(res.status).to.equal(200)
            expect(res.data).to.eql({ headers: 'RequestHeaders' })
        })
    })

    it('should catch error and convert to StandardError', async function() {
        await r.get('/error').catch(err => {
            expect(err.response.status).to.equal(500)
            expect(err.response.data).to.have.property('error').which.include({
                code: 'ERR.UNCAUGHT_ERROR',
                msg: 'Internal Server Error',
                status: 500
            })
        })
    })
})
