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
import chai_spies from 'chai-spies'
import { ContentType, Get, HttpServerModule, TpResponse, TpRouter } from '../src'

chai.use(cap)
chai.use(chai_spies)

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Get()
    @ContentType('text/html')
    async html() {
        return '<body>HTML BODY</body>'
    }

    @Get()
    @ContentType('text/plain')
    async plain() {
        return '<body>HTML BODY</body>'
    }

    @Get()
    async plain_with_no_declaration() {
        return '<body>HTML BODY</body>'
    }

    @Get()
    async json_with_no_declaration() {
        return { a: 1, b: 2 }
    }

    @Get()
    @ContentType('text/plain')
    async json_as_text_plain() {
        return { a: 1, b: 2 }
    }

    @Get()
    @ContentType('text/plain')
    async json_with_inner_declaration(response: TpResponse) {
        response.content_type = 'application/json'
        return { a: 1, b: 2 }
    }
}

describe('content type case', function() {

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31260, expose_error: true } }))
        .bootstrap(TempRouter)
    const inspector = platform.expose(TpInspector)!
    const sandbox = chai.spy.sandbox()
    const r = axios.create({ baseURL: 'http://localhost:31260', proxy: false })

    before(async function() {
        // sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        platform.start()
        await inspector.wait_start()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        sandbox.restore()
    })

    it('should set Content-Type by annotation', async function() {

        await r.get('/user/html').then(res => {
            expect(res.status).to.equal(200)
            expect(res.headers['content-type']).to.equal('text/html; charset=utf-8')
            expect(res.data).to.equal('<body>HTML BODY</body>')
        })

        await r.get('/user/plain').then(res => {
            expect(res.status).to.equal(200)
            expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8')
            expect(res.data).to.equal('<body>HTML BODY</body>')
        })
    })

    it('should set Content-Type as text/plain if not specified when response is text', async function() {

        await r.get('/user/plain_with_no_declaration').then(res => {
            expect(res.status).to.equal(200)
            expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8')
            expect(res.data).to.equal('<body>HTML BODY</body>')
        })
    })

    it('should set Content-Type as application/json if not specified when response is an object', async function() {

        await r.get('/user/json_with_no_declaration').then(res => {
            expect(res.status).to.equal(200)
            expect(res.headers['content-type']).to.equal('application/json; charset=utf-8')
            expect(res.data).to.eql({ a: 1, b: 2 })
        })
    })

    it('should set Content-Type as text/plain as specified whatever the type of the response is', async function() {

        await r.get('/user/json_as_text_plain').then(res => {
            expect(res.status).to.equal(200)
            expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8')
        })
    })

    it('should cover the ContentType setting when explicitly set inside the handler', async function() {

        await r.get('/user/json_with_inner_declaration').then(res => {
            expect(res.status).to.equal(200)
            expect(res.headers['content-type']).to.equal('application/json; charset=utf-8')
            expect(res.data).to.eql({ a: 1, b: 2 })
        })
    })
})
