/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_http from 'chai-http'
import crypto from 'crypto'
import iconv_lite from 'iconv-lite'
import { FormBody, HttpServerModule, JsonBody, MimeBody, Post, RawBody, TextBody, TpRequest, TpRouter } from '../src'
import { throw_bad_request } from '../src/errors'
import { HttpServer } from '../src/services'

chai.use(cap)
chai.use(chai_http)

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Post('json')
    async add_user_by_json(body: JsonBody<{
        name: string
        nick: string
    }>, request: TpRequest) {
        const name = body.ensure('name', Jtl.non_empty_string)
        const nick = body.ensure('nick', Jtl.non_empty_string)
        const id = crypto.randomUUID()
        return { id, name, nick, type: request.type, charset: request.charset }
    }

    @Post('form')
    async add_user_by_form(body: FormBody<{
        name: string
        nick: string
    }>, request: TpRequest) {
        const name = body.ensure('name', Jtl.non_empty_string)
        const nick = body.ensure('nick', Jtl.non_empty_string)
        const id = crypto.randomUUID()
        return { id, name, nick, type: request.type, charset: request.charset }
    }

    @Post('text')
    async add_user_by_text(body: TextBody, request: TpRequest) {
        const obj = JSON.parse(body as string)
        const id = crypto.randomUUID()
        return { id, name: obj.name, nick: obj.nick, type: request.type, charset: request.charset }
    }

    @Post('buffer')
    async add_user_by_buffer(body: RawBody, request: TpRequest) {
        const text = body.toString('utf-8')
        const obj = JSON.parse(text)
        const id = crypto.randomUUID()
        return { id, name: obj.name, nick: obj.nick, type: request.type, charset: request.charset }
    }

    @Post('mime')
    async add_user_by_mime(body: MimeBody<{ name: string, nick: string }>) {
        if (body.type !== 'application/json' && body.type !== 'application/x-www-form-urlencoded') {
            throw_bad_request()
        }
        const name = body.checker!.ensure('name', /^秦始皇$/)
        const nick = body.checker!.ensure('nick', /^嬴政$/)
        return { name, nick, type: body.type, charset: body.charset }
    }
}

describe('request body case', function() {

    const platform = new Platform({ http: { port: 31260, expose_error: true } })
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

    it('should parse body according to Content-Type', async function() {
        await axios.post('http://localhost:31260/user/mime', iconv_lite.encode(JSON.stringify({ name: '秦始皇', nick: '嬴政' }), 'gbk'),
            { headers: { 'Content-Type': 'application/json; charset=gbk' } })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/json', charset: 'gbk' })
            })
        await axios.post('http://localhost:31260/user/mime', iconv_lite.encode(JSON.stringify({ name: '秦始皇', nick: '嬴政' }), 'utf-8'),
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/json', charset: 'utf-8' })
            })
        const params = new URLSearchParams()
        params.append('name', '秦始皇')
        params.append('nick', '嬴政')
        await axios.post('http://localhost:31260/user/mime', params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' } })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/x-www-form-urlencoded', charset: 'utf-8' })
            })
    })

    it('should parse request body as json', async function() {
        await chai.request(http_server.server)
            .post('/user/json')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send({ name: 'Leonard', nick: 'Leo' })
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/json', charset: 'utf-8' })
                expect(res.body).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

    it('should parse request body as form', async function() {
        await chai.request(http_server.server)
            .post('/user/form')
            .type('form')
            .set('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8')
            .send({ name: 'Leonard', nick: 'Leo' })
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/x-www-form-urlencoded', charset: 'utf-8' })
                expect(res.body).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

    it('should parse request body as text', async function() {
        await chai.request(http_server.server)
            .post('/user/text')
            .type('text')
            .set('Content-Type', 'text/plain; charset=utf-8')
            .send(JSON.stringify({ name: 'Leonard', nick: 'Leo' }))
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.include({ name: 'Leonard', nick: 'Leo', type: 'text/plain', charset: 'utf-8' })
                expect(res.body).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

    it('should read request as buffer', async function() {
        await chai.request(http_server.server)
            .post('/user/buffer')
            .type('buffer')
            .send(Buffer.from(JSON.stringify({ name: 'Leonard', nick: 'Leo' })))
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res.body).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/octet-stream' })
                expect(res.body).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

})

