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
import { Auth, CacheUnder, Delete, finish, Get, HttpServerModule, Params, Post, Put, Route, TpHttpError, TpRouter } from '../src'

chai.use(cap)

@TpRouter('/', { imports: [HttpServerModule] })
class TestRouter {

    @CacheUnder('asd')
    @Get()
    async user(params: Params<{ id: string }>) {
        const id = params.get_first('id')
        return { id }
    }

    @Post()
    @Route(['POST'])
    async add_user(params: Params<{ id: string }>) {
        const id = params.get_first('id')
        return { id }
    }

    @Auth()
    @Put()
    async modify_user(params: Params<{ id: string }>) {
        const id = params.get_first('id')
        return { id }
    }

    @Delete()
    async delete_user(params: Params<{ id: string }>) {
        const id = params.get_first('id')
        return { id }
    }

    @Post()
    @Get()
    async delay() {
        await new Promise(resolve => {
            setTimeout(() => resolve(null), 1000)
        })
        return { a: 123 }
    }

    @Post('finish-with-custom-error')
    async finish_custom() {
        finish((async () => {
            throw new Error('custom something')
        })())
    }

    @Post('finish-with-http-error')
    async finish_http_error() {
        finish((async () => {
            throw new TpHttpError({ code: 'ERR', msg: 'custom something', status: 504 })
        })())
    }
}

describe('HttpServerModule', function() {

    this.timeout(8000)

    const platform = new Platform({ http: { port: 31254, server: { keepalive_timeout: 3000, terminate_timeout: 300 } } })
        .bootstrap(TestRouter)

    const inspector = platform.expose(TpInspector)!

    const r = axios.create({ baseURL: 'http://127.0.0.1:31254', proxy: false })

    const tmp = console.log

    before(async function() {
        console.log = (..._args: any[]) => undefined
        platform.start()
        await inspector.wait_start()
        axios.get('http://127.0.0.1:31254/delay', { proxy: false }).then()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        console.log = tmp
    })

    it('should response as normal', async function() {
        await r.get('/user', { params: { id: 123 } })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.eql({ id: '123' })
            })
    })

    it('should reply 404 if handler not found', async function() {
        await r.get('/not/found', { params: { id: 123 }, responseType: 'text' })
            .catch(err => {
                expect(err.response.status).to.equal(404)
                expect(err.response.data).to.equal('Not Found')
            })
    })

    it('should reply 405 if method not allowed', async function() {
        await r.post('/user', {}, { params: { id: 123 }, responseType: 'text' })
            .catch(err => {
                expect(err.response.status).to.equal(405)
                expect(err.response.data).to.equal('Method Not Allowed')
            })
    })

    it('should reply 204 to OPTIONS request', async function() {
        await r.options('/user', { params: { id: 123 }, responseType: 'text' })
            .then(res => {
                expect(res.status).to.equal(204)
                expect(res.data).to.equal('')
            })
    })

    it('should catch custom error from finish function', async function() {
        await r.post('/finish-with-custom-error', {})
            .catch(err => {
                expect(err.response.status).to.equal(500)
                expect(err.response.data).to.eql({
                    error: {
                        code: 'STANDARD_HTTP_ERROR',
                        msg: 'Internal Server Error'
                    }
                })
            })
    })

    it('should catch http error from finish function', async function() {
        await r.post('/finish-with-http-error', {})
            .catch(err => {
                expect(err.response.status).to.equal(504)
                expect(err.response.data).to.eql({
                    error: {
                        code: 'ERR',
                        msg: 'Gateway Timeout',
                    }
                })
            })
    })
})
