/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import axios, { AxiosInstance } from 'axios'
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HttpServer } from '../src/services/http-server'
import { Auth, CacheUnder, Delete, finish, Get, HttpServerModule, Params, Post, Put, Route, TpHttpFinish, TpRouter } from '../src'

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
            throw new TpHttpFinish({ code: 'ERR', msg: 'custom something', status: 504 })
        })())
    }
}

describe('HttpServerModule', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, server: { keepalive_timeout: 3000, terminate_timeout: 300 } } }))
            .import(TestRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        const port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://127.0.0.1:${port}`, proxy: false })
    }, 8000)

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should response as normal', async function() {
        await r.get('/user', { params: { id: 123 } })
            .then(res => {
                expect(res.status).toEqual(200)
                expect(res.data).toEqual({ id: '123' })
            })
    })

    it('should reply 404 if handler not found', async function() {
        await r.get('/not/found', { params: { id: 123 }, responseType: 'text' })
            .catch(err => {
                expect(err.response.status).toEqual(404)
                expect(err.response.data).toEqual('Not Found')
            })
    })

    it('should reply 405 if method not allowed', async function() {
        await r.post('/user', {}, { params: { id: 123 }, responseType: 'text' })
            .catch(err => {
                expect(err.response.status).toEqual(405)
                expect(err.response.data).toEqual('Method Not Allowed')
            })
    })

    it('should reply 204 to OPTIONS request', async function() {
        await r.options('/user', { params: { id: 123 }, responseType: 'text' })
            .then(res => {
                expect(res.status).toEqual(204)
                expect(res.data).toEqual('')
            })
    })

    it('should catch custom error from finish function', async function() {
        await r.post('/finish-with-custom-error', {})
            .catch(err => {
                expect(err.response.status).toEqual(500)
                expect(err.response.data).toEqual({
                    error: {
                        code: 'ERR.UNCAUGHT_ERROR',
                        msg: 'Internal Server Error'
                    }
                })
            })
    })

    it('should catch http error from finish function', async function() {
        await r.post('/finish-with-http-error', {})
            .catch(err => {
                expect(err.response.status).toEqual(504)
                expect(err.response.data).toEqual({
                    error: {
                        code: 'ERR',
                        msg: 'Gateway Timeout',
                    }
                })
            })
    })
})
