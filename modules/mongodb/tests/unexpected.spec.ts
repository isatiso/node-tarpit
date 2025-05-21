/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { GenericCollection, MongodbModule, TpMongo } from '../src'

chai.use(chai_spies)

@TpMongo('test', 'no_generic')
class TestNoGenericMongo {
}

@TpMongo('test', 'not_exists', { client_name: 'not_exists' as any })
class TestNotExistClientMongo extends GenericCollection<{ a: string }>() {
}

describe('unexpected case', function() {

    // this.slow(200)

    const url = process.env.MONGODB_URL ?? ''
    let platform: Platform
    let mongo: TestNoGenericMongo

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        platform = new Platform(load_config({ mongodb: { url } }))
            .import(MongodbModule)

        mongo = platform.expose(TestNoGenericMongo)!
        await platform.start()
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    after(async function() {
        await platform.terminate()
        sandbox.restore()
    })

    it('should throw an error if TpMongo is not inherit from GenericCollection', async function() {
        const p = new Platform(load_config({ mongodb: { url } }))
            .import(MongodbModule)
        expect(() => p.import(TestNoGenericMongo)).to.throw('A TpMongo class must inherit from GenericCollection directly.')
    })

    it('should throw an error if specified a client_name of nothing', async function() {
        const p = new Platform(load_config({ mongodb: { url } }))
            .import(MongodbModule)
        expect(() => p.import(TestNotExistClientMongo)).to.throw('Can not find specified MongoClient of name not_exists.')
    })
})
