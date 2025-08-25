/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { GenericCollection, MongodbModule, TpMongo } from '../src'

@TpMongo('test', 'no_generic')
class TestNoGenericMongo {
}

@TpMongo('test', 'not_exists', { client_name: 'not_exists' as any })
class TestNotExistClientMongo extends GenericCollection<{ a: string }>() {
}

describe('unexpected case', function() {

    let platform: Platform
    const mongodb_url = process.env.MONGODB_URL!

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config({ mongodb: { url: mongodb_url } }))
            .import(MongodbModule)
        await platform.start()
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should throw an error if TpMongo is not inherit from GenericCollection', async function() {
        const p = new Platform(load_config({ mongodb: { url: mongodb_url } }))
            .import(MongodbModule)
        expect(() => p.import(TestNoGenericMongo)).to.throw('A TpMongo class must inherit from GenericCollection directly.')
    })

    it('should throw an error if specified a client_name of nothing', async function() {
        const p = new Platform(load_config({ mongodb: { url: mongodb_url } }))
            .import(MongodbModule)
        expect(() => p.import(TestNotExistClientMongo)).to.throw('Can not find specified MongoClient of name not_exists.')
    })
})
