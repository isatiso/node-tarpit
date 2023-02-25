/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector } from '@tarpit/core'
import { expect } from 'chai'
import { GenericCollection, MongodbModule, TpMongo } from '../src'

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
    let inspector: TpInspector
    let mongo: TestNoGenericMongo

    const tmp = console.log
    before(async function() {
        console.log = () => undefined
        platform = new Platform({ mongodb: { url } })
            .import(MongodbModule)

        inspector = platform.expose(TpInspector)!
        mongo = platform.expose(TestNoGenericMongo)!
        platform.start()
        await inspector.wait_start()
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        console.log = tmp
    })

    it('should throw an error if TpMongo is not inherit from GenericCollection', async function() {
        const p = new Platform({ mongodb: { url } })
            .import(MongodbModule)
        expect(() => p.import(TestNoGenericMongo)).to.throw('A TpMongo class must inherit from GenericCollection directly.')
    })

    it('should throw an error if specified a client_name of nothing', async function() {
        const p = new Platform({ mongodb: { url } })
            .import(MongodbModule)
        expect(() => p.import(TestNotExistClientMongo)).to.throw('Can not find specified MongoClient of name not_exists.')
    })
})
