/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpService } from '@tarpit/core'
import axios from 'axios'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { HttpContext, HttpHooks, HttpServerModule, Post, RawBody, TpHttpFinish, TpRouter } from '../src'

chai.use(cap)

@TpService()
class CustomHooks extends HttpHooks {

    async on_init(context: HttpContext): Promise<void> {
        throw new Error('lkj')
    }

    async on_error(context: HttpContext, err: TpHttpFinish): Promise<void> {
        throw new Error('lkj')
    }

    async on_finish(context: HttpContext, res: any): Promise<void> {
        throw new Error('lkj')
    }
}

@TpRouter('/user', { imports: [HttpServerModule] })
class TempRouter {

    @Post('buffer')
    async add_user_by_buffer(body: RawBody) {
        return { length: body.byteLength }
    }

    @Post('error')
    async throw_error() {
        throw new Error()
    }
}

describe('throw error in hooks case', function() {

    const platform = new Platform({ http: { port: 31254, expose_error: true, body: { max_length: 10 } } })
        .import({ provide: HttpHooks, useClass: CustomHooks })
        .bootstrap(TempRouter)

    const inspector = platform.expose(TpInspector)!
    const r = axios.create({ baseURL: 'http://localhost:31254', proxy: false })
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

    it('should catch error from on_init and on_finished called', async function() {
        await r.post('/user/buffer', Buffer.from('some thing')).then(res => {
            expect(res.status).to.equal(200)
        })
    })

    it('should catch error from on_error called', async function() {
        await r.post('/user/error', Buffer.from('some thing')).catch(err => {
            expect(err.response.status).to.equal(500)
        })
    })
})
