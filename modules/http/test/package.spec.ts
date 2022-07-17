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
import chai_http from 'chai-http'
import { Auth, CacheUnder, Delete, Get, HttpServerModule, Params, Post, Put, Route, TpRouter } from '../src'
import { HttpServer } from '../src/services'

chai.use(cap)
chai.use(chai_http)

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
            setTimeout(() => resolve(null), 600)
        })
        return { a: 123 }
    }
}

describe('HttpServerModule', function() {

    const platform = new Platform({ http: { port: 31254, server: { keepalive_timeout: 3000, terminate_timeout: 300 } } })
        .bootstrap(TestRouter)

    const inspector = platform.expose(TpInspector)!
    const http_server = platform.expose(HttpServer)!

    const tmp = console.log

    before(async function() {
        console.log = (..._args: any[]) => undefined
        platform.start()
        await inspector.wait_start()
        axios.get('http://localhost:31254/delay').then()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        console.log = tmp
    })

    it('should ', async function() {
        await chai.request(http_server.server)
            .get('/user')
            .query({ id: 123 })
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.text).to.equal('{"id":"123"}')
                expect(res.body).to.eql({ id: '123' })
            })
    })

    it('should reply 404 if handler not found', async function() {
        await chai.request(http_server.server)
            .get('/not/found')
            .then(function(res) {
                expect(res).to.have.status(404)
                expect(res.text).to.equal('Not Found')
            })
    })

    it('should reply 405 if method not allowed', async function() {
        await chai.request(http_server.server)
            .post('/user')
            .then(function(res) {
                expect(res).to.have.status(405)
                expect(res.text).to.equal('Method Not Allowed')
            })
    })

    it('should reply 204 to OPTIONS request', async function() {
        await chai.request(http_server.server)
            .options('/user')
            .then(function(res) {
                expect(res).to.have.status(204)
                expect(res.text).to.equal('')
            })
    })
})
