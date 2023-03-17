/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData, load_config } from '@tarpit/config'
import { Platform, TpConfigData, TpConfigSchema, TpInspector } from '@tarpit/core'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { ReadStream } from 'fs'
import { Get, HttpServerModule, HttpStatic, Params, PathArgs, TpHttpFinish, TpRequest, TpResponse, TpRouter } from '../src'
import { create_stream, is_fresh, is_precondition_failure } from '../src/services/http-static'
import { CacheControl } from '../src/tools/cache-control'

chai.use(cap)

@TpRouter('/', { imports: [HttpServerModule] })
class StaticRouter {

    constructor(
        private http_static: HttpStatic,
    ) {
    }

    @Get('assets/(.+)')
    async get_txt(req: TpRequest, res: TpResponse, params: Params<{ remove_etag: string }>) {
        const remove_etag = params.get_first('remove_etag')
        if (remove_etag) {
            res.set('Etag', '')
        }
        return this.http_static.serve(req, res)
    }

    @Get('custom/:filename(.+)')
    async get_custom(req: TpRequest, res: TpResponse, path_args: PathArgs<{ filename: string }>) {
        res.set('Content-Type', 'text/plain; charset=utf-8')
        res.set('Content-Length', '8')
        return this.http_static.serve(req, res, {
            path: 'assets/' + path_args.get('filename'),
            dotfile: 'allow',
            vary: ['Date'],
            cache_control: { public: true, 'max-age': 86400 }
        })
    }

    @Get('dotfile')
    async get_dotfile(req: TpRequest, res: TpResponse) {
        res.set('Last-Modified', new Date().toUTCString())
        res.set('Etag', '"abcde"')
        res.set('Cache-Control', `public`)
        res.set('Vary', 'Date')
        return this.http_static.serve(req, res, { path: 'assets/.dotfile', dotfile: 'allow' })
    }

    @Get('')
    async get_some_text_2(req: TpRequest, res: TpResponse) {
        (req as any)._url.pathname = undefined
        return this.http_static.serve(req, res, {})
    }
}

