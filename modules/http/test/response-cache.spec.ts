/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpInspector, TpService } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { CacheUnder, HttpServerModule, JsonBody, Post, ResponseCache, TpRouter } from '../src'

chai.use(cap)
chai.use(chai_spies)

const mongo_query = chai.spy()

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

    const platform = new Platform(load_config<TpConfigSchema>({ http: { port: 31260, expose_error: true } }))
        .import(SomeMongo)
        .bootstrap(TempRouter)

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

    it('should use cache if exists', async function() {

        const r = axios.create({ baseURL: 'http://localhost:31260', proxy: false })

        await r.post('/user/job', { name: 'leo', age: 28 }).then(res => {
            expect(res.status).to.equal(200)
            expect(mongo_query).to.have.been.called.once
            expect(res.data).to.include({ job: 'clean room' })
        })

        await r.post('/user/job', { name: 'leo', age: 28 }).then(res => {
            expect(res.status).to.equal(200)
            expect(mongo_query).to.have.been.called.once
            expect(res.data).to.include({ job: 'clean room' })
        })
    })
})
