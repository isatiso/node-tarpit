/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import axios, { AxiosInstance } from 'axios'
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HttpServer } from '../src/services/http-server'
import { CacheUnder, HttpServerModule, JsonBody, Post, ResponseCache, TpRouter } from '../src'

const mongo_query = vi.fn()

@TpService()
class SomeMongo {
    async query() {
        mongo_query()
        return { job: 'clean room' }
    }
}

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @CacheUnder('admin')
    @Post('job')
    async get_group_job(
        mongo: SomeMongo,
        cache: ResponseCache,
        body: JsonBody<{ name: string, age: number }>) {

        const age = body.ensure('age', Jtl.$gt(18))

        await cache.respond_if_cache(Math.floor(age / 4) + '')

        await cache.cache_and_respond(mongo.query())
    }
}

describe('response cache case', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({ http: { port: 0, expose_error: true } }))
            .import(SomeMongo)
            .import(TempRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        const port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}`, proxy: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should use cache if exists', async function() {

        await r.post('/user/job', { name: 'leo', age: 28 }).then(res => {
            expect(res.status).toEqual(200)
            expect(mongo_query).toHaveBeenCalledTimes(1)
            expect(res.data).to.include({ job: 'clean room' })
        })

        await r.post('/user/job', { name: 'leo', age: 28 }).then(res => {
            expect(res.status).toEqual(200)
            expect(mongo_query).toHaveBeenCalledTimes(1)
            expect(res.data).to.include({ job: 'clean room' })
        })
    })
})