describe('static case', function() {

    const platform = new Platform(load_config<TpConfigSchema>({
        http: {
            port: 31254, expose_error: true,
            static: {
                root: './test',
                dotfile: 'deny',
                cache_size: 50,
                index: ['index.html'],
                extensions: ['.htm', '.html'],
                vary: '*'
            }
        }
    })).bootstrap(StaticRouter)

    const inspector = platform.expose(TpInspector)!
    const r = axios.create({ baseURL: 'http://localhost:31254', proxy: false })
    const http_static = platform.expose(HttpStatic)
    const sandbox = chai.spy.sandbox()


    function mock_request_and_response(override: {
        if_match?: string
        if_none_match?: string
        if_modified_since?: number
        if_unmodified_since?: number
        cache_control?: CacheControl
        etag?: string
        last_modified?: number
    }): { request: TpRequest; response: TpResponse } {
        const request: any = {}
        override?.if_match && (request.if_match = override.if_match)
        override?.if_none_match && (request.if_none_match = override.if_none_match)
        override?.if_modified_since && (request.if_modified_since = override.if_modified_since)
        override?.if_unmodified_since && (request.if_unmodified_since = override.if_unmodified_since)
        override?.cache_control && (request.cache_control = override.cache_control)
        const response: any = {}
        override?.etag && (response.etag = override.etag)
        override?.last_modified && (response.last_modified = override.last_modified)
        return { request, response }
    }

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        platform.start()
        await inspector.wait_start()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        sandbox.restore(console)
    })

    describe('serve static', function() {

        let etag: string | undefined
        let last_modified: string | undefined

        it('should serve static file', async function() {
            await r.get('/assets/some.txt').then(res => {
                expect(res.status).to.equal(200)
                expect(res.headers['content-type']).to.equal('text/plain; charset=UTF-8')
                expect(res.headers).to.have.property('etag')
                etag = res.headers['etag']
                expect(res.headers).to.have.property('last-modified')
                last_modified = res.headers['last-modified']
                expect(res.headers['content-length']).to.equal('8')
                expect(res.data.trim()).to.equal('abcdefg')
            })
        })

        it('should serve static file with custom path', async function() {
            await r.get('/custom/.dotfile').then(res => {
                expect(res.status).to.equal(200)
            })
            await r.get('/dotfile').then(res => {
                expect(res.status).to.equal(200)
            })
        })

        it('should use / as path if there is none', async function() {
            await r.get('/').catch(err => err.response).then(res => {
                expect(res.status).to.equal(404)
            })
        })

        it('should access HEAD method', async function() {
            await r.head('/assets/some.txt').then(res => {
                expect(res.status).to.equal(200)
                expect(res.headers['content-type']).to.equal('text/plain; charset=UTF-8')
                expect(res.headers).to.have.property('etag')
                etag = res.headers['etag']
                expect(res.headers).to.have.property('last-modified')
                last_modified = res.headers['last-modified']
                expect(res.headers['content-length']).to.equal('8')
                expect(res.data).to.equal('')
            })
        })

        it('should response with status 412 if precondition failure', async function() {
            await r.get('/assets/some.txt', { headers: { 'If-Match': 'wrong etag' } })
                .catch(err => err.response)
                .then(res => {
                    expect(res.status).to.equal(412)
                })
        })

        it('should response with status 304 if the source is fresh', async function() {
            await r.get('/assets/some.txt', { headers: { 'If-None-Match': etag } })
                .catch(err => err.response)
                .then(res => {
                    expect(res.status).to.equal(304)
                })
        })

        it('should response with status 404 if specified file not exists', async function() {
            await r.get('/assets/not-exist.txt')
                .catch(err => err.response)
                .then(res => {
                    expect(res.status).to.equal(404)
                    expect(res.data).to.eql({ error: { status: 404, code: '404', msg: 'Not Found', headers: {}, stack: '' } })
                })
        })

        it('should response with status 403 if configure as deny dotfile', async function() {
            await r.get('/assets/.dotfile')
                .catch(err => err.response)
                .then(res => {
                    expect(res.status).to.equal(403)
                    expect(res.data).to.eql({ error: { status: 403, code: '403', msg: 'Forbidden', headers: {}, stack: '' } })
                })
        })

        it('should response with status 404 if configure as ignore dotfile', async function() {
            if (http_static) {
                (http_static as any).dotfile = 'ignore'
            }
            await r.get('/assets/.dotfile')
                .catch(err => err.response)
                .then(res => {
                    expect(res.status).to.equal(404)
                    expect(res.data).to.eql({ error: { status: 404, code: '404', msg: 'Not Found', headers: {}, stack: '' } })
                })
        })

        it('should response as normal if configure as allow dotfile', async function() {
            if (http_static) {
                (http_static as any).dotfile = 'allow'
            }
            await r.get('/assets/.dotfile')
                .catch(err => err.response)
                .then(res => {
                    expect(res.status).to.equal(200)
                    expect(res.data.trim()).to.equal('dotfile content')
                })
        })
    })

    describe('#create_stream()', function() {

        it('should read exist file as ReadStream', async function() {
            const stream = await create_stream('./test/assets/some.txt')
            expect(stream).to.be.an.instanceof(ReadStream)
        })

        it('should read non-exist file with a TpHttpError', async function() {
            await expect(create_stream('./test/assets/non-exists.txt')).rejectedWith(TpHttpFinish)
        })
    })

    describe('#constructor()', function() {

        it('should startup with default config', function() {
            const http_static: any = new HttpStatic(new ConfigData({ http: { port: 3939 } }))
            expect(http_static).to.have.property('root').which.to.equal(process.cwd())
            expect(http_static).to.have.property('cache_size').which.to.equal(100)
        })

        it('should throw error if specified root path is not a directory', function() {
            expect(() => new HttpStatic(new TpConfigData({ http: { port: 3939, static: { root: './test/assets/some.txt' } } }))).to.throw()
        })
    })

    describe('#is_fresh()', function() {

        it('should return false if Cache-Control contains no-cache', function() {
            const { request, response } = mock_request_and_response({ cache_control: { 'no-cache': true }, etag: '"abcde"' })
            expect(is_fresh(request, response)).to.be.false
        })

        it('should return true if If-None-Match is *', function() {
            const { request, response } = mock_request_and_response({ if_none_match: '*', etag: '"abcde"' })
            expect(is_fresh(request, response)).to.be.true
        })

        it('should return false if Etag not exists', function() {
            const { request, response } = mock_request_and_response({ if_none_match: '*' })
            expect(is_fresh(request, response)).to.be.false
        })

        it('should return true if If-None-Match contains Etag', function() {
            const { request, response } = mock_request_and_response({ if_none_match: '"1", "2", "3"', etag: '"2"' })
            expect(is_fresh(request, response)).to.be.true
        })

        it('should return false if If-None-Match does not contain Etag', function() {
            const { request, response } = mock_request_and_response({ if_none_match: '"1", "2", "3"', etag: '"4"' })
            expect(is_fresh(request, response)).to.be.false
        })

        it('should return true if If-Modified-Since is greater than Last-Modified', function() {
            const { request, response } = mock_request_and_response({ if_modified_since: 1670000000, last_modified: 1669000000 })
            expect(is_fresh(request, response)).to.be.true
        })

        it('should return false if If-Modified-Since is less than Last-Modified', function() {
            const { request, response } = mock_request_and_response({ if_modified_since: 1669000000, last_modified: 1670000000 })
            expect(is_fresh(request, response)).to.be.false
        })

        it('should return false if Last-Modified not exists', function() {
            const { request, response } = mock_request_and_response({ if_modified_since: 1670000000 })
            expect(is_fresh(request, response)).to.be.false
        })

        it('should ignore If-Modified-Since if If-None-Match exists', function() {
            const { request, response } = mock_request_and_response({ if_none_match: '"1", "2", "3"', etag: '"2"', if_modified_since: 1669000000, last_modified: 1670000000 })
            expect(is_fresh(request, response)).to.be.true
        })
    })

    describe('#is_precondition_failure()', function() {

        it('should return true if If-Match is *', function() {
            const { request, response } = mock_request_and_response({ if_match: '*', etag: '"abcde"' })
            expect(is_precondition_failure(request, response)).to.be.false
        })

        it('should return true if Etag not exists', function() {
            const { request, response } = mock_request_and_response({ if_match: '*' })
            expect(is_precondition_failure(request, response)).to.be.true
        })

        it('should return false if If-Match contains Etag', function() {
            const { request, response } = mock_request_and_response({ if_match: '"1", "2", "3"', etag: '"2"' })
            expect(is_precondition_failure(request, response)).to.be.false
        })

        it('should return false if If-Match does not contain Etag', function() {
            const { request, response } = mock_request_and_response({ if_match: '"1", "2", "3"', etag: '"4"' })
            expect(is_precondition_failure(request, response)).to.be.true
        })

        it('should return false if If-Unmodified-Since is greater than Last-Modified', function() {
            const { request, response } = mock_request_and_response({ if_unmodified_since: 1670000000, last_modified: 1669000000 })
            expect(is_precondition_failure(request, response)).to.be.false
        })

        it('should return true if If-Unmodified-Since is less than Last-Modified', function() {
            const { request, response } = mock_request_and_response({ if_unmodified_since: 1669000000, last_modified: 1670000000 })
            expect(is_precondition_failure(request, response)).to.be.true
        })

        it('should return true if Last-Modified not exists', function() {
            const { request, response } = mock_request_and_response({ if_unmodified_since: 1670000000 })
            expect(is_precondition_failure(request, response)).to.be.true
        })
    })
})
