/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpInspector } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import crypto from 'crypto'
import iconv_lite from 'iconv-lite'
import { FormBody, HttpServerModule, JsonBody, MimeBody, Post, RawBody, TextBody, throw_bad_request, TpRequest, TpRouter } from '../src'

chai.use(cap)

@TpRouter('/user', { imports: [HttpServerModule] })
class RequestBodyRouter {

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

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31260, expose_error: true } }))
        .bootstrap(RequestBodyRouter)

    const inspector = platform.expose(TpInspector)!

    const sandbox = chai.spy.sandbox()

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

    it('should parse body according to Content-Type', async function() {
        await axios.post('http://localhost:31260/user/mime', iconv_lite.encode(JSON.stringify({ name: '秦始皇', nick: '嬴政' }), 'gbk'),
            { headers: { 'Content-Type': 'application/json; charset=gbk' }, proxy: false })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/json', charset: 'gbk' })
            })
        await axios.post('http://localhost:31260/user/mime', iconv_lite.encode(JSON.stringify({ name: '秦始皇', nick: '嬴政' }), 'utf-8'),
            { headers: { 'Content-Type': 'application/json; charset=utf-8' }, proxy: false })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/json', charset: 'utf-8' })
            })
        const params = new URLSearchParams()
        params.append('name', '秦始皇')
        params.append('nick', '嬴政')
        await axios.post('http://localhost:31260/user/mime', params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' }, proxy: false })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/x-www-form-urlencoded', charset: 'utf-8' })
            })
    })

    it('should parse request body as json', async function() {
        await axios.post('http://localhost:31260/user/text', { name: 'Leonard', nick: 'Leo' }, { headers: { 'Content-Type': 'application/json; charset=utf-8' }, proxy: false })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/json', charset: 'utf-8' })
                expect(res.data).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

    it('should parse request body as form', async function() {
        const params = new URLSearchParams()
        params.append('name', 'Leonard')
        params.append('nick', 'Leo')
        await axios.post('http://localhost:31260/user/form', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' }, proxy: false })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/x-www-form-urlencoded', charset: 'utf-8' })
                expect(res.data).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

    it('should parse request body as text', async function() {
        await axios.post('http://localhost:31260/user/text', Buffer.from(JSON.stringify({ name: 'Leonard', nick: 'Leo' })),
            { headers: { 'Content-Type': 'text/plain; charset=utf-8' }, proxy: false })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'text/plain', charset: 'utf-8' })
                expect(res.data).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

    it('should read request as buffer', async function() {
        await axios.post('http://localhost:31260/user/buffer', Buffer.from(JSON.stringify({ name: 'Leonard', nick: 'Leo' })),
            { headers: { 'Content-Type': 'application/octet-stream' }, proxy: false })
            .then(res => {
                expect(res.status).to.equal(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/octet-stream' })
                expect(res.data).to.have.property('id').which.is.a('string').of.length(36)
            })
    })

})

