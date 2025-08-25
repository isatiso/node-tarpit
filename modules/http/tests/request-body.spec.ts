/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'
import iconv_lite from 'iconv-lite'
import { AddressInfo } from 'net'
import { setTimeout as sleep } from 'node:timers/promises'
import { PassThrough } from 'stream'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HttpServer } from '../src/services/http-server'
import { FormBody, HttpServerModule, JsonBody, MimeBody, Post, RawBody, TextBody, throw_bad_request, TpRequest, TpRouter } from '../src'

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

    @Post('raw')
    async add_user_raw(request: TpRequest) {
        console.log('add_user_raw')
        request.req.once('error', (err) => {
            console.log('error', err)
        })
        request.req.once('close', () => {
            console.log('close')
        })
        await sleep(400)
        const id = crypto.randomUUID()
        return { id }
    }
}

describe('request body case', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true } }))
            .import(RequestBodyRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        const port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should parse body according to Content-Type', async function() {
        await r.post('/user/mime', iconv_lite.encode(JSON.stringify({ name: '秦始皇', nick: '嬴政' }), 'gbk'),
            { headers: { 'Content-Type': 'application/json; charset=gbk' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/json', charset: 'gbk' })
            })
        await r.post('/user/mime', iconv_lite.encode(JSON.stringify({ name: '秦始皇', nick: '嬴政' }), 'utf-8'),
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/json', charset: 'utf-8' })
            })
        const params = new URLSearchParams()
        params.append('name', '秦始皇')
        params.append('nick', '嬴政')
        await r.post('/user/mime', params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: '秦始皇', nick: '嬴政', type: 'application/x-www-form-urlencoded', charset: 'utf-8' })
            })
    })

    it('should parse request body as json', async function() {
        await r.post('/user/text', { name: 'Leonard', nick: 'Leo' }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/json', charset: 'utf-8' })
                expect(res.data).toHaveProperty('id')
                expect(res.data.id).to.be.a('string').of.length(36)
            })
    })

    it('should parse request body as form', async function() {
        const params = new URLSearchParams()
        params.append('name', 'Leonard')
        params.append('nick', 'Leo')
        await r.post('/user/form', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/x-www-form-urlencoded', charset: 'utf-8' })
                expect(res.data).toHaveProperty('id')
                expect(res.data.id).to.be.a('string').of.length(36)
            })
    })

    it('should parse request body as text', async function() {
        await r.post('/user/text', Buffer.from(JSON.stringify({ name: 'Leonard', nick: 'Leo' })),
            { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'text/plain', charset: 'utf-8' })
                expect(res.data).toHaveProperty('id')
                expect(res.data.id).to.be.a('string').of.length(36)
            })
    })

    it('should read request as buffer', async function() {
        await r.post('/user/buffer', Buffer.from(JSON.stringify({ name: 'Leonard', nick: 'Leo' })),
            { headers: { 'Content-Type': 'application/octet-stream' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/octet-stream' })
                expect(res.data).toHaveProperty('id')
                expect(res.data.id).to.be.a('string').of.length(36)
            })
    })

    it('should treat content type as buffer if not specified', async function() {
        await r.post('/user/buffer', Buffer.from(JSON.stringify({ name: 'Leonard', nick: 'Leo' })),
            { headers: { 'Content-Type': '' } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).to.include({ name: 'Leonard', nick: 'Leo', type: 'application/octet-stream' })
                expect(res.data).toHaveProperty('id')
                expect(res.data.id).to.be.a('string').of.length(36)
            })
    })

    it('should handle aborted requests gracefully', async function() {
        const controller = new AbortController()
        const body = new PassThrough()
        body.write(Buffer.alloc(1024 * 1024))
        const request = r.post('/user/raw',
            body,
            {
                signal: controller.signal,
            }
        )
        await sleep(200)
        controller.abort()
        body.end()
        const res = await request.catch(err => err)
        expect(res.status).toBeUndefined()
        expect(res.statusText).toBeUndefined()
    })
})

